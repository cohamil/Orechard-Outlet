import { Grid, Coordinate } from './scenes/Game';

// This manager handles all player-related actions
export class PlayerActions {
    private scene: Phaser.Scene; // Reference to the Phaser scene
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;


    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeInput();
    }

    getCursorKeys() {
        return this.cursors;
    }

    // Handle player movement
    checkForPlayerMovement(gridSize: number, playerPosition: Coordinate, undoable: (Coordinate | Grid)[]) {
        if (!this.cursors || !this.scene.input.keyboard) {
            console.warn('Keyboard input or cursors are not available.');
            return;
        }

        const { row, col } = playerPosition;

        // WASD Keys for Movement
        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[65])) {
            if (col > 0) { 
                undoable.push(playerPosition);
                return {row: row, col: col - 1}; // Move left
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[68])) {
            if (col < gridSize - 1) {
                undoable.push(playerPosition);
                return {row: row, col: col + 1}; // Move right
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[87])) {
            if (row > 0) {
                undoable.push(playerPosition);
                return {row: row - 1, col: col}; // Move up
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[83])) {
            if (row < gridSize - 1) {
                undoable.push(playerPosition);
                return {row: row + 1, col: col}; // Move down
            }
        }
    }

    // Handle plant interaction
    checkforPlantInteraction(gridSize: number, playerPosition: Coordinate, grid: Grid, undoable: (Coordinate | Grid)[]) {
        if (!this.cursors || !this.scene.input.keyboard) {
            console.warn('Keyboard input or cursors are not available.');
            return;
        }

        const { row, col } = playerPosition;
        
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (col > 0) {
                undoable.push(grid);
                return {row: row, col: col - 1}; // Plant to the left
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (col < gridSize - 1) {
                undoable.push(grid);
                return {row: row, col: col + 1}; // Plant to the right
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (row > 0) {
                undoable.push(grid);
                return {row: row - 1, col: col}; // Plant up
            }
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (row < gridSize - 1) {
                undoable.push(grid);
                return {row: row + 1, col: col}; // Plant down
            }
        }
    }

    // Initialize player input
    private initializeInput() {
        if (!this.scene.input.keyboard) {
            console.error('Keyboard input system is not available.');
            return;
        }

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.scene.input.keyboard.addKeys('W,S,A,D,T,X,L,M');


    }
}