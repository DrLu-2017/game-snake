// snake.js

// Global variables from index.html assumed: ctx, box, rows
// Game state variables like gameOver will be handled in game.js

let snake = [{ x: 10, y: 10 }];
let dx = 1; // Initial direction: right
let dy = 0;

// State variables for transformation
let defaultSnakeColor = '#0f0'; // Original green
let currentSnakeColor = defaultSnakeColor;
let transformationTimeoutId = null;


/**
 * Resets the snake to its initial state, direction, and appearance.
 */
function resetSnake() {
  snake = [{ x: 10, y: 10 }];
  dx = 1;
  dy = 0;

  // Reset transformation state
  if (transformationTimeoutId) {
    clearTimeout(transformationTimeoutId);
    transformationTimeoutId = null;
  }
  currentSnakeColor = defaultSnakeColor;
}

/**
 * Draws the snake on the canvas using the currentSnakeColor.
 */
function drawSnake() {
  // Assuming 'ctx' and 'box' are global
  if (ctx && box && snake) {
    snake.forEach(segment => {
      ctx.fillStyle = currentSnakeColor; // Use current color
      ctx.fillRect(segment.x * box, segment.y * box, box - 2, box - 2);
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
 * Checks for snake collision with walls.
 * @param {object} snakeHead - The head of the snake.
 * @returns {boolean} - True if collision occurred, false otherwise.
 */
function checkWallCollision(snakeHead) {
  if (snakeHead.x < 0 || snakeHead.x >= rows || snakeHead.y < 0 || snakeHead.y >= rows) {
    return true;
  }
  return false;
}

/**
 * Checks for snake collision with its own body.
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
  // This logic assumes snake cannot be shorter than 1 segment if game is active.
  // If snake has length 1, it can reverse. If > 1, it cannot make a 180-degree turn.
  const isCurrentlyMovingHorizontally = dy === 0;
  const isCurrentlyMovingVertically = dx === 0;

  if (newDirection === 'up' && (isCurrentlyMovingHorizontally || snake.length === 1)) {
    dx = 0; dy = -1;
  } else if (newDirection === 'down' && (isCurrentlyMovingHorizontally || snake.length === 1)) {
    dx = 0; dy = 1;
  } else if (newDirection === 'left' && (isCurrentlyMovingVertically || snake.length === 1)) {
    dx = -1; dy = 0;
  } else if (newDirection === 'right' && (isCurrentlyMovingVertically || snake.length === 1)) {
    dx = 1; dy = 0;
  }
}

/**
 * Applies a transformation to the snake, e.g., temporary color change.
 * @param {object} transformDetails - Object containing transformation type, color, duration.
 */
function applyTransformation(transformDetails) {
    if (transformationTimeoutId) {
        clearTimeout(transformationTimeoutId); // Clear any existing transformation timeout
        // currentSnakeColor is not reset to default here, allowing new transform to override smoothly
    }

    if (transformDetails && transformDetails.type === 'color_change') {
        currentSnakeColor = transformDetails.newColor;
        transformationTimeoutId = setTimeout(() => {
            currentSnakeColor = defaultSnakeColor;
            transformationTimeoutId = null;
            // A redraw would be needed if the game is paused when this timeout fires.
            // Assuming game loop handles redraws if active, or drawGame() is called if paused.
            if(isPaused) drawGame();
        }, transformDetails.duration);
    }
}
