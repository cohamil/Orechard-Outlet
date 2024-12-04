import { Scene } from 'phaser';

export class Game extends Scene {
    private gridSize: number = 10; // Number of rows and columns
    private cellSize: number = 64; // Size of each cell in pixels
    private player!: Phaser.GameObjects.Rectangle; // The player's visual representation
    private playerPosition: Coordinate = { row: 0, col: 0 }; // Tracks the player's position on the grid
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private undoable: (Grid | Coordinate)[];   // Tracks undoable actions. If needed, can be changed to an any[] array
    private redoable: (Grid | Coordinate)[];    // Tracks redoable actions.  ""
    
    // New properties for cell resources
    private grid!: Grid;

    // Constants
    private MAX_GROWTH_LEVEL = 4;
    private MAXED_PLANTS_WIN_CONDITION = 3;
    private plantSpecies = ['0xDA70D6', '0x4CBB17', '0xF28C28']; // Lilac, Daisy, Tulip
    private numMaxedPlants = 0;

    // Save-related properties
    private currentSaveSlot: string | null = null;
    private autoSaveKey = 'game_autosave';
    private saveSlotPrefix = 'game_save_';
    
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x87ceeb);
    
        // Initialize grid and player first
        this.initializeCellResources();
        this.createPlayer();
        this.movePlayerTo(this.playerPosition);
    
        let autoSaveLoaded = false;
        
        // Check for auto-save
        const autoSave = localStorage.getItem(this.autoSaveKey);
        if (autoSave) {
            const confirmLoad = confirm('An auto-save was found. Do you want to continue your previous game?');
            if (confirmLoad) {
                try {
                    const savedState = JSON.parse(autoSave);
                    if (this.isValidGameState(savedState)) {
                        this.loadGameState(savedState);
                        autoSaveLoaded = true;
                    }
                } catch (error) {
                    console.error('Error loading auto-save:', error);
                }
            }
        }
    
        // Only draw initial grid if no autosave was loaded
        if (!autoSaveLoaded) {
            this.drawGrid();
        }

        if (!this.input.keyboard) {
            console.error('Keyboard input system is not available.');
            return;
        }

        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeys('W,S,A,D,T,X,L,M'); 
        /*
        Added 'T' for turn advancement
        Added 'Z' for undo
        Added 'X' for redo
        Added 'L' for load
        */
        
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
        redoKey.on('down', this.redo, this)

        // Set Win Condition (3 to win)
        this.numMaxedPlants = 0;
    }

    // Check for auto-save when game starts
    private checkAutoSave() {
        try {
            const autoSave = localStorage.getItem(this.autoSaveKey);
            console.log('Raw auto-save data:', autoSave); // Debugging line
            if (autoSave) {
                const confirmLoad = confirm('An auto-save was found. Do you want to continue your previous game?');
                if (confirmLoad) {
                    try {
                        const savedState = JSON.parse(autoSave);
                        console.log('Parsed auto-save state:', savedState); // Debugging line
    
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
                    typeof cell.sun === 'boolean' &&
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
        const gridCopy = this.grid.map(row => 
            row.map(cell => ({
                sun: cell.sun,
                water: cell.water,
                plant: cell.plant ? {
                    species: cell.plant.species,
                    growthLevel: cell.plant.growthLevel
                } : null
            }))
        );
    
        const gameState: GameState = {
            grid: gridCopy,
            playerPosition: { ...this.playerPosition },
            numMaxedPlants: this.numMaxedPlants,
            undoable: JSON.parse(JSON.stringify(this.undoable)),
            redoable: JSON.parse(JSON.stringify(this.redoable))
        };
    
        const serializedState = JSON.stringify(gameState);
        
        try {
            if (!slot) {
                localStorage.setItem(this.autoSaveKey, serializedState);
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
            // Reconstruct the grid with proper typing
            this.grid = savedState.grid.map(row => 
                row.map(cell => ({
                    sun: Boolean(cell.sun),
                    water: Number(cell.water),
                    plant: cell.plant ? {
                        species: String(cell.plant.species),
                        growthLevel: Number(cell.plant.growthLevel)
                    } : null
                }))
            );
    
            this.playerPosition = { ...savedState.playerPosition };
            this.numMaxedPlants = savedState.numMaxedPlants || 0;
            this.undoable = savedState.undoable || [];
            this.redoable = savedState.redoable || [];
    
            if (!this.player) {
                this.createPlayer();
            }
    
            this.drawGrid();
            this.repositionPlayer();
            
            console.log('Game loaded successfully - Grid state:', this.grid);
        } catch (error) {
            console.error('Error loading game state:', error);
            alert('Failed to load game state.');
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
        const sunProbability = 0.4;
        const waterProbability = 0.4;

        const hasSun = Math.random() < sunProbability;
        const hasWater = Math.random() < waterProbability;
        
        // If water exists, start at water level 1
        const waterLevel = hasWater ? 1 : 0;

        return {
            sun: hasSun,
            water: waterLevel,
            plant: null,
        };
    }

    // Advance turn with new resource mechanics
    private advanceTurn() {
        this.undoable.push(this.grid);
        this.redoable = [];
        this.grid = JSON.parse(JSON.stringify(this.grid));         // Dereference this.grid from the object in undoable array
        // Update resources for each cell
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentCell = this.grid[row][col];

                // Plant growth mechanics
                if (currentCell.plant) {
                    this.updatePlantGrowth(row, col);
                }

                // Check for the win condition
                if (this.numMaxedPlants === this.MAXED_PLANTS_WIN_CONDITION) {
                    console.log('You win!');
                    this.scene.start('GameOver');

                    return;
                }

                // Sun mechanics
                if (currentCell.sun) {
                    // Remove existing sun
                    currentCell.sun = false;
                } else {
                    // Chance to gain sun
                    currentCell.sun = Math.random() < 0.3; // 30% chance to gain sun
                }

                // Water mechanics
                if (currentCell.water > 0) {
                    // For cells with water, randomly maintain, increase, or decrease
                    const waterChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    currentCell.water = Math.max(0, Math.min(3, currentCell.water + waterChange));
                } else {
                    // Cells without water have a chance to gain water
                    if (Math.random() < 0.4) { // 40% chance to gain water
                        currentCell.water = 1;
                    }
                }
            }
        }

        // Redraw the grid to reflect new resources
        this.drawGrid();

        // Auto-save after each turn
        this.saveGame();
    }

    // Update plant growth based on resources
    private updatePlantGrowth(row: number, col: number) {
        const cellResource = this.grid[row][col];
        const plant = cellResource.plant;

        if (!plant || !cellResource.sun || plant.growthLevel === this.MAX_GROWTH_LEVEL) return;

        switch (plant.growthLevel) {
            // Any amount of water is enough
            case 1:
                if (cellResource.water > 0) {
                    plant.growthLevel += 1;
                    cellResource.water -= 1; // Consume water

                    console.log(`Plant at (${row}, ${col}) grew to level ${plant.growthLevel}`);
                }
                break; 
            // Needs at least 2 water
            case 2:
                if (cellResource.water >= 2) {
                    plant.growthLevel += 1;
                    cellResource.water -= 1; // Consume water

                    console.log(`Plant at (${row}, ${col}) grew to level ${plant.growthLevel}`);
                }
                break;
            // Needs at least 2 water and no adjacent flowers
            case 3:
                if (cellResource.water >= 2 && this.checkAdjacentFlowers(row, col)) {
                    plant.growthLevel += 1;
                    cellResource.water -= 1; // Consume water
                    this.numMaxedPlants += 1;

                    console.log(`Plant at (${row}, ${col}) grew to level ${plant.growthLevel}`);
                }
                break;
        }
    }

    // Check for adjacent flowers to prevent growth
    private checkAdjacentFlowers(row: number, col: number): boolean {
        const adjacentCells = [
            { row: row - 1, col }, // Up
            { row: row + 1, col }, // Down
            { row, col: col - 1 }, // Left
            { row, col: col + 1 }, // Right
        ];

        for (const cell of adjacentCells) {
            if (cell.row >= 0 && cell.row < this.gridSize &&
                cell.col >= 0 && cell.col < this.gridSize) {
                const adjacentPlant = this.grid[cell.row][cell.col].plant;
                if (adjacentPlant) return false;
            }
        }

        return true;
    }

    private drawGrid() {
        console.log('Drawing grid - full grid state:', JSON.stringify(this.grid, null, 2));
    
        const startX = (this.cameras.main.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.cameras.main.height - this.gridSize * this.cellSize) / 2;
    
        // Destroy existing grid elements, but keep the player
        this.children.list
            .filter(child => child !== this.player)
            .forEach(child => child.destroy());
    
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = startX + col * this.cellSize;
                const y = startY + row * this.cellSize;
    
                // Get cell resources
                const cellResource = this.grid[row][col];
                console.log(`Rendering cell (${row}, ${col}):`, cellResource);
    
                // Determine cell color based on resources
                let cellColor = 0xcccccc; // Default gray
                if (cellResource.sun && cellResource.water) {
                    console.log('Cell has both sun and water');
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
                    console.log('Cell has sun');
                    // Sun-only cell (yellow)
                    cellColor = 0xffff00;
                } else if (cellResource.water) {
                    console.log('Cell has water');
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
                    console.log(`Plant in cell (${row}, ${col}):`, plant);
                    
                    const plantColor = plant.species;
                    const plantSize = (this.cellSize * 0.4) * (plant.growthLevel / this.MAX_GROWTH_LEVEL);
                    const plantX = x + (this.cellSize - plantSize) / 2;
                    const plantY = y + (this.cellSize - plantSize) / 2;
    
                    this.add
                        .rectangle(plantX, plantY, plantSize, plantSize, parseInt(plantColor))
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);
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
        const plantSpeciesIndex = Math.floor(Math.random() * this.plantSpecies.length);
        const newPlantSpecies = this.plantSpecies[plantSpeciesIndex];
        const newPlant: Plant = {
            species: newPlantSpecies,
            growthLevel: 1,
        };
        cellResource.plant = newPlant;

        console.log(`New plant sown: ${newPlantSpecies}`);
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
}

// Interface for game state
interface GameState {
    grid: Grid;
    playerPosition: Coordinate;
    numMaxedPlants: number;
    undoable: (Grid | Coordinate)[];
    redoable: (Grid | Coordinate)[];
}

// Interface to define cell resource structure
interface CellResource {
    sun: boolean;
    water: number; // 0-3 water levels
    plant: Plant | null; // Plant object or null if no plant
}
type Grid = CellResource[][];

interface Coordinate {
    row: number,
    col: number
}
// Interface to define plant structure
interface Plant {
    species: string;
    growthLevel: number; // 1-4 growth levels
}