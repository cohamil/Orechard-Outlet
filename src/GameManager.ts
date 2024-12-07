import 'phaser';

import { TextButton } from './text-button';
import { Grid, Coordinate } from './scenes/Game';
import { PlantsManager, Plant } from './PlantsManager';

class GameManager extends Phaser.Data.DataManager
{
    private isPlaying: boolean = false;
    private autoSaveKey: string = 'game_autosave';
    private confirmLoad: boolean | null = null;
    private player: Phaser.GameObjects.Rectangle | null = null;
    private UIElements: {
        forecastText: Phaser.GameObjects.Text | null;
        settingsButton: TextButton | null;
        tutorialButton: TextButton | null;
    } = {
        forecastText: null,
        settingsButton: null,
        tutorialButton: null,
    };
    
    constructor () {
        super(new Phaser.Events.EventEmitter());
    }

    setPlaying (value: boolean){
        this.isPlaying = value;
    }

    getPlaying () {
        return this.isPlaying;
    }

    printBool () {
        console.log(this.isPlaying);
    }

    setConfirmLoad (value: boolean) {
        this.confirmLoad = value;
    }

    getConfirmLoad () {
        return this.confirmLoad;
    }

    getAutoSaveKey () {
        return this.autoSaveKey;
    }

    setPlayer (player: Phaser.GameObjects.Rectangle) {
        this.player = player;
    }

    setUIElements (forecastText: Phaser.GameObjects.Text, settingsButton: TextButton, tutorialButton: TextButton) {
        this.UIElements.forecastText = forecastText;
        this.UIElements.settingsButton = settingsButton;
        this.UIElements.tutorialButton = tutorialButton;
    }
    
    drawGrid (scene: Phaser.Scene, gridSize: number, cellSize: number, grid: Grid, plantsManager: PlantsManager) {
        const startX = (scene.cameras.main.width - gridSize * cellSize) / 2;
        const startY = (scene.cameras.main.height - gridSize * cellSize) / 2;
        
        // Destroy existing grid elements, but keep the player and UI elements
        scene.children.list
            .filter(child => child !== this.player && !Object.values(this.UIElements).includes(child as any))
            .forEach(child => child.destroy());

        let cellColor = 0xcccccc; // Default gray
    
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const x = startX + col * cellSize;
                const y = startY + row * cellSize;
    
                // Get cell resources
                const cellResource = grid[row][col];
    
                // Determine cell color based on resources
                cellColor = 0xcccccc; // Default gray
                if (cellResource.sun && cellResource.water) {
                    // If both sun and water, create a diagonal split cell
                    const sunPath = scene.add
                        .polygon(x, y, [
                            0, 0,
                            cellSize - 2, cellSize - 2,
                            0, cellSize - 2
                        ], 0xffff00)
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);
                    
                    const waterPath = scene.add
                        .polygon(x, y, [
                            cellSize - 2, 0,
                            cellSize - 2, cellSize - 2,
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
                    scene.add
                        .rectangle(x, y, cellSize - 2, cellSize - 2, cellColor)
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);
                }
            }
        }

        plantsManager.drawPlants(cellSize, startX, startY, cellColor, grid);
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
}

export const gameManager = new GameManager();