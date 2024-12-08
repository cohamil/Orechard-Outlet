import { TextButton } from './text-button';
import i18n from './i18n';

export class PopupWindow extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, title, content, style) {
        super(scene, x, y);
        // Create background
        const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8).setInteractive();
        this.add(background);
        
        // Create title text
        this.titleText = scene.add.text(0, -height / 2 + 20, title, { ...style, fontSize: '40px' }).setOrigin(0.5);
        this.add(this.titleText);
        
        // Create content text
        this.contentText = scene.add.text(0, 0, content, style).setOrigin(0.5);
        this.add(this.contentText);
        
        // Close Button for the popup
        const closeButton = new TextButton(scene, -50, height / 2 - 50, i18n.t('close'), {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        }, () => {
            this.setVisible(false);
        });
        this.add(closeButton);
        this.setDepth(1000);
        scene.add.existing(this);
    }

    changeTitle(newTitle) {
        this.titleText.text = newTitle;
    }

    changeContent(newContent) {
        this.contentText.text = newContent;
    }

    setVisibility(visible) {
        this.setVisible(visible);
    }

    isVisibile() {
        return this.visible;
    }
}