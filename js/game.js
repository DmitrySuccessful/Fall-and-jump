// Game Constants and Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('finalScore');

// Set canvas size to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Game state
let gameState = {
    isRunning: false,
    score: 0,
    lives: 3,
    bubbles: [],
    lastBubbleSpawn: 0,
    bubbleSpawnRate: 1000, // milliseconds
    difficulty: 1,
    lastFrameTime: 0
};

// Bubble class
class Bubble {
    constructor(x, y, radius, speed, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        this.color = color;
        this.isPopped = false;
        this.popAnimation = 0;
    }

    update(deltaTime) {
        if (this.isPopped) {
            this.popAnimation += deltaTime * 0.01;
            return this.popAnimation >= 1; // Return true when animation is complete
        }

        this.y -= this.speed * deltaTime * 0.05;
        return this.y < -this.radius; // Return true when bubble is off screen
    }

    draw() {
        if (this.isPopped) {
            // Draw pop animation
            ctx.globalAlpha = 1 - this.popAnimation;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * (1 + this.popAnimation), 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1;
            return;
        }

        // Draw bubble
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Create gradient for bubble effect
        let gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
    }

    contains(x, y) {
        const distance = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
        return distance <= this.radius;
    }

    pop() {
        this.isPopped = true;
        return this.radius; // Return size for score calculation
    }
}

// Initialize game
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    canvas.addEventListener('click', handleClick);
    
    // Setup initial game state
    resetGameState();
    
    // Start animation loop
    requestAnimationFrame(gameLoop);
}

// Reset game state
function resetGameState() {
    gameState = {
        isRunning: false,
        score: 0,
        lives: 3,
        bubbles: [],
        lastBubbleSpawn: 0,
        bubbleSpawnRate: 1000,
        difficulty: 1,
        lastFrameTime: 0
    };
    
    updateUI();
    gameOverScreen.style.display = 'none';
    startButton.style.display = 'block';
}

// Start the game
function startGame() {
    gameState.isRunning = true;
    startButton.style.display = 'none';
    gameState.lastFrameTime = performance.now();
}

// Restart the game
function restartGame() {
    resetGameState();
    startGame();
}

// End the game
function endGame() {
    gameState.isRunning = false;
    finalScoreElement.textContent = gameState.score;
    gameOverScreen.style.display = 'flex';
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
}

// Spawn a new bubble
function spawnBubble() {
    const colors = [
        '#ff5252', // red
        '#4caf50', // green
        '#2196f3', // blue
        '#ffeb3b', // yellow
        '#9c27b0'  // purple
    ];
    
    const minRadius = 20;
    const maxRadius = 40;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    
    const x = radius + Math.random() * (canvas.width - radius * 2);
    const y = canvas.height + radius;
    
    const minSpeed = 1;
    const maxSpeed = 3;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed) * gameState.difficulty;
    
    const colorIndex = Math.floor(Math.random() * colors.length);
    
    gameState.bubbles.push(new Bubble(x, y, radius, speed, colors[colorIndex]));
}

// Handle click event
function handleClick(event) {
    if (!gameState.isRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    let popped = false;
    for (let i = gameState.bubbles.length - 1; i >= 0; i--) {
        const bubble = gameState.bubbles[i];
        if (!bubble.isPopped && bubble.contains(x, y)) {
            const size = bubble.pop();
            gameState.score += Math.floor(size);
            updateUI();
            popped = true;
            break; // Only pop one bubble per click
        }
    }
    
    if (!popped) {
        // Penalty for missing
        gameState.lives--;
        updateUI();
        
        if (gameState.lives <= 0) {
            endGame();
        }
    }
}

// Update game logic
function update(deltaTime) {
    if (!gameState.isRunning) return;
    
    // Increase difficulty over time
    gameState.difficulty += deltaTime * 0.00001;
    
    // Spawn bubbles
    const currentTime = performance.now();
    if (currentTime - gameState.lastBubbleSpawn > gameState.bubbleSpawnRate / gameState.difficulty) {
        spawnBubble();
        gameState.lastBubbleSpawn = currentTime;
    }
    
    // Update bubbles
    for (let i = gameState.bubbles.length - 1; i >= 0; i--) {
        const bubble = gameState.bubbles[i];
        const shouldRemove = bubble.update(deltaTime);
        
        if (shouldRemove) {
            gameState.bubbles.splice(i, 1);
            
            // If bubble escaped (wasn't popped)
            if (!bubble.isPopped) {
                gameState.lives--;
                updateUI();
                
                if (gameState.lives <= 0) {
                    endGame();
                }
            }
        }
    }
}

// Render game elements
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bubbles
    gameState.bubbles.forEach(bubble => bubble.draw());
}

// Main game loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - (gameState.lastFrameTime || timestamp);
    gameState.lastFrameTime = timestamp;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}

// Initialize the game when the page loads
window.addEventListener('load', init); 