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
    towerAngle = 0;
    velocityY = 0;
    gravity = 0.2;
    ballRadius = 15;
    segmentCount = 8; // количество сегментов в платформе
    lastPlatformPassed = null;

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
        
        // Load segment images
        this.load.svg('safe-segment', 'assets/images/segment-safe.svg');
        this.load.svg('danger-segment', 'assets/images/segment-danger.svg');
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
        this.ball.setCircle(this.ballRadius);
        
        // Create platforms with segments
        this.createPlatforms();
        
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
                // Вычисляем угол вращения башни на основе положения указателя
                let dx = pointer.x - 200;
                this.towerAngle = dx * 0.1;
                
                // Визуально вращаем башню
                this.tower.setRotation(this.towerAngle);
                
                // Обновляем положение сегментов платформ в соответствии с углом башни
                this.updatePlatformSegmentsPosition();
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
        
        // Применяем гравитацию к мячу
        this.velocityY += this.gravity;
        this.ball.y += this.velocityY;
        
        // Проверяем коллизии мяча с платформами
        this.checkPlatformCollisions();
        
        // Check if ball fell out of bounds
        if (this.ball.y > 600) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }
    }
    
    createPlatforms() {
        // Clear existing platforms
        this.platforms.forEach(platform => {
            platform.segments.forEach(segment => segment.destroy());
        });
        this.platforms = [];
        
        // Радиус платформы
        const platformRadius = 100;
        
        // Создаем новые платформы с сегментами
        for (let i = 0; i < 6; i++) {
            const y = 500 - i * 100;
            const platform = {
                y: y,
                segments: [],
                passed: false
            };
            
            // Генерируем сегменты для платформы
            for (let j = 0; j < this.segmentCount; j++) {
                const segmentType = this.getSegmentType(i, j);
                const angle = (j / this.segmentCount) * Math.PI * 2;
                
                // Если сегмент не является "дыркой", создаем его
                if (segmentType !== 'hole') {
                    const segmentX = 200 + Math.cos(angle) * platformRadius;
                    const segmentY = y + Math.sin(angle) * platformRadius;
                    
                    const segmentTexture = segmentType === 'danger' ? 'danger-segment' : 'safe-segment';
                    const segment = this.add.image(segmentX, segmentY, segmentTexture);
                    
                    // Устанавливаем угол поворота сегмента
                    segment.setRotation(angle + Math.PI/2);
                    
                    // Добавляем информацию о сегменте
                    segment.segmentType = segmentType;
                    segment.segmentAngle = angle;
                    segment.segmentIndex = j;
                    
                    platform.segments.push(segment);
                } else {
                    // Для "дырок" создаем невидимый маркер
                    platform.segments.push({
                        segmentType: 'hole',
                        segmentAngle: angle,
                        segmentIndex: j,
                        x: 200 + Math.cos(angle) * platformRadius,
                        y: y + Math.sin(angle) * platformRadius,
                        destroy: () => {} // заглушка для метода destroy
                    });
                }
            }
            
            this.platforms.push(platform);
        }
        
        // Обновляем положение сегментов с учетом текущего угла башни
        this.updatePlatformSegmentsPosition();
    }
    
    getSegmentType(platformIndex, segmentIndex) {
        // Определяем тип сегмента (safe, danger, hole) на основе его индекса и индекса платформы
        // Это можно настроить для создания разных паттернов платформ
        
        // Каждая четвертая платформа имеет опасные зоны
        if (platformIndex % 4 === 1) {
            // Каждый четный сегмент - опасный
            if (segmentIndex % 2 === 0) {
                return 'danger';
            }
        }
        
        // Создаем "дырку" в каждой платформе (обычно 1-2 сегмента)
        // Положение дырки зависит от индекса платформы, чтобы они не были на одной линии
        const holeStart = (platformIndex % this.segmentCount);
        const holeWidth = 2; // ширина дырки в сегментах
        
        if (segmentIndex >= holeStart && segmentIndex < holeStart + holeWidth) {
            return 'hole';
        }
        
        return 'safe';
    }
    
    updatePlatformSegmentsPosition() {
        // Обновляем положение сегментов всех платформ в зависимости от угла поворота башни
        const platformRadius = 100;
        
        this.platforms.forEach(platform => {
            platform.segments.forEach(segment => {
                if (segment.segmentType !== 'hole') {
                    // Вычисляем новый угол с учетом поворота башни
                    const newAngle = segment.segmentAngle - this.towerAngle;
                    
                    // Обновляем позицию сегмента
                    segment.x = 200 + Math.cos(newAngle) * platformRadius;
                    segment.y = platform.y + Math.sin(newAngle) * platformRadius;
                    
                    // Обновляем угол поворота сегмента
                    segment.setRotation(newAngle + Math.PI/2);
                } else {
                    // Обновляем позицию невидимого маркера дырки
                    const newAngle = segment.segmentAngle - this.towerAngle;
                    segment.x = 200 + Math.cos(newAngle) * platformRadius;
                    segment.y = platform.y + Math.sin(newAngle) * platformRadius;
                }
            });
        });
    }
    
    checkPlatformCollisions() {
        // Проверяем столкновения мяча с платформами
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            
            // Проверяем только если мяч находится рядом с платформой по Y
            if (Math.abs(this.ball.y - platform.y) < this.ballRadius + 10) {
                
                // Если мяч движется вниз и находится над платформой
                if (this.velocityY > 0 && this.ball.y < platform.y) {
                    
                    // Вычисляем угол положения мяча относительно центра
                    const dx = this.ball.x - 200;
                    const dy = this.ball.y - platform.y;
                    let ballAngle = Math.atan2(dy, dx);
                    if (ballAngle < 0) ballAngle += Math.PI * 2;
                    
                    // Проверяем, в какой сегмент попал мяч
                    let hitSegment = null;
                    
                    for (let j = 0; j < platform.segments.length; j++) {
                        const segment = platform.segments[j];
                        
                        // Вычисляем угловые границы сегмента с учетом поворота башни
                        const segmentAngle = segment.segmentAngle - this.towerAngle;
                        const segmentSize = (Math.PI * 2) / this.segmentCount;
                        const segmentStart = segmentAngle - segmentSize/2;
                        const segmentEnd = segmentAngle + segmentSize/2;
                        
                        // Проверяем, попал ли мяч в данный сегмент
                        if (this.isAngleBetween(ballAngle, segmentStart, segmentEnd)) {
                            hitSegment = segment;
                            break;
                        }
                    }
                    
                    // Обрабатываем столкновение с сегментом
                    if (hitSegment) {
                        if (hitSegment.segmentType === 'safe') {
                            // Отскок от безопасного сегмента
                            this.ball.y = platform.y - this.ballRadius - 5;
                            this.velocityY = -10; // Отскок
                            
                            // Если платформа еще не была пройдена, увеличиваем счет
                            if (!platform.passed && platform !== this.lastPlatformPassed) {
                                this.increaseScore();
                                platform.passed = true;
                                this.lastPlatformPassed = platform;
                                
                                // Визуальный эффект при прохождении платформы
                                this.tweens.add({
                                    targets: platform.segments.filter(s => s.segmentType !== 'hole'),
                                    alpha: 0.3,
                                    duration: 300,
                                    yoyo: true,
                                    repeat: 0
                                });
                            }
                            
                        } else if (hitSegment.segmentType === 'danger') {
                            // Столкновение с опасным сегментом
                            this.gameOver = true;
                            this.showGameOver();
                            
                            // Добавляем эффект "взрыва" при столкновении с опасной зоной
                            this.createExplosion(this.ball.x, this.ball.y);
                        }
                        // Если hitSegment.segmentType === 'hole', то мяч просто проходит сквозь дырку
                    }
                }
            }
        }
    }
    
    isAngleBetween(angle, start, end) {
        // Приводим все углы к диапазону [0, 2π]
        angle = (angle + Math.PI * 2) % (Math.PI * 2);
        start = (start + Math.PI * 2) % (Math.PI * 2);
        end = (end + Math.PI * 2) % (Math.PI * 2);
        
        // Если начало больше конца, это означает, что интервал пересекает 0
        if (start > end) {
            return angle >= start || angle <= end;
        } else {
            return angle >= start && angle <= end;
        }
    }
    
    createExplosion(x, y) {
        // Создаем эффект взрыва при столкновении с опасной зоной
        const particles = this.add.particles('ball');
        
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 300
        });
        
        // Автоматически останавливаем эмиттер через некоторое время
        this.time.delayedCall(500, () => {
            emitter.stop();
            this.time.delayedCall(1000, () => {
                particles.destroy();
            });
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
        this.velocityY = 0;
        this.towerAngle = 0;
        this.lastPlatformPassed = null;
        this.scene.restart();
    }
} 