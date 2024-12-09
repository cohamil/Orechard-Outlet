import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { PopupWindow } from '../popup-window';
import { gameManager } from '../GameManager';
import i18n from '../i18n';

export class Tutorial extends Scene {
    constructor() {
        super('Tutorial');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.title_text = this.add.text(512, 70, i18n.t('tutorial'), {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.title_text.setOrigin(0.5);

        // Controls tutorial
        const controlsTitle = i18n.t('controls_title');
        const controlsContent = i18n.t('controls_content');

        const controlsButton = new TextButton(this, 100, 150, i18n.t('controls'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(controlsTitle);
            popupWindow.changeContent(controlsContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Goal tutorial
        const goalTitle = i18n.t('goal_title');
        const goalContent = i18n.t('goal_content');

        const goalButton = new TextButton(this, 100, 250, i18n.t('goal'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(goalTitle);
            popupWindow.changeContent(goalContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Garden tutorial
        const gardenTitle = i18n.t('garden_title');
        const gardenContent = i18n.t('garden_content');

        const gardenButton = new TextButton(this, 100, 350, i18n.t('garden'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(gardenTitle);
            popupWindow.changeContent(gardenContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Turns tutorial
        const turnsTitle = i18n.t('turns_title');
        const turnsContent = i18n.t('turns_content');

        const turnsButton = new TextButton(this, 100, 450, i18n.t('turns'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(turnsTitle);
            popupWindow.changeContent(turnsContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Weather tutorial
        const weatherTitle = i18n.t('weather_title');
        const weatherContent = i18n.t('weather_content');

        const weatherButton = new TextButton(this, 100, 550, i18n.t('weather'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(weatherTitle);
            popupWindow.changeContent(weatherContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        const backButtonText = gameManager.getPlaying() ? i18n.t('back') : i18n.t('main_menu');
        const backButton = new TextButton(this, 250, 670, backButtonText, {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (gameManager.getPlaying()) {
                // hide the tutorial
                this.scene.stop('Tutorial');
            } else {
                this.scene.start('MainMenu');
            }
        });

        // Create a popup window
        const popupWindow = new PopupWindow(this, 650, 384, 700, 475, controlsTitle, controlsContent, {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#ffffff',
            align: 'center',
        });
    }
}