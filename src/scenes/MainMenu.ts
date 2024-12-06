import { Scene, GameObjects } from 'phaser';
import { TextButton } from '../text-button';
import { gameManager } from '../GameManager';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo');
        

        const playButton = new TextButton(this, 250, 390, 'Play', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            gameManager.setPlaying(true);

            this.scene.start('Game');
        });

        const tutorialButton = new TextButton(this, 250, 460, 'Tutorial', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('Tutorial'));

        const settingsButton = new TextButton(this, 250, 530, 'Settings', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('Settings'));

        const creditsButton = new TextButton(this, 250, 600, 'Credits', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('Credits'));

        const quitButton = new TextButton(this, 250, 670, 'Quit', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.game.destroy(true);
        });
    }
}
