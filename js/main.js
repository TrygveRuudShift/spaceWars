import { Vector2 } from './Vector2.js';
import { classes } from './gameClasses.js';
import { Joystick } from './Joystick.js';
import { Player } from './Player.js';
import { Bullet, Explosion } from './gameEntities.js';

// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Initialize joysticks
let joystick1, joystick2;

function initJoysticks() {
    joystick1 = new Joystick('joystick1', canvas, 'top');
    joystick2 = new Joystick('joystick2', canvas, 'bottom');
}

// Initialize joysticks after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJoysticks);
} else {
    initJoysticks();
}

// Class selection state
let selectedClasses = {
    player1: 'demolition',
    player2: 'bouncer'
};

// Class selection functions
function initClassSelection() {
    const player1Grid = document.getElementById('player1Classes');
    const player2Grid = document.getElementById('player2Classes');
    
    player1Grid.innerHTML = '';
    player2Grid.innerHTML = '';
    
    Object.keys(classes).forEach(classId => {
        const classData = classes[classId];
        
        // Player 1 card (rotated)
        const card1 = document.createElement('div');
        card1.className = `class-card ${selectedClasses.player1 === classId ? 'selected' : ''}`;
        card1.style.color = classData.color;
        card1.style.borderColor = `${classData.color}40`;
        card1.innerHTML = `
            <div class="class-name">${classData.emoji} ${classData.name}</div>
            <div class="class-stats">${classData.description}</div>
        `;
        card1.onclick = () => selectClass('player1', classId);
        player1Grid.appendChild(card1);
        
        // Player 2 card
        const card2 = document.createElement('div');
        card2.className = `class-card ${selectedClasses.player2 === classId ? 'selected' : ''}`;
        card2.style.color = classData.color;
        card2.style.borderColor = `${classData.color}40`;
        card2.innerHTML = `
            <div class="class-name">${classData.emoji} ${classData.name}</div>
            <div class="class-stats">${classData.description}</div>
        `;
        card2.onclick = () => selectClass('player2', classId);
        player2Grid.appendChild(card2);
    });
}

function selectClass(player, classId) {
    selectedClasses[player] = classId;
    initClassSelection();
}

function showClassSelection() {
    // Hide win screen if showing
    document.getElementById('winScreen').style.display = 'none';
    
    // Stop the game
    gameRunning = false;
    
    // Show class selection
    document.getElementById('classSelection').style.display = 'flex';
    initClassSelection();
}

function startGameWithClasses() {
    document.getElementById('classSelection').style.display = 'none';
    restartGame();
    requestAnimationFrame(gameLoop); // Start the game loop
}

// Create players
const player1 = new Player(canvas.width / 2, 50, '#ff4444', 1, canvas);
const player2 = new Player(canvas.width / 2, canvas.height - 50, '#4444ff', 2, canvas);

// Initialize with default classes to prevent errors
player1.setClass(classes.demolition);
player2.setClass(classes.bouncer);

// Game arrays
const bullets = [];
const explosions = [];

// Game state
let gameRunning = false; // Start as false until class selection is complete
let winner = null;

// Restart game function
function restartGame() {
    // Get selected class data
    const class1 = classes[selectedClasses.player1];
    const class2 = classes[selectedClasses.player2];
    
    // Reset and apply class data to player 1
    player1.position = new Vector2(canvas.width / 2, 50);
    player1.velocity = new Vector2(0, 0);
    player1.setClass(class1, class2);
    player1.shootTimer = 0;
    player1.trail = [];
    player1.lastMovementDirection = new Vector2(0, 1); // Player 1 starts facing down
    
    // Reset and apply class data to player 2
    player2.position = new Vector2(canvas.width / 2, canvas.height - 50);
    player2.velocity = new Vector2(0, 0);
    player2.setClass(class2, class1);
    player2.shootTimer = 0;
    player2.trail = [];
    player2.lastMovementDirection = new Vector2(0, -1); // Player 2 starts facing up
    
    // Clear bullets and explosions
    bullets.length = 0;
    explosions.length = 0;
    
    // Reset game state
    gameRunning = true;
    winner = null;
    
    // Hide win screen
    document.getElementById('winScreen').style.display = 'none';
}

// Joystick-based input handling
let player1InputVector = new Vector2();
let player2InputVector = new Vector2();

// Touch event handling for joysticks
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Try joystick 1 first, then joystick 2
        if (joystick1 && joystick1.handleTouchStart(touch.identifier, touchX, touchY)) {
            continue; // Joystick 1 consumed this touch
        } else if (joystick2 && joystick2.handleTouchStart(touch.identifier, touchX, touchY)) {
            continue; // Joystick 2 consumed this touch
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Try both joysticks
        if (joystick1 && joystick1.handleTouchMove(touch.identifier, touchX, touchY)) {
            continue; // Joystick 1 consumed this touch
        } else if (joystick2 && joystick2.handleTouchMove(touch.identifier, touchX, touchY)) {
            continue; // Joystick 2 consumed this touch
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (let touch of e.changedTouches) {
        // Try both joysticks
        if (joystick1 && joystick1.handleTouchEnd(touch.identifier)) {
            continue; // Joystick 1 consumed this touch
        } else if (joystick2 && joystick2.handleTouchEnd(touch.identifier)) {
            continue; // Joystick 2 consumed this touch
        }
    }
});

// Mouse events for desktop testing
let mouseDown = false;
let mousePos = new Vector2();
let activeMouseJoystick = null;

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    mousePos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);
    
    // Try to activate the appropriate joystick
    const screenMiddle = canvas.height / 2;
    if (mousePos.y < screenMiddle && joystick1 && !joystick1.isActive) {
        joystick1.showAt(mousePos.x, mousePos.y);
        activeMouseJoystick = joystick1;
    } else if (mousePos.y >= screenMiddle && joystick2 && !joystick2.isActive) {
        joystick2.showAt(mousePos.x, mousePos.y);
        activeMouseJoystick = joystick2;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (mouseDown && activeMouseJoystick) {
        const rect = canvas.getBoundingClientRect();
        mousePos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);
        activeMouseJoystick.updateKnobPosition(mousePos.x, mousePos.y);
    }
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    if (activeMouseJoystick) {
        activeMouseJoystick.hide();
        activeMouseJoystick = null;
    }
});

// Game loop
let lastTime = 0;

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
    lastTime = currentTime;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Only update game logic if game is running
    if (gameRunning) {
        // Update input vectors from joysticks
        if (joystick1) {
            player1InputVector = joystick1.getInputVector();
        }
        if (joystick2) {
            player2InputVector = joystick2.getInputVector();
        }
        
        // Check and resolve collisions
        if (player1.checkCollision(player2)) {
            player1.resolveCollision(player2);
        }
    
        // Update players with joystick input
        player1.update(deltaTime, player1InputVector);
        player2.update(deltaTime, player2InputVector);
        
        // Handle player shooting
        if (player1.shootTimer >= player1.shootInterval) {
            const newBullets = player1.shoot();
            bullets.push(...newBullets);
            player1.shootTimer = 0;
        }
        
        if (player2.shootTimer >= player2.shootInterval) {
            const newBullets = player2.shoot();
            bullets.push(...newBullets);
            player2.shootTimer = 0;
        }
        
        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            // Update bullet
            const result = bullet.update(deltaTime);
            if (result.explode) {
                // Create explosion effect
                const explosionRadius = 50;
                explosions.push(new Explosion(bullet.position.x, bullet.position.y, explosionRadius));
                
                // Check if players are in explosion range
                const dist1 = Vector2.distance(bullet.position, player1.position);
                if (dist1 <= explosionRadius && bullet.shooterId !== player1.id) {
                    const damage = Math.max(1, Math.floor(3 * (1 - dist1 / explosionRadius)));
                    player1.takeDamage(damage);
                }
                
                const dist2 = Vector2.distance(bullet.position, player2.position);
                if (dist2 <= explosionRadius && bullet.shooterId !== player2.id) {
                    const damage = Math.max(1, Math.floor(3 * (1 - dist2 / explosionRadius)));
                    player2.takeDamage(damage);
                }
            }
            
            if (result.remove) {
                bullets.splice(i, 1);
                continue;
            }
            
            // Check bullet vs player collisions
            // Phase bullets can only hit when visible
            const canHitPlayer = bullet.weaponType !== "phase" || bullet.isVisible;
            
            if (canHitPlayer && bullet.shooterId !== player1.id && bullet.checkCollision(player1)) {
                player1.takeDamage();
                bullets.splice(i, 1);
                continue;
            }
            
            if (canHitPlayer && bullet.shooterId !== player2.id && bullet.checkCollision(player2)) {
                player2.takeDamage();
                bullets.splice(i, 1);
                continue;
            }
            
            // Check bullet vs bullet collisions
            for (let j = i - 1; j >= 0; j--) {
                const otherBullet = bullets[j];
                
                // Phase bullets can pass through other bullets when invisible
                const bulletCanCollide = bullet.weaponType !== "phase" || bullet.isVisible;
                const otherCanCollide = otherBullet.weaponType !== "phase" || otherBullet.isVisible;
                
                if (bulletCanCollide && otherCanCollide && bullet.checkCollision(otherBullet)) {
                    bullets.splice(i, 1);
                    bullets.splice(j, 1);
                    i--; // Adjust index since we removed two bullets
                    break;
                }
            }
        }
        
        // Update explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];
            const shouldRemove = explosion.update(deltaTime);
            if (shouldRemove) {
                explosions.splice(i, 1);
            }
        }
        
        // Check win conditions after all damage has been applied
        const player1Dead = player1.health <= 0;
        const player2Dead = player2.health <= 0;
        
        if (player1Dead && player2Dead) {
            // Both players died - Draw/Tie
            gameRunning = false;
            document.getElementById('winMessage').textContent = 'Draw! Both Players Eliminated!';
            document.getElementById('winMessage').style.color = '#FFD700'; // Gold color for draw
            document.getElementById('winScreen').style.display = 'flex';
        } else if (player1Dead) {
            // Only Player 1 died - Player 2 wins
            gameRunning = false;
            document.getElementById('winMessage').textContent = 'Player 2 Wins!';
            document.getElementById('winMessage').style.color = '#4444ff';
            document.getElementById('winScreen').style.display = 'flex';
        } else if (player2Dead) {
            // Only Player 2 died - Player 1 wins
            gameRunning = false;
            document.getElementById('winMessage').textContent = 'Player 1 Wins!';
            document.getElementById('winMessage').style.color = '#ff4444';
            document.getElementById('winScreen').style.display = 'flex';
        }
        
        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Always draw players, bullets, and explosions (even when game is paused)
    player1.draw(ctx);
    player2.draw(ctx);
    
    bullets.forEach(bullet => bullet.draw(ctx));
    explosions.forEach(explosion => explosion.draw(ctx));
    
    requestAnimationFrame(gameLoop);
}

// Make functions available globally for HTML onclick handlers
window.restartGame = restartGame;
window.showClassSelection = showClassSelection;
window.startGameWithClasses = startGameWithClasses;

// Start the game
showClassSelection(); // Show class selection first