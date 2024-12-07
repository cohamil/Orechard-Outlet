import { Scene } from 'phaser';

import { TextButton } from '../text-button';
import { PopupWindow } from '../popup-window';
import { parse } from 'yaml';
import { gameManager } from '../GameManager';

export class Game extends Scene {
    private gridSize: number; // Number of rows and columns
    private cellSize: number = 64; // Size of each cell in pixels
    private player!: Phaser.GameObjects.Rectangle; // The player's visual representation
    private playerPosition: Coordinate = { row: 0, col: 0 }; // Tracks the player's position on the grid
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private undoable: (Grid | Coordinate)[];   // Tracks undoable actions. If needed, can be changed to an any[] array
    private redoable: (Grid | Coordinate)[];    // Tracks redoable actions.  ""
    private gameSettings: Settings;              // Define how game should be played out
    private weatherSchedule: {next() : weatherKey | null, getNext(): weatherKey | null};
    private resourceModifier = {
        sun: 1,
        water: 1
    }
    
    // New properties for cell resources
    private grid!: Grid;
    private sunProbability: number;
    private waterProbability: number;

    // Constants
    private MAXED_PLANTS_WIN_CONDITION: number;
    private plantSpecies: Plant[] = [];
    private MAX_SPECIES_LENGTH = 8;
    private numMaxedPlants = 0;
    private defaultGrowthConditions: GrowthCondition[] = [
        {
            requiredSun: 1,
            requiredWater: 1,
            requiredNeighbors: -1
        },
        {
            requiredSun: 1,
            requiredWater: 2,
            requiredNeighbors: -1
        },
        {
            requiredSun: 1,
            requiredWater: 2,
            requiredNeighbors: 0
        },
    ]

    // Save-related properties
    private currentSaveSlot: string | null = null;
    private saveSlotPrefix = 'game_save_';

    // UI properties
    private UIElements: { 
        forecastText: Phaser.GameObjects.Text | null,
        settingsButton: TextButton | null
        tutorialButton: TextButton | null 
    } = {
        forecastText: null,
        settingsButton: null,
        tutorialButton: null,
    }
    
    constructor() {
        super('Game');
    }

    preload() {
        this.load.text('yamlData' , '/assets/config.yaml')
    }

    create() {
        this.cameras.main.setBackgroundColor(0x87ceeb);
    
        let autoSaveLoaded = false;

        // Check for auto-save and load if confirmed
        if (gameManager.getConfirmLoad()) {
            try {
                let savedState;
                const autoSaveString = localStorage.getItem(gameManager.getAutoSaveKey());
                if (autoSaveString) {
                    savedState = JSON.parse(autoSaveString);
                }
                if (this.isValidGameState(savedState)) {
                    this.loadGameState(savedState);
                    autoSaveLoaded = true;
                }
            } catch (error) {
                console.error('Error loading auto-save:', error);
            }
        }
        else {
            this.createPlayer();
            this.movePlayerTo({row: 0, col: 0});
        }
    
        // Only load YAML settings if no save was loaded
        if (!autoSaveLoaded) {
            if (this.cache.text.has('yamlData')) {
                try {
                    this.gameSettings = parse(this.cache.text.get('yamlData'));
                } catch (error) {
                    console.error('Error parsing YAML file. Using defaults.');
                    this.setDefaultSettings();
                }
            } else {
                console.error("YAML file not found, using defaults.");
                this.setDefaultSettings();
            }
    
            // Initialize with YAML/default settings
            this.gridSize = this.gameSettings.gridSize;
            this.sunProbability = this.gameSettings.defaultSunProbability;
            this.waterProbability = this.gameSettings.defaultWaterProbability;
            this.MAXED_PLANTS_WIN_CONDITION = this.gameSettings.plantsToMax;
            
            // Initialize weather
            let weatherKeys = this.gameSettings.weatherSchedule;
            if (!weatherKeys.every(key => Object.keys(Weathers).includes(key))) {
                console.error('YAML: weatherSchedule has unknown options, using defaults');
                weatherKeys = [];
            }
            this.weatherSchedule = this.createIterator(weatherKeys);
            this.updateWeather();

            this.createPlayer();
    
            // Initialize grid
            this.initializeCellResources();
            this.drawGrid();
        }
    
        // Create base Plants regardless of load state
        this.plantSpecies = []; // Reset plant species
        this.createSpecies('0xDA70D6', this.defaultGrowthConditions);
        this.createSpecies('0x4CBB17', this.defaultGrowthConditions);
        this.createSpecies('0xF28C28', this.defaultGrowthConditions);
    
        // Set up keyboard input
        if (!this.input.keyboard) {
            console.error('Keyboard input system is not available.');
            return;
        }
    
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeys('W,S,A,D,T,X,L,M');
    
        // Add key listeners for save/load
        const loadKey = this.input.keyboard.addKey('L');
        loadKey.on('down', this.showSaveSlots, this);
        
        // Add a key listener for advancing turns
        const turnKey = this.input.keyboard.addKey('T');
        turnKey.on('down', this.advanceTurn, this);
    
        // Add key listeners for undo/redo
        this.undoable = [];
        const undoKey = this.input.keyboard.addKey('Z');
        undoKey.on('down', this.undo, this);
        this.redoable = [];
        const redoKey = this.input.keyboard.addKey('X');
        redoKey.on('down', this.redo, this);
    
        // Reset Win Condition if not loaded
        if (!autoSaveLoaded) {
            this.numMaxedPlants = 0;
        }

        // Create base Plants
        // Lilac, Daisy, Tulip
        this.createSpecies('0xDA70D6', this.defaultGrowthConditions)
        this.createSpecies('0x4CBB17', this.defaultGrowthConditions)
        this.createSpecies('0xF28C28', this.defaultGrowthConditions)

        // Create UI elements
        this.createUIElements();
    }

    // Create the UI elements for the game scene
    private createUIElements(){
        // Create forecast text
        const forecastText = this.weatherSchedule.getNext() || 'NORMAL';
        this.UIElements.forecastText = this.add.text(Number(this.game.config.width) / 2 - 200, 0, 'Forecast: ' + forecastText, {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });

        // Create Settings button
        this.UIElements.settingsButton = new TextButton(this, 0, 0, 'Settings', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.saveGame();
            this.game.scene.start('Settings');
        });

        // Create tutorial button
        this.UIElements.tutorialButton = new TextButton(this, 0, 70, 'Tutorial', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.game.scene.start('Tutorial');
        });
    }

    // Update the forecacst UI
    private updateForecastUI(){
        if (this.UIElements.forecastText){
            const forecastText = this.weatherSchedule.getNext() || 'NORMAL';
            this.UIElements.forecastText.setText('Forecast: ' + forecastText);
        }
    }

    private setDefaultSettings(){
        this.gameSettings = {
            gridSize: 10,
            plantsToMax: 4,
            defaultSunProbability: 0.4,
            defaultWaterProbability: 0.4,
            weatherSchedule: []
        }
    }

    private createIterator(array: weatherKey[]): {next() : weatherKey | null, getNext(): weatherKey | null}{       // Returns null if nothing left to return
        let index = 0;
        return {
            next: function() {
                if (index < array.length){
                    const value = array[index];
                    index += 1;
                    return value;
                }else{
                    return null;
                }
            },
            getNext: function(){
                if (index < array.length){
                    return array[index];
                }else{
                    return null;
                }
            }
        }
    }

    // Create a new plant species
    private createSpecies(species: string, conditions: GrowthCondition[]){
        // make the object based on parameters and add to plantSpecies array
        // TBD: add location of spritesheet to use
        if (species.length != this.MAX_SPECIES_LENGTH){
            console.error("Incorrect Species format. Not creating plant.\nGiven Species: " + species);
            return;
        }
        const newPlant: Plant = {
            species: species,
            growthLevel: 0,
            maxGrowthLevel: 3,
            growthConditions: conditions
        }
        this.plantSpecies.push(newPlant);
    }

    // Check for auto-save when game starts
    private checkAutoSave() {
        try {
            const autoSave = localStorage.getItem(gameManager.getAutoSaveKey());
            //console.log('Raw auto-save data:', autoSave); // Debugging line
            if (autoSave) {
                const confirmLoad = confirm('An auto-save was found. Do you want to continue your previous game?');
                if (confirmLoad) {
                    try {
                        const savedState = JSON.parse(autoSave);
                        //console.log('Parsed auto-save state:', savedState); // Debugging line
    
                        if (this.isValidGameState(savedState)) {
                            this.loadGameState(savedState);
                        } else {
                            throw new Error('Invalid game state detected in auto-save.');
                        }
                    } catch (parseError) {
                        console.error('Error parsing auto-save:', parseError);
                        alert('Failed to load auto-save due to data corruption. Starting a new game.');
                    }
                }
            }
        } catch (error) {
            console.error('Error during auto-save check:', error);
            alert('Failed to load auto-save. Starting a new game.');
        }
    }
    

    private isValidGameState(state: any): state is GameState {
        return (
            state &&
            // Validate grid structure
            Array.isArray(state.grid) &&
            state.grid.every((row: any) => 
                Array.isArray(row) &&
                row.every((cell: any) => 
                    cell &&
                    typeof cell.sun === 'number' &&
                    typeof cell.water === 'number' &&
                    (cell.plant === null || 
                        (typeof cell.plant === 'object' && 
                         typeof cell.plant.species === 'string' && 
                         typeof cell.plant.growthLevel === 'number'))
                )
            ) &&
            // Validate player position
            state.playerPosition &&
            typeof state.playerPosition.row === 'number' &&
            typeof state.playerPosition.col === 'number' &&
            // Validate undo/redo stacks
            Array.isArray(state.undoable) &&
            Array.isArray(state.redoable) &&
            // Validate maxed plants count
            typeof state.numMaxedPlants === 'number'
        );
    }
    

    // Save game to a specific slot or auto-save
    private saveGame(slot?: string) {
        // Create a clean copy of the grid state
        const gameState: GameState = {
            grid: this.grid.map(row => 
                row.map(cell => ({
                    sun: cell.sun,
                    water: cell.water,
                    plant: cell.plant ? {
                        species: cell.plant.species,
                        growthLevel: cell.plant.growthLevel,
                        maxGrowthLevel: cell.plant.maxGrowthLevel,
                        growthConditions: JSON.parse(JSON.stringify(cell.plant.growthConditions))
                    } : null
                }))
            ),
            playerPosition: { ...this.playerPosition },
            numMaxedPlants: this.numMaxedPlants,
            undoable: JSON.parse(JSON.stringify(this.undoable)),
            redoable: JSON.parse(JSON.stringify(this.redoable)),
            gameSettings: { ...this.gameSettings }  // Save full settings
        };
    
        const serializedState = JSON.stringify(gameState);
        
        try {
            if (!slot) {
                localStorage.setItem(gameManager.getAutoSaveKey(), serializedState);
            } else {
                localStorage.setItem(this.saveSlotPrefix + slot, serializedState);
                alert(`Game saved to ${slot}.`);
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            alert('Failed to save game state.');
        }
    }

    // Show save slots for manual save/load
    private showSaveSlots() {
        const action = prompt('Enter action (save/load) and slot number (1-5), e.g., "save 1" or "load 2":');
        if (!action) return;

        const [actionType, slotNumber] = action.toLowerCase().split(' ');
        const slot = `slot${slotNumber}`;

        if (actionType === 'save') {
            this.saveGame(slot);
        } else if (actionType === 'load') {
            this.loadGame(slot);
        }
    }

    // Load game from a specific slot
    private loadGame(slot: string) {
        const savedGame = localStorage.getItem(this.saveSlotPrefix + slot);
        if (savedGame) {
            this.loadGameState(JSON.parse(savedGame));
        } else {
            alert(`No save found in slot ${slot}.`);
        }
    }

    // Load game state (for both auto-save and manual load)
private loadGameState(savedState: GameState) {
    try {
        console.log('Loading state:', savedState); // Debug log

        // Load game settings first
        this.gameSettings = savedState.gameSettings;
        
        // Initialize game properties from settings
        this.gridSize = this.gameSettings.gridSize;
        this.sunProbability = this.gameSettings.defaultSunProbability;
        this.waterProbability = this.gameSettings.defaultWaterProbability;
        this.MAXED_PLANTS_WIN_CONDITION = this.gameSettings.plantsToMax;

        // Reinitialize weather schedule
        this.weatherSchedule = this.createIterator(this.gameSettings.weatherSchedule);
        this.updateWeather();

        // Validate and load grid
        if (!savedState.grid || !Array.isArray(savedState.grid)) {
            throw new Error('Invalid grid data in saved state');
        }

        // Deep copy grid with explicit type checking
        this.grid = savedState.grid.map(row => 
            row.map(cell => ({
                sun: Number(cell.sun),
                water: Number(cell.water),
                plant: cell.plant ? {
                    species: String(cell.plant.species),
                    growthLevel: Number(cell.plant.growthLevel),
                    maxGrowthLevel: Number(cell.plant.maxGrowthLevel),
                    growthConditions: cell.plant.growthConditions
                } : null
            }))
        );

        // Load other state
        this.playerPosition = { ...savedState.playerPosition };
        this.numMaxedPlants = savedState.numMaxedPlants || 0;
        this.undoable = savedState.undoable || [];
        this.redoable = savedState.redoable || [];

        this.createPlayer();

        // Update display
        this.drawGrid();
        this.repositionPlayer();

        console.log('Loaded grid:', this.grid); // Debug log
    } catch (error) {
        console.error('Error loading game state:', error);
        alert('Failed to load game state. Starting new game.');
        this.setDefaultSettings();
        this.initializeCellResources();
        this.drawGrid();
    }
}
    

    update() {
        // Handle player movement
        this.handlePlayerMovement();
    }

    // Initialize cell resources with random generation
    private initializeCellResources() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = this.generateCellResources();
            }
        }
    }

    // Randomly generate resources for a cell
    private generateCellResources(): CellResource {
        const sunLevel = Math.random() < this.sunProbability ? 1 : 0;
        const waterLevel = Math.random() < this.waterProbability ? 1 : 0;

        return {
            sun: sunLevel,
            water: waterLevel,
            plant: null,
        };
    }

    // Advance turn with new resource mechanics
    private advanceTurn() {
        this.updateWeather();
        this.updateForecastUI();
        this.undoable.push(this.grid);
        this.redoable = [];
        this.grid = JSON.parse(JSON.stringify(this.grid));         // Dereference this.grid from the object in undoable array
        // Update resources for each cell
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentCell = this.grid[row][col];

                // Plant growth mechanics
                if (currentCell.plant) {
                    this.updatePlantGrowth({row: row, col: col});
                }

                // Check for the win condition
                if (this.numMaxedPlants === this.MAXED_PLANTS_WIN_CONDITION) {
                    //console.log('You win!');
                    this.scene.start('GameOver');
                    this.playerPosition = { row: 0, col: 0 };
                    return;
                }

                // Sun mechanics
                currentCell.sun = Math.random() / this.resourceModifier.sun < this.sunProbability ? 1 : 0;

                // Water mechanics
                if (currentCell.water > 0) {
                    // For cells with water, randomly maintain, increase, or decrease
                    const waterChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    currentCell.water = Math.max(0, Math.min(3, currentCell.water + waterChange));
                } else {
                    // Cells without water have a chance to gain water
                    currentCell.water = Math.random() / this.resourceModifier.water < this.waterProbability ? 1 : 0;
                }
            }
        }
        // Redraw the grid to reflect new resources
        this.drawGrid();

        // Auto-save after each turn
        this.saveGame();
    }

    private updateWeather(){
        const newWeather: weatherKey | null = this.weatherSchedule.next();
        if (newWeather && newWeather != "DEFAULT"){
            this.resourceModifier.sun = Weathers[newWeather].sun;
            this.resourceModifier.water = Weathers[newWeather].water;
        }else{
            this.resourceModifier.sun = 1;
            this.resourceModifier.water = 1;
        }
    }

    // Update plant growth based on resources
    private updatePlantGrowth(cell: Coordinate) {
        const cellResource = this.grid[cell.row][cell.col];
        const plant = cellResource.plant;

        if (!plant || plant.growthLevel === plant.maxGrowthLevel) return;
        const condition = plant.growthConditions[plant.growthLevel]
        if (cellResource.water >= condition.requiredWater && cellResource.sun >= condition.requiredSun){
            if (condition.requiredNeighbors == -1 || condition.requiredNeighbors == this.checkAdjacentFlowers(cell)){      // Plant does not care for number of neighbors
                plant.growthLevel += 1;
                if (plant.growthLevel == plant.maxGrowthLevel){
                    this.numMaxedPlants += 1;
                    console.log(`1 more plant maxed! \nHave ${this.numMaxedPlants}\nNeed ${this.MAXED_PLANTS_WIN_CONDITION}`)
                }
                cellResource.water -= 1;
            }
        }
    }

    // Check for adjacent flowers to prevent growth
    private checkAdjacentFlowers(center: Coordinate): number {
        const adjacentCells = [
            { row: center.row - 1, col: center.col }, // Up
            { row: center.row + 1, col: center.col }, // Down
            { row: center.row, col: center.col - 1 }, // Left
            { row: center.row, col: center.col + 1 }, // Right
        ];
        let numAdjacentPlants = 0;

        for (const cell of adjacentCells) {
            if (cell.row >= 0 && cell.row < this.gridSize &&
                cell.col >= 0 && cell.col < this.gridSize) {
                const adjacentPlant = this.grid[cell.row][cell.col].plant;
                if (adjacentPlant) numAdjacentPlants+=1;
            }
        }

        return numAdjacentPlants;
    }

    private drawGrid() {
        //console.log('Drawing grid - full grid state:', JSON.stringify(this.grid, null, 2));
    
        const startX = (this.cameras.main.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.cameras.main.height - this.gridSize * this.cellSize) / 2;
    
        // Destroy existing grid elements, but keep the player and UI elements
        this.children.list
            .filter(child => child !== this.player && !Object.values(this.UIElements).includes(child as any))
            .forEach(child => child.destroy());
    
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = startX + col * this.cellSize;
                const y = startY + row * this.cellSize;
    
                // Get cell resources
                const cellResource = this.grid[row][col];
                //console.log(`Rendering cell (${row}, ${col}):`, cellResource);
    
                // Determine cell color based on resources
                let cellColor = 0xcccccc; // Default gray
                if (cellResource.sun && cellResource.water) {
                    //console.log('Cell has both sun and water');
                    // If both sun and water, create a diagonal split cell
                    const sunPath = this.add
                        .polygon(x, y, [
                            0, 0,
                            this.cellSize - 2, this.cellSize - 2,
                            0, this.cellSize - 2
                        ], 0xffff00)
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);
                    
                    const waterPath = this.add
                        .polygon(x, y, [
                            this.cellSize - 2, 0,
                            this.cellSize - 2, this.cellSize - 2,
                            0, 0
                        ], this.getWaterColor(cellResource.water))
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);
                } else if (cellResource.sun) {
                    //console.log('Cell has sun');
                    // Sun-only cell (yellow)
                    cellColor = 0xffff00;
                } else if (cellResource.water) {
                    //console.log('Cell has water');
                    // Water cell (blue with intensity based on water level)
                    cellColor = this.getWaterColor(cellResource.water);
                }
    
                // Draw the base cell if not split
                if (!cellResource.sun || !cellResource.water) {
                    this.add
                        .rectangle(x, y, this.cellSize - 2, this.cellSize - 2, cellColor)
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);
                }
    
                // Draw plant if present
                if (cellResource.plant) {
                    const plant = cellResource.plant;
                    //console.log(`Plant in cell (${row}, ${col}):`, plant);
                    
                    const plantColor = plant.species;
                    const plantSize = (this.cellSize * 0.4) * ((1+plant.growthLevel) / plant.maxGrowthLevel);
                    const plantX = x + (this.cellSize - plantSize) / 2;
                    const plantY = y + (this.cellSize - plantSize) / 2;
    
                    // Draw the plant
                    this.add
                        .rectangle(plantX, plantY, plantSize, plantSize, parseInt(plantColor))
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);

                    // Format growth requirements for display
                    let growthRequirementString;
                    if (plant.growthLevel === plant.maxGrowthLevel) {
                        growthRequirementString = 'Plant is Fully Grown!';
                    }
                    else {
                        const condition = plant.growthConditions[plant.growthLevel];
                        const neighborsString = condition.requiredNeighbors === -1 ? 'Any' : condition.requiredNeighbors;
                        growthRequirementString = `Growth Requirements For Level Up:\nWater Level: ${condition.requiredWater}\nSun Level: ${condition.requiredSun}\nNumber of Neighbors: ${neighborsString}`;
                    }
                    
                    // Create a popup window for plant information
                    const plantPopup = new PopupWindow(this, this.cameras.main.width / 2, this.cameras.main.height / 2, 700, 500, 'Plant Info', 
                        `Species: ${plant.species}\nMax Growth Level: ${plant.maxGrowthLevel}\nGrowth Level: ${plant.growthLevel}\n\n${growthRequirementString}`, {
                        fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
                        stroke: '#000000', strokeThickness: 6
                    });
                    plantPopup.setVisibility(false);

                    // Make the cell interactive
                    this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, cellColor)
                        .setOrigin(0)
                        .setAlpha(0.001)
                        .setInteractive()
                        .on('pointerdown', () => plantPopup.setVisibility(true));
                }
            }
        }
    
        // Reposition the player after redrawing grid
        this.repositionPlayer();
    }

    // Helper method to get water color based on moisture level
    private getWaterColor(waterLevel: number): number {
        switch(waterLevel) {
            case 1: return 0x87CEEB;   // Light blue
            case 2: return 0x4682B4;   // Medium blue
            case 3: return 0x000080;   // Dark blue
            default: return 0xcccccc;  // Default gray if no water
        }
    }

    private createPlayer() {
        const startX = (this.cameras.main.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.cameras.main.height - this.gridSize * this.cellSize) / 2;

        // Place the player at the initial position (row 0, col 0)
        const x = startX + this.playerPosition.col * this.cellSize + this.cellSize / 2;
        const y = startY + this.playerPosition.row * this.cellSize + this.cellSize / 2;

        this.player = this.add
            .rectangle(x, y, this.cellSize * 0.5, this.cellSize * 0.5, 0xff0000)
            .setOrigin(0.5)
            .setDepth(10); // Ensure player is drawn on top of grid cells
    }

    private repositionPlayer() {
        const startX = (this.cameras.main.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.cameras.main.height - this.gridSize * this.cellSize) / 2;
    
        // Ensure the player exists before attempting to reposition
        if (!this.player) {
            console.error('Player object is undefined during repositioning.');
            return;
        }
    
        // Reposition the player
        const x = startX + this.playerPosition.col * this.cellSize + this.cellSize / 2;
        const y = startY + this.playerPosition.row * this.cellSize + this.cellSize / 2;
    
        this.player.setPosition(x, y);
    }
    

    private handlePlayerMovement() {
        const { row, col } = this.playerPosition;
    
        // Ensure cursors and keyboard input are initialized
        if (!this.cursors || !this.input.keyboard) {
            console.warn('Keyboard input or cursors are not available.');
            return;
        }
    
        // WASD Keys for Movement
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[65])) {
            if (col > 0) { 
                this.undoable.push(this.playerPosition);
                this.redoable = [];
                this.movePlayerTo({row: row, col: col - 1}); // Move left
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[68])) {
            if (col < this.gridSize - 1) {
                this.undoable.push(this.playerPosition);
                this.redoable = [];
                this.movePlayerTo({row: row, col: col + 1}); // Move right
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[87])) {
            if (row > 0) {
                this.undoable.push(this.playerPosition);
                this.redoable = [];
                this.movePlayerTo({row: row - 1, col: col}); // Move up
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[83])) {
            if (row < this.gridSize - 1) {
                this.undoable.push(this.playerPosition);
                this.redoable = [];
                this.movePlayerTo({row: row + 1, col: col}); // Move down
            }
        }

        // Arrow Keys for Plant Interaction
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (col > 0) {
                this.undoable.push(this.grid);
                this.redoable = [];
                this.grid = JSON.parse(JSON.stringify(this.grid));
                this.handlePlantInteraction({row: row, col: col - 1});
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (col < this.gridSize - 1) {
                this.undoable.push(this.grid);
                this.redoable = [];
                this.grid = JSON.parse(JSON.stringify(this.grid));
                this.handlePlantInteraction({row: row, col: col + 1});
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (row > 0) {
                this.undoable.push(this.grid);
                this.redoable = [];
                this.grid = JSON.parse(JSON.stringify(this.grid));
                this.handlePlantInteraction({row: row - 1, col: col});
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (row < this.gridSize - 1) {
                this.undoable.push(this.grid);
                this.redoable = [];
                this.grid = JSON.parse(JSON.stringify(this.grid));
                this.handlePlantInteraction({row: row + 1, col: col});
            }
        }
    }

    private movePlayerTo(cell: Coordinate) {
        const startX = (this.cameras.main.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.cameras.main.height - this.gridSize * this.cellSize) / 2;

        // Calculate new position
        const x = startX + cell.col * this.cellSize + this.cellSize / 2;
        const y = startY + cell.row * this.cellSize + this.cellSize / 2;

        // Update the player's position
        this.player.setPosition(x, y);
        this.playerPosition = cell;
    }

    // Method to handle plant interaction
    private handlePlantInteraction(cell: Coordinate) {
        const cellResource = this.grid[cell.row][cell.col];
        
        // Plant a new plant if the cell is empty
        if (!cellResource.plant) {
            this.sowPlant(cell);
        } 
        // Harvest the plant if the cell has a plant
        else {
            this.harvestPlant(cell);
        }

        // Redraw the grid to reflect plant changes
        this.drawGrid();
    }

    // Method to plant a new plant in a cell
    private sowPlant(cell: Coordinate) {
        const cellResource = this.grid[cell.row][cell.col];

        // Randomly select a plant species
        if (this.plantSpecies.length === 0){
            console.error("No available plants to sow!");
            return;
        }
        const plantSpeciesIndex = Math.floor(Math.random() * this.plantSpecies.length);
        const newPlant: Plant = {...this.plantSpecies[plantSpeciesIndex]};
        cellResource.plant = newPlant;

        ////console.log(`New plant sown: ${newPlantSpecies}`);
    }

    // Method to harvest a plant from a cell
    private harvestPlant(cell: Coordinate) {
        const cellResource = this.grid[cell.row][cell.col];

        // Harvest the plant and remove it from the cell
        cellResource.plant = null;
    }


    // Handle UNDO and REDO operations
    private undo(){
        if (this.undoable.length > 0){
            const action: Grid | Coordinate = this.undoable.pop()!;
            if (Array.isArray(action)){         // cheap way to check if action is a Grid
                this.redoable.push(this.grid);
                this.grid = action;
                this.drawGrid();
            }else{                              // otherwise action is a Coordinate
                this.redoable.push(this.playerPosition);
                this.movePlayerTo(action)
            }
        }
    }
    private redo(){
        if (this.redoable.length > 0){
            const action: Grid | Coordinate = this.redoable.pop()!;
            if (Array.isArray(action)){
                this.undoable.push(this.grid);
                this.grid = action;
                this.drawGrid();
            }else{
                this.undoable.push(this.playerPosition)
                this.movePlayerTo(action)
            }
        }
    }

    // Convert Grid to/from Byte Array for memory
    private serializeGrid(grid: Grid): ArrayBuffer {
        const growthConditionSize = 3; // Each GrowthCondition is 3 bytes (water, sun, neighbors)
        const plantFixedSize = 2 + 2 + 4 + this.MAX_SPECIES_LENGTH + growthConditionSize * 4; // Fixed Plant size
        const cellSize = 2 + 1 + plantFixedSize; // 2 bytes (sun, water), 1 byte (plant flag), plant data
    
        // Calculate total buffer size
        const gridSize = grid.length * grid[0].length;
        const bufferSize = gridSize * cellSize;
        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);
    
        let byteOffset = 0;
    
        // Serialize each cell in the grid
        for (const row of grid) {
            for (const cell of row) {
                // Serialize sun
                view.setUint8(byteOffset, cell.sun);
                byteOffset += 1;
    
                // Serialize water
                view.setUint8(byteOffset, cell.water);
                byteOffset += 1;
    
                // Serialize plant presence flag (1 = Plant exists, 0 = null)
                if (cell.plant) {
                    view.setUint8(byteOffset, 1); // Flag
                    byteOffset += 1;
    
                    // Serialize Plant
                    const { species, growthLevel, maxGrowthLevel, growthConditions } = cell.plant;
    
                    // Write species
                    for (let i = 0; i < this.MAX_SPECIES_LENGTH; i++) {
                        if (i < species.length) {
                            view.setUint8(byteOffset + i, species.charCodeAt(i));
                        } else {
                            view.setUint8(byteOffset + i, 0); // Padding
                        }
                    }
                    byteOffset += this.MAX_SPECIES_LENGTH;
    
                    // Write growthLevel and maxGrowthLevel
                    view.setUint8(byteOffset, growthLevel);
                    byteOffset += 1;
                    view.setUint8(byteOffset, maxGrowthLevel);
                    byteOffset += 1;
    
                    // Write growthConditions
                    for (let i = 0; i < maxGrowthLevel; i++) {
                        if (i < growthConditions.length) {
                            const condition = growthConditions[i];
                            view.setInt8(byteOffset, condition.requiredWater);
                            view.setInt8(byteOffset + 1, condition.requiredSun);
                            view.setInt8(byteOffset + 2, condition.requiredNeighbors);
                            byteOffset += 3;
                        } else {
                            // Padding empty growthCondition slots
                            view.setUint8(byteOffset, 0);
                            view.setUint8(byteOffset + 1, 0);
                            view.setUint8(byteOffset + 2, 0);
                            byteOffset += 3;
                        }
                    }
                } else {
                    // No plant; write plant flag as 0 and skip plant data
                    view.setUint8(byteOffset, 0);
                    byteOffset += 1;
    
                    // Skip space allocated for a Plant object
                    byteOffset += plantFixedSize;
                }
            }
        }
    
        return buffer;
    }
    private deserializeGrid(buffer: ArrayBuffer): Grid {
        const view = new DataView(buffer);
        const growthConditionSize = 3;
        const plantFixedSize = 2 + 2 + 4 + this.MAX_SPECIES_LENGTH + growthConditionSize * 4;
    
        let byteOffset = 0;
        const grid: Grid = [];
    
        for (let r = 0; r < this.gridSize; r++) {
            const row: CellResource[] = [];
    
            for (let c = 0; c < this.gridSize; c++) {
                // Deserialize sun and water
                const sun = view.getUint8(byteOffset);
                byteOffset += 1;
    
                const water = view.getUint8(byteOffset);
                byteOffset += 1;
    
                // Deserialize plant flag
                const hasPlant = view.getUint8(byteOffset) === 1;
                byteOffset += 1;
    
                let plant: Plant | null = null;
                if (hasPlant) {
                    // Deserialize Plant
                    let species = "";
                    for (let i = 0; i < this.MAX_SPECIES_LENGTH; i++) {
                        const charCode = view.getUint8(byteOffset + i);
                        if (charCode !== 0) {
                            species += String.fromCharCode(charCode);
                        }
                    }
                    byteOffset += this.MAX_SPECIES_LENGTH;
    
                    const growthLevel = view.getUint8(byteOffset);
                    byteOffset += 1;
    
                    const maxGrowthLevel = view.getUint8(byteOffset);
                    byteOffset += 1;
    
                    const growthConditions: GrowthCondition[] = [];
                    for (let i = 0; i < maxGrowthLevel; i++) {
                        const requiredSun = view.getInt8(byteOffset);
                        const requiredWater = view.getInt8(byteOffset+1);
                        const requiredNeighbors = view.getInt8(byteOffset+2);
                        byteOffset += 3;
    
                        growthConditions.push({
                            requiredWater,
                            requiredSun,
                            requiredNeighbors,
                        });
                    }
    
                    plant = { species, growthLevel, maxGrowthLevel, growthConditions };
                } else {
                    byteOffset += plantFixedSize; // Skip plant data
                }
                const nextCell: CellResource = { sun, water, plant }
                row.push(nextCell);
            }
            grid.push(row);
        }
    
        return grid;
    }
}

// Interface for game state
interface GameState {
    grid: Grid;
    playerPosition: Coordinate;
    numMaxedPlants: number;
    undoable: (Grid | Coordinate)[];
    redoable: (Grid | Coordinate)[];
    gameSettings: Settings;  // Add full game settings
}

// Interface to define cell resource structure
interface CellResource {
    sun: number;
    water: number; // 0-3 water levels
    plant: Plant | null; // Plant object or null if no plant
}
type Grid = CellResource[][];
// Interface to define plant structure
interface Plant {
    species: string;
    growthLevel: number;
    maxGrowthLevel: number;
    growthConditions: GrowthCondition[];
}
interface GrowthCondition {
    requiredSun: number;
    requiredWater: number;
    requiredNeighbors: number;
}
interface Coordinate {
    row: number;
    col: number;
}
// Interface to define game settings
interface Settings {
    gridSize: number,
    plantsToMax: number,
    defaultSunProbability: number,
    defaultWaterProbability: number
    weatherSchedule: weatherKey[]
}
// Enum to define types of weather
type weatherKey = keyof typeof Weathers
const Weathers = Object.freeze({
    SUNNY : {
        sun: 2,
        water: 1
    },
    RAINY : {
        sun: 1,
        water: 2
    },
    CLOUDY : {
        sun: 0.5,
        water: 1
    },
    DEFAULT : {
        sun: 1,
        water: 1
    }
})