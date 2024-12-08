import 'phaser';

import i18n from './i18n';
import { PopupWindow } from './popup-window';

export class SaveManager extends Phaser.Data.DataManager {
    game = null;
    MAX_GROWTH_CONDITIONS = null;
    
    constructor() {
        super(new Phaser.Events.EventEmitter());
        this.saveSlotPrefix = 'game_save_';
        this.MAX_SPECIES_LENGTH = 8;
        this.numSaveSlots = 3;
    }

    setGame(game) {
        this.game = game;
    }

    setMaxGrowthConditions(maxGrowthConditions) {
        this.MAX_GROWTH_CONDITIONS = maxGrowthConditions;
    }

    initializeSaveManager(game, maxGrowthConditions) {
        this.setGame(game);
        this.setMaxGrowthConditions(maxGrowthConditions); 
    }

    isInitialized() {
        return this.game !== null && this.MAX_GROWTH_CONDITIONS !== null;
    }


    saveGame(slot) {
        const gameState = {
            grid: this.serializeGrid(this.game.getGrid()),
            playerPosition: { ...this.game.getPlayerPosition() },
            numMaxedPlants: this.game.getNumMaxedPlants(),
            undoable: JSON.parse(JSON.stringify(this.game.getUndoable())),
            redoable: JSON.parse(JSON.stringify(this.game.getRedoable())),
            gameSettings: {
                ...this.game.getGameSettings(),
                weatherSchedule: this.game.getWeatherSchedule() // Ensure schedule is saved
            },
            weatherIndex: this.game.getWeatherIndex()
        };

        const serializedGrid = btoa(String.fromCharCode(...new Uint8Array(gameState.grid)));
        const stateForStorage = {
            ...gameState,
            grid: serializedGrid
        };

        try {
            const serializedState = JSON.stringify(stateForStorage);
            if (!slot) {
                localStorage.setItem(this.game.getAutoSaveKey(), serializedState);
            } else {
                localStorage.setItem(this.saveSlotPrefix + slot, serializedState);
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            alert('Failed to save game state.');
        }
    }

    loadGame(slot) {
        const savedGame = localStorage.getItem(this.saveSlotPrefix + slot);
        if (savedGame) {
            this.loadGameState(JSON.parse(savedGame));
        } else {
            alert(`No save found in slot ${slot}.`);
        }
    }

    showSaveSlots(scene) {
        const saveSlotPopup = new PopupWindow(scene, scene.cameras.main.width / 2, scene.cameras.main.height / 2, 900, 700, i18n.t('choose_save_slot'), "", {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });
        saveSlotPopup.changeCloseButtonPosition(-200, 300);

        for (let i = 1; i <= this.numSaveSlots; i++) {
            this.createSaveSlot(scene, saveSlotPopup, -400, -275 + (175 * (i - 1)), 600, 150, i);
        }

        // Clear save slots button
        const clearSaveSlotsButton = scene.add.rectangle(200, 300, 400, 75, 0xff0000)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerup', () => {
                this.clearSaveSlots();
                saveSlotPopup.setVisible(false);
                this.showSaveSlots(scene);
            })
            .on('pointerover', () => {
                clearSaveSlotsButton.setFillStyle(0xffff00);
            })
            .on('pointerout', () => {
                clearSaveSlotsButton.setFillStyle(0xff0000);
            })
            .on('pointerdown', () => {
                clearSaveSlotsButton.setFillStyle(0x00ffff);
            });

        saveSlotPopup.add(clearSaveSlotsButton);
        clearSaveSlotsButton.text = scene.add.text(200, 300, i18n.t('clear_save_slots'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);
        saveSlotPopup.add(clearSaveSlotsButton.text);
    }

    createSaveSlot(scene, saveSlotPopup, x, y, width, height, slotNumber) {
        const isLoaded = localStorage.getItem(this.saveSlotPrefix + slotNumber) ? true : false;
        
        const saveSlotColor = isLoaded ? saveSlotColors.loaded : saveSlotColors.empty;
        const saveSlotDisplayText = isLoaded ? "Override Slot " + slotNumber : "Save Slot " + slotNumber;

        const saveSlot = scene.add.rectangle(x, y, width, height, saveSlotColor)
            .setOrigin(0)
            .setInteractive()
            .on('pointerup', () => {
                this.saveGame(slotNumber);
                this.createSaveSlot(scene, saveSlotPopup, x, y, width, height, slotNumber);
            })
            .on('pointerover', () => {
                saveSlot.setFillStyle(0xffff00);
            })
            .on('pointerout', () => {
                saveSlot.setFillStyle(saveSlotColor);
            })
            .on('pointerdown', () => {
                saveSlot.setFillStyle(0x00ffff);
            });
        saveSlotPopup.add(saveSlot);
        saveSlot.text = scene.add.text(-100, y + 75, i18n.t('display_save_slot_text', {saveSlotDisplayText}), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);
        saveSlotPopup.add(saveSlot.text);

        if (isLoaded) {
            const loadButton = scene.add.rectangle(x + 625, y, 200, height, 0xffff00)
                .setOrigin(0)
                .setInteractive()
                .on('pointerup', () => {
                    this.loadGame(slotNumber);
                    scene.scene.stop('Settings');
                })
                .on('pointerover', () => {
                    loadButton.setFillStyle(0x0000ff);
                })
                .on('pointerout', () => {
                    loadButton.setFillStyle(0xffff00);
                })
            saveSlotPopup.add(loadButton);
            loadButton.text = scene.add.text(x + 725, y + 75, i18n.t('load'), {
                fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 6
            }).setOrigin(0.5);
            saveSlotPopup.add(loadButton.text);
        }
    }

    clearSaveSlots() {
        for (let i = 1; i <= this.numSaveSlots; i++) {
            localStorage.removeItem(this.saveSlotPrefix + i);
        }
    }

    loadGameState(savedState) {
        try {
            console.log("Loading state:", savedState); // Add debug
            const gridArray = new Uint8Array(atob(savedState.grid).split('').map(c => c.charCodeAt(0)));
            const gridBuffer = gridArray.buffer;
            const grid = this.deserializeGrid(gridBuffer);
            console.log("Grid after deserialize:", grid); // Add debug
            this.game.loadState(savedState, grid);
        } catch (error) {
            console.error('Error in loadGameState:', error);
            this.game.initializeNewGame();
        }
    }

    serializeGrid(grid) {
        const growthConditionSize = 3;
        const plantFixedSize = 2 + 2 + this.MAX_SPECIES_LENGTH + growthConditionSize * this.MAX_GROWTH_CONDITIONS;
        const cellSize = 2 + 1 + plantFixedSize;

        const gridSize = grid.length * grid[0].length;
        const bufferSize = gridSize * cellSize;
        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);

        let byteOffset = 0;

        for (const row of grid) {
            for (const cell of row) {
                view.setUint8(byteOffset++, cell.sun);
                view.setUint8(byteOffset++, cell.water);

                if (cell.plant) {
                    view.setUint8(byteOffset++, 1);

                    const { species, growthLevel, maxGrowthLevel, growthConditions } = cell.plant;

                    for (let i = 0; i < this.MAX_SPECIES_LENGTH; i++) {
                        view.setUint8(byteOffset + i, i < species.length ? species.charCodeAt(i) : 0);
                    }
                    byteOffset += this.MAX_SPECIES_LENGTH;

                    view.setUint8(byteOffset++, growthLevel);
                    view.setUint8(byteOffset++, maxGrowthLevel);

                    for (let i = 0; i < this.MAX_GROWTH_CONDITIONS; i++) {
                        if (i < growthConditions.length) {
                            const condition = growthConditions[i];
                            view.setInt8(byteOffset++, condition.requiredSun);
                            view.setInt8(byteOffset++, condition.requiredWater);
                            view.setInt8(byteOffset++, condition.requiredNeighbors);
                        } else {
                            view.setUint8(byteOffset++, 0);
                            view.setUint8(byteOffset++, 0);
                            view.setUint8(byteOffset++, 0);
                        }
                    }
                } else {
                    view.setUint8(byteOffset++, 0);
                    byteOffset += plantFixedSize;
                }
            }
        }

        return buffer;
    }

    deserializeGrid(buffer) {
        console.log("Buffer length:", buffer.byteLength); // Debug
        
        const view = new DataView(buffer);
        const growthConditionSize = 3;
        const plantFixedSize = 2 + 2 + this.MAX_SPECIES_LENGTH + growthConditionSize * this.MAX_GROWTH_CONDITIONS;
        let byteOffset = 0;
        const gridSize = this.game.getGridSize(); // Get size from game
        console.log("GridSize during deserialize:", gridSize); // Debug
        
        const grid = [];
        for (let r = 0; r < gridSize; r++) {
            const row = [];
            for (let c = 0; c < gridSize; c++) {
                const sun = view.getUint8(byteOffset);
                byteOffset += 1;
                const water = view.getUint8(byteOffset);
                byteOffset += 1;
                const hasPlant = view.getUint8(byteOffset) === 1;
                byteOffset += 1;
                let plant = null;
                if (hasPlant) {
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
                    const growthConditions = [];
                    for (let i = 0; i < maxGrowthLevel; i++) {
                        growthConditions.push({
                            requiredSun: view.getInt8(byteOffset),
                            requiredWater: view.getInt8(byteOffset + 1),
                            requiredNeighbors: view.getInt8(byteOffset + 2)
                        });
                        byteOffset += 3;
                    }
                    byteOffset += (this.MAX_GROWTH_CONDITIONS - maxGrowthLevel) * 3;
                    plant = { species, growthLevel, maxGrowthLevel, growthConditions };
                } else {
                    byteOffset += plantFixedSize;
                }
                row.push({ sun, water, plant });
            }
            grid.push(row);
        }
        console.log("Deserialized grid:", grid); // Debug
        return grid;
    }
}

const saveSlotColors = {
    "loaded": 0x00ff00,
    "empty": 0xcccccc,
}

export const saveManager = new SaveManager();