// food.js

// Global 'ctx', 'box', 'rows' from index.html are assumed.
// Global 'snake' array from snake.js is used by generateNewFood.

const FOOD_TYPES = {
    REGULAR:  { id: 'REGULAR',  color: '#f00', score: 1, effect: 'grow',        name: 'Regular Food' },
    APPLE:    { id: 'APPLE',    color: '#ff0', score: 5, effect: 'score_bonus', name: 'Golden Apple', transform: { type: 'color_change', newColor: '#00f', duration: 3000 } }, // Blue snake for 3s
    BANANA:   { id: 'BANANA',   color: '#f90', score: 2, effect: 'speed_boost', name: 'Speed Banana', duration: 5000, speedMultiplier: 0.66 }, // Orange
    OBSTACLE: { id: 'OBSTACLE', color: '#777', score: 0, effect: 'game_over',   name: 'Obstacle' } // Grey
};

let currentFood = { x: 0, y: 0, type: FOOD_TYPES.REGULAR };

/**
 * Generates a new food item, selecting its type randomly and ensuring it doesn't spawn on the snake.
 * Updates the global currentFood object.
 * Assumes 'snake' (array of segments {x, y}) and 'rows' (grid dimension) are globally available.
 */
function generateNewFood() {
    // Basic weighted random selection for food types
    const rand = Math.random();
    if (rand < 0.6) { // 60% chance for REGULAR
        currentFood.type = FOOD_TYPES.REGULAR;
    } else if (rand < 0.8) { // 20% chance for APPLE
        currentFood.type = FOOD_TYPES.APPLE;
    } else if (rand < 0.95) { // 15% chance for BANANA
        currentFood.type = FOOD_TYPES.BANANA;
    } else { // 5% chance for OBSTACLE
        currentFood.type = FOOD_TYPES.OBSTACLE;
    }

    let newX, newY;
    let validPosition = false;
    while (!validPosition) {
        newX = Math.floor(Math.random() * rows);
        newY = Math.floor(Math.random() * rows);
        validPosition = true; // Assume valid until proven otherwise
        // Check against snake body
        // Ensure 'snake' is defined and is an array. If not, this will error.
        // This assumes 'snake' from snake.js is globally accessible here.
        if (typeof snake !== 'undefined' && Array.isArray(snake)) {
            for (const segment of snake) {
                if (segment.x === newX && segment.y === newY) {
                    validPosition = false;
                    break;
                }
            }
        } else {
            // console.warn("generateNewFood: 'snake' array is not available globally or not an array.");
            // Fallback: place food without checking snake collision if snake is not available.
            // This might not be ideal but prevents an error.
        }
    }
    currentFood.x = newX;
    currentFood.y = newY;
}

/**
 * Draws the current food item on the canvas.
 * Uses the color defined in currentFood.type.
 */
function drawFood() {
    if (ctx && box && currentFood && currentFood.type) {
        ctx.fillStyle = currentFood.type.color;
        ctx.fillRect(currentFood.x * box, currentFood.y * box, box - 2, box - 2);
    }
}

/**
 * Checks if the snake's head is at the same position as the current food.
 * @param {object} headPosition - An object {x, y} representing the snake's head.
 * @returns {boolean} - True if food is eaten, false otherwise.
 */
function checkFoodEaten(headPosition) {
    if (headPosition.x === currentFood.x && headPosition.y === currentFood.y) {
        return true;
    }
    return false;
}

// Note: The old `initFood` that was called by index.html is removed.
// `generateNewFood` is now the primary function for creating food and will be called from game.js.
// The initial call to place food will be from game.js's initGame function.
// Make sure `snake` array from snake.js is globally accessible for `generateNewFood`.
