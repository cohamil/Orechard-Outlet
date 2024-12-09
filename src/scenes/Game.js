import { Scene } from 'phaser';
import { TextButton } from '../text-button';
// import { PopupWindow } from '../popup-window'; // Uncomment if needed
import { parse } from 'yaml';
import { gameManager } from '../GameManager';
import { PlantsManager, SpeciesName } from '../PlantsManager';
import { PlayerActions } from '../PlayerActions';
import { saveManager } from '../SaveManager';
import i18n from '../i18n';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.cellSize = 64; // Size of each cell in pixels
        this.playerPosition = { row: 0, col: 0 }; // Tracks the player's position on the grid
        this.undoable = [];
        this.redoable = [];
        
        this.plantModeActive = false;

        // Initialize managers
        this.plantsManager = new PlantsManager(this);
        saveManager.initializeSaveManager(this, this.plantsManager.getMaxConditions());

        // Default growth conditions for plants
        this.defaultGrowthConditions = [
            { requiredSun: 1, requiredWater: 1, requiredNeighbors: -1 },
            { requiredSun: 1, requiredWater: 2, requiredNeighbors: 0 },
        ];
        this.weatherSchedule = { next: () => null, getNext: () => null }; // Initialize
        this.gridSize = 0; // Number of rows and columns
        this.numOrdersCompleted = 0;
        this.MAX_SPECIES_LENGTH = 8;
        this.resourceModifier = { sun: 1, water: 1 };
        this.grid = [];
        this.sunProbability = 0;
        this.waterProbability = 0;

        // UI properties
        this.UIElements = {
            forecastText: null,
            settingsButton: null,
            tutorialButton: null,
            undoButton: null,
            redoButton: null,
            nextTurnButton: null,
            plantModeButton: null,
            upButton: null,
            downButton: null,
            leftButton: null,
            rightButton: null,
            inventoryDisplay: null,
            shopDisplay: null,
        };
    }

    preload() {
        this.load.text('yamlData', 'assets/config.yaml');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x87ceeb);

        this.playerActions = new PlayerActions(this);

        gameManager.setGame(this);

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
                gameManager.setOrdersCompletedWinCon(this.gameSettings.ordersToComplete);
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
                        saveManager.loadGameState(savedState);
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
            this.numOrdersCompleted = 0;
            gameManager.generateNewOrder();
        }

        // Create UI elements
        this.createUIElements();
    }

    getGrid() { return this.grid; }
    getPlayerPosition() { return this.playerPosition; }
    getNumOrdersCompleted() { return this.numOrdersCompleted; }
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
        gameManager.setOrdersCompletedWinCon(this.gameSettings.ordersToComplete);

        // Load state
        this.playerPosition = { ...savedState.playerPosition };
        this.numOrdersCompleted = savedState.numOrdersCompleted || 0;
        this.undoable = savedState.undoable || [];
        this.redoable = savedState.redoable || [];
        this.plantsManager.setHarvestCountArray(savedState.harvestCount);
        gameManager.setCurrentOrder(savedState.currentOrder);

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
        this.numOrdersCompleted = 0;  // Set orders completed to 0
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
    }

    // Create the UI elements for the game scene
    createUIElements() {
        // Create forecast text
        const forecast = this.weatherSchedule.getNext();
        const forecastText = forecast ? i18n.t(forecast.toLowerCase()) : i18n.t('normal');
        this.UIElements.forecastText = this.add.text(Number(this.game.config.width) / 2 - 200, 0, i18n.t('forecast') + ': ' + forecastText, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });

        // Create Settings button
        this.UIElements.settingsButton = new TextButton(this, 0, 0, i18n.t('settings'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            saveManager.saveGame();
            this.game.scene.start('Settings');
        });

        // Create tutorial button
        this.UIElements.tutorialButton = new TextButton(this, 0, 70, i18n.t('tutorial'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.game.scene.start('Tutorial');
        });

        // Create undo button
        this.UIElements.undoButton = new TextButton(this, 0, 140, i18n.t('undo'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.undo();
        });

        // Create redo button
        this.UIElements.redoButton = new TextButton(this, 0, 210, i18n.t('redo'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.redo();
        });

        // Create next turn button
        this.UIElements.nextTurnButton = new TextButton(this, 0, 320, i18n.t('next_turn'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.advanceTurn();
        });

        // Create plant mode button
        this.UIElements.plantModeButton = new TextButton(this, 45, 450, this.plantModeActive ? i18n.t('move_mode') : i18n.t('plant_mode'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.plantModeActive = !this.plantModeActive;
            this.UIElements.plantModeButton.setText(this.plantModeActive ? i18n.t('move_mode') : i18n.t('plant_mode'));
        });
        
        // Create up button
        this.UIElements.upButton = new TextButton(this, 75, 545, '↑', {
            fontFamily: 'Arial Black', fontSize: 70, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (this.playerPosition.row > 0) {
                this.player.setFlipX(false);
                this.player.setFrame(19);
                if (this.plantModeActive) {
                    this.undoable.push(this.grid);
                    this.redoable = [];
                    this.grid = JSON.parse(JSON.stringify(this.grid));
                    this.handlePlantInteraction({ row: this.playerPosition.row - 1, col: this.playerPosition.col });
                } else {
                    this.undoable.push(this.playerPosition);
                    this.redoable = [];
                    this.movePlayerTo({ row: this.playerPosition.row - 1, col: this.playerPosition.col });
                }
            }
        });

        // Create down button
        this.UIElements.downButton = new TextButton(this, 75, 655, '↓', {
            fontFamily: 'Arial Black', fontSize: 70, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (this.playerPosition.row < this.gridSize - 1) {
                this.player.setFlipX(false);
                this.player.setFrame(11);
                if (this.plantModeActive) {
                    this.undoable.push(this.grid);
                    this.redoable = [];
                    this.grid = JSON.parse(JSON.stringify(this.grid));
                    this.handlePlantInteraction({ row: this.playerPosition.row + 1, col: this.playerPosition.col });
                }
                else {
                    this.undoable.push(this.playerPosition);
                    this.redoable = [];
                    this.movePlayerTo({ row: this.playerPosition.row + 1, col: this.playerPosition.col });
                }
            }
        });

        // Create left button
        this.UIElements.leftButton = new TextButton(this, 0, 600, '←', {
            fontFamily: 'Arial Black', fontSize: 70, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (this.playerPosition.col > 0) {
                this.player.setFlipX(true);
                this.player.setFrame(3);
                if (this.plantModeActive) {
                    this.undoable.push(this.grid);
                    this.redoable = [];
                    this.grid = JSON.parse(JSON.stringify(this.grid));
                    this.handlePlantInteraction({ row: this.playerPosition.row, col: this.playerPosition.col - 1 });
                } else {
                    this.undoable.push(this.playerPosition);
                    this.redoable = [];
                    this.movePlayerTo({ row: this.playerPosition.row, col: this.playerPosition.col - 1 });
                }
            }
        });

        // Create right button
        this.UIElements.rightButton = new TextButton(this, 115, 600, '→', {
            fontFamily: 'Arial Black', fontSize: 70, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (this.playerPosition.col < this.gridSize - 1) {
                this.player.setFlipX(false);
                this.player.setFrame(3);
                if (this.plantModeActive) {
                    this.undoable.push(this.grid);
                    this.redoable = [];
                    this.grid = JSON.parse(JSON.stringify(this.grid));
                    this.handlePlantInteraction({ row: this.playerPosition.row, col: this.playerPosition.col + 1 });
                } else {
                    this.undoable.push(this.playerPosition);
                    this.redoable = [];
                    this.movePlayerTo({ row: this.playerPosition.row, col: this.playerPosition.col + 1 });
                }
            }
        });

        // Create inventory display
        this.UIElements.inventoryDisplay = this.add.container(0, 0);
        this.UIElements.inventoryDisplay.add(this.add.text(840, 425, i18n.t('inventory'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }));
        this.UIElements.inventoryDisplay.add(this.add.text(950, 475, this.plantsManager.getHarvestedPlantsDisplay(), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }));
        // Display Sprites
        this.UIElements.inventoryDisplay.add(this.add.sprite(895, 494, 'lilac', 2));
        this.UIElements.inventoryDisplay.add(this.add.sprite(895, 573, 'daisy', 2));
        this.UIElements.inventoryDisplay.add(this.add.sprite(895, 655, 'tulip', 2));

        // Create shop display
        this.UIElements.shopDisplay = this.add.container(0, 0);
        this.UIElements.shopDisplay.add(this.add.text(840, 0, i18n.t('order'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }));
        this.UIElements.shopDisplay.add(this.add.text(840, 50, gameManager.getOrderDisplay(), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }));
        this.UIElements.shopDisplay.add(new TextButton(this, 840, 150, i18n.t('submit_order'), {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            const completedOrder = gameManager.submitOrder(this.plantsManager.getHarvestCountArray());
            if (completedOrder) {
                this.numOrdersCompleted += 1;

                // Check for the win condition
                if (this.numOrdersCompleted === gameManager.getOrdersCompletedWinCon()) {
                    this.scene.start('GameOver');
                    this.playerPosition = { row: 0, col: 0 };
                    return;
                }

                this.undoable.push(completedOrder);
                this.redoable = [];
                this.plantsManager.decrementHarvestCount(completedOrder.species, completedOrder.collectionLevel);
                console.log("Orders completed:", this.numOrdersCompleted);
            }
            else {
                console.log("Order not complete.");
            }
        }));


        gameManager.setUIElements(this.UIElements);
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
            ordersToComplete: 5,
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
            typeof state.numOrdersCompleted === 'number'
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
                    this.plantsManager.updatePlantGrowth({ row: row, col: col }, this.grid);
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
        saveManager.saveGame();
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
        /*this.player = this.add
            .rectangle(x, y, this.cellSize * 0.5, this.cellSize * 0.5, 0xff0000)
            .setOrigin(0.5)
            .setDepth(10); // Ensure player is drawn on top of grid cells*/
        this.player = this.add.sprite(x, y, 'playerAnimations', 11).setOrigin(0.5).setScale(3).setDepth(10);
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
        const movementDirection = this.playerActions.checkForPlayerMovement(this.gridSize, this.playerPosition, this.player);
        if (movementDirection) {
            this.undoable.push(this.playerPosition);
            this.redoable = [];
            this.movePlayerTo(movementDirection);
        }

        const plantInteractionDirection = this.playerActions.checkforPlantInteraction(this.gridSize, this.playerPosition, this.player);
        if (plantInteractionDirection) {
            this.undoable.push(this.grid);
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
        saveManager.saveGame();
        // Redraw the grid to reflect plant changes
        gameManager.setPlayer(this.player);
        gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
    }

    getHarvestCount() {
        return this.plantsManager.getHarvestCountArray();
    }

    setHarvestCount(harvestCount) {
        this.plantsManager.setHarvestCountArray(harvestCount);
    }

    // Handle UNDO and REDO operations
    undo() {
        if (this.undoable.length > 0) {
            const action = this.undoable.pop();
            if (Array.isArray(action)) { // Check if action is a Grid
                const plantUpdate = this.checkForUndoPlantDifference(this.grid, action);
                if (plantUpdate) {
                    if (plantUpdate.growthLevel === plantUpdate.maxGrowthLevel) {
                        this.plantsManager.decrementHarvestCount(SpeciesName[plantUpdate.species], 1);   
                    }
                }
                
                this.redoable.push(this.grid);
                this.grid = action;
                gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
            }
            else if (action.species && action.collectionLevel) { // Check if action is an Order
                console.log("Undoing order:", action);
                
                this.numOrdersCompleted -= 1;
                this.plantsManager.incrementHarvestCount(action.species, action.collectionLevel);
                this.redoable.push(gameManager.getCurrentOrder());
                gameManager.undoOrder(action);
                gameManager.refreshUIElements();
            }
            else { // Otherwise action is a Coordinate
                this.redoable.push(this.playerPosition);
                this.movePlayerTo(action);
            }
        }
    }

    redo() {
        if (this.redoable.length > 0) {
            const action = this.redoable.pop();
            if (Array.isArray(action)) {
                const plantUpdate = this.checkForRedoPlantDifference(this.grid, action);
                if (plantUpdate) {
                    if (plantUpdate.growthLevel === plantUpdate.maxGrowthLevel) {
                        this.plantsManager.incrementHarvestCount(SpeciesName[plantUpdate.species], 1);
                    }
                }
                
                this.undoable.push(this.grid);
                this.grid = action;
                gameManager.drawGrid(this, this.gridSize, this.cellSize, this.grid, this.plantsManager);
            } 
            else if (action.species && action.collectionLevel) {
                console.log("Redoing order:", action);
                
                this.numOrdersCompleted += 1;
                this.plantsManager.decrementHarvestCount(gameManager.getCurrentOrder().species, gameManager.getCurrentOrder().collectionLevel);
                this.undoable.push(gameManager.getCurrentOrder());
                gameManager.redoOrder(action);
                gameManager.refreshUIElements();
            }

            else {
                this.undoable.push(this.playerPosition);
                this.movePlayerTo(action);
            }
        }
    }

    checkForUndoPlantDifference(curGrid, prevGrid) {
        for (let row = 0; row < curGrid.length; row++) {
            for (let col = 0; col < curGrid[row].length; col++) {
                const prevPlant = prevGrid[row][col].plant;
                if (!curGrid[row][col].plant && prevPlant) {
                    return prevPlant ? prevPlant : false;
                }
            }
        }
        return false;
    }

    checkForRedoPlantDifference(curGrid, prevGrid) {
        for (let row = 0; row < curGrid.length; row++) {
            for (let col = 0; col < curGrid[row].length; col++) {
                const curPlant = curGrid[row][col].plant;
                if (curPlant && !prevGrid[row][col].plant) {
                    return curPlant ? curPlant : false;
                }
            }
        }
        return false;
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