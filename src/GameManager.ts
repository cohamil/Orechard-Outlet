import 'phaser';

class GameManager extends Phaser.Data.DataManager
{
    private isPlaying: boolean = false;
    private autoSaveKey: string = 'game_autosave';
    private confirmLoad: boolean | null = null;
    
    constructor () {
        super(new Phaser.Events.EventEmitter());
    }

    setPlaying (value: boolean){
        this.isPlaying = value;
    }

    getPlaying () {
        return this.isPlaying;
    }

    printBool () {
        console.log(this.isPlaying);
    }

    setConfirmLoad (value: boolean) {
        this.confirmLoad = value;
    }

    getConfirmLoad () {
        return this.confirmLoad;
    }

    getAutoSaveKey () {
        return this.autoSaveKey;
    }
}

export const gameManager = new GameManager();