import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { gameManager } from '../GameManager';

export class Settings extends Scene
{
    constructor ()
    {
        super('Settings');
    }

    create ()
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.title_text = this.add.text(512, 384, 'Settings', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.title_text.setOrigin(0.5);

        if (gameManager.getPlaying()) {
            const resumeButton = new TextButton(this, 250, 530, 'Resume', {
                fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 6
            }, () => {
                this.scene.stop('Settings');
            });
        }
        
        const mainMenuButton = new TextButton(this, 250, 600, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (gameManager.getPlaying()) {
                gameManager.setPlaying(false);
            }
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        });
    }
}