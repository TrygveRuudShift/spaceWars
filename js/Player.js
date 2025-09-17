import { Vector2 } from './Vector2.js';
import { Bullet } from './gameEntities.js';

// Player class for game characters
export class Player {
    constructor(x, y, color, id, canvas) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.radius = 25;
        this.color = color;
        this.id = id;
        this.maxSpeed = 6;
        this.baseAcceleration = 0.4;
        this.health = 10;
        this.maxHealth = 10;
        this.shootTimer = 0;
        this.shootInterval = 1.0;
        this.minSpeed = 0.05; // Minimum speed before stopping
        this.lastMovementDirection = this.id === 1 ? new Vector2(0, 1) : new Vector2(0, -1);
        this.mass = 1; // For collision physics
        this.canvas = canvas;
        this.classData = null; // Set when class is assigned
        this.sprite = null; // Will hold the loaded sprite image
        this.spriteLoaded = false;
        this.thrustParticles = []; // Particles for thrust effects
        this.muzzleFlashTimer = 0; // Timer for muzzle flash effect
        this.impactParticles = []; // Particles for impact effects
        this.isDying = false; // Whether player is in death animation
        this.deathTimer = 0; // Timer for death animation
        this.deathDuration = 0.5; // How long the death fade takes (in seconds)
        this.alpha = 1.0; // Alpha for fading effect
    }
    
    setClass(classData, otherPlayerClass = null) {
        this.classData = classData;
        this.radius = classData.playerSize;
        this.maxSpeed = classData.playerSpeed;
        this.baseAcceleration = classData.thrustPower;
        this.health = classData.health;
        this.maxHealth = classData.health;
        // Convert shootingFrequency (frames) to interval (seconds)
        this.shootInterval = classData.shootingFrequency / 60.0; // 60 FPS conversion
        
        // Check if both players have the same class and apply hue shift
        this.needsHueShift = otherPlayerClass && classData.name === otherPlayerClass.name;
        if (this.needsHueShift) {
            // Player 2 gets a hue shift when both select the same class
            this.hueShiftDegrees = this.id === 2 ? 180 : 0;
        } else {
            this.needsHueShift = false;
            this.hueShiftDegrees = 0;
        }
        
        // Load sprite if available
        if (classData.spriteUrl) {
            this.loadSprite(classData.spriteUrl);
        }
    }
    
    loadSprite(url) {
        console.log(`Attempting to load sprite: ${url}`);
        this.sprite = new Image();
        this.sprite.onload = () => {
            console.log(`Sprite loaded successfully: ${url}`);
            this.spriteLoaded = true;
        };
        this.sprite.onerror = () => {
            console.warn(`Failed to load sprite: ${url}`);
            this.spriteLoaded = false;
        };
        this.sprite.src = url;
    }
    
    update(deltaTime, inputVector = null) {
        // Update death animation if dying
        if (this.isDying) {
            this.deathTimer += deltaTime / 60; // Convert to seconds
            this.alpha = Math.max(0, 1 - (this.deathTimer / this.deathDuration));
            
            // Don't process other updates if dying
            if (this.deathTimer >= this.deathDuration) {
                this.alpha = 0;
                return;
            }
        }
        
        // Directional movement system using joystick input
        if (inputVector && (inputVector.x !== 0 || inputVector.y !== 0)) {
            // Apply input vector to acceleration
            const acceleration = inputVector.copy().multiply(this.baseAcceleration);
            this.velocity.add(acceleration.copy().multiply(deltaTime));
            
            // Limit max speed
            if (this.velocity.length() > this.maxSpeed) {
                this.velocity.normalize().multiply(this.maxSpeed);
            }
            
            // Update movement direction for shooting
            this.lastMovementDirection = inputVector.copy().normalize();
        } else {
            // No input - apply friction/deceleration
            this.velocity.multiply(0.92);
            
            // Stop very slow movement to prevent jittering
            if (this.velocity.length() < this.minSpeed) {
                this.velocity.multiply(0.1);
            }
        }
        
        // Apply velocity to position
        this.position.add(this.velocity.copy().multiply(deltaTime));
        
        // Create thrust particles when moving
        if (inputVector && (inputVector.x !== 0 || inputVector.y !== 0) && this.velocity.length() > 1) {
            this.createThrustParticles(inputVector);
        }
        
        // Update thrust particles
        this.updateThrustParticles(deltaTime);
        
        // Update impact particles
        this.updateImpactParticles(deltaTime);
        
        // Update muzzle flash timer
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= deltaTime;
        }
        
        // Update shooting timer
        this.shootTimer += deltaTime / 60;
        
        // Handle screen boundaries (bounce)
        if (this.position.x - this.radius < 0 || this.position.x + this.radius > this.canvas.width) {
            this.velocity.x *= -0.8;
            this.position.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.position.x));
        }
        if (this.position.y - this.radius < 0 || this.position.y + this.radius > this.canvas.height) {
            this.velocity.y *= -0.8;
            this.position.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.position.y));
        }
    }
    
    shoot() {
        if (!this.classData) return [];
        
        // Determine shooting direction based on current velocity or last movement direction
        let shootDirection;
        if (this.velocity.length() > 0.1) {
            // Use current movement direction
            shootDirection = this.velocity.copy().normalize();
            // Update last movement direction
            this.lastMovementDirection = shootDirection.copy();
        } else {
            // Use last significant movement direction when stationary
            shootDirection = this.lastMovementDirection.copy();
        }
        
        const bullets = [];
        
        // Handle different weapon types
        switch(this.classData.weaponType) {
            case "side":
                // Sidewinder shoots from both sides (closer to center)
                const perpendicular = new Vector2(-shootDirection.y, shootDirection.x);
                
                // Left side bullet (closer to center)
                const leftStart = this.position.copy().add(perpendicular.copy().multiply(this.radius * 0.6 + 3)); // Reduced from radius + 5
                const leftBullet = new Bullet(leftStart.x, leftStart.y, shootDirection, this.classData, this.id, this.canvas);
                bullets.push(leftBullet);
                
                // Right side bullet (closer to center)
                const rightStart = this.position.copy().add(perpendicular.copy().multiply(-(this.radius * 0.6 + 3))); // Reduced from radius + 5
                const rightBullet = new Bullet(rightStart.x, rightStart.y, shootDirection, this.classData, this.id, this.canvas);
                bullets.push(rightBullet);
                break;
                
            case "rear":
                // Retreat specialist shoots backwards
                const rearDirection = shootDirection.copy().multiply(-1);
                const rearStart = this.position.copy().add(rearDirection.copy().multiply(this.radius + 5));
                const rearBullet = new Bullet(rearStart.x, rearStart.y, rearDirection, this.classData, this.id, this.canvas);
                bullets.push(rearBullet);
                break;
                
            default:
                // Standard forward shooting
                const bulletStart = this.position.copy().add(shootDirection.copy().multiply(this.radius + 5));
                const bullet = new Bullet(bulletStart.x, bulletStart.y, shootDirection, this.classData, this.id, this.canvas);
                bullets.push(bullet);
                break;
        }
        
        // Set muzzle flash effect
        this.muzzleFlashTimer = 5; // Show muzzle flash for 5 frames
        
        return bullets;
    }
    
    createThrustParticles(inputVector) {
        // Create particles behind the ship when thrusting
        // Use ship's actual facing direction, not input direction
        let shipDirection;
        if (this.velocity.length() > 0.1) {
            shipDirection = this.velocity.copy().normalize();
        } else {
            shipDirection = this.lastMovementDirection.copy();
        }
        
        const thrustDirection = shipDirection.copy().multiply(-1); // Opposite to ship facing
        
        // Create 2-3 particles per frame when thrusting
        for (let i = 0; i < 2; i++) {
            const spreadAngle = (Math.random() - 0.5) * 0.2; // Small spread
            const particleDirection = thrustDirection.copy();
            
            // Rotate the direction by spread angle
            const cos = Math.cos(spreadAngle);
            const sin = Math.sin(spreadAngle);
            const newX = particleDirection.x * cos - particleDirection.y * sin;
            const newY = particleDirection.x * sin + particleDirection.y * cos;
            particleDirection.x = newX;
            particleDirection.y = newY;
            
            // Position particles at the actual back of the ship (closer to center)
            const backOffset = thrustDirection.copy().multiply(this.radius * 0.9); // Closer to ship
            const startPos = this.position.copy().add(backOffset);
            
            const particle = {
                position: startPos,
                velocity: particleDirection.copy().multiply(2 + Math.random() * 3),
                life: 15 + Math.random() * 10, // 15-25 frames
                maxLife: 25,
                size: 1 + Math.random() * 2
            };
            
            this.thrustParticles.push(particle);
        }
        
        // Limit particle count
        if (this.thrustParticles.length > 50) {
            this.thrustParticles.splice(0, this.thrustParticles.length - 50);
        }
    }
    
    updateThrustParticles(deltaTime) {
        for (let i = this.thrustParticles.length - 1; i >= 0; i--) {
            const particle = this.thrustParticles[i];
            
            // Update particle position
            particle.position.add(particle.velocity.copy().multiply(deltaTime));
            
            // Update particle life
            particle.life -= deltaTime;
            
            // Apply friction to particles
            particle.velocity.multiply(0.95);
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.thrustParticles.splice(i, 1);
            }
        }
    }
    
    createImpactParticles() {
        // Create red impact particles when taking damage
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;
            
            const particle = {
                position: this.position.copy(),
                velocity: new Vector2(Math.cos(angle), Math.sin(angle)).multiply(speed),
                life: 20 + Math.random() * 15,
                maxLife: 35,
                size: 2 + Math.random() * 2
            };
            
            this.impactParticles.push(particle);
        }
    }
    
    updateImpactParticles(deltaTime) {
        for (let i = this.impactParticles.length - 1; i >= 0; i--) {
            const particle = this.impactParticles[i];
            
            // Update particle position
            particle.position.add(particle.velocity.copy().multiply(deltaTime));
            
            // Update particle life
            particle.life -= deltaTime;
            
            // Apply friction to particles
            particle.velocity.multiply(0.92);
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.impactParticles.splice(i, 1);
            }
        }
    }
    
    takeDamage(amount = 1) {
        this.health = Math.max(0, this.health - amount);
        
        // Create impact particles when taking damage
        this.createImpactParticles();
        
        // Start death animation if health reaches 0
        if (this.health <= 0 && !this.isDying) {
            this.startDeathAnimation();
        }
        
        return this.health <= 0; // Return true if player is dead
    }
    
    startDeathAnimation() {
        this.isDying = true;
        this.deathTimer = 0;
    }
    
    resetDeathState() {
        this.isDying = false;
        this.deathTimer = 0;
        this.alpha = 1.0;
    }
    
    checkCollision(otherPlayer) {
        // Use simplified hitbox collision for debugging
        if (this.classData && this.classData.simpleHitbox) {
            return this.checkSimpleHitboxCollision(otherPlayer);
        }
        
        // Fallback to simple circular collision
        const distance = Vector2.distance(this.position, otherPlayer.position);
        const minDistance = this.radius + otherPlayer.radius;
        return distance < minDistance;
    }
    
    checkSimpleHitboxCollision(otherPlayer) {
        const thisAngle = this.getShipAngle();
        const otherAngle = otherPlayer.getShipAngle();
        
        // Get hitbox bounds for both players
        const thisBox = this.getSimpleHitboxBounds(thisAngle);
        const otherBox = otherPlayer.classData && otherPlayer.classData.simpleHitbox 
            ? otherPlayer.getSimpleHitboxBounds(otherAngle)
            : { x: otherPlayer.position.x - otherPlayer.radius, y: otherPlayer.position.y - otherPlayer.radius, 
                width: otherPlayer.radius * 2, height: otherPlayer.radius * 2 };
        
        // Simple AABB collision detection (approximate for rotated boxes)
        const distance = Vector2.distance(this.position, otherPlayer.position);
        const maxDimension = Math.max(thisBox.width, thisBox.height, otherBox.width, otherBox.height);
        
        return distance < maxDimension * 0.6; // Simplified collision threshold
    }
    
    getSimpleHitboxBounds(angle) {
        const hitbox = this.classData.simpleHitbox;
        // Return approximate bounds (we'll use distance-based collision for simplicity)
        return {
            x: this.position.x - hitbox.width / 2,
            y: this.position.y - hitbox.height / 2,
            width: hitbox.width,
            height: hitbox.height
        };
    }
    
    getShipAngle() {
        // Calculate ship rotation based on movement direction
        // Add PI/2 to orient the composite shapes correctly (gun pointing forward)
        if (this.velocity.length() > 0.1) {
            return Math.atan2(this.velocity.y, this.velocity.x) + Math.PI/2;
        }
        return Math.atan2(this.lastMovementDirection.y, this.lastMovementDirection.x) + Math.PI/2;
    }
    
    getPartWorldPosition(part, angle) {
        // Rotate and translate part position to world coordinates
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const rotatedX = part.x * cos - part.y * sin;
        const rotatedY = part.x * sin + part.y * cos;
        
        return {
            x: this.position.x + rotatedX,
            y: this.position.y + rotatedY,
            ...part
        };
    }
    
    checkPartCollision(part1, pos1, part2, pos2) {
        // Simplified collision check between two parts
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Get approximate radius for each part
        const radius1 = this.getPartRadius(part1);
        const radius2 = this.getPartRadius(part2);
        
        return distance < (radius1 + radius2);
    }
    
    checkPartVsCircle(part, partPos, circlePos, circleRadius) {
        const dx = partPos.x - circlePos.x;
        const dy = partPos.y - circlePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const partRadius = this.getPartRadius(part);
        return distance < (partRadius + circleRadius);
    }
    
    getPartRadius(part) {
        // Calculate approximate radius for different part types
        switch (part.type) {
            case "circle":
                return part.radius;
            case "rectangle":
                return Math.max(part.width, part.height) / 2;
            case "triangle":
                return Math.max(part.width, part.height) / 2.5;
            case "diamond":
                return Math.max(part.width, part.height) / 2.2;
            case "hexagon":
                return part.radius;
            case "star":
                return part.radius;
            default:
                return 10; // Default radius
        }
    }
    
    resolveCollision(otherPlayer) {
        const distance = Vector2.distance(this.position, otherPlayer.position);
        const minDistance = this.radius + otherPlayer.radius;
        
        if (distance < minDistance) {
            // Calculate collision normal
            const normal = otherPlayer.position.copy().subtract(this.position).normalize();
            
            // Separate the players
            const overlap = minDistance - distance;
            const separation = normal.copy().multiply(overlap * 0.5);
            
            this.position.subtract(separation);
            otherPlayer.position.add(separation);
            
            // Calculate relative velocity
            const relativeVelocity = this.velocity.copy().subtract(otherPlayer.velocity);
            const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
            
            // Don't resolve if velocities are separating
            if (velocityAlongNormal > 0) return;
            
            // Calculate restitution (bounciness)
            const restitution = 4.8;
            
            // Calculate impulse scalar
            let impulseScalar = -(1 + restitution) * velocityAlongNormal;
            impulseScalar /= (1/this.mass + 1/otherPlayer.mass);
            
            // Apply impulse
            const impulse = normal.copy().multiply(impulseScalar);
            this.velocity.subtract(impulse.copy().multiply(1/this.mass));
            otherPlayer.velocity.add(impulse.copy().multiply(1/otherPlayer.mass));
        }
    }
    
    draw(ctx) {
        // Save context and apply alpha for death fade effect
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Draw thrust particles first (behind ship)
        this.drawThrustParticles(ctx);
        
        // Draw impact particles
        this.drawImpactParticles(ctx);
        
        // Draw sprite if loaded, otherwise fall back to composite design
        if (this.spriteLoaded && this.sprite) {
            this.drawSprite(ctx);
        } else if (this.classData && this.classData.hitboxShape === "composite") {
            // Add debug info
            if (this.classData.spriteUrl && !this.spriteLoaded) {
                console.log(`Sprite not loaded yet for ${this.classData.name}: ${this.classData.spriteUrl}`);
            }
            this.drawCompositeHitbox(ctx);
        } else {
            // Draw simple circular player
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw debug hitbox with green lines (commented out)
        // if (this.classData && this.classData.simpleHitbox) {
        //     this.drawDebugHitbox(ctx);
        // }
        
        // Draw muzzle flash effect
        if (this.muzzleFlashTimer > 0) {
            this.drawMuzzleFlash(ctx);
        }
        
        // Draw health bar
        const barWidth = 40;
        const barHeight = 6;
        const barX = this.position.x - barWidth / 2;
        const barY = this.position.y - this.radius - 15;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#4CAF50' : healthPercent > 0.3 ? '#FFC107' : '#F44336';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Health bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Restore context (for alpha transparency effect)
        ctx.restore();
    }
    
    drawSprite(ctx) {
        // Sprites have gun turrets pointing down, add PI/2 + PI to orient correctly
        let angle;
        if (this.velocity.length() > 0.1) {
            angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI/2 + Math.PI;
        } else {
            angle = Math.atan2(this.lastMovementDirection.y, this.lastMovementDirection.x) + Math.PI/2 + Math.PI;
        }
        
        const spriteSize = this.classData.spriteSize || 32;
        const scale = (this.radius * 2) / spriteSize; // Scale sprite to match player size
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        // Apply hue shift if this player needs it (for duplicate class selection)
        if (this.needsHueShift) {
            ctx.filter = `hue-rotate(${this.hueShiftDegrees}deg)`;
        }
        
        // Draw the sprite centered
        ctx.drawImage(
            this.sprite,
            -spriteSize * scale / 2,
            -spriteSize * scale / 2,
            spriteSize * scale,
            spriteSize * scale
        );
        
        ctx.restore();
    }
    
    drawThrustParticles(ctx) {
        for (const particle of this.thrustParticles) {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size * alpha;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = '#ff6600'; // Orange/red thrust color
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a bright center
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawImpactParticles(ctx) {
        for (const particle of this.impactParticles) {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size * alpha;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = '#ff3333'; // Red impact color
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a bright center
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawMuzzleFlash(ctx) {
        // Get shooting direction
        let shootDirection;
        if (this.velocity.length() > 0.1) {
            shootDirection = this.velocity.copy().normalize();
        } else {
            shootDirection = this.lastMovementDirection.copy();
        }
        
        // Draw muzzle flash at gun position(s)
        const flashIntensity = this.muzzleFlashTimer / 5; // Fade out over time
        const flashSize = 6 + Math.random() * 3; // Slightly smaller
        
        ctx.save();
        ctx.globalAlpha = flashIntensity * 0.8;
        
        if (this.classData && this.classData.weaponType === "side") {
            // Sidewinder: dual muzzle flashes
            const perpendicular = new Vector2(-shootDirection.y, shootDirection.x);
            
            // Left flash position
            const leftFlashPos = this.position.copy()
                .add(perpendicular.copy().multiply(this.radius * 0.6 + 3))
                .add(shootDirection.copy().multiply(this.radius * 0.3));
            
            // Right flash position
            const rightFlashPos = this.position.copy()
                .add(perpendicular.copy().multiply(-(this.radius * 0.6 + 3)))
                .add(shootDirection.copy().multiply(this.radius * 0.3));
            
            // Draw both flashes
            this.drawSingleMuzzleFlash(ctx, leftFlashPos, flashSize);
            this.drawSingleMuzzleFlash(ctx, rightFlashPos, flashSize);
            
        } else if (this.classData && this.classData.weaponType === "rear") {
            // Retreat specialist: rear flash
            const rearFlashPos = this.position.copy().add(shootDirection.copy().multiply(-(this.radius + 5)));
            this.drawSingleMuzzleFlash(ctx, rearFlashPos, flashSize);
            
        } else {
            // Standard forward flash
            const flashPos = this.position.copy().add(shootDirection.copy().multiply(this.radius + 5));
            this.drawSingleMuzzleFlash(ctx, flashPos, flashSize);
        }
        
        ctx.restore();
    }
    
    drawSingleMuzzleFlash(ctx, position, size) {
        // Outer flash (yellow)
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner flash (white)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(position.x, position.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawDebugHitbox(ctx) {
        const angle = this.getShipAngle();
        const hitbox = this.classData.simpleHitbox;
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        ctx.strokeStyle = '#00FF00'; // Bright green for debug
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (hitbox.type === "oval") {
            // Draw ellipse
            ctx.ellipse(0, 0, hitbox.width / 2, hitbox.height / 2, 0, 0, Math.PI * 2);
        } else if (hitbox.type === "rectangle") {
            // Draw rectangle
            ctx.rect(-hitbox.width / 2, -hitbox.height / 2, hitbox.width, hitbox.height);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    drawCompositeHitbox(ctx) {
        const angle = this.getShipAngle();
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        // Draw each part of the composite hitbox
        for (const part of this.classData.hitboxParts) {
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            
            this.drawHitboxPart(ctx, part);
        }
        
        ctx.restore();
    }
    
    drawHitboxPart(ctx, part) {
        ctx.beginPath();
        
        switch (part.type) {
            case "rectangle":
                ctx.rect(part.x - part.width/2, part.y - part.height/2, part.width, part.height);
                break;
                
            case "circle":
                ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
                break;
                
            case "triangle":
                ctx.moveTo(part.x, part.y - part.height/2);
                ctx.lineTo(part.x - part.width/2, part.y + part.height/2);
                ctx.lineTo(part.x + part.width/2, part.y + part.height/2);
                ctx.closePath();
                break;
                
            case "diamond":
                ctx.moveTo(part.x, part.y - part.height/2);
                ctx.lineTo(part.x + part.width/2, part.y);
                ctx.lineTo(part.x, part.y + part.height/2);
                ctx.lineTo(part.x - part.width/2, part.y);
                ctx.closePath();
                break;
                
            case "hexagon":
                for (let i = 0; i < 6; i++) {
                    const hexAngle = (i * Math.PI) / 3;
                    const x = part.x + part.radius * Math.cos(hexAngle);
                    const y = part.y + part.radius * Math.sin(hexAngle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
                
            case "star":
                const spikes = 5;
                const outerRadius = part.radius;
                const innerRadius = part.radius * 0.5;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const starAngle = (i * Math.PI) / spikes;
                    const x = part.x + radius * Math.cos(starAngle);
                    const y = part.y + radius * Math.sin(starAngle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
        }
        
        ctx.fill();
        ctx.stroke();
    }
}