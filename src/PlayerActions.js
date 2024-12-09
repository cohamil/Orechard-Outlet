
// This manager handles all player-related actions
export class PlayerActions {
    constructor(scene) {
        this.scene = scene; // Reference to the Phaser scene
        this.initializeInput();
    }

    getCursorKeys() {
        return this.cursors;
    }

    // Handle player movement
    checkForPlayerMovement(gridSize, playerPosition, player) {
        if (!this.cursors || !this.scene.input.keyboard) {
            console.warn('Keyboard input or cursors are not available.');
            return;
        }

        const { row, col } = playerPosition;
        // WASD Keys for Movement
        if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[65])) { // A
            if (col > 0) { 
                player.setFlipX(true);
                player.setFrame(3);
                return { row: row, col: col - 1 }; // Move left
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[68])) { // D
            if (col < gridSize - 1) {
                player.setFlipX(false);
                player.setFrame(3);
                return { row: row, col: col + 1 }; // Move right
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[87])) { // W
            if (row > 0) {
                player.setFlipX(false);
                player.setFrame(19);
                return { row: row - 1, col: col }; // Move up
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.keys[83])) { // S
            if (row < gridSize - 1) {
                player.setFlipX(false);
                player.setFrame(11);
                return { row: row + 1, col: col }; // Move down
            }
        }
    }
    
    // Handle plant interaction
    checkforPlantInteraction(gridSize, playerPosition, player) {
        if (!this.cursors || !this.scene.input.keyboard) {
            console.warn('Keyboard input or cursors are not available.');
            return;
        }
        const { row, col } = playerPosition;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (col > 0) {
                player.setFlipX(true);
                player.setFrame(3);
                return { row: row, col: col - 1 }; // Plant to the left
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (col < gridSize - 1) {
                player.setFlipX(false);
                player.setFrame(3);
                return { row: row, col: col + 1 }; // Plant to the right
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (row > 0) {
                player.setFlipX(false);
                player.setFrame(19);
                return { row: row - 1, col: col }; // Plant up
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (row < gridSize - 1) {
                player.setFlipX(false);
                player.setFrame(11);
                return { row: row + 1, col: col }; // Plant down
            }
        }
    }

    // Initialize player input
    initializeInput() {
        if (!this.scene.input.keyboard) {
            console.error('Keyboard input system is not available.');
            return;
        }
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.scene.input.keyboard.addKeys('W,S,A,D,T,X,L,M');
    }
}