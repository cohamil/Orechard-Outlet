import { Scene } from 'phaser';

import { TextButton } from '../text-button';
//import { PopupWindow } from '../popup-window';
import { parse } from 'yaml';
import { gameManager } from '../GameManager';
import { PlantsManager, Plant, GrowthCondition } from '../PlantsManager';
import { PlayerActions } from '../PlayerActions';
import { SaveManager } from '../SaveManager';

export class Game extends Scene {
    private gridSize: number; // Number of rows and columns
    private cellSize: number = 64; // Size of each cell in pixels
    private player!: Phaser.GameObjects.Rectangle; // The player's visual representation
    private playerPosition: Coordinate = { row: 0, col: 0 }; // Tracks the player's position on the grid
    private undoable: (Grid | Coordinate)[];   // Tracks undoable actions. If needed, can be changed to an any[] array
    private redoable: (Grid | Coordinate)[];    // Tracks redoable actions.  ""
    private gameSettings: Settings;
                  // Define how game should be played out
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

    // Add PlantsManager here
    private plantsManager!: PlantsManager;

    // Add PlayerActions here
    private playerActions!: PlayerActions;

    //add SaveManager here
    private saveManager: SaveManager;

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
        this.saveManager = new SaveManager(this);
    }

    preload() {
        this.load.text('yamlData' , '/assets/config.yaml')
    }

    create() {
        this.cameras.main.setBackgroundColor(0x87ceeb);
    
        // Initialize managers
        this.plantsManager = new PlantsManager(this.MAX_SPECIES_LENGTH, this);
        this.playerActions = new PlayerActions(this);
    
        // Create initial plant species
        this.plantsManager.createSpecies("0xDA70D6", this.defaultGrowthConditions);
        this.plantsManager.createSpecies("0x4CBB17", this.defaultGrowthConditions);
        this.plantsManager.createSpecies("0xF28C28", this.defaultGrowthConditions);
    
        // Always load YAML settings first
        if (this.cache.text.has('yamlData')) {
            try {
                this.gameSettings = parse(this.cache.text.get('yamlData'));
                // Initialize core settings immediately
                this.gridSize = this.gameSettings.gridSize;
                this.sunProbability = this.gameSettings.defaultSunProbability;
                this.waterProbability = this.gameSettings.defaultWaterProbability;
                this.MAXED_PLANTS_WIN_CONDITION = this.gameSettings.plantsToMax;
            } catch (error) {
                console.error('Error parsing YAML file. Using defaults.');
                this.setDefaultSettings();
            }
        } else {
            console.error("YAML file not found, using defaults.");
            this.setDefaultSettings();
        }
    
        let autoSaveLoaded = false;
    
        // Try loading autosave
        if (gameManager.getConfirmLoad()) {
            try {
                const autoSaveString = localStorage.getItem(gameManager.getAutoSaveKey());
                if (autoSaveString) {
                    const savedState = JSON.parse(autoSaveString);
                    if (this.isValidGameState(savedState)) {
                        this.weatherSchedule = this.createIterator(this.gameSettings.weatherSchedule);
                        this.saveManager.loadGameState(savedState);
                        autoSaveLoaded = true;
                    }
                }
            } catch (error) {
                console.error('Error loading auto-save:', error);
            }
        }
    
        if (!autoSaveLoaded) {
            this.weatherSchedule = this.createIterator(this.gameSettings.weatherSchedule);
            this.updateWeather();
            this.createPlayer();
            this.initializeCellResources();
            gameManager.setPlayer(this.player);
            gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
        }
    
        // Set up keyboard input
        if (!this.input.keyboard) {
            console.error('Keyboard input system is not available.');
            return;
        }
    
        // Add key listeners for save/load
        const loadKey = this.input.keyboard.addKey('L');
        loadKey.on('down', () => this.saveManager.showSaveSlots(), this);
        
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
    
        // Create UI elements
        this.createUIElements();
    }

    public getGrid(): Grid { return this.grid; }
    public getPlayerPosition(): Coordinate { return this.playerPosition; }
    public getNumMaxedPlants(): number { return this.numMaxedPlants; }
    public getUndoable(): (Grid | Coordinate)[] { return this.undoable; }
    public getRedoable(): (Grid | Coordinate)[] { return this.redoable; }
    public getGameSettings(): Settings { return this.gameSettings; }
    public getAutoSaveKey(): string { return gameManager.getAutoSaveKey(); }
    public getGridSize(): number { return this.gridSize; }
    public getWeatherIndex(): number {
        return (this.weatherSchedule as any).index || 0;
    }
    public getWeatherSchedule(): weatherKey[] {
        return this.gameSettings.weatherSchedule;
    }

// In Game.ts loadState() method, modify order:
public loadState(savedState: any, grid: Grid) {
    console.log("Grid in loadState:", grid); // Add debug
    // Load grid first
    this.grid = grid;
    
    // Then settings
    this.gameSettings = savedState.gameSettings;
    this.gridSize = this.gameSettings.gridSize;
    this.sunProbability = this.gameSettings.defaultSunProbability;
    this.waterProbability = this.gameSettings.defaultWaterProbability;
    this.MAXED_PLANTS_WIN_CONDITION = this.gameSettings.plantsToMax;

    // Load state
    this.playerPosition = { ...savedState.playerPosition };
    this.numMaxedPlants = savedState.numMaxedPlants || 0;
    this.undoable = savedState.undoable || [];
    this.redoable = savedState.redoable || [];

    // Weather after grid
    this.weatherSchedule = this.createIterator(this.gameSettings.weatherSchedule);
    this.updateWeather();

    // Visual updates last
    this.createPlayer();
    gameManager.setPlayer(this.player);
    gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
    this.repositionPlayer();
}
    
    public initializeNewGame() {
        this.setDefaultSettings();
        this.initializeCellResources();
        this.createPlayer();
        this.numMaxedPlants = 0;  // Add this line
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
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
            this.saveManager.saveGame();
            this.game.scene.start('Settings');
        });

        // Create tutorial button
        this.UIElements.tutorialButton = new TextButton(this, 0, 70, 'Tutorial', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.game.scene.start('Tutorial');
        });

        gameManager.setUIElements(this.UIElements.forecastText, this.UIElements.settingsButton, this.UIElements.tutorialButton);
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

    private createIterator(array: weatherKey[]): {next() : weatherKey | null, getNext(): weatherKey | null} {
        let index = 0;
        const schedule = array;  // Keep reference to original schedule
    
        return {
            next: function() {
                // If we hit the end, reset index to start
                if (index >= schedule.length) {
                    index = 0;
                }
                // Return next weather if schedule exists
                if (schedule.length > 0) {
                    const value = schedule[index];
                    index += 1;
                    return value;
                }
                return null;
            },
            getNext: function() {
                if (schedule.length > 0) {
                    // Use modulo to wrap around array
                    return schedule[index % schedule.length];
                }
                return null;
            }
        }
    }

    private isValidGameState(state: any): state is GameState {
        return (
            state &&
            // Validate grid is a Base64 string
            typeof state.grid === 'string' &&
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

    update() {
        // Handle player actions
        this.handlePlayerActions();
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
        this.grid = JSON.parse(JSON.stringify(this.grid));       // Dereference this.grid from the object in undoable array
        // Update resources for each cell
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentCell = this.grid[row][col];

                // Plant growth mechanics
                if (currentCell.plant) {
                    this.numMaxedPlants = this.plantsManager.updatePlantGrowth({row: row, col: col}, this.numMaxedPlants, this.grid);
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
        //this.drawGrid();
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);

        // Auto-save after each turn
        this.saveManager.saveGame();
    }

    private updateWeather() {
        const newWeather: weatherKey | null = this.weatherSchedule.next();
        
        // Explicitly check for valid weather key
        if (newWeather && Weathers[newWeather]) {
            this.resourceModifier = {
                sun: Weathers[newWeather].sun,
                water: Weathers[newWeather].water
            };
        } else {
            // Default values if weather is invalid
            this.resourceModifier = {
                sun: 1,
                water: 1
            };
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
    

    private handlePlayerActions() {
        const movementDirection = this.playerActions.checkForPlayerMovement(this.gridSize, this.playerPosition, this.undoable);
        if (movementDirection) {
            this.redoable = [];
            this.movePlayerTo(movementDirection);
        }

        const plantInteractionDirection = this.playerActions.checkforPlantInteraction(this.gridSize, this.playerPosition, this.grid, this.undoable);
        if (plantInteractionDirection) {
            this.redoable = [];
            this.grid = JSON.parse(JSON.stringify(this.grid));
            this.handlePlantInteraction(plantInteractionDirection);
        }
    }

    // Method to move the player to a specific cell
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
        this.plantsManager.handlePlantInteraction(cell, this.grid);
        this.saveManager.saveGame();

        // Redraw the grid to reflect plant changes
        //this.drawGrid();
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
    }

    // Handle UNDO and REDO operations
    private undo(){
        if (this.undoable.length > 0){
            const action: Grid | Coordinate = this.undoable.pop()!;
            if (Array.isArray(action)){         // cheap way to check if action is a Grid
                this.redoable.push(this.grid);
                this.grid = action;
                gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
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
                gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
            }else{
                this.undoable.push(this.playerPosition)
                this.movePlayerTo(action)
            }
        }
    }
}

// Interface for game state
interface GameState {
    grid: ArrayBuffer;  // Changed from Grid to ArrayBuffer
    playerPosition: Coordinate;
    numMaxedPlants: number;
    undoable: (Grid | Coordinate)[];
    redoable: (Grid | Coordinate)[];
    gameSettings: Settings;
    weatherIndex: number;
}

// Interface to define cell resource structure
export interface CellResource {
    sun: number;
    water: number; // 0-3 water levels
    plant: Plant | null; // Plant object or null if no plant
}
export type Grid = CellResource[][];
export interface Coordinate {
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
type weatherKey = keyof typeof Weathers;

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