// snake.js

// Global variables from index.html assumed: ctx, box, rows (used as numCols/numRows)
// Game state variables like gameOver, isPaused will be handled in game.js for some functions.

let snake = [{ x: 10, y: 10 }];
let dx = 1; // Initial direction: right
let dy = 0;

// State variables for transformation (color change)
let defaultSnakeColor = '#0f0'; // Original green
let currentSnakeColor = defaultSnakeColor;
let transformationTimeoutId = null;

// State variables for fattening
let snakeWidth = 1; // Width in 'box' units. 1 means normal size (1x1 box units).
let consecutiveRedBlocksEaten = 0;
const maxSnakeWidth = 4; // Example maximum width in box units.

/**
 * Resets the snake to its initial state, direction, appearance, and width.
 */
function resetSnake() {
  snake = [{ x: 10, y: 10 }];
  dx = 1;
  dy = 0;

  // Reset color transformation state
  if (transformationTimeoutId) {
    clearTimeout(transformationTimeoutId);
    transformationTimeoutId = null;
  }
  currentSnakeColor = defaultSnakeColor;

  // Reset fattening state
  snakeWidth = 1;
  consecutiveRedBlocksEaten = 0;
  console.log("[DEBUG][snake.js] resetSnake: snakeWidth = " + snakeWidth + ", consecutiveRedBlocksEaten = " + consecutiveRedBlocksEaten);
}

/**
 * Draws the snake on the canvas using currentSnakeColor and snakeWidth.
 */
function drawSnake() {
  console.log("[DEBUG][snake.js] drawSnake: USING snakeWidth = " + snakeWidth);
  if (ctx && box && snake) {
    snake.forEach(segment => {
      ctx.fillStyle = currentSnakeColor;
      // Calculate offset for centering the wider snake segment
      // If snakeWidth is 1, offset is 0.
      // If snakeWidth is 2, offset is box/2. Segment is drawn from x-box/2 to x+box/2. (Incorrect: should be width 2*box)
      // Correct: each segment is a square. Its top-left is (s.x * box, s.y * box) for width 1.
      // For width W, it should still be centered around (s.x * box + box/2, s.y * box + box/2).
      // So, top-left becomes (s.x * box - (W-1)*box/2, s.y * box - (W-1)*box/2)
      // And size becomes W*box by W*box.
      const segmentSize = box * snakeWidth;
      const offset = (segmentSize - box) / 2; // This is the offset from the original top-left corner

      // The -2 was for visual spacing when snakeWidth was 1.
      // For a fat snake, this might not be desired or needs adjustment.
      // Let's remove the -2 for simplicity with fattening, or make it proportional.
      // For now, removing the -2 for fat snake, using full segmentSize.
      // Or, keep a small border: const visualSize = segmentSize - (snakeWidth > 1 ? 0 : 2);
      const visualSize = segmentSize - 2; // Keep a small border always

      ctx.fillRect(segment.x * box - offset, segment.y * box - offset, visualSize, visualSize);
    });
  }
}

/**
 * Updates the snake's position based on current direction (dx, dy).
 * @returns {object} The new head of the snake.
 */
function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);
  return head;
}

/**
 * Checks for snake collision with walls, considering snakeWidth.
 * @param {object} snakeHead - The head of the snake.
 * @returns {boolean} - True if collision occurred, false otherwise.
 * Assumes 'rows' is effectively numRows and numCols (square grid).
 */
function checkWallCollision(snakeHead) {
  // Effective radius from the center of the head segment to its edge
  const effectiveRadius = (snakeWidth - 1) * 0.5; // in box units

  // Check boundaries:
  // Left wall: head center (snakeHead.x) minus radius < 0
  // Right wall: head center (snakeHead.x) plus radius >= total columns (rows)
  // Top wall: head center (snakeHead.y) minus radius < 0
  // Bottom wall: head center (snakeHead.y) plus radius >= total rows (rows)
  if (snakeHead.x - effectiveRadius < 0 ||
      snakeHead.x + effectiveRadius >= rows ||  // Assuming 'rows' is also numCols
      snakeHead.y - effectiveRadius < 0 ||
      snakeHead.y + effectiveRadius >= rows) {
    return true;
  }
  return false;
}

/**
 * Checks for snake collision with its own body.
 * (Note: This does not yet account for snakeWidth; only checks center points)
 * @param {object} snakeHead - The head of the snake.
 * @returns {boolean} - True if collision occurred, false otherwise.
 */
function checkSelfCollision(snakeHead) {
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === snakeHead.x && snake[i].y === snakeHead.y) {
      return true;
    }
  }
  return false;
}

/**
 * Changes the snake's direction.
 * @param {string} newDirection - "up", "down", "left", or "right".
 */
function changeDirection(newDirection) {
  const isCurrentlyMovingHorizontally = dy === 0;
  const isCurrentlyMovingVertically = dx === 0;

  if (newDirection === 'up' && (isCurrentlyMovingHorizontally || snake.length === 1)) { dx = 0; dy = -1; }
  else if (newDirection === 'down' && (isCurrentlyMovingHorizontally || snake.length === 1)) { dx = 0; dy = 1; }
  else if (newDirection === 'left' && (isCurrentlyMovingVertically || snake.length === 1)) { dx = -1; dy = 0; }
  else if (newDirection === 'right' && (isCurrentlyMovingVertically || snake.length === 1)) { dx = 1; dy = 0; }
}

/**
 * Applies a color transformation to the snake.
 * @param {object} transformDetails - Object containing transformation type, color, duration.
 */
function applyTransformation(transformDetails) {
    if (transformationTimeoutId) {
        clearTimeout(transformationTimeoutId);
    }
    if (transformDetails && transformDetails.type === 'color_change') {
        currentSnakeColor = transformDetails.newColor;
        transformationTimeoutId = setTimeout(() => {
            currentSnakeColor = defaultSnakeColor;
            transformationTimeoutId = null;
            if(typeof isPaused !== 'undefined' && isPaused && typeof drawGame !== 'undefined') drawGame();
        }, transformDetails.duration);
    }
}

// --- Functions for managing fattening ---

function incrementConsecutiveRedBlocks() {
    console.log("[DEBUG][snake.js] incrementConsecutiveRedBlocks: old count = " + consecutiveRedBlocksEaten);
    consecutiveRedBlocksEaten++;
    console.log("[DEBUG][snake.js] incrementConsecutiveRedBlocks: new count = " + consecutiveRedBlocksEaten);
}

function resetConsecutiveRedBlocks() {
    console.log("[DEBUG][snake.js] resetConsecutiveRedBlocks: old count = " + consecutiveRedBlocksEaten);
    consecutiveRedBlocksEaten = 0;
    console.log("[DEBUG][snake.js] resetConsecutiveRedBlocks: new count = " + consecutiveRedBlocksEaten);
}

function getConsecutiveRedBlocks() {
    return consecutiveRedBlocksEaten;
}

function incrementSnakeWidth() {
    console.log("[DEBUG][snake.js] incrementSnakeWidth: CALLED. current snakeWidth = " + snakeWidth + ", maxSnakeWidth = " + maxSnakeWidth);
    if (snakeWidth < maxSnakeWidth) {
        if (snakeWidth === 1) { // First increment from normal size
            snakeWidth = 2;
        } else {
            snakeWidth++;
        }
        // Reset consecutive counter as the width has been incremented
        // Or, game.js could reset it after calling incrementSnakeWidth if condition met.
        // Let's have game.js reset it for clarity of when the "2 consecutive" rule applies.
        console.log("[DEBUG][snake.js] incrementSnakeWidth: new snakeWidth = " + snakeWidth);
    }
}

function getSnakeWidth() {
    return snakeWidth;
}

// resetSnakeWidth is implicitly handled by resetSnake setting snakeWidth = 1.
// No separate resetSnakeWidth function needed if resetSnake does the job.
