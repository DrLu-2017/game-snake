// game.js

// Assumes food.js and snake.js are loaded first.
// Assumes canvas, ctx, box, rows, snake (array from snake.js) are global.
// Assumes activeFoods (array from food.js) is global.
// Assumes all necessary functions from snake.js (applyTransformation, resetSnake, moveSnake,
// checkWallCollision, checkSelfCollision, incrementConsecutiveRedBlocks,
// resetConsecutiveRedBlocks, getConsecutiveRedBlocks, incrementSnakeWidth) are global.

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
    updateScoreDisplay();

    if (speedBoostTimeoutId) {
        clearTimeout(speedBoostTimeoutId);
        speedBoostTimeoutId = null;
    }
    gameSpeed = 200;

    resetSnake(); // From snake.js - also resets width and consecutive red blocks
    generateNewFood();

    if (gameIntervalId) {
        clearInterval(gameIntervalId);
    }
    gameIntervalId = setInterval(updateGame, gameSpeed);

    drawGame();
    if (typeof updateControlBtnText === 'function') updateControlBtnText();
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
    drawFood();
    drawSnake();
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

    const head = moveSnake();

    // Pass 'rows' for cols and rows as checkWallCollision expects it (from snake.js context)
    if (checkWallCollision(head) || checkSelfCollision(head)) { // Assuming checkWallCollision now uses 'rows' for cols too
        triggerEndGame();
        return;
    }

    let foodEatenThisTick = false;
    const eatenFoodItem = checkFoodEaten(head);

    if (eatenFoodItem) {
        foodEatenThisTick = true;
        const eatenFoodType = eatenFoodItem.type;
        score += eatenFoodType.score;


        // Fattening logic
        if (eatenFoodType.id === FOOD_TYPES.RED_BLOCK.id) { // Check against ID from FOOD_TYPES
            incrementConsecutiveRedBlocks(); // from snake.js
            if (getConsecutiveRedBlocks() >= 2) {
                incrementSnakeWidth(); // from snake.js
                resetConsecutiveRedBlocks();
            }
        } else {
            // Only reset if it's not a RED_BLOCK. If it was a RED_BLOCK but count < 2, we don't reset here.
            // The reset for RED_BLOCK happens above if width is incremented.
            // This else means "any food other than RED_BLOCK was eaten".
            resetConsecutiveRedBlocks(); // from snake.js, reset if other food eaten
        }

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
                speedBoostTimeoutId = null;
                originalGameSpeed = 0;
            }, eatenFoodType.duration);
        }

        if (eatenFoodType.transform) {
            applyTransformation(eatenFoodType.transform);
        }

        if (eatenFoodType.effect === 'double_length') {
            const segmentsToAdd = snake.length;
            for (let i = 0; i < segmentsToAdd; i++) {
                snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y });
            }
        } else if (eatenFoodType.effect === 'halve_length') {
            const lenForHalvingCheck = snake.length;
            if (lenForHalvingCheck > 2) {
                const targetLength = Math.max(1, Math.floor(lenForHalvingCheck / 2));
                while (snake.length > targetLength) {
                    if (snake.length > 1) snake.pop();
                    else break;
                }
            }
        }

        generateNewFood();
    }

    if (!foodEatenThisTick) {
        if (snake.length > 1) {
             snake.pop();
        }
    }

    drawGame();
}

/**
 * Sets gameOver flag and clears speed boost.
 */
function triggerEndGame() {
    gameOver = true;
    if (speedBoostTimeoutId) {
        clearTimeout(speedBoostTimeoutId);
        speedBoostTimeoutId = null;
    }
    if (typeof updateControlBtnText === 'function') updateControlBtnText();
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
        clearInterval(gameIntervalId);
        gameIntervalId = setInterval(updateGame, gameSpeed);
    }
    if (typeof updateControlBtnText === 'function') updateControlBtnText();
}
