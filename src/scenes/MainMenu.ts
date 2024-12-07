import { Scene, GameObjects } from 'phaser';
import { TextButton } from '../text-button';
import { PopupWindow } from '../popup-window';
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
            let autoSave;
            const autoSaveString = gameManager.getAutoSaveKey();
            if (autoSaveString) {
                autoSave = localStorage.getItem(autoSaveString);
            }
            if (autoSave) {
                //const confirmLoad = confirm('An auto-save was found. Do you want to continue your previous game?');
                const autoSavePopup = new PopupWindow(this, this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 900, 600, 'Auto-Save Detected', 
                    'Do you want to continue your previous game?', {
                    fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 6
                });

                const yesButton = new TextButton(this, -200, 50, 'Yes', {
                    fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 6
                }, () => {
                    autoSavePopup.setVisibility(false);
                    gameManager.setConfirmLoad(true);
                    gameManager.setPlaying(true);
                    this.scene.start('Game');
                });
                const noButton = new TextButton(this, 125, 50, 'No', {
                    fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 6
                }, () => {
                    autoSavePopup.setVisibility(false);
                    gameManager.setConfirmLoad(false);
                    gameManager.setPlaying(true);
                    this.scene.start('Game');
                });
                autoSavePopup.add(yesButton);
                autoSavePopup.add(noButton);
            }
            else {
                gameManager.setPlaying(true);
                this.scene.start('Game');
            }
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
