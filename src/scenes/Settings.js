import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { gameManager } from '../GameManager';
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
            const resumeButton = new TextButton(this, 250, 530, i18n.t('resume'), {
                fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 6
            }, () => {
                this.scene.stop('Settings');
            });
        }

        const mainMenuButton = new TextButton(this, 250, 600, i18n.t('main_menu'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (gameManager.getPlaying()) {
                gameManager.setPlaying(false);
            }
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        });

        const englishButton = new TextButton(this, 512, 200, 'English', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            i18n.changeLanguage('en').then(() => {
                this.scene.restart();
            });
        });

        const mandarinButton = new TextButton(this, 512, 300, '中文', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            i18n.changeLanguage('zh').then(() => {
                this.scene.restart();
            });
        });

        const hebrewButton = new TextButton(this, 512, 400, 'עברית', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            i18n.changeLanguage('he').then(() => {
                this.scene.restart();
            });
        });
    }
}