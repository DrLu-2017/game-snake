// game.js

// Assumes food.js and snake.js are loaded first.
// Assumes canvas, ctx, box, rows, snake (array from snake.js) are global.
// Assumes currentFood (object from food.js) is global.
// Assumes applyTransformation (function from snake.js) is global.

// Game state variables
let score = 0;
let gameOver = false;
let isPaused = false;
let gameStarted = false;
let gameSpeed = 200; // Default to Easy speed
let gameIntervalId;

// Variables for speed boost effect
let originalGameSpeed = 0;
let speedBoostTimeoutId = null;

/**
 * Updates the score display in the HTML.
 */
function updateScoreDisplay() {
    const scoreElement = document.getElementById('scoreDisplay');
    if (scoreElement) {
        scoreElement.textContent = 'Score: ' + score;
    }
}

/**
 * Initializes or resets the game state for a new game.
 */
function initGame() {
    gameStarted = true;
    isPaused = false;
    gameOver = false;
    score = 0;
    updateScoreDisplay(); // Reset score display

    // Reset speed boost effects
    if (speedBoostTimeoutId) {
        clearTimeout(speedBoostTimeoutId);
        speedBoostTimeoutId = null;
    }
    gameSpeed = 200; // Default to easy or could be last selected difficulty

    resetSnake(); // From snake.js - this also resets snake color and transformation timeout
    generateNewFood(); // From food.js - generates food and places it in currentFood

    if (gameIntervalId) {
        clearInterval(gameIntervalId);
    }
    gameIntervalId = setInterval(updateGame, gameSpeed);

    drawGame();
}

/**
 * Main game drawing function.
 */
function drawGame() {
    if (!ctx || !canvas) return;

    if (!gameStarted) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press Start Game", canvas.width / 2, canvas.height / 2);
        updateScoreDisplay();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();  // From food.js
    drawSnake(); // From snake.js
    updateScoreDisplay();

    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
    }
}

/**
 * Main game update function.
 */
function updateGame() {
    if (gameOver) {
        if (speedBoostTimeoutId) {
            clearTimeout(speedBoostTimeoutId);
            speedBoostTimeoutId = null;
        }
        clearInterval(gameIntervalId);
        alert("游戏结束！你的得分：" + score);
        location.reload();
        return;
    }

    if (isPaused) {
        drawGame();
        return;
    }

    const head = moveSnake(); // From snake.js

    if (checkWallCollision(head) || checkSelfCollision(head)) {
        triggerEndGame();
        return;
    }

    if (checkFoodEaten(head)) { // From food.js
        const eatenFoodType = currentFood.type;
        score += eatenFoodType.score;

        if (eatenFoodType.effect === 'game_over') {
            triggerEndGame();
            drawGame();
            return;
        }

        if (eatenFoodType.effect === 'speed_boost') {
            if (speedBoostTimeoutId) {
                clearTimeout(speedBoostTimeoutId);
            } else {
                originalGameSpeed = gameSpeed;
            }
            // Ensure originalGameSpeed has a valid base if speed boost is picked up first
            if (originalGameSpeed === 0) originalGameSpeed = gameSpeed;

            gameSpeed = Math.max(50, Math.floor(originalGameSpeed * eatenFoodType.speedMultiplier));

            clearInterval(gameIntervalId);
            gameIntervalId = setInterval(updateGame, gameSpeed);

            speedBoostTimeoutId = setTimeout(() => {
                gameSpeed = originalGameSpeed;
                if (gameStarted && !gameOver && !isPaused) {
                    clearInterval(gameIntervalId);
                    gameIntervalId = setInterval(updateGame, gameSpeed);
                }
                // If paused, gameSpeed is updated. Interval will use it when unpaused.
                speedBoostTimeoutId = null;
                originalGameSpeed = 0;
            }, eatenFoodType.duration);
        }

        // Apply transformation if defined for the food type
        if (eatenFoodType.transform) {
            applyTransformation(eatenFoodType.transform); // Function from snake.js
        }

        generateNewFood();
    } else {
        if (snake.length > 1) {
             snake.pop();
        }
    }

    drawGame();
}

/**
 * Sets gameOver flag and clears speed boost.
 * Snake color reset is handled by resetSnake() during initGame().
 */
function triggerEndGame() {
    gameOver = true;
    if (speedBoostTimeoutId) {
        clearTimeout(speedBoostTimeoutId);
        speedBoostTimeoutId = null;
    }
    // Note: Snake color and transformation timeout are reset by resetSnake() in snake.js,
    // which is called by initGame() when a new game starts.
    // If the snake needs to be visually reset *immediately* on game over (before page reload),
    // then currentSnakeColor = defaultSnakeColor and clearTimeout(transformationTimeoutId)
    // would need to be callable/done here. For now, relying on full reset via initGame.
}

/**
 * Sets the game difficulty (speed).
 */
function setGameDifficulty(level) {
    let newSpeed;
    switch (level) {
        case 'easy': newSpeed = 200; break;
        case 'medium': newSpeed = 150; break;
        case 'hard': newSpeed = 100; break;
        default: newSpeed = gameSpeed;
    }

    if (speedBoostTimeoutId && originalGameSpeed > 0) {
        originalGameSpeed = newSpeed;
    } else {
         gameSpeed = newSpeed;
    }

    if (gameStarted && !gameOver && !isPaused) {
        clearInterval(gameIntervalId);
        gameIntervalId = setInterval(updateGame, gameSpeed);
    }
}

/**
 * Toggles the pause state of the game.
 */
function togglePauseGame() {
    if (!gameStarted || gameOver) {
        return;
    }
    isPaused = !isPaused;
    if (isPaused) {
        drawGame();
    } else {
        // When unpausing, ensure the game loop uses the current gameSpeed
        clearInterval(gameIntervalId);
        gameIntervalId = setInterval(updateGame, gameSpeed);
    }
}
