import { Game } from './scenes/Game';
import { Grid, CellResource, } from './scenes/Game';
import {Plant, GrowthCondition } from './PlantsManager';

export class SaveManager {
    private saveSlotPrefix = 'game_save_';
    private game: Game;
    private readonly MAX_SPECIES_LENGTH = 8;
    private readonly MAX_GROWTH_CONDITIONS = 5;

    constructor(game: Game) {
        this.game = game;
    }

    public saveGame(slot?: string) {
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
                alert(`Game saved to ${slot}.`);
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            alert('Failed to save game state.');
        }
    }

    public loadGame(slot: string) {
        const savedGame = localStorage.getItem(this.saveSlotPrefix + slot);
        if (savedGame) {
            this.loadGameState(JSON.parse(savedGame));
        } else {
            alert(`No save found in slot ${slot}.`);
        }
    }

    public showSaveSlots() {
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

    public loadGameState(savedState: any) {
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

    private serializeGrid(grid: Grid): ArrayBuffer {
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

    // In SaveManager.ts, update deserializeGrid:
    private deserializeGrid(buffer: ArrayBuffer): Grid {
        console.log("Buffer length:", buffer.byteLength); // Debug
        
        const view = new DataView(buffer);
        const growthConditionSize = 3;
        const plantFixedSize = 2 + 2 + this.MAX_SPECIES_LENGTH + growthConditionSize * this.MAX_GROWTH_CONDITIONS;

        let byteOffset = 0;
        const gridSize = this.game.getGridSize(); // Get size from game
        console.log("GridSize during deserialize:", gridSize); // Debug
        
        const grid: Grid = [];

        for (let r = 0; r < gridSize; r++) {
            const row: CellResource[] = [];

            for (let c = 0; c < gridSize; c++) {
                const sun = view.getUint8(byteOffset);
                byteOffset += 1;

                const water = view.getUint8(byteOffset);
                byteOffset += 1;

                const hasPlant = view.getUint8(byteOffset) === 1;
                byteOffset += 1;

                let plant: Plant | null = null;
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

                    const growthConditions: GrowthCondition[] = [];
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