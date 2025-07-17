// Game constants and variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('current-score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('current-level');
const finalScoreElement = document.getElementById('final-score');
const newHighScoreElement = document.getElementById('new-high-score');

// Game state
let game = {
    snake: [{ x: 200, y: 200 }],
    direction: { x: 0, y: 0 },
    food: { x: 0, y: 0 },
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    level: 1,
    gameRunning: false,
    gamePaused: false,
    lastTime: 0,
    gameSpeed: 150, // milliseconds between moves
    gridSize: 20
};

// Difficulty settings
const difficulties = {
    easy: { speed: 200, scoreMultiplier: 1 },
    medium: { speed: 150, scoreMultiplier: 1.5 },
    hard: { speed: 100, scoreMultiplier: 2 },
    insane: { speed: 50, scoreMultiplier: 3 }
};

// Theme colors
const themes = {
    modern: {
        snake: '#2ecc71',
        food: '#e74c3c',
        background: '#ecf0f1',
        grid: '#bdc3c7'
    },
    nokia: {
        snake: '#2ecc71',
        food: '#2ecc71',
        background: '#2c3e50',
        grid: '#34495e'
    },
    crt: {
        snake: '#00ff00',
        food: '#00ff00',
        background: '#000000',
        grid: '#003300'
    }
};

let currentTheme = themes.modern;

// Initialize game
function initGame() {
    // Load high score
    game.highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = game.highScore;
    
    // Set initial food position
    generateFood();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    draw();
}

// Setup all event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Button controls
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('play-again-btn').addEventListener('click', restartGame);
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    
    // Theme and difficulty selectors
    document.getElementById('theme-select').addEventListener('change', changeTheme);
    document.getElementById('difficulty-select').addEventListener('change', changeDifficulty);
    
    // Prevent spacebar from scrolling page
    window.addEventListener('keydown', function(e) {
        if(e.keyCode === 32 && e.target === document.body) {
            e.preventDefault();
        }
    });
}

// Handle keyboard input
function handleKeyPress(event) {
    if (!game.gameRunning && event.code !== 'KeyR') return;
    
    const key = event.code;
    
    // Movement controls
    if ((key === 'ArrowUp' || key === 'KeyW') && game.direction.y === 0) {
        game.direction = { x: 0, y: -game.gridSize };
    } else if ((key === 'ArrowDown' || key === 'KeyS') && game.direction.y === 0) {
        game.direction = { x: 0, y: game.gridSize };
    } else if ((key === 'ArrowLeft' || key === 'KeyA') && game.direction.x === 0) {
        game.direction = { x: -game.gridSize, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'KeyD') && game.direction.x === 0) {
        game.direction = { x: game.gridSize, y: 0 };
    }
    
    // Game controls
    if (key === 'Space') {
        event.preventDefault();
        togglePause();
    } else if (key === 'KeyR') {
        event.preventDefault();
        restartGame();
    }
}

// Start the game
function startGame() {
    if (game.gameRunning) return;
    
    game.gameRunning = true;
    game.gamePaused = false;
    hideAllScreens();
    updateButtons();
    
    // Start movement if no direction is set
    if (game.direction.x === 0 && game.direction.y === 0) {
        game.direction = { x: game.gridSize, y: 0 }; // Start moving right
    }
    
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(currentTime) {
    if (!game.gameRunning || game.gamePaused) return;
    
    if (currentTime - game.lastTime >= game.gameSpeed) {
        update();
        draw();
        game.lastTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Move snake head
    const head = { ...game.snake[0] };
    head.x += game.direction.x;
    head.y += game.direction.y;
    
    // Check wall collisions
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let segment of game.snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    game.snake.unshift(head);
    
    // Check food collision
    if (head.x === game.food.x && head.y === game.food.y) {
        // Increase score
        const difficulty = document.getElementById('difficulty-select').value;
        const baseScore = 10;
        const levelBonus = (game.level - 1) * 5;
        const scoreIncrease = Math.floor((baseScore + levelBonus) * difficulties[difficulty].scoreMultiplier);
        
        game.score += scoreIncrease;
        scoreElement.textContent = game.score;
        
        // Check for level up (every 100 points)
        const newLevel = Math.floor(game.score / 100) + 1;
        if (newLevel > game.level) {
            game.level = newLevel;
            levelElement.textContent = game.level;
            // Increase speed slightly with each level
            game.gameSpeed = Math.max(game.gameSpeed - 3, 30);
        }
        
        // Generate new food
        generateFood();
        
        // Add visual feedback
        animateScore();
    } else {
        // Remove tail if no food eaten
        game.snake.pop();
    }
}

// Draw everything on canvas
function draw() {
    // Clear canvas
    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (subtle)
    drawGrid();
    
    // Draw snake
    drawSnake();
    
    // Draw food
    drawFood();
}

// Draw subtle grid
function drawGrid() {
    ctx.strokeStyle = currentTheme.grid;
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= canvas.width; x += game.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += game.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw snake with gradient and rounded corners
function drawSnake() {
    game.snake.forEach((segment, index) => {
        // Create gradient for snake body
        const gradient = ctx.createLinearGradient(
            segment.x, segment.y, 
            segment.x + game.gridSize, segment.y + game.gridSize
        );
        
        if (index === 0) {
            // Head is brighter
            gradient.addColorStop(0, currentTheme.snake);
            gradient.addColorStop(1, darkenColor(currentTheme.snake, 20));
        } else {
            // Body gets gradually darker
            const darkness = Math.min(index * 5, 40);
            gradient.addColorStop(0, darkenColor(currentTheme.snake, darkness));
            gradient.addColorStop(1, darkenColor(currentTheme.snake, darkness + 20));
        }
        
        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle for snake segments
        drawRoundedRect(segment.x + 1, segment.y + 1, game.gridSize - 2, game.gridSize - 2, 3);
        
        // Draw eyes on head
        if (index === 0) {
            drawSnakeEyes(segment);
        }
    });
}

// Draw snake eyes
function drawSnakeEyes(head) {
    ctx.fillStyle = currentTheme.background;
    const eyeSize = 3;
    const eyeOffset = 5;
    
    // Determine eye position based on direction
    let leftEye = { x: head.x + eyeOffset, y: head.y + eyeOffset };
    let rightEye = { x: head.x + game.gridSize - eyeOffset, y: head.y + eyeOffset };
    
    if (game.direction.y > 0) { // Moving down
        leftEye.y = head.y + game.gridSize - eyeOffset;
        rightEye.y = head.y + game.gridSize - eyeOffset;
    } else if (game.direction.x < 0) { // Moving left
        leftEye = { x: head.x + eyeOffset, y: head.y + eyeOffset };
        rightEye = { x: head.x + eyeOffset, y: head.y + game.gridSize - eyeOffset };
    } else if (game.direction.x > 0) { // Moving right
        leftEye = { x: head.x + game.gridSize - eyeOffset, y: head.y + eyeOffset };
        rightEye = { x: head.x + game.gridSize - eyeOffset, y: head.y + game.gridSize - eyeOffset };
    }
    
    // Draw eyes
    ctx.beginPath();
    ctx.arc(leftEye.x, leftEye.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(rightEye.x, rightEye.y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
}

// Draw food with pulsing animation
function drawFood() {
    const time = Date.now();
    const pulse = Math.sin(time * 0.005) * 0.2 + 1;
    const size = (game.gridSize - 4) * pulse;
    const offset = (game.gridSize - size) / 2;
    
    // Food glow effect
    ctx.shadowColor = currentTheme.food;
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = currentTheme.food;
    drawRoundedRect(
        game.food.x + offset, 
        game.food.y + offset, 
        size, 
        size, 
        size / 4
    );
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Utility function to draw rounded rectangles
function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// Generate random food position
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / game.gridSize)) * game.gridSize,
            y: Math.floor(Math.random() * (canvas.height / game.gridSize)) * game.gridSize
        };
    } while (game.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    game.food = newFood;
}

// Game over
function gameOver() {
    game.gameRunning = false;
    game.gamePaused = false;
    
    // Check for high score
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('snakeHighScore', game.highScore);
        highScoreElement.textContent = game.highScore;
        newHighScoreElement.classList.remove('hidden');
    } else {
        newHighScoreElement.classList.add('hidden');
    }
    
    finalScoreElement.textContent = game.score;
    document.getElementById('game-over-screen').classList.remove('hidden');
    updateButtons();
}

// Toggle pause
function togglePause() {
    if (!game.gameRunning) return;
    
    game.gamePaused = !game.gamePaused;
    
    if (game.gamePaused) {
        document.getElementById('pause-screen').classList.remove('hidden');
    } else {
        document.getElementById('pause-screen').classList.add('hidden');
        requestAnimationFrame(gameLoop);
    }
    
    updateButtons();
}

// Restart game
function restartGame() {
    // Reset game state
    game.snake = [{ x: 200, y: 200 }];
    game.direction = { x: 0, y: 0 };
    game.score = 0;
    game.level = 1;
    game.gameRunning = false;
    game.gamePaused = false;
    
    // Reset speed based on difficulty
    const difficulty = document.getElementById('difficulty-select').value;
    game.gameSpeed = difficulties[difficulty].speed;
    
    // Update UI
    scoreElement.textContent = game.score;
    levelElement.textContent = game.level;
    hideAllScreens();
    updateButtons();
    
    // Generate new food and draw
    generateFood();
    draw();
}

// Hide all overlay screens
function hideAllScreens() {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
}

// Update button states
function updateButtons() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    startBtn.disabled = game.gameRunning;
    pauseBtn.disabled = !game.gameRunning;
    pauseBtn.textContent = game.gamePaused ? 'Resume' : 'Pause';
}

// Change theme
function changeTheme() {
    const selectedTheme = document.getElementById('theme-select').value;
    currentTheme = themes[selectedTheme];
    
    // Update body class for CSS theme
    document.body.className = selectedTheme === 'modern' ? '' : selectedTheme + '-theme';
    
    // Redraw canvas with new theme
    draw();
}

// Change difficulty
function changeDifficulty() {
    const difficulty = document.getElementById('difficulty-select').value;
    game.gameSpeed = difficulties[difficulty].speed;
}

// Utility functions
function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function animateScore() {
    scoreElement.style.transform = 'scale(1.2)';
    scoreElement.style.color = currentTheme.food;
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
        scoreElement.style.color = '';
    }, 200);
}

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
});

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (!game.gameRunning) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && game.direction.x === 0) {
                game.direction = { x: game.gridSize, y: 0 }; // Right
            } else if (deltaX < 0 && game.direction.x === 0) {
                game.direction = { x: -game.gridSize, y: 0 }; // Left
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && game.direction.y === 0) {
                game.direction = { x: 0, y: game.gridSize }; // Down
            } else if (deltaY < 0 && game.direction.y === 0) {
                game.direction = { x: 0, y: -game.gridSize }; // Up
            }
        }
    }
});

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', initGame);
