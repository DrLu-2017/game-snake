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

// --- Player 2 Game State ---
let p2_targetLength = 0;
let p2_roundsAchieved = 0;
let p2_foodEatenThisRound = 0;
let p2_gameOver = false; // Player-specific game over

// Variables for speed boost effect (player-specific)
let p1SpeedEffectActive = false;
let p2SpeedEffectActive = false;
let p1OriginalSpeedBeforeEffect = 0;
let p2OriginalSpeedBeforeEffect = 0;
let p1SpeedChangeTimeoutId = null;
let p2SpeedChangeTimeoutId = null;

let gameDifficultyBeforeMousse = null; // Stores 'easy', 'medium', or 'hard' string for Mousse effect
let score = 0;

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
    const p1TargetLengthEl = document.getElementById('p1TargetLengthDisplay');
    if (p1TargetLengthEl) p1TargetLengthEl.textContent = 'Target Length: ' + p1_targetLength;
    else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1TargetLengthDisplay' NOT FOUND!");
    const p1RoundsEl = document.getElementById('p1RoundsDisplay');
    if (p1RoundsEl) p1RoundsEl.textContent = 'Rounds Cleared: ' + p1_roundsAchieved + ' / ' + maxRoundsPerGame;
    else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1RoundsDisplay' NOT FOUND!");
    const p1FoodThisRoundEl = document.getElementById('p1FoodThisRoundDisplay');
    if (p1FoodThisRoundEl) p1FoodThisRoundEl.textContent = 'Food This Round: ' + p1_foodEatenThisRound + ' / ' + maxFoodPerRound;
    else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1FoodThisRoundDisplay' NOT FOUND!");
    const p1CurrentLengthEl = document.getElementById('p1CurrentLengthDisplay');
    if (p1CurrentLengthEl) p1CurrentLengthEl.textContent = 'Current Length: ' + (typeof snake1Body !== 'undefined' && snake1Body ? snake1Body.length : 0);
    else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1CurrentLengthDisplay' NOT FOUND!");
    const p1GameOverEl = document.getElementById('p1GameOverDisplay');
    if (p1GameOverEl) p1GameOverEl.style.display = p1_gameOver ? 'block' : 'none';
    else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p1GameOverDisplay' NOT FOUND!");

    const p2StatusContainer = document.getElementById('p2StatusContainer');
    if (p2StatusContainer) {
        if (typeof isPlayer2Active !== 'undefined' && !isPlayer2Active) {
            p2StatusContainer.style.display = 'none';
        } else {
            p2StatusContainer.style.display = 'block';
            const p2TargetLengthEl = document.getElementById('p2TargetLengthDisplay');
            if (p2TargetLengthEl) p2TargetLengthEl.textContent = 'Target Length: ' + p2_targetLength;
            else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2TargetLengthDisplay' NOT FOUND!");
            const p2RoundsEl = document.getElementById('p2RoundsDisplay');
            if (p2RoundsEl) p2RoundsEl.textContent = 'Rounds Cleared: ' + p2_roundsAchieved + ' / ' + maxRoundsPerGame;
            else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2RoundsDisplay' NOT FOUND!");
            const p2FoodThisRoundEl = document.getElementById('p2FoodThisRoundDisplay');
            if (p2FoodThisRoundEl) p2FoodThisRoundEl.textContent = 'Food This Round: ' + p2_foodEatenThisRound + ' / ' + maxFoodPerRound;
            else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2FoodThisRoundDisplay' NOT FOUND!");
            const p2CurrentLengthEl = document.getElementById('p2CurrentLengthDisplay');
            if (p2CurrentLengthEl) p2CurrentLengthEl.textContent = 'Current Length: ' + (typeof snake2Body !== 'undefined' && snake2Body ? snake2Body.length : 0);
            else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2CurrentLengthDisplay' NOT FOUND!");
            const p2GameOverEl = document.getElementById('p2GameOverDisplay');
            if (p2GameOverEl) p2GameOverEl.style.display = p2_gameOver ? 'block' : 'none';
            else console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2GameOverDisplay' NOT FOUND!");
        }
    } else {
        console.error("[DEBUG_STARTUP] updateGameStatusDisplay: Element 'p2StatusContainer' NOT FOUND!");
    }
    console.log("[DEBUG_STARTUP] updateGameStatusDisplay: End");
}

function initGame() {
    console.log("[DEBUG_STARTUP] initGame: Start");
    gameStarted = true;
    isPaused = false;
    gameOver = false; 

    p1_gameOver = false;
    p1_roundsAchieved = 0;
    resetSnake1(); // From snake.js
    startNewRoundForPlayer(1);

    if (typeof selectedGameMode !== 'undefined' && selectedGameMode === '2P') {
        isPlayer2Active = true;
        p2_gameOver = false; 
        p2_roundsAchieved = 0;
        resetSnake2(); // From snake.js
        startNewRoundForPlayer(2);
        console.log("[GAME SETUP] Two-player mode selected and initialized.");
    } else { 
        isPlayer2Active = false;
        p2_gameOver = true; 
        if (typeof snake2Body !== 'undefined') snake2Body = []; 
        p2_roundsAchieved = 0; 
        p2_foodEatenThisRound = 0;
        p2_targetLength = 0;
        console.log("[GAME SETUP] One-player mode selected and initialized. P2 disabled.");
    }
    score = 0;

    if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
    if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
    p1SpeedEffectActive = false;
    p2SpeedEffectActive = false;
    p1SpeedChangeTimeoutId = null;
    p2SpeedChangeTimeoutId = null;
    gameDifficultyBeforeMousse = null; 
    
    setGameDifficulty(currentDifficultyLevel); 

    p1LastEatenFoodType = null;
    p2LastEatenFoodType = null;
    p1AwaitingMessageAck = false;
    p2AwaitingMessageAck = false;
    const warningContainer = document.getElementById('consecutiveFoodWarning');
    if (warningContainer) {
        warningContainer.style.display = 'none';
    }

    if (gameIntervalId) clearInterval(gameIntervalId);
    gameIntervalId = setInterval(updateGame, gameSpeed);
    
    drawGame();
    if (typeof updateControlBtnText === 'function') updateControlBtnText(); // From index.html
    console.log("[DEBUG_STARTUP] initGame: End");
}

function startNewRoundForPlayer(playerNum) {
    let currentSnakeLength;
    if (playerNum === 1) {
        p1_foodEatenThisRound = 0;
        currentSnakeLength = (snake1Body && snake1Body.length > 0) ? snake1Body.length : 1;
        p1_targetLength = currentSnakeLength + Math.floor(Math.random() * 5) + 3;
        p1LastEatenFoodType = null; 
        p1AwaitingMessageAck = false; 
        if (p1SpeedChangeTimeoutId) { clearTimeout(p1SpeedChangeTimeoutId); p1SpeedChangeTimeoutId = null; }
        p1SpeedEffectActive = false;
        console.log(`[GAME LOGIC] P1 New Round. Target: ${p1_targetLength}, Current Len: ${currentSnakeLength}`);
    } else if (playerNum === 2) {
        p2_foodEatenThisRound = 0;
        currentSnakeLength = (snake2Body && snake2Body.length > 0) ? snake2Body.length : 1;
        p2_targetLength = currentSnakeLength + Math.floor(Math.random() * 5) + 3;
        p2LastEatenFoodType = null; 
        p2AwaitingMessageAck = false; 
        if (p2SpeedChangeTimeoutId) { clearTimeout(p2SpeedChangeTimeoutId); p2SpeedChangeTimeoutId = null; }
        p2SpeedEffectActive = false;
        console.log(`[GAME LOGIC] P2 New Round. Target: ${p2_targetLength}, Current Len: ${currentSnakeLength}`);
    }

    if (!p1AwaitingMessageAck && !p2AwaitingMessageAck) {
        const warningContainer = document.getElementById('consecutiveFoodWarning');
        if (warningContainer) warningContainer.style.display = 'none';
    }
    generateNewFood(); // From food.js
    updateGameStatusDisplay(); 
}

function drawGame() {
    console.log("[DRAW_DEBUG] drawGame: Entered.");
    if (!ctx || !canvas) { // ctx and canvas are global from index.html
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
        } catch (e) { console.error("[DRAW_DEBUG] drawGame: Error drawing start message:", e); }
        updateGameStatusDisplay();
        return;
    }

    console.log("[DRAW_DEBUG] drawGame: Game started. Clearing canvas.");
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log("[DRAW_DEBUG] drawGame: Canvas cleared.");
    } catch (e) { console.error("[DRAW_DEBUG] drawGame: Error clearing canvas:", e); }

    console.log("[DRAW_DEBUG] drawGame: Calling drawFood().");
    try {
        drawFood(); // From food.js
        console.log("[DRAW_DEBUG] drawGame: drawFood() returned.");
    } catch (e) { console.error("[DRAW_DEBUG] drawGame: Error during drawFood():", e); }

    console.log("[DRAW_DEBUG] drawGame: Calling drawSnakes().");
    try {
        drawSnakes(); // From snake.js
        console.log("[DRAW_DEBUG] drawGame: drawSnakes() returned.");
    } catch (e) { console.error("[DRAW_DEBUG] drawGame: Error during drawSnakes():", e); }
    
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
        } catch (e) { console.error("[DRAW_DEBUG] drawGame: Error drawing pause message:", e); }
    }
    console.log("[DRAW_DEBUG] drawGame: Exiting.");
}

function updateGame() {
    if (gameOver) return;
    if (isPaused) { drawGame(); return; }

    let foodEatenThisTick = false;
    let p1FoodEatenOnThisTurn = false; // Declared at function scope
    let p2FoodEatenOnThisTurn = false; // Declared at function scope
    // processP1FoodThisTick and processP2FoodThisTick are replaced by p1FoodEatenOnThisTurn and p2FoodEatenOnThisTurn
    let head1 = null; 
    let head2 = null;

    // --- Player 1 Logic ---
    if (gameStarted && !isPaused && !p1_gameOver) {
        if (p1AwaitingMessageAck) { /* P1 is paused */ } 
        else {
            head1 = moveSnake1(); 

            p1FoodEatenOnThisTurn = false; // Reset for P1's turn processing
            const currentP1Width = getSnakeWidthP1();
            const currentDx1 = dx1; // Assuming dx1, dy1 are global for P1 direction
            const currentDy1 = dy1;

            if (head1) {
                if (checkWallCollision(head1, currentP1Width) || checkSelfCollision(head1, snake1Body)) { // Use currentP1Width for wall collision
                    p1_gameOver = true; console.log("Player 1 Game Over - Wall/Self Collision");
                } else {
                    const widthOffset = Math.floor((currentP1Width - 1) / 2);
                    console.log(`[P1 FOOD DEBUG] Head at (${head1.x}, ${head1.y}), Width: ${currentP1Width}, Offset: ${widthOffset}, Direction: dx1=${currentDx1}, dy1=${currentDy1}`);

                    for (let offset = -widthOffset; offset <= widthOffset; offset++) {
                        let checkX = head1.x;
                        let checkY = head1.y;

                        if (currentDy1 === 0) { // Moving horizontally (left/right)
                            checkY = head1.y + offset;
                        } else { // Moving vertically (up/down)
                            checkX = head1.x + offset;
                        }
                        console.log(`[P1 FOOD DEBUG] Checking cell (${checkX}, ${checkY}) for food.`);
                        const eatenFoodItem = checkFoodEaten({ x: checkX, y: checkY });

                        if (eatenFoodItem) {
                            console.log(`P1 attempting to eat ${eatenFoodItem.type.name} at (${checkX}, ${checkY}) with width ${currentP1Width}`);
                            if (isPlayer2Active && eatenFoodItem.type.id === p1LastEatenFoodType) {
                                showFoodWarning(1, `Player 1: Cannot eat ${eatenFoodItem.type.name} again consecutively!`);
                            } else {
                                p1FoodEatenOnThisTurn = true; // Set flag here for this turn
                                p1LastEatenFoodType = eatenFoodItem.type.id;
                                const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItem.x && f.y === eatenFoodItem.y);
                                if (foodIndex > -1) {
                                    activeFoods.splice(foodIndex, 1);
                                    console.log(`[P1 FOOD DEBUG] Successfully removed ${eatenFoodItem.type.name} from activeFoods.`);
                                } else {
                                    console.log(`[P1 FOOD DEBUG] Error: Eaten food ${eatenFoodItem.type.name} at (${eatenFoodItem.x}, ${eatenFoodItem.y}) not found in activeFoods. Skipping this item.`);
                                    continue; // Skip processing for this non-existent food item
                                }

                                p1_foodEatenThisRound++; score += eatenFoodItem.type.score;

                                if (eatenFoodItem.type.effect === 'mousse_special') {
                                    console.log("Player 1 ate Mousse!");
                                    if (gameDifficultyBeforeMousse === null) gameDifficultyBeforeMousse = currentDifficultyLevel;
                                    setGameDifficulty('hard');
                                    console.log("Mousse: P1 triggered HARD mode. Game speed now:", gameSpeed);
                                    if (p1MousseTurnsActive === 0) p1OriginalWidthBeforeMousse = getSnakeWidthP1();
                                    setSnakeWidthP1(getSnakeWidthP1() * 2);
                                    p1MousseTurnsActive = 3;
                                    console.log(`Mousse: P1 width effect active/refreshed (${getSnakeWidthP1()}) for 3 turns.`);
                                } else if (eatenFoodItem.type.effect === 'width_increase_effect') {
                                    console.log("Player 1 ate food with width_increase_effect (e.g., PASTEQUE)!");
                                    if (p1WidthIncreaseTurnsActive === 0) {
                                        p1OriginalWidthBeforeIncrease = getSnakeWidthP1();
                                    }
                                    setSnakeWidthP1(2);
                                    p1WidthIncreaseTurnsActive = 3;
                                    console.log(`P1 width increase active. Width: ${getSnakeWidthP1()}, Turns: ${p1WidthIncreaseTurnsActive}`);
                                } else if (eatenFoodItem.type.effect === 'apple_special') {
                                    console.log("Player 1 ate Apple!");
                                    applyTransformationP1({ type: 'color_change', newColor: '#8A2BE2', duration: 5000 });
                                    if (!p1SpeedEffectActive) {
                                        p1OriginalSpeedBeforeEffect = gameSpeed; p1SpeedEffectActive = true;
                                        gameSpeed = Math.floor(gameSpeed * 1.3); if (gameSpeed === p1OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed++;
                                        clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                        console.log("Apple: P1 speed slowed to", gameSpeed);
                                        if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
                                        p1SpeedChangeTimeoutId = setTimeout(() => {
                                            if (p1SpeedEffectActive) {
                                                gameSpeed = p1OriginalSpeedBeforeEffect; clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                                p1SpeedEffectActive = false; console.log("Apple: P1 speed reverted to", gameSpeed);
                                            }
                                            p1SpeedChangeTimeoutId = null;
                                        }, 5000);
                                    } else { console.log("Apple: P1 already has a speed effect active."); }
                                } else if (eatenFoodItem.type.effect === 'speed_boost') {
                                    console.log("Player 1 ate Pasteque (speed boost)!");
                                    if (!p1SpeedEffectActive) {
                                        p1OriginalSpeedBeforeEffect = gameSpeed; p1SpeedEffectActive = true;
                                        gameSpeed = Math.floor(gameSpeed * 0.75); if (gameSpeed === p1OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed--;
                                        clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                        console.log("Pasteque: P1 speed boosted to", gameSpeed);
                                        if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
                                        p1SpeedChangeTimeoutId = setTimeout(() => {
                                            if (p1SpeedEffectActive) {
                                                gameSpeed = p1OriginalSpeedBeforeEffect; clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                                p1SpeedEffectActive = false; console.log("Pasteque: P1 speed reverted to", gameSpeed);
                                            }
                                            p1SpeedChangeTimeoutId = null;
                                        }, 5000);
                                    } else { console.log("Pasteque: P1 already has a speed effect active."); }
                                } else if (eatenFoodItem.type.effect === 'citron_special') {
                                    console.log("Player 1 ate Citron!");
                                    const s1l = snake1Body.length; for(let i=0; i<s1l; i++) snake1Body.push({...snake1Body[snake1Body.length-1]});
                                    console.log("Citron: P1 length doubled.");
                                    incrementConsecutiveRedBlocksP1();
                                    if (getConsecutiveRedBlocksP1() >= 2) {
                                        incrementSnakeWidthP1(); resetConsecutiveRedBlocksP1();
                                        console.log("Citron: P1 ate 2 consecutively, width increased to", getSnakeWidthP1());
                                    }
                                } else if (eatenFoodItem.type.effect === 'halve_length') {
                                    console.log("Player 1 ate Orange!");
                                    if(snake1Body.length > 2) { const t1l = Math.max(1, Math.floor(snake1Body.length/2)); while(snake1Body.length > t1l) snake1Body.pop(); console.log("Orange: P1 length halved."); }
                                } else if (eatenFoodItem.type.effect === 'game_over') {
                                    p1_gameOver = true; console.log("Player 1 Game Over - Obstacle (Wall)");
                                } else if (eatenFoodItem.type.effect === 'grow') { console.log("Player 1 ate food with 'grow' effect."); }

                                if (eatenFoodItem.type.effect !== 'citron_special') {
                                    if (typeof getConsecutiveRedBlocksP1 === 'function' && getConsecutiveRedBlocksP1() > 0) {
                                        resetConsecutiveRedBlocksP1(); console.log("P1: Citron consecutive counter reset due to eating other food.");
                                    }
                                }
                                if (!p1_gameOver) {
                                    if (snake1Body.length >= p1_targetLength) {
                                        p1_roundsAchieved++;
                                        if (p1_roundsAchieved >= maxRoundsPerGame) { p1_gameOver = true; console.log("Player 1 Wins their track!"); }
                                        else { startNewRoundForPlayer(1); }
                                    } else if (p1_foodEatenThisRound >= maxFoodPerRound) { p1_gameOver = true; console.log("Player 1 Game Over - Out of food for round"); }
                                }
                            } // End of food can be eaten (else of consecutive check)
                        } // End of if (eatenFoodItem)
                    } // End of for loop for width offset
                } // End of else (no wall/self collision)
            } // End of if (head1)

            // Effect countdowns for P1
            if (head1 && !p1AwaitingMessageAck && typeof p1MousseTurnsActive !== 'undefined' && p1MousseTurnsActive > 0) {
                p1MousseTurnsActive--; console.log(`P1 Mousse effect: ${p1MousseTurnsActive} turns remaining.`);
                if (p1MousseTurnsActive === 0) {
                    console.log("P1 Mousse effect expired."); setSnakeWidthP1(p1OriginalWidthBeforeMousse); // from snake.js
                    if ((typeof p2MousseTurnsActive === 'undefined' || p2MousseTurnsActive === 0) && gameDifficultyBeforeMousse !== null) {
                        setGameDifficulty(gameDifficultyBeforeMousse); console.log("Mousse: Game difficulty reverted to", gameDifficultyBeforeMousse, "Speed:", gameSpeed);
                        gameDifficultyBeforeMousse = null;
                    } else { console.log("Mousse: P1 effect ended, but P2 Mousse may still be active. Difficulty not changed by P1."); }
                }
            }
            // Handle P1 Width Increase Effect Countdown
            if (head1 && !p1AwaitingMessageAck && typeof p1WidthIncreaseTurnsActive !== 'undefined' && p1WidthIncreaseTurnsActive > 0) {
                p1WidthIncreaseTurnsActive--;
                console.log(`P1 width effect: ${p1WidthIncreaseTurnsActive} turns remaining.`);
                if (p1WidthIncreaseTurnsActive === 0) {
                    console.log(`P1 width effect expired. Reverting to width: ${p1OriginalWidthBeforeIncrease}`);
                    setSnakeWidthP1(p1OriginalWidthBeforeIncrease);
                }
            }
        } // Closes `else` for `if (p1AwaitingMessageAck)`
    } // Closes `if (gameStarted && !isPaused && !p1_gameOver)`

    if (p1FoodEatenOnThisTurn) foodEatenThisTick = true; // Use the new flag for P1

    // --- Player 2 Logic ---
    if (isPlayer2Active && gameStarted && !isPaused && !p2_gameOver) {
        if (p2AwaitingMessageAck) { /* P2 is paused */ } 
        else {
            head2 = moveSnake2();

            p2FoodEatenOnThisTurn = false; // Reset for P2's turn processing
            const currentP2Width = getSnakeWidthP2();
            const currentDx2 = dx2; // Assuming dx2, dy2 are global for P2 direction
            const currentDy2 = dy2;

            if (head2) {
                if (checkWallCollision(head2, currentP2Width) || checkSelfCollision(head2, snake2Body)) { // Use currentP2Width
                    p2_gameOver = true; console.log("Player 2 Game Over - Wall/Self Collision");
                } else {
                    const widthOffsetP2 = Math.floor((currentP2Width - 1) / 2);
                    console.log(`[P2 FOOD DEBUG] Head at (${head2.x}, ${head2.y}), Width: ${currentP2Width}, Offset: ${widthOffsetP2}, Direction: dx2=${currentDx2}, dy2=${currentDy2}`);

                    for (let offset = -widthOffsetP2; offset <= widthOffsetP2; offset++) {
                        let checkX = head2.x;
                        let checkY = head2.y;

                        if (currentDy2 === 0) { // Moving horizontally
                            checkY = head2.y + offset;
                        } else { // Moving vertically
                            checkX = head2.x + offset;
                        }
                        console.log(`[P2 FOOD DEBUG] Checking cell (${checkX}, ${checkY}) for food.`);
                        const eatenFoodItemP2 = checkFoodEaten({ x: checkX, y: checkY });

                        if (eatenFoodItemP2) {
                            console.log(`P2 attempting to eat ${eatenFoodItemP2.type.name} at (${checkX}, ${checkY}) with width ${currentP2Width}`);
                            if (eatenFoodItemP2.type.id === p2LastEatenFoodType) {
                                showFoodWarning(2, `Player 2: Cannot eat ${eatenFoodItemP2.type.name} again consecutively!`);
                            } else {
                                p2FoodEatenOnThisTurn = true; // Set flag for P2
                                p2LastEatenFoodType = eatenFoodItemP2.type.id;
                                const foodIndex = activeFoods.findIndex(f => f.x === eatenFoodItemP2.x && f.y === eatenFoodItemP2.y);
                                if (foodIndex > -1) {
                                    activeFoods.splice(foodIndex, 1);
                                    console.log(`[P2 FOOD DEBUG] Successfully removed ${eatenFoodItemP2.type.name} from activeFoods.`);
                                } else {
                                    console.log(`[P2 FOOD DEBUG] Error: Eaten food ${eatenFoodItemP2.type.name} at (${eatenFoodItemP2.x}, ${eatenFoodItemP2.y}) not found in activeFoods. Skipping this item.`);
                                    continue;
                                }

                                p2_foodEatenThisRound++;
                                score += eatenFoodItemP2.type.score; // P2 also adds to global score

                                if (eatenFoodItemP2.type.effect === 'mousse_special') {
                                    console.log("Player 2 ate Mousse!");
                                    if (gameDifficultyBeforeMousse === null) gameDifficultyBeforeMousse = currentDifficultyLevel;
                                    setGameDifficulty('hard');
                                    console.log("Mousse: P2 triggered HARD mode. Game speed now:", gameSpeed);
                                    if (p2MousseTurnsActive === 0) p2OriginalWidthBeforeMousse = getSnakeWidthP2();
                                    setSnakeWidthP2(getSnakeWidthP2() * 2);
                                    p2MousseTurnsActive = 3;
                                    console.log(`Mousse: P2 width effect active/refreshed (${getSnakeWidthP2()}) for 3 turns.`);
                                } else if (eatenFoodItemP2.type.effect === 'width_increase_effect') {
                                    console.log("Player 2 ate food with width_increase_effect (e.g., PASTEQUE)!");
                                    if (p2WidthIncreaseTurnsActive === 0) {
                                        p2OriginalWidthBeforeIncrease = getSnakeWidthP2();
                                    }
                                    setSnakeWidthP2(2);
                                    p2WidthIncreaseTurnsActive = 3;
                                    console.log(`P2 width increase active. Width: ${getSnakeWidthP2()}, Turns: ${p2WidthIncreaseTurnsActive}`);
                                } else if (eatenFoodItemP2.type.effect === 'apple_special') {
                                    console.log("Player 2 ate Apple!");
                                    applyTransformationP2({ type: 'color_change', newColor: '#8A2BE2', duration: 5000 });
                                    if (!p2SpeedEffectActive) {
                                        p2OriginalSpeedBeforeEffect = gameSpeed; p2SpeedEffectActive = true;
                                        gameSpeed = Math.floor(gameSpeed * 1.3); if (gameSpeed === p2OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed++;
                                        clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                        console.log("Apple: P2 speed slowed to", gameSpeed);
                                        if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
                                        p2SpeedChangeTimeoutId = setTimeout(() => {
                                            if (p2SpeedEffectActive) {
                                                gameSpeed = p2OriginalSpeedBeforeEffect; clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                                p2SpeedEffectActive = false; console.log("Apple: P2 speed reverted to", gameSpeed);
                                            }
                                            p2SpeedChangeTimeoutId = null;
                                        }, 5000);
                                    } else { console.log("Apple: P2 already has a speed effect active."); }
                                } else if (eatenFoodItemP2.type.effect === 'speed_boost') {
                                    console.log("Player 2 ate Pasteque (speed boost)!");
                                    if (!p2SpeedEffectActive) {
                                        p2OriginalSpeedBeforeEffect = gameSpeed; p2SpeedEffectActive = true;
                                        gameSpeed = Math.floor(gameSpeed * 0.75); if (gameSpeed === p2OriginalSpeedBeforeEffect && gameSpeed > 1) gameSpeed--;
                                        clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                        console.log("Pasteque: P2 speed boosted to", gameSpeed);
                                        if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
                                        p2SpeedChangeTimeoutId = setTimeout(() => {
                                            if (p2SpeedEffectActive) {
                                                gameSpeed = p2OriginalSpeedBeforeEffect; clearInterval(gameIntervalId); gameIntervalId = setInterval(updateGame, gameSpeed);
                                                p2SpeedEffectActive = false; console.log("Pasteque: P2 speed reverted to", gameSpeed);
                                            }
                                            p2SpeedChangeTimeoutId = null;
                                        }, 5000);
                                    } else { console.log("Pasteque: P2 already has a speed effect active."); }
                                } else if (eatenFoodItemP2.type.effect === 'citron_special') {
                                    console.log("Player 2 ate Citron!");
                                    const s2l = snake2Body.length; for(let i=0; i<s2l; i++) snake2Body.push({...snake2Body[snake2Body.length-1]});
                                    console.log("Citron: P2 length doubled.");
                                    incrementConsecutiveRedBlocksP2();
                                    if (getConsecutiveRedBlocksP2() >= 2) {
                                        incrementSnakeWidthP2(); resetConsecutiveRedBlocksP2();
                                        console.log("Citron: P2 ate 2 consecutively, width increased to", getSnakeWidthP2());
                                    }
                                } else if (eatenFoodItemP2.type.effect === 'halve_length') {
                                    console.log("Player 2 ate Orange!");
                                    if(snake2Body.length > 2) { const t2l = Math.max(1, Math.floor(snake2Body.length/2)); while(snake2Body.length > t2l) snake2Body.pop(); console.log("Orange: P2 length halved.");}
                                } else if (eatenFoodItemP2.type.effect === 'game_over') {
                                    p2_gameOver = true; console.log("Player 2 Game Over - Obstacle (Wall)");
                                } else if (eatenFoodItemP2.type.effect === 'grow') { console.log("Player 2 ate food with 'grow' effect.");}

                                if (eatenFoodItemP2.type.effect !== 'citron_special') {
                                     if (typeof getConsecutiveRedBlocksP2 === 'function' && getConsecutiveRedBlocksP2() > 0) {
                                        resetConsecutiveRedBlocksP2(); console.log("P2: Citron consecutive counter reset due to eating other food.");
                                     }
                                }
                                if (!p2_gameOver) {
                                    if (snake2Body.length >= p2_targetLength) {
                                        p2_roundsAchieved++;
                                        if (p2_roundsAchieved >= maxRoundsPerGame) { p2_gameOver = true; console.log("Player 2 Wins their track!"); }
                                        else { startNewRoundForPlayer(2); }
                                    } else if (p2_foodEatenThisRound >= maxFoodPerRound) { p2_gameOver = true; console.log("Player 2 Game Over - Out of food"); }
                                }
                            } // End of P2 food can be eaten
                        } // End of if (eatenFoodItemP2)
                    } // End of P2 for loop for width offset
                } // End of P2 else (no wall/self collision)
            } // End of if (head2)

            // Effect countdowns for P2
            if (head2 && !p2AwaitingMessageAck && typeof p2MousseTurnsActive !== 'undefined' && p2MousseTurnsActive > 0) {
                p2MousseTurnsActive--; console.log(`P2 Mousse effect: ${p2MousseTurnsActive} turns remaining.`);
                if (p2MousseTurnsActive === 0) {
                    console.log("P2 Mousse effect expired."); setSnakeWidthP2(p2OriginalWidthBeforeMousse); // from snake.js
                    if ((typeof p1MousseTurnsActive === 'undefined' || p1MousseTurnsActive === 0) && gameDifficultyBeforeMousse !== null) {
                        setGameDifficulty(gameDifficultyBeforeMousse); console.log("Mousse: Game difficulty reverted to", gameDifficultyBeforeMousse, "Speed:", gameSpeed);
                        gameDifficultyBeforeMousse = null;
                    } else { console.log("Mousse: P2 effect ended, but P1 Mousse may still be active. Difficulty not changed by P2.");}
                }
            }
            // Handle P2 Width Increase Effect Countdown
            if (head2 && !p2AwaitingMessageAck && typeof p2WidthIncreaseTurnsActive !== 'undefined' && p2WidthIncreaseTurnsActive > 0) {
                p2WidthIncreaseTurnsActive--;
                console.log(`P2 width effect: ${p2WidthIncreaseTurnsActive} turns remaining.`);
                if (p2WidthIncreaseTurnsActive === 0) {
                    console.log(`P2 width effect expired. Reverting to width: ${p2OriginalWidthBeforeIncrease}`);
                    setSnakeWidthP2(p2OriginalWidthBeforeIncrease);
                }
            }
        } // Closes `else` for `if (p2AwaitingMessageAck)`
    } // Closes `if (isPlayer2Active && gameStarted && !isPaused && !p2_gameOver)`

    if (p2FoodEatenOnThisTurn) foodEatenThisTick = true; // Use the new flag for P2

    // Tail Popping Logic
    if (foodEatenThisTick) {
        generateNewFood();
        if (!p1FoodEatenOnThisTurn && gameStarted && !p1_gameOver && !p1AwaitingMessageAck && snake1Body && snake1Body.length > 1) snake1Body.pop();
        if (!p2FoodEatenOnThisTurn && isPlayer2Active && gameStarted && !p2_gameOver && !p2AwaitingMessageAck && snake2Body && snake2Body.length > 1) snake2Body.pop();
    } else {
        if (gameStarted && !p1_gameOver && !p1AwaitingMessageAck && snake1Body && snake1Body.length > 1) snake1Body.pop();
        if (isPlayer2Active && gameStarted && !p2_gameOver && !p2AwaitingMessageAck && snake2Body && snake2Body.length > 1) snake2Body.pop();
    }

    // Snake vs Snake collision logic
    if (isPlayer2Active && gameStarted && !isPaused && !p1_gameOver && !p2_gameOver && snake1Body.length > 0 && snake2Body.length > 0) {
        let p1HitP2 = false;
        let p2HitP1 = false;
        for (let i = 0; i < snake2Body.length; i++) {
            if (snake1Body[0].x === snake2Body[i].x && snake1Body[0].y === snake2Body[i].y) {
                p1HitP2 = true; break;
            }
        }
        for (let i = 0; i < snake1Body.length; i++) {
            if (snake2Body[0].x === snake1Body[i].x && snake2Body[0].y === snake1Body[i].y) {
                p2HitP1 = true; break;
            }
        }
        if (snake1Body[0].x === snake2Body[0].x && snake1Body[0].y === snake2Body[0].y) { // Head-to-head
            p1_gameOver = true; p2_gameOver = true; console.log("Head-to-Head Collision! Both players Game Over.");
        } else if (p1HitP2) {
            p1_gameOver = true; console.log("Player 1 hit Player 2's body! Player 1 Game Over.");
        } else if (p2HitP1) {
            p2_gameOver = true; console.log("Player 2 hit Player 1's body! Player 2 Game Over.");
        }
        if(p1HitP2 || p2HitP1) updateGameStatusDisplay();
    }
    
    // Overall game over checks
    if ((p1_gameOver && (!isPlayer2Active || p2_gameOver)) || // If P1 is over AND (P2 isn't active OR P2 is also over)
        (isPlayer2Active && p2_gameOver && p1_gameOver) || // Explicitly if P2 is active and both are over
        (p1_roundsAchieved >= maxRoundsPerGame && (!isPlayer2Active || p2_gameOver)) || 
        (isPlayer2Active && p2_roundsAchieved >= maxRoundsPerGame && p1_gameOver) ||
        (p1_roundsAchieved >= maxRoundsPerGame && isPlayer2Active && p2_roundsAchieved >= maxRoundsPerGame) // Both win
       ) {
        if (!gameOver) { 
            gameOver = true; 
            let p1Won = p1_roundsAchieved >= maxRoundsPerGame && !p1_gameOver;
            let p2Won = isPlayer2Active && p2_roundsAchieved >= maxRoundsPerGame && !p2_gameOver;
            // Simplified win condition for triggerEndGame:
            // Pass true if P1 won and P2 lost/inactive, or P2 won and P1 lost, or both won.
            // Pass false if both lost, or one lost and other didn't complete rounds.
            let gameActuallyWon = (p1Won && (!isPlayer2Active || p2_gameOver || !p2Won)) || (p2Won && (p1_gameOver || !p1Won)) || (p1Won && p2Won);
            if (p1_gameOver && p2_gameOver) gameActuallyWon = false; // Both lost overrides
            else if (p1_roundsAchieved >= maxRoundsPerGame && p2_roundsAchieved >= maxRoundsPerGame) gameActuallyWon = true; // Both completed
            else if (p1_roundsAchieved >= maxRoundsPerGame && (!isPlayer2Active || p2_gameOver)) gameActuallyWon = true; // P1 won
            else if (isPlayer2Active && p2_roundsAchieved >= maxRoundsPerGame && p1_gameOver) gameActuallyWon = true; // P2 won
            else if (p1_gameOver || (isPlayer2Active && p2_gameOver)) gameActuallyWon = false; // One or both lost without completing

            triggerEndGame(gameActuallyWon); 
        }
    }

    updateGameStatusDisplay();
    drawGame(); 
}

function triggerEndGame(isWin) {
    gameOver = true;
    if (p1SpeedChangeTimeoutId) clearTimeout(p1SpeedChangeTimeoutId);
    if (p2SpeedChangeTimeoutId) clearTimeout(p2SpeedChangeTimeoutId);
    p1SpeedChangeTimeoutId = null;
    p2SpeedChangeTimeoutId = null;
    clearInterval(gameIntervalId);
    if (typeof updateControlBtnText === 'function') updateControlBtnText(); // from index.html
    updateGameStatusDisplay();
    drawGame();
    let endMessage;
    if (isWin === true) {
        if (p1_roundsAchieved >= maxRoundsPerGame && (!isPlayer2Active || p2_roundsAchieved >= maxRoundsPerGame) ) { // If P2 not active, P1 winning is enough
             endMessage = (isPlayer2Active && p1_roundsAchieved >= maxRoundsPerGame && p2_roundsAchieved >= maxRoundsPerGame) ? "Amazing! Both players reached all targets!" : "Congratulations Player 1! You Reached All Targets!";
             if (!isPlayer2Active && p1_roundsAchieved < maxRoundsPerGame) endMessage = "Victory!"; // Should not happen if isWin is true
             else if (isPlayer2Active && p2_roundsAchieved >= maxRoundsPerGame && p1_roundsAchieved < maxRoundsPerGame) endMessage = "Congratulations Player 2! You Reached All Targets!";

        } else if (p1_roundsAchieved >= maxRoundsPerGame) {
            endMessage = "Congratulations Player 1! You Reached All Targets!";
        } else if (isPlayer2Active && p2_roundsAchieved >= maxRoundsPerGame) {
            endMessage = "Congratulations Player 2! You Reached All Targets!";
        }
         else { 
            endMessage = "Victory!"; 
        }
    } else { 
        if (p1_gameOver && (!isPlayer2Active || p2_gameOver)) { // If P1 is over AND (P2 isn't active OR P2 is also over)
             endMessage = (isPlayer2Active && p1_gameOver && p2_gameOver) ? "Game Over for Both Players!" : "Player 1 Game Over!";
        } else if (isPlayer2Active && p2_gameOver) { // P2 is over, P1 must not be (otherwise caught above)
            endMessage = "Player 2 Game Over!";
        } else { 
            endMessage = "Target Not Reached! Game Over.";
        }
    }
    let p1Stats = `P1 Final Length: ${snake1Body ? snake1Body.length : 0} (Rounds: ${p1_roundsAchieved}/${maxRoundsPerGame})`;
    let p2Stats = isPlayer2Active ? `\nP2 Final Length: ${snake2Body ? snake2Body.length : 0} (Rounds: ${p2_roundsAchieved}/${maxRoundsPerGame})` : "";
    alert(endMessage + "\n" + p1Stats + p2Stats);
    location.reload();
}

function setGameDifficulty(level) {
    currentDifficultyLevel = level; 
    let newSpeed;
    switch (level) {
        case 'easy': newSpeed = 200; break;
        case 'medium': newSpeed = 150; break;
        case 'hard': newSpeed = 100; break;
        default: newSpeed = gameSpeed; // Keep current if level is unknown
    }
    gameSpeed = newSpeed;
    if (gameStarted && !gameOver && !isPaused) {
        clearInterval(gameIntervalId);
        gameIntervalId = setInterval(updateGame, gameSpeed);
    }
}

function togglePauseGame() {
    if (!gameStarted || gameOver) { 
        return;
    }
    isPaused = !isPaused;
    if (isPaused) {
        drawGame();
    } else {
        // Ensure interval is cleared before starting a new one, especially if speed changed.
        clearInterval(gameIntervalId); 
        gameIntervalId = setInterval(updateGame, gameSpeed);
    }
    if (typeof updateControlBtnText === 'function') updateControlBtnText(); // From index.html
}
