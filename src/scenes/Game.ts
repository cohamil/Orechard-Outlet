import { Scene } from 'phaser';

export class Game extends Scene {
    private gridSize: number = 10; // Number of rows and columns
    private cellSize: number = 64; // Size of each cell in pixels
    private player!: Phaser.GameObjects.Rectangle; // The player's visual representation
    private playerPosition: { row: number; col: number } = { row: 0, col: 0 }; // Tracks the player's position on the grid
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    
    // New properties for cell resources
    private cellResources!: CellResource[][];

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
            water: waterLevel
        };
    }

    // Advance turn with new resource mechanics
    private advanceTurn() {
        console.log('Turn advanced!');
        
        // Update resources for each cell
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentCell = this.cellResources[row][col];

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
    
        // WASD or Arrow Keys
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[65])) {
            if (col > 0) this.movePlayerTo(row, col - 1); // Move left
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[68])) {
            if (col < this.gridSize - 1) this.movePlayerTo(row, col + 1); // Move right
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[87])) {
            if (row > 0) this.movePlayerTo(row - 1, col); // Move up
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.input.keyboard.keys[83])) {
            if (row < this.gridSize - 1) this.movePlayerTo(row + 1, col); // Move down
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
}

// Interface to define cell resource structure
interface CellResource {
    sun: boolean;
    water: number; // 0-3 water levels
}