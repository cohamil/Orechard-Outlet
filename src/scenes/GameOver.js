import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { gameManager } from '../GameManager';
import i18n from '../i18n';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.gameover_text = this.add.text(512, 384, i18n.t('game_over'), {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.gameover_text.setOrigin(0.5);

        const backButton = new TextButton(this, 250, 600, i18n.t('back'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            localStorage.removeItem(gameManager.getAutoSaveKey());
            this.scene.start('MainMenu');
        });
    }
}