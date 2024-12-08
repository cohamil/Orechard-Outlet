import { Scene } from 'phaser';
import { TextButton } from '../text-button';
import { PopupWindow } from '../popup-window';
import { gameManager } from '../GameManager';

export class Tutorial extends Scene
{
    constructor ()
    {
        super('Tutorial');
    }

    create ()
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.title_text = this.add.text(512, 70, 'Tutorial', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.title_text.setOrigin(0.5);

        // Controls tutorial
        const controlsTitle = "Controls (Keyboard)";
        const controlsContent = "Move: WASD\nSow/Harvest Plants: Arrow Keys\nAdvance Turn: T\nUndo Action: Z\nRedo Action: X\nLoad/Save Game: L";
        
        const controlsButton = new TextButton(this, 100, 150, 'Controls', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(controlsTitle);
            popupWindow.changeContent(controlsContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Goal tutorial
        const goalTitle = "Goal";
        const goalContent = "Harvest 3 fully grown plants in the \ngarden to win the game.\n\nBe mindful of each species' growth requirements.\n\nClick on a plant to view its growth \nlevel/requirements.";

        const goalButton = new TextButton(this, 100, 250, 'Goal', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(goalTitle);
            popupWindow.changeContent(goalContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Garden tutorial
        const gardenTitle = "Garden";
        const gardenContent = "The garden is represented by a grid system.\n\nEach cell contains data regarding sun/water levels,\nwhere a yellow cell contains sun and a blue cell \ncontains water. Plants will need both in a\n cell to grow.\n\nDarker shades of blue represent higher \nwater levels. Higher leveled plants will require\nmore water to grow.";

        const gardenButton = new TextButton(this, 100, 350, 'Garden', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(gardenTitle);
            popupWindow.changeContent(gardenContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Turns tutorial
        const turnsTitle = "Turns";
        const turnsContent = "Pressing 'T' will advance your turn.\nEach turn, the garden will advance by one day.\n\nEach plant will grow by one level if it meets\nits growth requirements from the previous turn.\n\nThe next turn's weather forecast is displayed\nat the top of the screen.";

        const turnsButton = new TextButton(this, 100, 450, 'Turns', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(turnsTitle);
            popupWindow.changeContent(turnsContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        // Weather tutorial
        const weatherTitle = "Weather";
        const weatherContent = "Each day, the weather will change.The weather\naffects the garden's sun/water levels.\n\nThe weather forecast for the next day is displayed\nat the top of the screen.\n\nTable of Weather Effects:\nNormal: No effect\nSunny: Doubled Chances of Sun\nRainy: Doubled Chances of Water\nCloudy: Halved Chances of Sun";

        const weatherButton = new TextButton(this, 100, 550, 'Weather', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            popupWindow.changeTitle(weatherTitle);
            popupWindow.changeContent(weatherContent);
            if (!popupWindow.isVisibile()) popupWindow.setVisibility(true);
        });

        const backButtonText = gameManager.getPlaying() ? 'Back' : 'Main Menu';
        const backButton = new TextButton(this, 250, 670, backButtonText, {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }, () => {
            if (gameManager.getPlaying()) {
                // hide the tutorial
                this.scene.stop('Tutorial');
            }
            else {
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