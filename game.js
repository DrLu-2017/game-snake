// game.js

// Assumes food.js and snake.js are loaded first.
// Assumes canvas, ctx, box, rows, cols are global, defined in index.html.
// Assumes P1 snake variables (snake1Body, dx1, dy1 etc.) and P2 snake variables are global from snake.js
// Assumes P1 and P2 functions from snake.js are global (e.g., resetSnake1, moveSnake1, applyTransformationP1 etc.)
// Assumes activeFoods (array from food.js) is global.

const maxRoundsPerGame = 5;
const maxFoodPerRound = 10;

// --- Game Master State ---
let gameOver = false; // Shared game over state
let isPaused = false;
let gameStarted = false;
let isPlayer2Active = false; // Added this flag
let gameSpeed = 200; // Shared game speed
let currentDifficultyLevel = 'easy'; // Added for obstacle probability
let gameIntervalId;

// --- Consecutive Food Rule State ---
let p1LastEatenFoodType = null;
let p2LastEatenFoodType = null;
let p1AwaitingMessageAck = false;
let p2AwaitingMessageAck = false;

// --- Player 1 Game State ---
let p1_targetLength = 0;
let p1_roundsAchieved = 0;
let p1_foodEatenThisRound = 0;
let p1_gameOver = false; // Player-specific game over
// These are now defined globally above
// const maxRoundsPerGame = 5;
// const maxFoodPerRound = 10;

// --- Player 2 Game State ---
let p2_targetLength = 0;
let p2_roundsAchieved = 0;
let p2_foodEatenThisRound = 0;
let p2_gameOver = false; // Player-specific game over

// Shared constants for Target Length mode are now defined globally above
// const maxRoundsPerGame = 5;
// const maxFoodPerRound = 10;

// Variables for speed boost effect (player-specific)
let p1SpeedEffectActive = false;
let p2SpeedEffectActive = false;
let p1OriginalSpeedBeforeEffect = 0;
let p2OriginalSpeedBeforeEffect = 0;
let p1SpeedChangeTimeoutId = null;
let p2SpeedChangeTimeoutId = null;

let gameDifficultyBeforeMousse = null; // Stores 'easy', 'medium', or 'hard' string for Mousse effect

let score = 0; // Keep traditional score for non-target modes or if needed.

// --- Consecutive Food Warning UI Functions ---
function showFoodWarning(playerNum, message) {
    const warningContainer = document.getElementById('consecutiveFoodWarning');
    const warningTextMessage = document.getElementById('warningTextMessage');
    if (warningContainer && warningTextMessage) {
        warningTextMessage.textContent = message;
        warningContainer.style.display = 'block';
        if (playerNum === 1) {
            p1AwaitingMessageAck = true;
        } else if (playerNum === 2) {
            p2AwaitingMessageAck = true;
        }
    } else {
        console.error("Cannot show food warning, UI elements not found.");
        // Fallback to alert if UI is missing, though this is disruptive
        // alert(message);
        // if (playerNum === 1) p1AwaitingMessageAck = true; else if (playerNum === 2) p2AwaitingMessageAck = true;
    }
}

function acknowledgeFoodWarning() {
    const warningContainer = document.getElementById('consecutiveFoodWarning');
    if (warningContainer) {
        warningContainer.style.display = 'none';
    }
    if (p1AwaitingMessageAck) {
        p1AwaitingMessageAck = false;
        console.log("Player 1 acknowledged food warning.");
    } else if (p2AwaitingMessageAck) {
        p2AwaitingMessageAck = false;
        console.log("Player 2 acknowledged food warning.");
    }
}

/**
 * Updates the game status displays in the HTML for both players.
 */
function updateGameStatusDisplay() {
    console.log("[DEBUG_STARTUP] updateGameStatusDisplay: Start");
    // Player 1
    const p1TargetLengthEl = document.getElementById('p1TargetLengthDisplay');
    if (!p1TargetLengthEl) {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1TargetLengthDisplay' NOT FOUND!");
    } else {
        p1TargetLengthEl.textContent = 'Target Length: ' + p1_targetLength;
    }

    const p1RoundsEl = document.getElementById('p1RoundsDisplay');
    if (!p1RoundsEl) {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1RoundsDisplay' NOT FOUND!");
    } else {
        p1RoundsEl.textContent = 'Rounds Cleared: ' + p1_roundsAchieved + ' / ' + maxRoundsPerGame;
    }

    const p1FoodThisRoundEl = document.getElementById('p1FoodThisRoundDisplay');
    if (!p1FoodThisRoundEl) {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1FoodThisRoundDisplay' NOT FOUND!");
    } else {
        p1FoodThisRoundEl.textContent = 'Food This Round: ' + p1_foodEatenThisRound + ' / ' + maxFoodPerRound;
    }

    const p1CurrentLengthEl = document.getElementById('p1CurrentLengthDisplay');
    if (!p1CurrentLengthEl) {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1CurrentLengthDisplay' NOT FOUND!");
    } else {
        p1CurrentLengthEl.textContent = 'Current Length: ' + (typeof snake1Body !== 'undefined' && snake1Body ? snake1Body.length : 0);
    }

    const p1GameOverEl = document.getElementById('p1GameOverDisplay');
    if (!p1GameOverEl) {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1GameOverDisplay' NOT FOUND!");
    } else {
        p1GameOverEl.style.display = p1_gameOver ? 'block' : 'none';
    }

    // Player 2 Status Area
    const p2StatusContainer = document.getElementById('p2StatusContainer');
    if (p2StatusContainer) {
        if (typeof isPlayer2Active !== 'undefined' && !isPlayer2Active) {
            p2StatusContainer.style.display = 'none';
        } else {
            // Assuming 'block' is the correct display type for the container when visible.
            // If it was 'flex' or something else, that should be used.
            // The initial HTML sets it to display:none; JS in index.html makes it block.
            p2StatusContainer.style.display = 'block';

            // Update P2 elements only if P2 is active
            const p2TargetLengthEl = document.getElementById('p2TargetLengthDisplay');
            if (!p2TargetLengthEl) {
                console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2TargetLengthDisplay' NOT FOUND!");
            } else {
                p2TargetLengthEl.textContent = 'Target Length: ' + p2_targetLength;
            }

            const p2RoundsEl = document.getElementById('p2RoundsDisplay');
            if (!p2RoundsEl) {
                console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2RoundsDisplay' NOT FOUND!");
            } else {
                p2RoundsEl.textContent = 'Rounds Cleared: ' + p2_roundsAchieved + ' / ' + maxRoundsPerGame;
            }

            const p2FoodThisRoundEl = document.getElementById('p2FoodThisRoundDisplay');
            if (!p2FoodThisRoundEl) {
                console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2FoodThisRoundDisplay' NOT FOUND!");
            } else {
                p2FoodThisRoundEl.textContent = 'Food This Round: ' + p2_foodEatenThisRound + ' / ' + maxFoodPerRound;
            }

            const p2CurrentLengthEl = document.getElementById('p2CurrentLengthDisplay');
            if (!p2CurrentLengthEl) {
                console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2CurrentLengthDisplay' NOT FOUND!");
            } else {
                p2CurrentLengthEl.textContent = 'Current Length: ' + (typeof snake2Body !== 'undefined' && snake2Body ? snake2Body.length : 0);
            }

            const p2GameOverEl = document.getElementById('p2GameOverDisplay');
            if (!p2GameOverEl) {
                console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2GameOverDisplay' NOT FOUND!");
            } else {
                // p2_gameOver will be true if !isPlayer2Active due to initGame logic,
                // so this naturally hides the "GAME OVER" text for P2 in 1P mode if container was visible.
                // However, since the container itself is hidden, this specific p2GameOverEl.style.display
                // might be redundant for 1P mode but correct for 2P mode when P2 has a game over.
                p2GameOverEl.style.display = p2_gameOver ? 'block' : 'none';
            }
        }
    } else {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2StatusContainer' NOT FOUND!");
    }
    console.log("[DEBUG_STARTUP] updateGameStatusDisplay: End");
}


/**
 * Initializes or resets the game state for a new game (both players).
 */
function initGame() {
    console.log("[DEBUG_STARTUP] initGame: Start");
    gameStarted = true;
    isPaused = false;
    gameOver = false; // Overall game over

    // Player 1 setup (common to both modes)
    p1_gameOver = false;
    p1_roundsAchieved = 0;
    // p1_targetLength and p1_foodEatenThisRound are set by startNewRoundForPlayer(1)
    console.log("[DEBUG_STARTUP] initGame: Calling resetSnake1");
    resetSnake1();
    console.log("[DEBUG_STARTUP] initGame: Calling startNewRoundForPlayer(1)");
    startNewRoundForPlayer(1); // Sets up P1's first round

    // Conditional Player 2 setup
    // selectedGameMode is global, accessible from index.html's script
    if (typeof selectedGameMode !== 'undefined' && selectedGameMode === '2P') {
        isPlayer2Active = true;
        p2_gameOver = false; // Ensure P2 is active
        p2_roundsAchieved = 0;
        // p2_targetLength and p2_foodEatenThisRound are set by startNewRoundForPlayer(2)
        console.log("[DEBUG_STARTUP] initGame: Calling resetSnake2 for 2P mode");
        resetSnake2();
        console.log("[DEBUG_STARTUP] initGame: Calling startNewRoundForPlayer(2) for 2P mode");
        startNewRoundForPlayer(2); // Sets up P2's first round
        console.log("[GAME SETUP] Two-player mode selected and initialized.");
    } else { // Default to One-Player mode or if selectedGameMode is '1P'
        isPlayer2Active = false;
        p2_gameOver = true; // Explicitly set P2 as game over to disable logic
        if (typeof snake2Body !== 'undefined') snake2Body = []; // Ensure P2 snake is empty
        p2_roundsAchieved = 0; // Reset stats
        p2_foodEatenThisRound = 0;
        p2_targetLength = 0;
        console.log("[GAME SETUP] One-player mode selected and initialized. P2 disabled.");
    }

    score = 0;

    // Clear any active player-specific speed effects
    if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
    if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
    p1SpeedEffectActive = false;
    p2SpeedEffectActive = false;
    p1SpeedChangeTimeoutId = null;
    p2SpeedChangeTimeoutId = null;
    gameDifficultyBeforeMousse = null; // Reset Mousse difficulty tracker
    // Mousse turns and width are reset via resetSnakeX() in snake.js, called by initGame.
    
    // gameSpeed = 200; // This is set by setGameDifficulty, called by initGame or UI.
                      // Or should be explicitly set if difficulty isn't set prior/during init.
                      // For now, assume currentDifficultyLevel is 'easy' by default, and setGameDifficulty will handle it.
    setGameDifficulty(currentDifficultyLevel); // Apply default/current difficulty speed

    p1LastEatenFoodType = null;
    p2LastEatenFoodType = null;
    p1AwaitingMessageAck = false;
    p2AwaitingMessageAck = false;
    const warningContainer = document.getElementById('consecutiveFoodWarning');
    if (warningContainer) {
        warningContainer.style.display = 'none';
    }

    // generateNewFood(); // This is now called by startNewRoundForPlayer

    if (gameIntervalId) {
        clearInterval(gameIntervalId);
    }
    console.log("[DEBUG_STARTUP] game.js/initGame: Setting up setInterval. gameSpeed = " + (typeof gameSpeed !== 'undefined' ? gameSpeed : "undef_gameSpeed") + ", gameLoop function name: " + (typeof updateGame !== 'undefined' && updateGame ? updateGame.name : "undef_updateGame_fn"));
    gameIntervalId = setInterval(updateGame, gameSpeed);

    // updateGameStatusDisplay(); // Initial display update, called by startNewRoundForPlayer
    drawGame();
    if (typeof updateControlBtnText === 'function') updateControlBtnText();
    console.log("[DEBUG_STARTUP] initGame: End");
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
        p1LastEatenFoodType = null; // Reset for new round
        p1AwaitingMessageAck = false; // Reset flag
        if (p1SpeedChangeTimeoutId) { clearTimeout(p1SpeedChangeTimeoutId); p1SpeedChangeTimeoutId = null; }
        p1SpeedEffectActive = false;
        console.log(`[GAME LOGIC] P1 New Round. Target: ${p1_targetLength}, Current Len: ${currentSnakeLength}`);
    } else if (playerNum === 2) {
        p2_foodEatenThisRound = 0;
        currentSnakeLength = (snake2Body && snake2Body.length > 0) ? snake2Body.length : 1;
        p2_targetLength = currentSnakeLength + Math.floor(Math.random() * 5) + 3;
        p2LastEatenFoodType = null; // Reset for new round
        p2AwaitingMessageAck = false; // Reset flag
        if (p2SpeedChangeTimeoutId) { clearTimeout(p2SpeedChangeTimeoutId); p2SpeedChangeTimeoutId = null; }
        p2SpeedEffectActive = false;
        console.log(`[GAME LOGIC] P2 New Round. Target: ${p2_targetLength}, Current Len: ${currentSnakeLength}`);
    }

    // If the other player is not waiting for an ack, hide the container.
    // This prevents a new round for P1 from hiding P2's active warning.
    if (!p1AwaitingMessageAck && !p2AwaitingMessageAck) {
        const warningContainer = document.getElementById('consecutiveFoodWarning');
        if (warningContainer) {
            warningContainer.style.display = 'none';
        }
    }

    // Food is generated once for both players.
    // Called AFTER individual player round states are set.
    generateNewFood();
    updateGameStatusDisplay(); // Update UI with new round info and food
}


/**
 * Main game drawing function.
 */
function drawGame() {
    console.log("[DRAW_DEBUG] drawGame: Entered.");
    if (!ctx || !canvas) {
        console.error("[DRAW_DEBUG] drawGame: ctx or canvas is undefined! Skipping draw.");
        return;
    }
    console.log("[DRAW_DEBUG] drawGame: ctx and canvas are OK.");

    if (!gameStarted) {
        console.log("[DRAW_DEBUG] drawGame: Game not started, drawing start message.");
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Press Start Game", canvas.width / 2, canvas.height / 2);
            console.log("[DRAW_DEBUG] drawGame: Start message drawn.");
        } catch (e) {
            console.error("[DRAW_DEBUG] drawGame: Error drawing start message:", e);
        }
        updateGameStatusDisplay();
        return;
    }

    console.log("[DRAW_DEBUG] drawGame: Game started. Clearing canvas.");
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log("[DRAW_DEBUG] drawGame: Canvas cleared.");
    } catch (e) {
        console.error("[DRAW_DEBUG] drawGame: Error clearing canvas:", e);
    }

    console.log("[DRAW_DEBUG] drawGame: Calling drawFood().");
    try {
        drawFood();
        console.log("[DRAW_DEBUG] drawGame: drawFood() returned.");
    } catch (e) {
        console.error("[DRAW_DEBUG] drawGame: Error during drawFood():", e);
    }

    console.log("[DRAW_DEBUG] drawGame: Calling drawSnakes().");
    try {
        drawSnakes();
        console.log("[DRAW_DEBUG] drawGame: drawSnakes() returned.");
    } catch (e) {
        console.error("[DRAW_DEBUG] drawGame: Error during drawSnakes():", e);
    }
    
    updateGameStatusDisplay();

    if (isPaused) {
        console.log("[DRAW_DEBUG] drawGame: Game is paused, drawing pause message.");
        try {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
            console.log("[DRAW_DEBUG] drawGame: Pause message drawn.");
        } catch (e) {
            console.error("[DRAW_DEBUG] drawGame: Error drawing pause message:", e);
        }
    }
    console.log("[DRAW_DEBUG] drawGame: Exiting.");
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
    let foodEatenThisTick = false; // This line should already exist
    let processP1FoodThisTick = false;
    let processP2FoodThisTick = false;

    // --- Player 1 Logic ---
    if (gameStarted && !isPaused && !p1_gameOver) { // Master isPaused already checked via early return
        if (p1AwaitingMessageAck) {
            // P1 is paused awaiting ack, snake does not move or act.
        } else {
            const head1 = moveSnake1(); // moveSnake1() is from snake.js
            if (head1) { // Ensure head is valid
                if (checkWallCollision(head1, getSnakeWidthP1()) || checkSelfCollision(head1, snake1Body)) {
                    p1_gameOver = true;
                    console.log("Player 1 Game Over - Wall/Self Collision");
                } else {
                    const eatenFoodItem = checkFoodEaten(head1); // from food.js, should not remove food from activeFoods

                    if (eatenFoodItem) {
                        if (isPlayer2Active && eatenFoodItem.type.id === p1LastEatenFoodType) {
                            showFoodWarning(1, `Player 1: Cannot eat ${eatenFoodItem.type.name} again consecutively!`);
                            // processP1FoodThisTick remains false. Food not consumed. Snake tail will be popped later if no other food eaten.
                        } else {
                            processP1FoodThisTick = true; // Mark valid consumption for P1
                            p1LastEatenFoodType = eatenFoodItem.type.id;

                            const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItem.x && f.y === eatenFoodItem.y);
                            if (foodIndex > -1) {
                                activeFoods.splice(foodIndex, 1); // Remove successfully eaten food
                            }

                            // ***** START NEW P1 FOOD PROCESSING LOGIC *****
                            p1_foodEatenThisRound++;
                            score += eatenFoodItem.type.score;

                            // MOUSSE effect
                            if (eatenFoodItem.type.effect === 'mousse_special') {
                                console.log("Player 1 ate Mousse!");
                                if (gameDifficultyBeforeMousse === null) {
                                    gameDifficultyBeforeMousse = currentDifficultyLevel;
                                }
                                setGameDifficulty('hard');
                                console.log("Mousse: P1 triggered HARD mode. Game speed now:", gameSpeed);
                                if (typeof p1MousseTurnsActive !== 'undefined' && p1MousseTurnsActive === 0) {
                                    p1OriginalWidthBeforeMousse = getSnakeWidthP1();
                                }
                                setSnakeWidthP1(getSnakeWidthP1() * 2);
                                p1MousseTurnsActive = 3;
                                console.log(`Mousse: P1 width effect active/refreshed (${getSnakeWidthP1()}) for 3 turns.`);
                            }
                            // APPLE effect
                            else if (eatenFoodItem.type.effect === 'apple_special') {
                                console.log("Player 1 ate Apple!");
                                applyTransformationP1({ type: 'color_change', newColor: '#8A2BE2', duration: 5000 }); // BlueViolet
                                if (!p1SpeedEffectActive) {
                                    p1OriginalSpeedBeforeEffect = gameSpeed;
                                    p1SpeedEffectActive = true;
                                    gameSpeed = Math.floor(gameSpeed * 1.3); // Slower
                                    if (gameSpeed === p1OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed++;
                                    clearInterval(gameIntervalId);
                                    gameIntervalId = setInterval(updateGame, gameSpeed);
                                    console.log("Apple: P1 speed slowed to", gameSpeed);
                                    if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
                                    p1SpeedChangeTimeoutId = setTimeout(() => {
                                        if (p1SpeedEffectActive) {
                                            gameSpeed = p1OriginalSpeedBeforeEffect;
                                            clearInterval(gameIntervalId);
                                            gameIntervalId = setInterval(updateGame, gameSpeed);
                                            p1SpeedEffectActive = false;
                                            console.log("Apple: P1 speed reverted to", gameSpeed);
                                        }
                                        p1SpeedChangeTimeoutId = null;
                                    }, 5000);
                                } else { console.log("Apple: P1 already has a speed effect active."); }
                            }
                            // PASTEQUE effect (speed_boost)
                            else if (eatenFoodItem.type.effect === 'speed_boost') {
                                console.log("Player 1 ate Pasteque (speed boost)!");
                                if (!p1SpeedEffectActive) {
                                    p1OriginalSpeedBeforeEffect = gameSpeed;
                                    p1SpeedEffectActive = true;
                                    gameSpeed = Math.floor(gameSpeed * 0.75); // Faster
                                    if (gameSpeed === p1OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed--;
                                    clearInterval(gameIntervalId);
                                    gameIntervalId = setInterval(updateGame, gameSpeed);
                                    console.log("Pasteque: P1 speed boosted to", gameSpeed);
                                    if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
                                    p1SpeedChangeTimeoutId = setTimeout(() => {
                                         if (p1SpeedEffectActive) {
                                            gameSpeed = p1OriginalSpeedBeforeEffect;
                                            clearInterval(gameIntervalId);
                                            gameIntervalId = setInterval(updateGame, gameSpeed);
                                            p1SpeedEffectActive = false;
                                            console.log("Pasteque: P1 speed reverted to", gameSpeed);
                                         }
                                        p1SpeedChangeTimeoutId = null;
                                    }, 5000);
                                } else { console.log("Pasteque: P1 already has a speed effect active."); }
                            }
                            // CITRON effect (double length, consecutive for width)
                            else if (eatenFoodItem.type.effect === 'citron_special') {
                                console.log("Player 1 ate Citron!");
                                const s1l = snake1Body.length;
                                for(let i=0; i<s1l; i++) { snake1Body.push({...snake1Body[snake1Body.length-1]}); }
                                console.log("Citron: P1 length doubled.");
                                incrementConsecutiveRedBlocksP1(); // Using this for Citron counter
                                if (getConsecutiveRedBlocksP1() >= 2) {
                                    incrementSnakeWidthP1(); 
                                    resetConsecutiveRedBlocksP1(); // Reset Citron counter
                                    console.log("Citron: P1 ate 2 consecutively, width increased to", getSnakeWidthP1());
                                }
                            }
                            // ORANGE effect (halve_length)
                            else if (eatenFoodItem.type.effect === 'halve_length') {
                                console.log("Player 1 ate Orange!");
                                if(snake1Body.length > 2) {
                                    const t1l = Math.max(1, Math.floor(snake1Body.length/2));
                                    while(snake1Body.length > t1l) { snake1Body.pop(); }
                                    console.log("Orange: P1 length halved.");
                                }
                            }
                            // OBSTACLE effect (game_over)
                            else if (eatenFoodItem.type.effect === 'game_over') {
                                p1_gameOver = true;
                                console.log("Player 1 Game Over - Obstacle (Wall)");
                            }
                            // Generic grow effect (if any food type uses 'grow')
                            else if (eatenFoodItem.type.effect === 'grow') {
                                // Default growth is implicit by not popping tail, score already added.
                                console.log("Player 1 ate food with 'grow' effect.");
                            }

                            // Reset Citron consecutive counter if non-Citron food eaten
                            if (eatenFoodItem.type.effect !== 'citron_special') {
                                if (typeof getConsecutiveRedBlocksP1 === 'function' && getConsecutiveRedBlocksP1() > 0) {
                                    resetConsecutiveRedBlocksP1(); // Reset Citron counter
                                    console.log("P1: Citron consecutive counter reset due to eating other food.");
                                }
                            }
                            
                            // Check win/loss conditions
                            if (!p1_gameOver) {
                                if (snake1Body.length >= p1_targetLength) {
                                    p1_roundsAchieved++;
                                    if (p1_roundsAchieved >= maxRoundsPerGame) {
                                        p1_gameOver = true;
                                        console.log("Player 1 Wins their track!");
                                    } else {
                                        startNewRoundForPlayer(1); // This will eventually call generateNewFood if foodEatenThisTick is true
                                    }
                                } else if (p1_foodEatenThisRound >= maxFoodPerRound) {
                                    p1_gameOver = true;
                                    console.log("Player 1 Game Over - Out of food for round");
                                }
                            }
                            // ***** END NEW P1 FOOD PROCESSING LOGIC *****
                        }
                    }
                    // If no food eaten (eatenFoodItem is null), processP1FoodThisTick remains false.
                }
            } // end if(head1)
            // Mousse turn-based effect management for P1
            if (head1 && !p1AwaitingMessageAck && typeof p1MousseTurnsActive !== 'undefined' && p1MousseTurnsActive > 0) {
                p1MousseTurnsActive--;
                console.log(`P1 Mousse effect: ${p1MousseTurnsActive} turns remaining.`);
                if (p1MousseTurnsActive === 0) {
                    console.log("P1 Mousse effect expired.");
                    setSnakeWidthP1(p1OriginalWidthBeforeMousse); 
                    if ((typeof p2MousseTurnsActive === 'undefined' || p2MousseTurnsActive === 0) && gameDifficultyBeforeMousse !== null) {
                        setGameDifficulty(gameDifficultyBeforeMousse);
                        console.log("Mousse: Game difficulty reverted to", gameDifficultyBeforeMousse, "Speed:", gameSpeed);
                        gameDifficultyBeforeMousse = null;
                    } else {
                        console.log("Mousse: P1 effect ended, but P2 Mousse may still be active or no baseline. Difficulty remains hard or unchanged by P1.");
                    }
                }
            }
        } // end else (not p1AwaitingMessageAck)
    } // End P1 Logic (if gameStarted && !isPaused && !p1_gameOver)
    if (processP1FoodThisTick) { foodEatenThisTick = true; }

    // --- Player 2 Logic ---
    if (isPlayer2Active && gameStarted && !isPaused && !p2_gameOver) { // Master isPaused already checked
        if (p2AwaitingMessageAck) {
            // P2 is paused awaiting ack.
        } else {
            const head2 = moveSnake2();
            if (head2) { // Ensure head is valid
                if (checkWallCollision(head2, getSnakeWidthP2()) || checkSelfCollision(head2, snake2Body)) {
                    p2_gameOver = true;
                    console.log("Player 2 Game Over - Wall/Self Collision");
                } else {
                    const eatenFoodItemP2 = checkFoodEaten(head2); 

                    if (eatenFoodItemP2) {
                        if (eatenFoodItemP2.type.id === p2LastEatenFoodType) { // 2P rule always active for P2
                            showFoodWarning(2, `Player 2: Cannot eat ${eatenFoodItemP2.type.name} again consecutively!`);
                        } else {
                            processP2FoodThisTick = true;
                            p2LastEatenFoodType = eatenFoodItemP2.type.id;
                            const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItemP2.x && f.y === eatenFoodItemP2.y);
                            if (foodIndex > -1) activeFoods.splice(foodIndex, 1);

                            // ***** START NEW P2 FOOD PROCESSING LOGIC *****
                            p2_foodEatenThisRound++;
                            // score += eatenFoodItemP2.type.score; // P2 doesn't add to main score

                            // MOUSSE effect
                            if (eatenFoodItemP2.type.effect === 'mousse_special') {
                                console.log("Player 2 ate Mousse!");
                                if (gameDifficultyBeforeMousse === null) {
                                    gameDifficultyBeforeMousse = currentDifficultyLevel;
                                }
                                setGameDifficulty('hard');
                                console.log("Mousse: P2 triggered HARD mode. Game speed now:", gameSpeed);
                                if (typeof p2MousseTurnsActive !== 'undefined' && p2MousseTurnsActive === 0) {
                                    p2OriginalWidthBeforeMousse = getSnakeWidthP2();
                                }
                                setSnakeWidthP2(getSnakeWidthP2() * 2);
                                p2MousseTurnsActive = 3;
                                console.log(`Mousse: P2 width effect active/refreshed (${getSnakeWidthP2()}) for 3 turns.`);
                            }
                            // APPLE effect
                            else if (eatenFoodItemP2.type.effect === 'apple_special') {
                                console.log("Player 2 ate Apple!");
                                applyTransformationP2({ type: 'color_change', newColor: '#8A2BE2', duration: 5000 }); // BlueViolet for P2
                                if (!p2SpeedEffectActive) {
                                    p2OriginalSpeedBeforeEffect = gameSpeed;
                                    p2SpeedEffectActive = true;
                                    gameSpeed = Math.floor(gameSpeed * 1.3); // Slower
                                    if (gameSpeed === p2OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed++;
                                    clearInterval(gameIntervalId);
                                    gameIntervalId = setInterval(updateGame, gameSpeed);
                                    console.log("Apple: P2 speed slowed to", gameSpeed);
                                    if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
                                    p2SpeedChangeTimeoutId = setTimeout(() => {
                                        if (p2SpeedEffectActive) {
                                            gameSpeed = p2OriginalSpeedBeforeEffect;
                                            clearInterval(gameIntervalId);
                                            gameIntervalId = setInterval(updateGame, gameSpeed);
                                            p2SpeedEffectActive = false;
                                            console.log("Apple: P2 speed reverted to", gameSpeed);
                                        }
                                        p2SpeedChangeTimeoutId = null;
                                    }, 5000);
                                } else { console.log("Apple: P2 already has a speed effect active."); }
                            }
                            // PASTEQUE effect (speed_boost)
                            else if (eatenFoodItemP2.type.effect === 'speed_boost') {
                                console.log("Player 2 ate Pasteque (speed boost)!");
                                if (!p2SpeedEffectActive) {
                                    p2OriginalSpeedBeforeEffect = gameSpeed;
                                    p2SpeedEffectActive = true;
                                    gameSpeed = Math.floor(gameSpeed * 0.75); // Faster
                                    if (gameSpeed === p2OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed--;
                                    clearInterval(gameIntervalId);
                                    gameIntervalId = setInterval(updateGame, gameSpeed);
                                    console.log("Pasteque: P2 speed boosted to", gameSpeed);
                                    if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
                                    p2SpeedChangeTimeoutId = setTimeout(() => {
                                         if (p2SpeedEffectActive) {
                                            gameSpeed = p2OriginalSpeedBeforeEffect;
                                            clearInterval(gameIntervalId);
                                            gameIntervalId = setInterval(updateGame, gameSpeed);
                                            p2SpeedEffectActive = false;
                                            console.log("Pasteque: P2 speed reverted to", gameSpeed);
                                         }
                                        p2SpeedChangeTimeoutId = null;
                                    }, 5000);
                                } else { console.log("Pasteque: P2 already has a speed effect active."); }
                            }
                            // CITRON effect (double length, consecutive for width)
                            else if (eatenFoodItemP2.type.effect === 'citron_special') {
                                console.log("Player 2 ate Citron!");
                                const s2l = snake2Body.length;
                                for(let i=0; i<s2l; i++) { snake2Body.push({...snake2Body[snake2Body.length-1]}); }
                                console.log("Citron: P2 length doubled.");
                                incrementConsecutiveRedBlocksP2(); // Using this for Citron counter
                                if (getConsecutiveRedBlocksP2() >= 2) {
                                    incrementSnakeWidthP2();
                                    resetConsecutiveRedBlocksP2(); // Reset Citron counter
                                    console.log("Citron: P2 ate 2 consecutively, width increased to", getSnakeWidthP2());
                                }
                            }
                            // ORANGE effect (halve_length)
                            else if (eatenFoodItemP2.type.effect === 'halve_length') {
                                console.log("Player 2 ate Orange!");
                                if(snake2Body.length > 2) {
                                    const t2l = Math.max(1, Math.floor(snake2Body.length/2));
                                    while(snake2Body.length > t2l) { snake2Body.pop(); }
                                    console.log("Orange: P2 length halved.");
                                }
                            }
                            // OBSTACLE effect (game_over)
                            else if (eatenFoodItemP2.type.effect === 'game_over') {
                                p2_gameOver = true;
                                console.log("Player 2 Game Over - Obstacle (Wall)");
                            }
                             // Generic grow effect (if any food type uses 'grow')
                            else if (eatenFoodItemP2.type.effect === 'grow') {
                                console.log("Player 2 ate food with 'grow' effect.");
                            }

                            // Reset Citron consecutive counter if non-Citron food eaten
                            if (eatenFoodItemP2.type.effect !== 'citron_special') {
                                if (typeof getConsecutiveRedBlocksP2 === 'function' && getConsecutiveRedBlocksP2() > 0) {
                                    resetConsecutiveRedBlocksP2(); // Reset Citron counter
                                    console.log("P2: Citron consecutive counter reset due to eating other food.");
                                }
                            }
                            
                            // Check win/loss conditions for P2
                            if (!p2_gameOver) {
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
                            // ***** END NEW P2 FOOD PROCESSING LOGIC *****
                        }
                    }
                }
            } // end if(head2)
            // Mousse turn-based effect management for P2
            if (head2 && !p2AwaitingMessageAck && typeof p2MousseTurnsActive !== 'undefined' && p2MousseTurnsActive > 0) {
                p2MousseTurnsActive--;
                console.log(`P2 Mousse effect: ${p2MousseTurnsActive} turns remaining.`);
                if (p2MousseTurnsActive === 0) {
                    console.log("P2 Mousse effect expired.");
                    setSnakeWidthP2(p2OriginalWidthBeforeMousse);
                    if ((typeof p1MousseTurnsActive === 'undefined' || p1MousseTurnsActive === 0) && gameDifficultyBeforeMousse !== null) {
                        setGameDifficulty(gameDifficultyBeforeMousse);
                        console.log("Mousse: Game difficulty reverted to", gameDifficultyBeforeMousse, "Speed:", gameSpeed);
                        gameDifficultyBeforeMousse = null;
                    } else {
                        console.log("Mousse: P2 effect ended, but P1 Mousse may still be active or no baseline. Difficulty remains hard or unchanged by P2.");
                    }
                }
            }
        } // end else (not p2AwaitingMessageAck)
    } // End P2 Logic
    if (processP2FoodThisTick) { foodEatenThisTick = true; }


    // Tail popping logic based on whether any food was validly eaten this tick
    if (foodEatenThisTick) {
        generateNewFood(); // Regenerate all food if any food was validly eaten
        
        // If a player ate (processPXFoodThisTick is true), their tail is NOT popped due to default snake growth.
        // If a player did NOT eat (processPXFoodThisTick is false) AND is not awaiting ack, their tail IS popped.
        if (!processP1FoodThisTick && gameStarted && !p1_gameOver && !p1AwaitingMessageAck && snake1Body && snake1Body.length > 1) {
            snake1Body.pop();
        }
        if (!processP2FoodThisTick && isPlayer2Active && gameStarted && !p2_gameOver && !p2AwaitingMessageAck && snake2Body && snake2Body.length > 1) {
            snake2Body.pop();
        }
    } else { // NO food was validly eaten by ANY player this tick
        // Pop tail only if snake is active, not game over, not awaiting message, and length > 1
        if (gameStarted && !p1_gameOver && !p1AwaitingMessageAck && snake1Body && snake1Body.length > 1) {
             snake1Body.pop();
        }
        if (isPlayer2Active && gameStarted && !p2_gameOver && !p2AwaitingMessageAck && snake2Body && snake2Body.length > 1) {
             snake2Body.pop();
        }
    }

    // Snake vs Snake collision logic
    if (isPlayer2Active && gameStarted && !isPaused && !p1_gameOver && !p2_gameOver && snake1Body.length > 0 && snake2Body.length > 0) {
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

    // Clear any active player-specific speed effects timeouts
    if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
    if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
    p1SpeedChangeTimeoutId = null;
    p2SpeedChangeTimeoutId = null;
    // No need to reset gameSpeed here as game is ending.

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
    currentDifficultyLevel = level; // Store the chosen difficulty
    let newSpeed;
    switch (level) {
        case 'easy': newSpeed = 200; break;
        case 'medium': newSpeed = 150; break;
        case 'hard': newSpeed = 100; break;
        default: newSpeed = gameSpeed;
    }

    // Speed effect logic is now player-specific and managed within food effects.
    // Global gameSpeed is directly set by setGameDifficulty or by player-specific effects.
    // No need to check originalGameSpeed or speedBoostTimeoutId here.
    gameSpeed = newSpeed;


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
