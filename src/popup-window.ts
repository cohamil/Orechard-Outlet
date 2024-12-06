import { TextButton } from './text-button';

export class PopupWindow extends Phaser.GameObjects.Container {
    titleText: Phaser.GameObjects.Text;
    contentText: Phaser.GameObjects.Text;
    
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, title: string, content: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
        super(scene, x, y);

        // Create background
        const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        this.add(background);

        // Create title text
        this.titleText = scene.add.text(0, -height / 2 + 20, title, { ...style, fontSize: '40px' }).setOrigin(0.5);
        this.add(this.titleText);

        // Create content text
        this.contentText = scene.add.text(0, 0, content, style).setOrigin(0.5);
        this.add(this.contentText);

        // Close Button for the popup
        const closeButton = new TextButton(scene, -50, height / 2 - 50, 'Close',{
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
        }, () => {
            this.setVisible(false);
        });
        this.add(closeButton);

        scene.add.existing(this);
    }

    changeTitle(newTitle: string) {
        this.titleText.text = newTitle;
    }

    changeContent(newContent: string) {
        this.contentText.text = newContent;
    }

    setVisibility(visible: boolean) {
        this.setVisible(visible);
    }

    isVisibile() {
        return this.visible;
    }
}

