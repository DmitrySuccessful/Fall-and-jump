class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    // Game variables
    ball;
    tower;
    platforms = [];
    currentLocation = 0;
    score = 0;
    scoreText;
    gameOver = false;

    // Location settings
    locations = [
        { bg: 'bg1', tower: 'tower1', name: 'Classic' },
        { bg: 'bg2', tower: 'tower2', name: 'Watermelon' },
        { bg: 'bg3', tower: 'tower3', name: 'Neon' }
    ];

    preload() {
        // Load ball image
        this.load.svg('ball', 'assets/images/ball.svg');
        
        // Load backgrounds for different locations
        this.load.svg('bg1', 'assets/images/bg1.svg');
        this.load.svg('bg2', 'assets/images/bg2.svg');
        this.load.svg('bg3', 'assets/images/bg3.svg');
        
        // Load tower images for different locations
        this.load.svg('tower1', 'assets/images/tower1.svg');
        this.load.svg('tower2', 'assets/images/tower2.svg');
        this.load.svg('tower3', 'assets/images/tower3.svg');
        
        // Load platform image
        this.load.svg('platform', 'assets/images/platform.svg');
    }

    create() {
        // Get current location settings
        const loc = this.locations[this.currentLocation];
        
        // Add background
        this.add.image(200, 300, loc.bg).setScale(2);
        
        // Add tower
        this.tower = this.add.image(200, 300, loc.tower).setScale(1.5);
        
        // Add ball
        this.ball = this.physics.add.sprite(200, 100, 'ball');
        this.ball.setBounce(0.6);
        this.ball.setCollideWorldBounds(true);
        
        // Create platforms
        this.createPlatforms();
        
        // Set up collisions between ball and platforms
        this.physics.add.collider(this.ball, this.platforms);
        
        // Add score text
        this.scoreText = this.add.text(20, 20, 'Score: 0', { 
            fontSize: '24px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        
        // Add location text
        this.add.text(200, 20, loc.name, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5, 0);
        
        // Set up input handler for tower rotation
        this.input.on('pointermove', (pointer) => {
            if (!this.gameOver) {
                let angle = (pointer.x - 200) * 0.1;
                this.tower.setRotation(angle);
                
                // Rotate all platforms
                this.platforms.forEach(platform => {
                    platform.setRotation(angle);
                });
            }
        });
        
        // Input handler for changing location or restarting
        this.input.on('pointerdown', () => {
            if (this.gameOver) {
                this.restartGame();
            } else {
                this.changeLocation();
            }
        });
        
        // Create trail effect for the ball
        this.createBallTrail();
    }

    update() {
        if (this.gameOver) {
            return;
        }
        
        // Check if ball fell out of bounds
        if (this.ball.y > 600) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }
        
        // Check platforms the ball has passed
        this.checkPlatforms();
    }
    
    createPlatforms() {
        // Clear existing platforms
        this.platforms.forEach(platform => platform.destroy());
        this.platforms = [];
        
        // Create new platforms
        for (let i = 0; i < 6; i++) {
            let platform = this.physics.add.image(200, 500 - i * 100, 'platform').setScale(1.5);
            platform.setImmovable(true);
            platform.body.allowGravity = false;
            this.platforms.push(platform);
        }
    }
    
    checkPlatforms() {
        this.platforms.forEach((platform, index) => {
            if (this.ball.y < platform.y && !platform.passed) {
                platform.passed = true;
                this.increaseScore();
                
                // Visual effect when passing a platform
                this.tweens.add({
                    targets: platform,
                    alpha: 0.3,
                    duration: 300,
                    yoyo: true,
                    repeat: 0
                });
            }
            
            // Remove platforms that are far below the ball
            if (this.ball.y < platform.y - 200) {
                platform.destroy();
                this.platforms.splice(index, 1);
                
                // Add a new platform at the top
                let newY = Math.min(...this.platforms.map(p => p.y)) - 100;
                let newPlatform = this.physics.add.image(200, newY, 'platform').setScale(1.5);
                newPlatform.setImmovable(true);
                newPlatform.body.allowGravity = false;
                newPlatform.setRotation(this.tower.rotation);
                this.platforms.push(newPlatform);
            }
        });
    }
    
    increaseScore() {
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }
    
    createBallTrail() {
        // Create trail particles for the ball
        this.ballTrail = this.add.particles('ball').createEmitter({
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.5, end: 0 },
            speed: 0,
            lifespan: 300,
            blendMode: 'ADD',
            frequency: 50
        });
        
        // Position trail behind the ball
        this.ballTrail.startFollow(this.ball);
    }
    
    changeLocation() {
        this.currentLocation = (this.currentLocation + 1) % this.locations.length;
        this.restartGame();
    }
    
    showGameOver() {
        // Darken the screen
        const overlay = this.add.rectangle(200, 300, 400, 600, 0x000000, 0.7);
        
        // Show game over text
        const gameOverText = this.add.text(200, 250, 'GAME OVER', { 
            fontSize: '40px', 
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Show score
        const finalScore = this.add.text(200, 300, 'Score: ' + this.score, { 
            fontSize: '30px', 
            fill: '#fff'
        }).setOrigin(0.5);
        
        // Show restart instruction
        const restartText = this.add.text(200, 350, 'Tap to restart', { 
            fontSize: '24px', 
            fill: '#fff'
        }).setOrigin(0.5);
        
        // Add blinking effect to restart text
        this.tweens.add({
            targets: restartText,
            alpha: 0.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    restartGame() {
        this.gameOver = false;
        this.score = 0;
        this.scene.restart();
    }
} 