import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import i18n from '../i18n';

export class Credits extends Scene {
    constructor() {
        super('Credits');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.title_text = this.add.text(512, 384, i18n.t('credits'), {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.title_text.setOrigin(0.5);

        const mainMenuButton = new TextButton(this, 250, 600, i18n.t('main_menu'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => this.scene.start('MainMenu'));
    }
}