// food.js

// Global 'ctx', 'box', 'rows' from index.html are assumed.
// Global 'snake' array from snake.js is used by generateNewFood.

const FOOD_TYPES = {
    REGULAR:     { id: 'REGULAR',     color: '#f00', score: 1, effect: 'grow',          name: 'Regular Food', imageSrc: 'img/appel.png' },
    APPLE:       { id: 'APPLE',       color: '#ff0', score: 5, effect: 'score_bonus',   name: 'Golden Apple', transform: { type: 'color_change', newColor: '#00f', duration: 3000 }, imageSrc: 'img/orange.png' },
    BANANA:      { id: 'BANANA',      color: '#f90', score: 2, effect: 'speed_boost',   name: 'Speed Banana', duration: 5000, speedMultiplier: 0.66, imageSrc: 'img/citron.png' },
    RED_BLOCK:   { id: 'RED_BLOCK',   color: '#c00', score: 2, effect: 'double_length', name: 'Grow Block' },
    GREEN_BLOCK: { id: 'GREEN_BLOCK', color: '#0c0', score: 2, effect: 'halve_length',  name: 'Shrink Block' },
    OBSTACLE:    { id: 'OBSTACLE',    color: '#777', score: 0, effect: 'game_over',     name: 'Obstacle' }
};

// Preload images for food types
Object.values(FOOD_TYPES).forEach(foodType => {
    if (foodType.imageSrc) {
        const img = new Image();
        img.src = foodType.imageSrc;
        foodType.img = img; // Store the preloaded image object back into the foodType
    }
});

let activeFoods = []; // Array to hold multiple food items
const maxOnScreenFoods = 5; // New value: Maximum number of food items on screen

/**
 * Generates a new set of food items, populating the activeFoods array.
 * Ensures food items do not overlap with the snake or each other.
 * Assumes 'snake' (array of segments {x, y}) and 'rows' (grid dimension) are globally available.
 */
function generateNewFood() {
    activeFoods = []; // Clear existing food items
    const maxRetriesPerFood = 10; // Prevent infinite loops if board is full

    for (let i = 0; i < maxOnScreenFoods; i++) {
        let newX, newY, foodType;
        let validPosition = false;
        let retries = 0;

        while (!validPosition && retries < maxRetriesPerFood) {
            // Select food type
            const rand = Math.random();
            if (rand < 0.50) foodType = FOOD_TYPES.REGULAR;
            else if (rand < 0.65) foodType = FOOD_TYPES.APPLE;
            else if (rand < 0.80) foodType = FOOD_TYPES.BANANA;
            else if (rand < 0.88) foodType = FOOD_TYPES.RED_BLOCK;
            else if (rand < 0.96) foodType = FOOD_TYPES.GREEN_BLOCK;
            else foodType = FOOD_TYPES.OBSTACLE;

            // Use 'cols' for X-axis limit and 'rows' for Y-axis limit
            newX = Math.floor(Math.random() * cols);
            newY = Math.floor(Math.random() * rows);
            validPosition = true;

            // Check against snake1Body
            // Assuming snake1Body is globally accessible from snake.js
            if (typeof snake1Body !== 'undefined' && Array.isArray(snake1Body)) {
                for (const segment of snake1Body) {
                    if (segment.x === newX && segment.y === newY) {
                        validPosition = false;
                        break;
                    }
                }
            }
            if (!validPosition) { retries++; continue; } // Try new position if on snake1

            // Check against snake2Body
            // Assuming snake2Body is globally accessible from snake.js
            if (typeof snake2Body !== 'undefined' && Array.isArray(snake2Body) && snake2Body.length > 0) {
                for (const segment of snake2Body) {
                    if (segment.x === newX && segment.y === newY) {
                        validPosition = false;
                        break;
                    }
                }
            }
            if (!validPosition) { retries++; continue; } // Try new position if on snake2

            // Check against other food items already generated in this batch
            for (const existingFood of activeFoods) {
                if (existingFood.x === newX && existingFood.y === newY) {
                    validPosition = false;
                    break;
                }
            }
            if (!validPosition) { retries++; continue; }
        }

        if (validPosition) {
            activeFoods.push({ x: newX, y: newY, type: foodType });
        } else {
            // console.warn(`Could not find a valid position for food item ${i+1} after ${maxRetriesPerFood} retries.`);
        }
    }
}

/**
 * Draws all active food items on the canvas.
 */
function drawFood() {
    if (ctx && box && activeFoods) {
        activeFoods.forEach(foodItem => {
            if (foodItem && foodItem.type) {
                if (foodItem.type.img && foodItem.type.img.complete) {
                    ctx.drawImage(foodItem.type.img, foodItem.x * box, foodItem.y * box, box, box);
                } else {
                    ctx.fillStyle = foodItem.type.color;
                    ctx.fillRect(foodItem.x * box, foodItem.y * box, box - 2, box - 2);
                }
            }
        });
    }
}

/**
 * Checks if the snake's head is at the same position as any of the active food items.
 * @param {object} headPosition - An object {x, y} representing the snake's head.
 * @returns {object|null} - The eaten food item object (with x, y, type) or null if no food eaten.
 */
function checkFoodEaten(headPosition) {
    for (let i = 0; i < activeFoods.length; i++) {
        const foodItem = activeFoods[i];
        if (headPosition.x === foodItem.x && headPosition.y === foodItem.y) {
            // Remove the eaten food from the active list by creating a new array without it.
            // Or, mark it for removal and then filter. Simpler for now: just return it.
            // The game.js logic will handle respawning all food.
            return foodItem;
        }
    }
    return null; // No food eaten
}
