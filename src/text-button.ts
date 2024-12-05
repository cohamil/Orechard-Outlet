// Credit: https://github.com/snowbillr/buttons-in-phaser3/blob/master/src/game-objects/text-button.js

export class TextButton extends Phaser.GameObjects.Text {
    constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle, callback: () => void) {
        super(scene, x, y, text, style);
  
        this.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.enterButtonHoverState() )
            .on('pointerout', () => this.enterButtonRestState() )
            .on('pointerdown', () => this.enterButtonActiveState() )
            .on('pointerup', () => {
                this.enterButtonHoverState();
            callback();
        });

        scene.add.existing(this);
    }
  
    enterButtonHoverState() {
        this.setStyle({ fill: '#ff0 '});
    }
  
    enterButtonRestState() {
        this.setStyle({ fill: '#fff '});
    }
  
    enterButtonActiveState() {
        this.setStyle({ fill: '#0ff' });
    }
  }