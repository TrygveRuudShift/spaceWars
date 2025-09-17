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
    joystick1 = new Joystick('joystick1', canvas, 'bottom');
    joystick2 = new Joystick('joystick2', canvas, 'top');
}

// Initialize joysticks after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJoysticks);
} else {
    initJoysticks();
}

// Function to get random class
function getRandomClass() {
    const classKeys = Object.keys(classes);
    return classKeys[Math.floor(Math.random() * classKeys.length)];
}

// Class selection state with random defaults
let selectedClasses = {
    player1: getRandomClass(),
    player2: getRandomClass()
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
    
    // Apply winner glow effect to the last winner's title
    const player1Title = document.querySelector('.player1-section .player-title');
    const player2Title = document.querySelector('.player2-section .player-title');
    
    // Remove winner class from both titles first
    player1Title.classList.remove('winner');
    player2Title.classList.remove('winner');
    
    // Add winner class to the appropriate title
    if (lastWinner === 'player1') {
        player1Title.classList.add('winner');
    } else if (lastWinner === 'player2') {
        player2Title.classList.add('winner');
    }
    // Note: For draws, neither player gets the winner glow
}

function selectClass(player, classId) {
    selectedClasses[player] = classId;
    initClassSelection();
}

function showClassSelection() {
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
const player1 = new Player(canvas.width / 2, canvas.height - 50, '#ff4444', 1, canvas);
const player2 = new Player(canvas.width / 2, 50, '#4444ff', 2, canvas);

// Initialize with default classes to prevent errors
player1.setClass(classes.demolition);
player2.setClass(classes.bouncer);

// Game arrays
const bullets = [];
const explosions = [];

// Game state
let gameRunning = false; // Start as false until class selection is complete
let winner = null;
let lastWinner = null; // Track the last winner for UI effects

// Restart game function
function restartGame() {
    // Get selected class data
    const class1 = classes[selectedClasses.player1];
    const class2 = classes[selectedClasses.player2];
    
    // Reset and apply class data to player 1
    player1.position = new Vector2(canvas.width / 2, canvas.height - 50);
    player1.velocity = new Vector2(0, 0);
    player1.setClass(class1, class2);
    player1.shootTimer = 0;
    player1.lastMovementDirection = new Vector2(0, -1); // Player 1 starts facing up
    player1.resetDeathState(); // Reset death animation state
    
    // Reset and apply class data to player 2
    player2.position = new Vector2(canvas.width / 2, 50);
    player2.velocity = new Vector2(0, 0);
    player2.setClass(class2, class1);
    player2.shootTimer = 0;
    player2.lastMovementDirection = new Vector2(0, 1); // Player 2 starts facing down
    player2.resetDeathState(); // Reset death animation state
    
    // Clear bullets and explosions
    bullets.length = 0;
    explosions.length = 0;
    
    // Reset game state
    gameRunning = true;
    winner = null;
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
    if (mousePos.y >= screenMiddle && joystick1 && !joystick1.isActive) {
        joystick1.showAt(mousePos.x, mousePos.y);
        activeMouseJoystick = joystick1;
    } else if (mousePos.y < screenMiddle && joystick2 && !joystick2.isActive) {
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
    
    // Clear canvas completely
    ctx.fillStyle = 'rgb(10, 10, 10)'; // Solid black background
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
        
        // Check win conditions after all damage has been applied
        const player1Dead = player1.health <= 0;
        const player2Dead = player2.health <= 0;
        
        if (player1Dead || player2Dead) {
            // Game over - create explosion effects and show winner
            gameRunning = false;
            
            // Create explosion at destroyed ship(s) location
            if (player1Dead) {
                explosions.push(new Explosion(player1.position.x, player1.position.y, 80)); // Larger explosion for ship destruction
            }
            if (player2Dead) {
                explosions.push(new Explosion(player2.position.x, player2.position.y, 80)); // Larger explosion for ship destruction
            }
            
            // Show winner message
            let winnerMessage = '';
            let messageColor = '';
            
            if (player1Dead && player2Dead) {
                winnerMessage = 'Draw! Both Players Eliminated!';
                messageColor = '#FFD700'; // Gold color for draw
                lastWinner = 'draw';
            } else if (player1Dead) {
                winnerMessage = 'Player 2 Wins!';
                messageColor = '#4444ff'; // Player 2 color
                lastWinner = 'player2';
            } else if (player2Dead) {
                winnerMessage = 'Player 1 Wins!';
                messageColor = '#ff4444'; // Player 1 color
                lastWinner = 'player1';
            }
            
            // Store winner info for display during pause
            winner = { message: winnerMessage, color: messageColor };
            
            // Add a delay before showing class selection for better UX
            setTimeout(() => {
                winner = null; // Clear winner message
                showClassSelection();
            }, 1000); // 1 second delay to see explosion and winner message
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
    
    // Update explosions even when game is not running (for death explosions)
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        const shouldRemove = explosion.update(deltaTime);
        if (shouldRemove) {
            explosions.splice(i, 1);
        }
    }
    
    // Update death animations even when game is not running
    if (!gameRunning) {
        if (player1.isDying) {
            player1.update(deltaTime, null);
        }
        if (player2.isDying) {
            player2.update(deltaTime, null);
        }
    }
    
    // Draw winner message if game just ended
    if (winner) {
        ctx.save();
        ctx.fillStyle = winner.color;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Draw winner message in center of screen
        ctx.fillText(winner.message, canvas.width / 2, canvas.height / 2);
        
        ctx.restore();
    }
    
    requestAnimationFrame(gameLoop);
}

// Make functions available globally for HTML onclick handlers
window.restartGame = restartGame;
window.showClassSelection = showClassSelection;
window.startGameWithClasses = startGameWithClasses;

// Start the game
showClassSelection(); // Show class selection first