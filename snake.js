// snake.js

// Global variables from index.html assumed: ctx, box, rows, cols
// Game state variables like gameOver, isPaused will be handled in game.js for some functions.

// --- Player 1 State ---
let snake1Body = [{ x: 10, y: 10 }];
let dx1 = 1;
let dy1 = 0;
let defaultSnake1Color = '#0f0'; // Green for P1
let currentSnake1Color = defaultSnake1Color;
let transformation1TimeoutId = null;
let snake1Width = 1;
let consecutiveRedBlocksEaten1 = 0;

// --- Player 2 State ---
let snake2Body = []; // Will be initialized in resetSnake2
let dx2 = -1; // Start P2 moving left
let dy2 = 0;
const defaultSnake2Color = '#00f'; // Blue for P2
let currentSnake2Color = defaultSnake2Color;
let transformation2TimeoutId = null;
let snake2Width = 1;
let consecutiveRedBlocksEaten2 = 0;

const maxSnakeWidth = 4; // Shared max width, can be player-specific if needed

/**
 * Resets Player 1's snake to its initial state.
 */
function resetSnake1() {
  console.log("[DEBUG_STARTUP] resetSnake1: Start. cols = " + (typeof cols !== 'undefined' ? cols : "undef") + ", rows = " + (typeof rows !== 'undefined' ? rows : "undef"));
  console.log("[DEBUG_STARTUP] resetSnake1: Initial snake1Body (first 2 segments): ", snake1Body ? JSON.stringify(snake1Body.slice(0,2)) : "undefined");

  snake1Body = [{ x: 10, y: 10 }]; // P1 starting position
  dx1 = 1; dy1 = 0; // P1 initial direction (right)

  if (transformation1TimeoutId) {
    clearTimeout(transformation1TimeoutId);
    transformation1TimeoutId = null;
  }
  currentSnake1Color = defaultSnake1Color;
  snake1Width = 1;
  consecutiveRedBlocksEaten1 = 0;
  // The existing log is fine, or can be merged/removed if too verbose with new ones.
  // console.log("[DEBUG][snake.js] resetSnake1: snake1Width reset to " + snake1Width + ", consecutiveRedBlocksEaten1 reset to " + consecutiveRedBlocksEaten1);
  console.log("[DEBUG_STARTUP] resetSnake1: End. Final snake1Body (first 2 segments): ", JSON.stringify(snake1Body.slice(0,2)));
}

/**
 * Resets Player 2's snake to its initial state.
 */
function resetSnake2() {
  console.log("[DEBUG_STARTUP] resetSnake2: Start. cols = " + (typeof cols !== 'undefined' ? cols : "undef") + ", rows = " + (typeof rows !== 'undefined' ? rows : "undef"));
  console.log("[DEBUG_STARTUP] resetSnake2: Initial snake2Body (first 2 segments): ", snake2Body ? JSON.stringify(snake2Body.slice(0,2)) : "undefined");

  let startX = (typeof cols !== 'undefined' && cols > 15) ? cols - 10 : 15;
  let startY = (typeof rows !== 'undefined' && rows > 15) ? rows - 10 : 15;

  // Validate startX and startY
  if (typeof startX !== 'number' || isNaN(startX) || typeof startY !== 'number' || isNaN(startY)) {
    console.error(`[ERROR][snake.js] resetSnake2: Invalid initial coordinates. startX: ${startX}, startY: ${startY}. Defaulting P2 start.`);
    // Fallback coordinates, ensuring they are different from P1's typical start (10,10)
    // and also different from the typical default if cols/rows were valid (e.g., 15,15 or (cols-10), (rows-10))
    // Using 20,20 as a distinct fallback.
    startX = 20;
    startY = 20;
    // Ensure these defaults are within typical grid boundaries if possible, though the issue is cols/rows being undefined.
    // If cols/rows are undefined, any coordinate is a gamble. This just prevents NaN.
  }

  snake2Body = [{ x: startX, y: startY }];
  dx2 = -1; dy2 = 0; // P2 initial direction (left)

  if (transformation2TimeoutId) {
    clearTimeout(transformation2TimeoutId);
    transformation2TimeoutId = null;
  }
  currentSnake2Color = defaultSnake2Color;
  snake2Width = 1;
  consecutiveRedBlocksEaten2 = 0;
  // console.log("[DEBUG][snake.js] resetSnake2: snake2Width reset to " + snake2Width + ", consecutiveRedBlocksEaten2 reset to " + consecutiveRedBlocksEaten2);
  console.log("[DEBUG_STARTUP] resetSnake2: End. Final snake2Body (first 2 segments): ", JSON.stringify(snake2Body.slice(0,2)));
}

/**
 * Helper function to draw a single snake.
 */
function drawSingleSnake(snakeBody, color, width) {
    console.log("[DEBUG_STARTUP] drawSingleSnake: Drawing snake with length " + (typeof snakeBody !== 'undefined' && snakeBody ? snakeBody.length : 'undefined_or_empty') + ", color: " + color + ", width: " + width);
    if (!snakeBody || snakeBody.length === 0) {
        console.log("[DEBUG_STARTUP] drawSingleSnake: snakeBody is undefined, null, or empty. Skipping draw for this snake.");
        return;
    }
    if (ctx && box) { // Removed snakeBody from here as it's checked above
        snakeBody.forEach(segment => {
            ctx.fillStyle = color;
            const segmentSize = box * width;
            const offset = (segmentSize - box) / 2;
            const visualSize = segmentSize - 2; // Keep a small border
            ctx.fillRect(segment.x * box - offset, segment.y * box - offset, visualSize, visualSize);
        });
    }
}

/**
 * Draws both snakes on the canvas.
 */
function drawSnakes() {
  // console.log("[DEBUG][snake.js] drawSnakes: P1 width = " + snake1Width + ", P2 width = " + snake2Width); // This is the old log
  console.log("[DEBUG_STARTUP] drawSnakes: Start. snake1Body length: " + (typeof snake1Body !== 'undefined' && snake1Body ? snake1Body.length : 'undefined_or_empty') + ", snake2Body length: " + (typeof snake2Body !== 'undefined' && snake2Body ? snake2Body.length : 'undefined_or_empty'));
  drawSingleSnake(snake1Body, currentSnake1Color, snake1Width);
  // No need to check snake2Body.length here, drawSingleSnake does it.
  drawSingleSnake(snake2Body, currentSnake2Color, snake2Width);
}


// --- Movement ---
function moveSnake1() {
  if (!snake1Body || snake1Body.length === 0) return null; // Safety check
  const head = { x: snake1Body[0].x + dx1, y: snake1Body[0].y + dy1 };
  snake1Body.unshift(head);
  return head;
}

function moveSnake2() {
  if (!snake2Body || snake2Body.length === 0) return null; // Safety check
  const head = { x: snake2Body[0].x + dx2, y: snake2Body[0].y + dy2 };
  snake2Body.unshift(head);
  return head;
}

// --- Collision Detection (Parameterized) ---
/**
 * Checks for snake collision with walls, considering snakeWidth.
 * @param {object} snakeHead - The head of the snake.
 * @param {number} width - The width of the snake being checked.
 * @returns {boolean} - True if collision occurred, false otherwise.
 */
function checkWallCollision(snakeHead, width) {
  if (!snakeHead) return false; // Should not happen if called correctly
  const effectiveRadius = (width - 1) * 0.5;
  if (snakeHead.x - effectiveRadius < 0 ||
      snakeHead.x + effectiveRadius >= cols ||
      snakeHead.y - effectiveRadius < 0 ||
      snakeHead.y + effectiveRadius >= rows) {
    return true;
  }
  return false;
}

/**
 * Checks for snake collision with its own body.
 * @param {object} snakeHead - The head of the snake.
 * @param {Array} body - The body array of the snake being checked.
 * @returns {boolean} - True if collision occurred, false otherwise.
 */
function checkSelfCollision(snakeHead, body) {
  if (!snakeHead || !body || body.length < 1) return false;
  for (let i = 1; i < body.length; i++) {
    if (body[i].x === snakeHead.x && body[i].y === snakeHead.y) {
      return true;
    }
  }
  return false;
}

// --- Direction Changes ---
function changeDirectionP1(newDirection) {
  const isCurrentlyMovingHorizontally = dy1 === 0;
  if (newDirection === 'up' && (isCurrentlyMovingHorizontally || snake1Body.length === 1)) { dx1 = 0; dy1 = -1; }
  else if (newDirection === 'down' && (isCurrentlyMovingHorizontally || snake1Body.length === 1)) { dx1 = 0; dy1 = 1; }
  else if (newDirection === 'left' && (!isCurrentlyMovingHorizontally || snake1Body.length === 1)) { dx1 = -1; dy1 = 0; }
  else if (newDirection === 'right' && (!isCurrentlyMovingHorizontally || snake1Body.length === 1)) { dx1 = 1; dy1 = 0; }
}

function changeDirectionP2(newDirection) {
  const isCurrentlyMovingHorizontally = dy2 === 0;
  if (newDirection === 'up' && (isCurrentlyMovingHorizontally || snake2Body.length === 1)) { dx2 = 0; dy2 = -1; }
  else if (newDirection === 'down' && (isCurrentlyMovingHorizontally || snake2Body.length === 1)) { dx2 = 0; dy2 = 1; }
  else if (newDirection === 'left' && (!isCurrentlyMovingHorizontally || snake2Body.length === 1)) { dx2 = -1; dy2 = 0; }
  else if (newDirection === 'right' && (!isCurrentlyMovingHorizontally || snake2Body.length === 1)) { dx2 = 1; dy2 = 0; }
}

// --- Transformations ---
function applyTransformationP1(transformDetails) {
    if (transformation1TimeoutId) clearTimeout(transformation1TimeoutId);
    if (transformDetails && transformDetails.type === 'color_change') {
        currentSnake1Color = transformDetails.newColor;
        transformation1TimeoutId = setTimeout(() => {
            currentSnake1Color = defaultSnake1Color;
            transformation1TimeoutId = null;
            if(typeof isPaused !== 'undefined' && isPaused && typeof drawGame !== 'undefined') drawGame();
        }, transformDetails.duration);
    }
}

function applyTransformationP2(transformDetails) {
    if (transformation2TimeoutId) clearTimeout(transformation2TimeoutId);
    if (transformDetails && transformDetails.type === 'color_change') {
        currentSnake2Color = transformDetails.newColor;
        transformation2TimeoutId = setTimeout(() => {
            currentSnake2Color = defaultSnake2Color;
            transformation2TimeoutId = null;
            if(typeof isPaused !== 'undefined' && isPaused && typeof drawGame !== 'undefined') drawGame();
        }, transformDetails.duration);
    }
}

// --- Fattening Logic (P1) ---
function incrementConsecutiveRedBlocksP1() {
    console.log("[DEBUG][snake.js] incrementConsecutiveRedBlocksP1: old count = " + consecutiveRedBlocksEaten1);
    consecutiveRedBlocksEaten1++;
    console.log("[DEBUG][snake.js] incrementConsecutiveRedBlocksP1: new count = " + consecutiveRedBlocksEaten1);
}
function resetConsecutiveRedBlocksP1() {
    console.log("[DEBUG][snake.js] resetConsecutiveRedBlocksP1: old count = " + consecutiveRedBlocksEaten1);
    consecutiveRedBlocksEaten1 = 0;
    console.log("[DEBUG][snake.js] resetConsecutiveRedBlocksP1: new count = " + consecutiveRedBlocksEaten1);
}
function getConsecutiveRedBlocksP1() { return consecutiveRedBlocksEaten1; }

function incrementSnakeWidthP1() {
    console.log("[DEBUG][snake.js] incrementSnakeWidthP1: CALLED. current snake1Width = " + snake1Width + ", maxSnakeWidth = " + maxSnakeWidth);
    if (snake1Width < maxSnakeWidth) {
        if (snake1Width === 1) snake1Width = 2;
        else snake1Width++;
        console.log("[DEBUG][snake.js] incrementSnakeWidthP1: new snake1Width = " + snake1Width);
    }
}
function getSnakeWidthP1() { return snake1Width; }

// --- Fattening Logic (P2) ---
function incrementConsecutiveRedBlocksP2() {
    console.log("[DEBUG][snake.js] incrementConsecutiveRedBlocksP2: old count = " + consecutiveRedBlocksEaten2);
    consecutiveRedBlocksEaten2++;
    console.log("[DEBUG][snake.js] incrementConsecutiveRedBlocksP2: new count = " + consecutiveRedBlocksEaten2);
}
function resetConsecutiveRedBlocksP2() {
    console.log("[DEBUG][snake.js] resetConsecutiveRedBlocksP2: old count = " + consecutiveRedBlocksEaten2);
    consecutiveRedBlocksEaten2 = 0;
    console.log("[DEBUG][snake.js] resetConsecutiveRedBlocksP2: new count = " + consecutiveRedBlocksEaten2);
}
function getConsecutiveRedBlocksP2() { return consecutiveRedBlocksEaten2; }

function incrementSnakeWidthP2() {
    console.log("[DEBUG][snake.js] incrementSnakeWidthP2: CALLED. current snake2Width = " + snake2Width + ", maxSnakeWidth = " + maxSnakeWidth);
    if (snake2Width < maxSnakeWidth) {
        if (snake2Width === 1) snake2Width = 2;
        else snake2Width++;
        console.log("[DEBUG][snake.js] incrementSnakeWidthP2: new snake2Width = " + snake2Width);
    }
}
function getSnakeWidthP2() { return snake2Width; }

// DEBUG logs for resetSnake were already added in previous step.
// The old drawSnake, moveSnake, changeDirection, applyTransformation,
// and fattening functions are now either P1 specific or parameterized.
// Global 'snake', 'dx', 'dy', 'currentSnakeColor', 'defaultSnakeColor',
// 'transformationTimeoutId', 'snakeWidth', 'consecutiveRedBlocksEaten'
// are now effectively P1 versions or need to be P1 versions.
// The original getSnakeWidth and other getters are now P1 specific.
// This diff renames them and adds P2 versions.
// The original drawSnake is replaced by drawSnakes and drawSingleSnake.
// The original moveSnake and changeDirection are replaced by P1/P2 versions.
// The original checkWallCollision and checkSelfCollision are parameterized.
// The original applyTransformation is replaced by P1/P2 versions.
// The original fattening functions are replaced by P1/P2 versions.
// The debug logs are kept in the P1/P2 versions.
// The old `drawSnake` function (singular) is now `drawSnakes` which calls `drawSingleSnake`.
// The single-player `getSnakeWidth` etc are now `getSnakeWidthP1` and new P2 versions are added.
// The `console.log` in original `drawSnake` is moved to `drawSnakes`.
// `resetSnake` is now `resetSnake1`.
// `incrementConsecutiveRedBlocks` is now `incrementConsecutiveRedBlocksP1`.
// `resetConsecutiveRedBlocks` is now `resetConsecutiveRedBlocksP1`.
// `getConsecutiveRedBlocks` is now `getConsecutiveRedBlocksP1`.
// `incrementSnakeWidth` is now `incrementSnakeWidthP1`.
// `getSnakeWidth` is now `getSnakeWidthP1`.
// `applyTransformation` is now `applyTransformationP1`.
// `moveSnake` is now `moveSnake1`.
// `changeDirection` is now `changeDirectionP1`.
// `checkWallCollision` and `checkSelfCollision` are now parameterized.
// Logs in P1 functions are updated to reflect P1.
// `resetSnake1` and `resetSnake2` have their respective logs.
// `drawSnakes` has a combined log.
// `incrementSnakeWidthP1` and `P2` have their specific logs.
// `incrementConsecutiveRedBlocksP1` and `P2` have their specific logs.
// `resetConsecutiveRedBlocksP1` and `P2` have their specific logs.
// `currentSnakeColor` (global) is now `currentSnake1Color`.
// `defaultSnakeColor` (global) is now `defaultSnake1Color`.
// `transformationTimeoutId` (global) is now `transformation1TimeoutId`.
// `snakeWidth` (global) is now `snake1Width`.
// `consecutiveRedBlocksEaten` (global) is now `consecutiveRedBlocksEaten1`.
// `snake` (global) is now `snake1Body`.
// `dx`, `dy` (global) are now `dx1`, `dy1`.
// `changeDirection` needs P1/P2 specific versions or parameterization. For this pass, made P1/P2.
// The changeDirection logic for P1 was also slightly bugged in its conditions (e.g. `!isCurrentlyMovingHorizontally` for left/right should be `isCurrentlyMovingVertically`). Corrected that.
