// food.js

// Global 'ctx', 'box', 'rows' from index.html are assumed.
// Global 'snake' array from snake.js is used by generateNewFood.

const FOOD_TYPES = {
    MOUSSE:      { id: 'MOUSSE',      color: '#A0522D', score: 3, effect: 'mousse_special', name: 'Mousse', imageSrc: 'img/citron.png' }, // Placeholder
    APPLE:       { id: 'APPLE',       color: '#ff0000', score: 5, effect: 'apple_special', name: 'Apple', imageSrc: 'img/appel.png' },   // Using existing appel.png
    PASTEQUE:    { id: 'PASTEQUE',    color: '#32CD32', score: 2, effect: 'speed_boost',   name: 'Pasteque', imageSrc: 'img/pasteque.png' },
    OBSTACLE:    { id: 'OBSTACLE',    color: '#777',    score: 0, effect: 'game_over',     name: 'Obstacle', imageSrc: 'img/orange.png' }, // Placeholder
    CITRON:      { id: 'CITRON',      color: '#FFFF00', score: 2, effect: 'citron_special',name: 'Citron', imageSrc: 'img/citron.png' },
    ORANGE:      { id: 'ORANGE',      color: '#FFA500', score: 2, effect: 'halve_length',  name: 'Orange', imageSrc: 'img/orange.png' }
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
            // Select food type based on difficulty
            let obstacleThreshold = 0.96; // Default for easy (4% chance of obstacle)
            // currentDifficultyLevel is expected to be a global variable from game.js
            if (typeof currentDifficultyLevel !== 'undefined') {
                if (currentDifficultyLevel === 'medium') {
                    obstacleThreshold = 0.92; // Medium (8% chance of obstacle)
                } else if (currentDifficultyLevel === 'hard') {
                    obstacleThreshold = 0.88; // Hard (12% chance of obstacle)
                }
            }

            const rand = Math.random();
            if (rand >= obstacleThreshold) {
                foodType = FOOD_TYPES.OBSTACLE;
            } else {
                // Adjust rand to distribute other food types in the remaining probability space
                const adjustedRand = rand / obstacleThreshold; // Scale rand to [0, 1)
                if (adjustedRand < 0.25) foodType = FOOD_TYPES.APPLE;       // New Apple
                else if (adjustedRand < 0.45) foodType = FOOD_TYPES.PASTEQUE; // New Pasteque (speed boost)
                else if (adjustedRand < 0.65) foodType = FOOD_TYPES.CITRON;   // New Citron
                else if (adjustedRand < 0.85) foodType = FOOD_TYPES.ORANGE;   // New Orange (halve length)
                else foodType = FOOD_TYPES.MOUSSE;                          // New Mousse
            }

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
    console.log("[DRAW_DEBUG] drawFood: Entered.");
    if (ctx && box && activeFoods) {
        activeFoods.forEach((foodItem, index) => {
            console.log(`[DRAW_DEBUG] drawFood: Processing food item ${index}, type: ${foodItem && foodItem.type ? foodItem.type.id : 'unknown'}`);
            if (foodItem && foodItem.type) {
                if (foodItem.type.img && foodItem.type.img.complete) {
                    console.log(`[DRAW_DEBUG] drawFood: Drawing image for ${foodItem.type.id} at ${foodItem.x * box}, ${foodItem.y * box}`);
                    try {
                        ctx.drawImage(foodItem.type.img, foodItem.x * box, foodItem.y * box, box, box);
                    } catch (e) {
                        console.error(`[DRAW_DEBUG] drawFood: Error drawing image for ${foodItem.type.id}:`, e);
                    }
                } else {
                    if (foodItem.type.img && !foodItem.type.img.complete) {
                        console.log(`[DRAW_DEBUG] drawFood: Image for ${foodItem.type.id} not complete. Using fallback color ${foodItem.type.color}.`);
                    } else if (!foodItem.type.img) {
                        console.log(`[DRAW_DEBUG] drawFood: No image for ${foodItem.type.id}. Using fallback color ${foodItem.type.color}.`);
                    }
                    try {
                        ctx.fillStyle = foodItem.type.color;
                        ctx.fillRect(foodItem.x * box, foodItem.y * box, box - 2, box - 2);
                    } catch (e) {
                        console.error(`[DRAW_DEBUG] drawFood: Error drawing fallback rect for ${foodItem.type.id}:`, e);
                    }
                }
            }
        });
    } else {
        console.warn("[DRAW_DEBUG] drawFood: ctx, box, or activeFoods is undefined/null.");
    }
    console.log("[DRAW_DEBUG] drawFood: Exiting.");
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
