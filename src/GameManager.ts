import 'phaser';

class GameManager extends Phaser.Data.DataManager
{
    private isPlaying: boolean = false;
    
    constructor ()
    {
        super(new Phaser.Events.EventEmitter());
    }

    setPlaying (value: boolean)
    {
        this.isPlaying = value;
    }

    getPlaying ()
    {
        return this.isPlaying;
    }

    printBool ()
    {
        console.log(this.isPlaying);
    }
}

export const gameManager = new GameManager();