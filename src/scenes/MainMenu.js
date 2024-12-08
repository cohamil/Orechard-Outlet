import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { PopupWindow } from '../popup-window';
import { gameManager } from '../GameManager';
import i18n from '../i18n';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo');

        const playButton = new TextButton(this, 250, 390, i18n.t('play'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            let autoSave;
            const autoSaveString = gameManager.getAutoSaveKey();
            if (autoSaveString) {
                autoSave = localStorage.getItem(autoSaveString);
            }
            if (autoSave) {
                const autoSavePopup = new PopupWindow(this, this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 900, 600, i18n.t('auto_save_detected'), 
                    i18n.t('continue_previous_game'), {
                    fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 6
                });

                const yesButton = new TextButton(this, -200, 50, i18n.t('yes'), {
                    fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 6
                }, () => {
                    autoSavePopup.setVisibility(false);
                    gameManager.setConfirmLoad(true);
                    gameManager.setPlaying(true);
                    this.scene.start('Game');
                });
                const noButton = new TextButton(this, 125, 50, i18n.t('no'), {
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
            } else {
                gameManager.setPlaying(true);
                this.scene.start('Game');
            }
        });

        const tutorialButton = new TextButton(this, 250, 460, i18n.t('tutorial'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('Tutorial'));

        const settingsButton = new TextButton(this, 250, 530, i18n.t('settings'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('Settings'));

        const creditsButton = new TextButton(this, 250, 600, i18n.t('credits'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('Credits'));

        const quitButton = new TextButton(this, 250, 670, i18n.t('quit'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            this.game.destroy(true);
        });
    }
}