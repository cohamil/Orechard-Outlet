import 'phaser';

import { SpeciesName } from './PlantsManager';

class GameManager extends Phaser.Data.DataManager {
    constructor() {
        super(new Phaser.Events.EventEmitter());
        this.isPlaying = false;
        this.ORDERS_COMPLETED_WIN_CONDITION = 5;
        this.autoSaveKey = 'game_autosave';
        this.confirmLoad = null;
        this.player = null;
        this.UIElements = null;
        this.game = null;
        this.gameSet = false;
        this.currentOrder = null;
        this.currentOrderComplete = true;
    }

    setGame(game) {
        this.game = game;
        this.gameSet = true;
    }

    getGame() {
        return this.gameSet ? this.game : null;
    }

    setPlaying(value) {
        this.isPlaying = value;
    }

    getPlaying() {
        return this.isPlaying;
    }

    setOrdersCompletedWinCon(value) {
        this.ORDERS_COMPLETED_WIN_CONDITION = value;
    }

    getOrdersCompletedWinCon() {
        return this.ORDERS_COMPLETED_WIN_CONDITION;
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

    getCurrentOrder() {
        return this.currentOrder;
    }

    setCurrentOrder(order) {
        this.currentOrder = order;
        console.log('Order set:', this.currentOrder); // Debugging log

        // Update the shop text directly
        if (gameManager.UIElements && gameManager.UIElements.shopDisplay) {
            const shopTextElement = gameManager.UIElements.shopDisplay.list[1]; // Assuming the text element is the second child
            if (shopTextElement) {
                let displayString = `${this.currentOrder.species} ${this.currentOrder.collectionLevel} `
                shopTextElement.setText(displayString);
                console.log('shop text updated:', displayString); // Debugging log
            } 
        }
    }

    undoOrder(order) {
        this.currentOrder = order;
        this.currentOrderComplete = false;
    }

    redoOrder(order) {
        this.currentOrder = order;
        this.currentOrderComplete = false;
    }

    submitOrder(harvestCount) {
        const order = this.currentOrder;
        if (harvestCount[order.species] >= order.collectionLevel) {
            this.currentOrderComplete = true;

            this.generateNewOrder()
            this.refreshUIElements();
            return order;
        }
        return false;
    }

    generateNewOrder() {
        // Get a random species name from the list of species
        const speciesNames = Object.values(SpeciesName);
        const species = speciesNames[Math.floor(Math.random() * speciesNames.length)];

        // Get a random collection level between 1 and 3
        const collectionLevel = Math.floor(Math.random() * 3) + 1;

        const order = {
            species: species,
            collectionLevel: collectionLevel
        };

        this.currentOrderComplete = false;
        this.setCurrentOrder(order);
    }

    getOrderDisplay() {
        // if (this.currentOrderComplete) {
        //     this.generateNewOrder();
        // }

        const orderDisplay = `${this.currentOrder.species} ${this.currentOrder.collectionLevel} `;

        return orderDisplay;
    }

    setUIElements(UIElements) {
        this.UIElements = UIElements;
    }

    refreshUIElements() {
        Object.values(this.UIElements).forEach(element => {
            if (element) {
                element.visible = false;
            }
        });
        this.game.createUIElements();
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