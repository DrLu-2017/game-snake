// game.js

// Assumes food.js and snake.js are loaded first.
// Assumes canvas, ctx, box, rows, cols are global, defined in index.html.
// Assumes P1 snake variables (snake1Body, dx1, dy1 etc.) and P2 snake variables are global from snake.js
// Assumes P1 and P2 functions from snake.js are global (e.g., resetSnake1, moveSnake1, applyTransformationP1 etc.)
// Assumes activeFoods (array from food.js) is global.

// --- Game Master State ---
let gameOver = false; // Shared game over state
let isPaused = false;
let gameStarted = false;
let gameSpeed = 200; // Shared game speed
let gameIntervalId;

// --- Player 1 Game State ---
let p1_targetLength = 0;
let p1_roundsAchieved = 0;
let p1_foodEatenThisRound = 0;
let p1_gameOver = false; // Player-specific game over
// const maxRoundsPerGame = 5; // Shared
// const maxFoodPerRound = 10; // Shared

// --- Player 2 Game State ---
let p2_targetLength = 0;
let p2_roundsAchieved = 0;
let p2_foodEatenThisRound = 0;
let p2_gameOver = false; // Player-specific game over

// Shared constants for Target Length mode (already in game.js, just for reference)
// const maxRoundsPerGame = 5;
// const maxFoodPerRound = 10;

// Variables for speed boost effect (assuming shared for now, can be made player-specific)
let originalGameSpeed = 0;
let speedBoostTimeoutId = null;
let score = 0; // Keep traditional score for non-target modes or if needed.

/**
 * Updates the game status displays in the HTML for both players.
 */
function updateGameStatusDisplay() {
    // Player 1
    const p1TargetLengthEl = document.getElementById('p1TargetLengthDisplay');
    const p1RoundsEl = document.getElementById('p1RoundsDisplay');
    const p1FoodThisRoundEl = document.getElementById('p1FoodThisRoundDisplay');
    const p1CurrentLengthEl = document.getElementById('p1CurrentLengthDisplay');
    const p1GameOverEl = document.getElementById('p1GameOverDisplay');

    if (p1TargetLengthEl) p1TargetLengthEl.textContent = 'Target Length: ' + p1_targetLength;
    if (p1RoundsEl) p1RoundsEl.textContent = 'Rounds Cleared: ' + p1_roundsAchieved + ' / ' + maxRoundsPerGame;
    if (p1FoodThisRoundEl) p1FoodThisRoundEl.textContent = 'Food This Round: ' + p1_foodEatenThisRound + ' / ' + maxFoodPerRound;
    if (p1CurrentLengthEl) p1CurrentLengthEl.textContent = 'Current Length: ' + (snake1Body ? snake1Body.length : 0);
    if (p1GameOverEl) p1GameOverEl.style.display = p1_gameOver ? 'block' : 'none';

    // Player 2
    const p2TargetLengthEl = document.getElementById('p2TargetLengthDisplay');
    const p2RoundsEl = document.getElementById('p2RoundsDisplay');
    const p2FoodThisRoundEl = document.getElementById('p2FoodThisRoundDisplay');
    const p2CurrentLengthEl = document.getElementById('p2CurrentLengthDisplay');
    const p2GameOverEl = document.getElementById('p2GameOverDisplay');

    if (p2TargetLengthEl) p2TargetLengthEl.textContent = 'Target Length: ' + p2_targetLength;
    if (p2RoundsEl) p2RoundsEl.textContent = 'Rounds Cleared: ' + p2_roundsAchieved + ' / ' + maxRoundsPerGame;
    if (p2FoodThisRoundEl) p2FoodThisRoundEl.textContent = 'Food This Round: ' + p2_foodEatenThisRound + ' / ' + maxFoodPerRound;
    if (p2CurrentLengthEl) p2CurrentLengthEl.textContent = 'Current Length: ' + (snake2Body ? snake2Body.length : 0);
    if (p2GameOverEl) p2GameOverEl.style.display = p2_gameOver ? 'block' : 'none';
}


/**
 * Initializes or resets the game state for a new game (both players).
 */
function initGame() {
    gameStarted = true;
    isPaused = false;
    gameOver = false; // Overall game over

    p1_gameOver = false;
    p1_roundsAchieved = 0;
    // p1_targetLength will be set by startNewRoundForPlayer
    // p1_foodEatenThisRound will be set by startNewRoundForPlayer

    p2_gameOver = false;
    p2_roundsAchieved = 0;
    // p2_targetLength will be set by startNewRoundForPlayer
    // p2_foodEatenThisRound will be set by startNewRoundForPlayer

    score = 0;

    if (speedBoostTimeoutId) {
        clearTimeout(speedBoostTimeoutId);
        speedBoostTimeoutId = null;
    }
    gameSpeed = 200;

    resetSnake1();
    resetSnake2();

    startNewRoundForPlayer(1); // Start P1's first round
    startNewRoundForPlayer(2); // Start P2's first round

    // generateNewFood(); // Called by startNewRound functions indirectly or directly

    if (gameIntervalId) {
        clearInterval(gameIntervalId);
    }
    gameIntervalId = setInterval(updateGame, gameSpeed);

    updateGameStatusDisplay(); // Initial display update
    drawGame();
    if (typeof updateControlBtnText === 'function') updateControlBtnText();
}

/**
 * Starts a new round for a specific player.
 * @param {number} playerNum - 1 for Player 1, 2 for Player 2.
 */
function startNewRoundForPlayer(playerNum) {
    let currentSnakeLength;
    if (playerNum === 1) {
        p1_foodEatenThisRound = 0;
        currentSnakeLength = (snake1Body && snake1Body.length > 0) ? snake1Body.length : 1;
        p1_targetLength = currentSnakeLength + Math.floor(Math.random() * 5) + 3;
        console.log(`[GAME LOGIC] P1 New Round. Target: ${p1_targetLength}, Current Len: ${currentSnakeLength}`);
    } else if (playerNum === 2) {
        p2_foodEatenThisRound = 0;
        currentSnakeLength = (snake2Body && snake2Body.length > 0) ? snake2Body.length : 1;
        p2_targetLength = currentSnakeLength + Math.floor(Math.random() * 5) + 3;
        console.log(`[GAME LOGIC] P2 New Round. Target: ${p2_targetLength}, Current Len: ${currentSnakeLength}`);
    }
    // Food is generated once for both players, or could be player-specific if desired
    generateNewFood(); // Assuming this generates food for the whole game board
    updateGameStatusDisplay();
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
        updateGameStatusDisplay();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnakes(); // Changed from drawSnake() to drawSnakes() from snake.js
    updateGameStatusDisplay();

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
 * Main game update function - needs significant changes for two players.
 * This will be addressed in the next subtask.
 * For now, it will mostly run P1's logic and P2 will just exist.
 */
function updateGame() {
    if (gameOver) return; // Overall game over

    if (isPaused) {
        drawGame();
        return;
    }

    // --- Player 1 Logic ---
    if (gameStarted && !isPaused && !p1_gameOver) {
        const head1 = moveSnake1();
        if (head1) { // Ensure head1 is not null (snake1Body might be empty if logic error)
            if (checkWallCollision(head1, getSnakeWidthP1()) || checkSelfCollision(head1, snake1Body)) {
                p1_gameOver = true;
                console.log("Player 1 Game Over - Collision");
            } else {
                const eatenFoodItem = checkFoodEaten(head1);
                if (eatenFoodItem) {
                    // Simplified: P1 eats, P1 processes effects. P2 interaction with food later.
                // Remove eaten food from activeFoods - TODO: This needs to be handled carefully
                // For now, assume checkFoodEaten returns the item, and game.js removes it
                // and then calls generateNewFood IF NEEDED (e.g. if all food gone or for competitive mode)
                // The current food.js checkFoodEaten just returns the item, doesn't remove.
                // And generateNewFood in game.js (when food eaten) regenerates ALL food.

                // Temporary: remove the eaten food item from activeFoods list
                const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItem.x && f.y === eatenFoodItem.y);
                    const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItem.x && f.y === eatenFoodItem.y);
                    if (foodIndex > -1) activeFoods.splice(foodIndex, 1);

                    p1_foodEatenThisRound++;
                    score += eatenFoodItem.type.score; // P1 score for now

                    // P1 Fattening logic
                    if (eatenFoodItem.type.id === FOOD_TYPES.RED_BLOCK.id) {
                        incrementConsecutiveRedBlocksP1();
                        if (getConsecutiveRedBlocksP1() >= 2) {
                            incrementSnakeWidthP1();
                            resetConsecutiveRedBlocksP1();
                            if (getSnakeWidthP1() > 2) { p1_gameOver = true; console.log("Player 1 Game Over - Too Wide by Fattening"); }
                        }
                    } else {
                        resetConsecutiveRedBlocksP1();
                    }

                    if (eatenFoodItem.type.effect === 'game_over') { p1_gameOver = true; console.log("Player 1 Game Over - Obstacle");}
                    if (eatenFoodItem.type.transform) applyTransformationP1(eatenFoodItem.type.transform);

                    let p1_grewByDefault = true;
                    if (eatenFoodItem.type.effect === 'double_length') {
                        const s1l = snake1Body.length; for(let i=0; i<s1l;i++) snake1Body.push({...snake1Body[snake1Body.length-1]});
                        p1_grewByDefault = false; // Length handled by effect
                    } else if (eatenFoodItem.type.effect === 'halve_length') {
                        if(snake1Body.length > 2) {const t1l = Math.max(1, Math.floor(snake1Body.length/2)); while(snake1Body.length > t1l) snake1Body.pop();}
                        p1_grewByDefault = false; // Length handled by effect
                    }
                    // If p1_grewByDefault is true, snake grows by not popping tail.

                    if (!p1_gameOver) { // Check if game over before proceeding with round logic
                        if (snake1Body.length >= p1_targetLength) {
                            p1_roundsAchieved++;
                            if (p1_roundsAchieved >= maxRoundsPerGame) {
                                p1_gameOver = true; // P1 wins their track
                                console.log("Player 1 Wins their track!");
                            } else {
                                startNewRoundForPlayer(1);
                            }
                        } else if (p1_foodEatenThisRound >= maxFoodPerRound) {
                            p1_gameOver = true;
                            console.log("Player 1 Game Over - Out of food for round");
                        }
                    }
                    generateNewFood();
                } else { // No food eaten by P1
                    if (snake1Body.length > 1) snake1Body.pop();
                }
            }
        }
    }

    // --- Player 2 Logic ---
    if (gameStarted && !isPaused && !p2_gameOver) {
        const head2 = moveSnake2();
        if (head2) { // Ensure head2 is not null
            if (checkWallCollision(head2, getSnakeWidthP2()) || checkSelfCollision(head2, snake2Body)) {
                p2_gameOver = true;
                console.log("Player 2 Game Over - Collision");
            } else {
                const eatenFoodItemP2 = checkFoodEaten(head2);
                if (eatenFoodItemP2) {
                    const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItemP2.x && f.y === eatenFoodItemP2.y);
                    if (foodIndex > -1) activeFoods.splice(foodIndex, 1);

                    p2_foodEatenThisRound++;
                    // score += eatenFoodItemP2.type.score; // P2 score if tracked separately

                    if (eatenFoodItemP2.type.id === FOOD_TYPES.RED_BLOCK.id) {
                        incrementConsecutiveRedBlocksP2();
                        if (getConsecutiveRedBlocksP2() >= 2) {
                            incrementSnakeWidthP2();
                            resetConsecutiveRedBlocksP2();
                            if(getSnakeWidthP2() > 2) p2_gameOver = true; console.log("Player 2 Game Over - Too Wide by Fattening");
                        }
                    } else {
                        resetConsecutiveRedBlocksP2();
                    }

                    if (eatenFoodItemP2.type.effect === 'game_over') { p2_gameOver = true; console.log("Player 2 Game Over - Obstacle"); }
                    if (eatenFoodItemP2.type.transform) applyTransformationP2(eatenFoodItemP2.type.transform);

                    let p2_grewByDefault = true;
                    if (eatenFoodItemP2.type.effect === 'double_length') {
                        const s2l = snake2Body.length; for(let i=0; i<s2l;i++) snake2Body.push({...snake2Body[snake2Body.length-1]});
                        p2_grewByDefault = false;
                    } else if (eatenFoodItemP2.type.effect === 'halve_length') {
                        if(snake2Body.length > 2) {const t2l = Math.max(1, Math.floor(snake2Body.length/2)); while(snake2Body.length > t2l) snake2Body.pop();}
                        p2_grewByDefault = false;
                    }

                    if (!p2_gameOver) { // Check if game over before round logic
                        if (snake2Body.length >= p2_targetLength) {
                            p2_roundsAchieved++;
                            if (p2_roundsAchieved >= maxRoundsPerGame) {
                                p2_gameOver = true; console.log("Player 2 Wins their track!");
                            } else {
                                startNewRoundForPlayer(2);
                            }
                        } else if (p2_foodEatenThisRound >= maxFoodPerRound) {
                            p2_gameOver = true; console.log("Player 2 Game Over - Out of food");
                        }
                    }
                    generateNewFood();
                } else { // No food eaten by P2
                    if (snake2Body.length > 1) snake2Body.pop();
                }
            }
        }
    }


    // Snake vs Snake collision logic
    if (gameStarted && !isPaused && !p1_gameOver && !p2_gameOver && snake1Body.length > 0 && snake2Body.length > 0) {
        let p1HitP2 = false;
        let p2HitP1 = false;

        // Check P1 head vs P2 body
        for (let i = 0; i < snake2Body.length; i++) {
            if (snake1Body[0].x === snake2Body[i].x && snake1Body[0].y === snake2Body[i].y) {
                p1HitP2 = true;
                break;
            }
        }

        // Check P2 head vs P1 body
        for (let i = 0; i < snake1Body.length; i++) {
            if (snake2Body[0].x === snake1Body[i].x && snake2Body[0].y === snake1Body[i].y) {
                p2HitP1 = true;
                break;
            }
        }

        if (snake1Body[0].x === snake2Body[0].x && snake1Body[0].y === snake2Body[0].y) { // Head-to-head
            p1_gameOver = true;
            p2_gameOver = true;
            console.log("Head-to-Head Collision! Both players Game Over.");
        } else if (p1HitP2) {
            p1_gameOver = true;
            console.log("Player 1 hit Player 2's body! Player 1 Game Over.");
        } else if (p2HitP1) {
            p2_gameOver = true;
            console.log("Player 2 hit Player 1's body! Player 2 Game Over.");
        }
        if(p1HitP2 || p2HitP1) updateGameStatusDisplay(); // Update UI if a collision occurred
    }

    // Check for overall game over
    // (e.g., if both players are game over, or one is game over and the other isn't actively playing,
    // or if one player has won their rounds and the other is game over)
    if ((p1_gameOver && p2_gameOver) ||
        (p1_gameOver && (!snake2Body || snake2Body.length === 0)) ||
        (p2_gameOver && (!snake1Body || snake1Body.length === 0)) ||
        (p1_roundsAchieved >= maxRoundsPerGame && p2_gameOver) || // P1 won, P2 game over
        (p2_roundsAchieved >= maxRoundsPerGame && p1_gameOver)    // P2 won, P1 game over
        ) {
        if (!gameOver) { // Ensure triggerEndGame is called only once for the master game over
            gameOver = true;
            // Determine overall win/loss based on who is not game over, or who achieved more rounds/length
            let gameWon = (p1_roundsAchieved >= maxRoundsPerGame && !p2_gameOver) || (p2_roundsAchieved >= maxRoundsPerGame && !p1_gameOver) || (p1_roundsAchieved >=maxRoundsPerGame && p2_roundsAchieved >=maxRoundsPerGame);
            // This win condition is simplistic, needs refinement if competitive.
            // For now, if one player completes all rounds and the other is game over, it's a win for that player.
            // If both complete all rounds, it's also a win.
            // If both p1_gameOver and p2_gameOver, it's a loss unless one completed rounds before game over.
            if (p1_roundsAchieved >= maxRoundsPerGame && p2_roundsAchieved < maxRoundsPerGame) gameWon = true; // P1 wins
            else if (p2_roundsAchieved >= maxRoundsPerGame && p1_roundsAchieved < maxRoundsPerGame) gameWon = true; // P2 wins
            else if (p1_roundsAchieved >=maxRoundsPerGame && p2_roundsAchieved >=maxRoundsPerGame) gameWon = true; // Both win (or draw)
            else gameWon = false; // Both lost or one lost and other didn't finish.

            triggerEndGame(gameWon);
        }
    }

    updateGameStatusDisplay();
    drawGame();
}


/**
 * Sets gameOver flag and clears speed boost.
 * @param {boolean} isWin - True if the game was won, false otherwise (or undefined for standard game over).
 */
function triggerEndGame(isWin) {
    gameOver = true;

    if (speedBoostTimeoutId) {
        clearTimeout(speedBoostTimeoutId);
        speedBoostTimeoutId = null;
    }
    clearInterval(gameIntervalId);

    if (typeof updateControlBtnText === 'function') updateControlBtnText();
    updateGameStatusDisplay();
    drawGame();

    let endMessage;
    if (isWin === true) {
        if (p1_roundsAchieved >= maxRoundsPerGame && p2_roundsAchieved >= maxRoundsPerGame) {
            endMessage = "Amazing! Both players reached all targets!";
        } else if (p1_roundsAchieved >= maxRoundsPerGame) {
            endMessage = "Congratulations Player 1! You Reached All Targets!";
        } else if (p2_roundsAchieved >= maxRoundsPerGame) {
            endMessage = "Congratulations Player 2! You Reached All Targets!";
        } else { // Should not happen if isWin is true based on current logic.
            endMessage = "Victory!";
        }
    } else if (isWin === false) {
        let p1Msg = p1_gameOver ? `P1: L${snake1Body.length}, R${p1_roundsAchieved}/${maxRoundsPerGame}, F${p1_foodEatenThisRound}/${maxFoodPerRound}` : "P1 Active";
        let p2Msg = p2_gameOver ? `P2: L${snake2Body.length}, R${p2_roundsAchieved}/${maxRoundsPerGame}, F${p2_foodEatenThisRound}/${maxFoodPerRound}` : "P2 Active";

        if (p1_gameOver && p2_gameOver) {
            endMessage = "Game Over for Both Players!";
        } else if (p1_gameOver) {
            endMessage = "Player 1 Game Over!";
        } else if (p2_gameOver) {
            endMessage = "Player 2 Game Over!";
        } else { // General loss if not specific player game over but master game over
            endMessage = "Target Not Reached! Game Over.";
        }
        // More detailed reasons can be added based on how p1_gameOver/p2_gameOver were set.
        // For instance, if food limit was hit for a player who is now gameOver.
        // The current alert will just show final lengths and rounds.
    } else {
        endMessage = "游戏结束！"; // Default for direct collisions etc.
    }

    alert(endMessage + `\nP1 Final Length: ${snake1Body ? snake1Body.length : 0} (Rounds: ${p1_roundsAchieved}/${maxRoundsPerGame})` +
                      `\nP2 Final Length: ${snake2Body ? snake2Body.length : 0} (Rounds: ${p2_roundsAchieved}/${maxRoundsPerGame})`);
    location.reload();
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
    if (!gameStarted || gameOver) { // Use master gameOver
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
