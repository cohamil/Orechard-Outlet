import { Scene } from 'phaser';

export class Game extends Scene {
    private gridSize: number = 10; // Number of rows and columns
    private cellSize: number = 64; // Size of each cell in pixels
    private player!: Phaser.GameObjects.Rectangle; // The player's visual representation
    private playerPosition: { row: number; col: number } = { row: 0, col: 0 }; // Tracks the player's position on the grid
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    
    // New properties for cell resources
    private cellResources!: CellResource[][];

    // Constants
    private MAX_GROWTH_LEVEL = 4;
    private MAXED_PLANTS_WIN_CONDITION = 3;
    private plantSpecies = ['0xDA70D6', '0x4CBB17', '0xF28C28']; // Lilac, Daisy, Tulip
    private numMaxedPlants = 0;

    constructor() {
        super('Game');
    }

    create() {
        // Set up the camera background color
        this.cameras.main.setBackgroundColor(0x87ceeb); // Light blue

        // Initialize cell resources
        this.initializeCellResources();

        // Create the player first
        this.createPlayer();
        this.movePlayerTo(0, 0);

        // Draw the 2D grid with resources
        this.drawGrid();

        if (!this.input.keyboard) {
            console.error('Keyboard input system is not available.');
            return;
        }

        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeys('W,S,A,D,T'); // Added 'T' for turn advancement
        
        // Add a key listener for advancing turns
        const turnKey = this.input.keyboard.addKey('T');
        turnKey.on('down', this.advanceTurn, this);
    }

    update() {
        // Handle player movement
        this.handlePlayerMovement();
    }

    // Initialize cell resources with random generation
    private initializeCellResources() {
        this.cellResources = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.cellResources[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.cellResources[row][col] = this.generateCellResources();
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
        console.log('Turn advanced!');
        
        // Update resources for each cell
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentCell = this.cellResources[row][col];

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
    }

    // Update plant growth based on resources
    private updatePlantGrowth(row: number, col: number) {
        const cellResource = this.cellResources[row][col];
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
                const adjacentPlant = this.cellResources[cell.row][cell.col].plant;
                if (adjacentPlant) return false;
            }
        }

        return true;
    }

    private drawGrid() {
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
                const cellResource = this.cellResources[row][col];

                // Determine cell color based on resources
                let cellColor = 0xcccccc; // Default gray
                if (cellResource.sun && cellResource.water) {
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
                    // Sun-only cell (yellow)
                    cellColor = 0xffff00;
                } else if (cellResource.water) {
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
            if (col > 0) this.movePlayerTo(row, col - 1); // Move left
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[68])) {
            if (col < this.gridSize - 1) this.movePlayerTo(row, col + 1); // Move right
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[87])) {
            if (row > 0) this.movePlayerTo(row - 1, col); // Move up
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[83])) {
            if (row < this.gridSize - 1) this.movePlayerTo(row + 1, col); // Move down
        }

        // Arrow Keys for Plant Interaction
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (col > 0) this.handlePlantInteraction(row, col - 1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (col < this.gridSize - 1) this.handlePlantInteraction(row, col + 1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (row > 0) this.handlePlantInteraction(row - 1, col);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (row < this.gridSize - 1) this.handlePlantInteraction(row + 1, col);
        }
    }

    private movePlayerTo(row: number, col: number) {
        const startX = (this.cameras.main.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.cameras.main.height - this.gridSize * this.cellSize) / 2;

        // Calculate new position
        const x = startX + col * this.cellSize + this.cellSize / 2;
        const y = startY + row * this.cellSize + this.cellSize / 2;

        // Update the player's position
        this.player.setPosition(x, y);
        this.playerPosition = { row, col };
    }

    // Method to handle plant interaction
    private handlePlantInteraction(row: number, col: number) {
        const cellResource = this.cellResources[row][col];
        
        // Plant a new plant if the cell is empty
        if (!cellResource.plant) {
            this.sowPlant(row, col);
        } 
        // Harvest the plant if the cell has a plant
        else {
            this.harvestPlant(row, col);
        }

        // Redraw the grid to reflect plant changes
        this.drawGrid();
    }

    // Method to plant a new plant in a cell
    private sowPlant(row: number, col: number) {
        const cellResource = this.cellResources[row][col];

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
    private harvestPlant(row: number, col: number) {
        const cellResource = this.cellResources[row][col];

        // Harvest the plant and remove it from the cell
        cellResource.plant = null;
    }
}

// Interface to define cell resource structure
interface CellResource {
    sun: boolean;
    water: number; // 0-3 water levels
    plant: Plant | null; // Plant object or null if no plant
}

// Interface to define plant structure
interface Plant {
    species: string;
    growthLevel: number; // 1-4 growth levels
}