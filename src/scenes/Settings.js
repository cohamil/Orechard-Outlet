import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { PopupWindow } from '../popup-window';
import { gameManager } from '../GameManager';
import { saveManager } from '../SaveManager';
import i18n from '../i18n';

export class Settings extends Scene {
    constructor() {
        super('Settings');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.title_text = this.add.text(512, 100, i18n.t('settings'), {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.title_text.setOrigin(0.5);

        if (gameManager.getPlaying()) {
            const resumeButton = new TextButton(this, 250, 600, i18n.t('resume'), {
                fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 6
            }, () => {
                this.scene.stop('Settings');
            });

            const saveSlotsButton = new TextButton(this, 100, 300, i18n.t('show_save_slots'), {
                fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 6
            }, () => {
                if (saveManager.isInitialized()) {
                    saveManager.showSaveSlots(this);
                }
            });

        }

        // main menu button
        const mainMenuButton = new TextButton(this, 250, 670, i18n.t('main_menu'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (gameManager.getPlaying()) {
                gameManager.setPlaying(false);
            }
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        });

        // Change language button
        const languageSelectButton = new TextButton(this, 100, 200, i18n.t('change_language'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Create a popup window
        const popupWindow = new PopupWindow(this, 750, 384, 500, 475, i18n.t('select_desired_language'), "", {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#ffffff',
            align: 'center',
        });
        popupWindow.setVisibility(false);

        const englishButton = new TextButton(this, -67, -125, 'English', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            i18n.changeLanguage('en').then(() => {
                if (gameManager.getGame()) {
                    gameManager.refreshUIElements();
                }
                this.scene.restart();
            });
        });
        popupWindow.add(englishButton);

        const mandarinButton = new TextButton(this, -67, -25, '中文', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            i18n.changeLanguage('zh').then(() => {
                if (gameManager.getGame()) {
                    gameManager.refreshUIElements();
                }
                this.scene.restart();
            });
        });
        popupWindow.add(mandarinButton);

        const hebrewButton = new TextButton(this, -67, 75, 'עברית', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            i18n.changeLanguage('he').then(() => {
                if (gameManager.getGame()) {
                    gameManager.refreshUIElements();
                }
                this.scene.restart();
            });
        });
        popupWindow.add(hebrewButton);
        
    }
}