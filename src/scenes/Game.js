import { Scene } from 'phaser';
import { TextButton } from '../text-button';
// import { PopupWindow } from '../popup-window'; // Uncomment if needed
import { parse } from 'yaml';
import { gameManager } from '../GameManager';
import { PlantsManager } from '../PlantsManager';
import { PlayerActions } from '../PlayerActions';
import { SaveManager } from '../SaveManager';
import i18n from '../i18n';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.cellSize = 64; // Size of each cell in pixels
        this.playerPosition = { row: 0, col: 0 }; // Tracks the player's position on the grid
        this.undoable = [];
        this.redoable = [];
        // Initialize managers
        this.plantsManager = new PlantsManager(this);
        this.saveManager = new SaveManager(this, this.plantsManager);
        this.defaultGrowthConditions = [
            { requiredSun: 1, requiredWater: 1, requiredNeighbors: -1 },
            { requiredSun: 1, requiredWater: 2, requiredNeighbors: -1 },
            { requiredSun: 1, requiredWater: 2, requiredNeighbors: 0 }
        ];
        this.weatherSchedule = { next: () => null, getNext: () => null }; // Initialize
        this.gridSize = 0; // Number of rows and columns
        this.numMaxedPlants = 0;
        this.MAX_SPECIES_LENGTH = 8;
        this.resourceModifier = { sun: 1, water: 1 };
        this.grid = [];
        this.sunProbability = 0;
        this.waterProbability = 0;

        // UI properties
        this.UIElements = {
            forecastText: null,
            settingsButton: null,
            tutorialButton: null
        };
    }

    preload() {
        this.load.text('yamlData', 'assets/config.yaml');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x87ceeb);

        this.playerActions = new PlayerActions(this);

        // Create initial plant species (species, maxLevel, conditions)
        this.plantsManager.createSpecies("lilac", this.defaultGrowthConditions.length, this.defaultGrowthConditions);
        this.plantsManager.createSpecies("daisy", this.defaultGrowthConditions.length, this.defaultGrowthConditions);
        this.plantsManager.createSpecies("tulip", this.defaultGrowthConditions.length, this.defaultGrowthConditions);

        // Always load YAML settings first
        if (this.cache.text.has('yamlData')) {
            try {
                this.gameSettings = parse(this.cache.text.get('yamlData'));
                // Initialize core settings immediately
                this.gridSize = this.gameSettings.gridSize;
                this.sunProbability = this.gameSettings.defaultSunProbability;
                this.waterProbability = this.gameSettings.defaultWaterProbability;
                gameManager.setPlantsWinCon(this.gameSettings.plantsToMax);
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
            this.movePlayerTo({row: 0, col: 0});
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
        turnKey.on('down', this.advanceTurn.bind(this));

        // Add key listeners for undo/redo
        const undoKey = this.input.keyboard.addKey('Z');
        undoKey.on('down', this.undo.bind(this));
        const redoKey = this.input.keyboard.addKey('X');
        redoKey.on('down', this.redo.bind(this));

        // Reset Win Condition if not loaded
        if (!autoSaveLoaded) {
            this.numMaxedPlants = 0;
        }

        // Create UI elements
        this.createUIElements();
    }

    getGrid() { return this.grid; }
    getPlayerPosition() { return this.playerPosition; }
    getNumMaxedPlants() { return this.numMaxedPlants; }
    getUndoable() { return this.undoable; }
    getRedoable() { return this.redoable; }
    getGameSettings() { return this.gameSettings; }
    getAutoSaveKey() { return gameManager.getAutoSaveKey(); }
    getGridSize() { return this.gridSize; }

    getWeatherIndex() {
        return (this.weatherSchedule).index || 0;
    }

    getWeatherSchedule() {
        return this.gameSettings.weatherSchedule;
    }

    // Modify loadState() method order
    loadState(savedState, grid) {
        console.log("Grid in loadState:", grid); // Add debug
        // Load grid first
        this.grid = grid;

        // Then settings
        this.gameSettings = savedState.gameSettings;
        this.gridSize = this.gameSettings.gridSize;
        this.sunProbability = this.gameSettings.defaultSunProbability;
        this.waterProbability = this.gameSettings.defaultWaterProbability;
        gameManager.setPlantsWinCon(this.gameSettings.plantsToMax);

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
    }

    initializeNewGame() {
        this.setDefaultSettings();
        this.initializeCellResources();
        this.createPlayer();
        this.numMaxedPlants = 0;  // Set maxed plants to 0
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
    }

    // Create the UI elements for the game scene
    // Create the UI elements for the game scene
    // Create the UI elements for the game scene
    createUIElements() {
        // Create forecast text
        const forecast = this.weatherSchedule.getNext();
        const forecastText = forecast ? i18n.t(forecast.toLowerCase()) : i18n.t('normal');
        this.UIElements.forecastText = this.add.text(Number(this.game.config.width) / 2 - 200, 0, i18n.t('forecast') + ': ' + forecastText, {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });

        // Create Settings button
        this.UIElements.settingsButton = new TextButton(this, 0, 0, i18n.t('settings'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.saveManager.saveGame();
            this.game.scene.start('Settings');
        });

        // Create tutorial button
        this.UIElements.tutorialButton = new TextButton(this, 0, 70, i18n.t('tutorial'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.game.scene.start('Tutorial');
        });

        gameManager.setUIElements(this.UIElements.forecastText, this.UIElements.settingsButton, this.UIElements.tutorialButton);
    }

    // Update the forecast UI
    updateForecastUI() {
        if (this.UIElements.forecastText) {
            const forecast = this.weatherSchedule.getNext();
            const forecastText = forecast ? i18n.t(forecast.toLowerCase()) : i18n.t('normal');
            this.UIElements.forecastText.setText(i18n.t('forecast') + ': ' + forecastText);
        }
    }

    setDefaultSettings() {
        this.gameSettings = {
            gridSize: 10,
            plantsToMax: 4,
            defaultSunProbability: 0.4,
            defaultWaterProbability: 0.4,
            weatherSchedule: []
        };
    }

    createIterator(array) {
        let index = 0;
        const schedule = array;  // Keep reference to the original schedule

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
        };
    }

    isValidGameState(state) {
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
    initializeCellResources() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = this.generateCellResources();
            }
        }
    }

    // Randomly generate resources for a cell
    generateCellResources() {
        const sunLevel = Math.random() < this.sunProbability ? 1 : 0;
        const waterLevel = Math.random() < this.waterProbability ? 1 : 0;
        return {
            sun: sunLevel,
            water: waterLevel,
            plant: null,
        };
    }

    // Advance turn with new resource mechanics
    advanceTurn() {
        this.updateWeather();
        this.updateForecastUI();
        this.undoable.push(this.grid);
        this.redoable = [];
        this.grid = JSON.parse(JSON.stringify(this.grid)); // Dereference this.grid from the object in undoable array

        // Update resources for each cell
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentCell = this.grid[row][col];
                // Plant growth mechanics
                if (currentCell.plant) {
                    this.numMaxedPlants = this.plantsManager.updatePlantGrowth({ row: row, col: col }, this.numMaxedPlants, this.grid);
                }
                // Check for the win condition
                if (this.numMaxedPlants === gameManager.getPlantsWinCon()) {
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
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
        
        // Auto-save after each turn
        this.saveManager.saveGame();
    }

    updateWeather() {
        const newWeather = this.weatherSchedule.next();
        
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

    createPlayer() {
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

    repositionPlayer() {
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

    handlePlayerActions() {
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
    movePlayerTo(cell) {
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
    handlePlantInteraction(cell) {
        this.plantsManager.handlePlantInteraction(cell, this.grid);
        this.saveManager.saveGame();
        // Redraw the grid to reflect plant changes
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
    }

    // Handle UNDO and REDO operations
    undo() {
        if (this.undoable.length > 0) {
            const action = this.undoable.pop();
            if (Array.isArray(action)) { // Check if action is a Grid
                this.redoable.push(this.grid);
                this.grid = action;
                gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
            } else { // Otherwise action is a Coordinate
                this.redoable.push(this.playerPosition);
                this.movePlayerTo(action);
            }
        }
    }

    redo() {
        if (this.redoable.length > 0) {
            const action = this.redoable.pop();
            if (Array.isArray(action)) {
                this.undoable.push(this.grid);
                this.grid = action;
                gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
            } else {
                this.undoable.push(this.playerPosition);
                this.movePlayerTo(action);
            }
        }
    }
}

// Type alias for CellResource
//export type Grid = CellResource[][];

// Enum to define types of weather
// Note: Enums can be defined using constants or simple objects in JavaScript.
const Weathers = Object.freeze({
    SUNNY: {
        sun: 2,
        water: 1
    },
    RAINY: {
        sun: 1,
        water: 2
    },
    CLOUDY: {
        sun: 0.5,
        water: 1
    },
    DEFAULT: {
        sun: 1,
        water: 1
    }
});