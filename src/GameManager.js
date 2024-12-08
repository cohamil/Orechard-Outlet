import 'phaser';

class GameManager extends Phaser.Data.DataManager {
    constructor() {
        super(new Phaser.Events.EventEmitter());
        this.isPlaying = false;
        this.autoSaveKey = 'game_autosave';
        this.confirmLoad = null;
        this.player = null;
        this.UIElements = {
            forecastText: null,
            settingsButton: null,
            tutorialButton: null,
        };
    }

    setPlaying(value) {
        this.isPlaying = value;
    }

    getPlaying() {
        return this.isPlaying;
    }

    setConfirmLoad(value) {
        this.confirmLoad = value;
    }

    getConfirmLoad() {
        return this.confirmLoad;
    }

    getAutoSaveKey() {
        return this.autoSaveKey;
    }

    setPlayer(player) {
        this.player = player;
    }

    setUIElements(forecastText, settingsButton, tutorialButton) {
        this.UIElements.forecastText = forecastText;
        this.UIElements.settingsButton = settingsButton;
        this.UIElements.tutorialButton = tutorialButton;
    }

    drawGrid(scene, gridSize, cellSize, grid, plantsManager) {
        const startX = (scene.cameras.main.width - gridSize * cellSize) / 2;
        const startY = (scene.cameras.main.height - gridSize * cellSize) / 2;

        // Destroy existing grid elements, but keep the player and UI elements
        scene.children.list
            .filter(child => child !== this.player && !Object.values(this.UIElements).includes(child))
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
                    // Sun-only cell (yellow)
                    cellColor = 0xffff00;
                } else if (cellResource.water) {
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
    getWaterColor(waterLevel) {
        switch(waterLevel) {
            case 1: return 0x87CEEB;   // Light blue
            case 2: return 0x4682B4;   // Medium blue
            case 3: return 0x000080;   // Dark blue
            default: return 0xcccccc;  // Default gray if no water
        }
    }
}

export const gameManager = new GameManager();