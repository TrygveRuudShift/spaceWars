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
        this.trail = [];
        this.maxTrailLength = 20;
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
        
        // Add current position to trail
        this.trail.push(this.position.copy());
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
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
                // Sidewinder shoots from both sides
                const perpendicular = new Vector2(-shootDirection.y, shootDirection.x);
                
                // Left side bullet
                const leftStart = this.position.copy().add(perpendicular.copy().multiply(this.radius + 5));
                const leftBullet = new Bullet(leftStart.x, leftStart.y, shootDirection, this.classData, this.id, this.canvas);
                bullets.push(leftBullet);
                
                // Right side bullet
                const rightStart = this.position.copy().add(perpendicular.copy().multiply(-(this.radius + 5)));
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
        
        return bullets;
    }
    
    takeDamage(amount = 1) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0; // Return true if player is dead
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
        // Draw trail
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = i / this.trail.length;
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
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
        
        // Draw velocity indicator
        if (this.velocity.length() > 0.5) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const velIndicator = this.velocity.copy().normalize().multiply(this.radius + 10);
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.position.x + velIndicator.x, this.position.y + velIndicator.y);
            ctx.stroke();
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