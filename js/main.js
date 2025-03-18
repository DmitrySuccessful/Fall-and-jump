// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [MainScene],
    parent: 'game-container',
    backgroundColor: '#000000'
};

// Initialize the game
let game = new Phaser.Game(config); 