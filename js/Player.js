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
    }
    
    setClass(classData) {
        this.classData = classData;
        this.radius = classData.playerSize;
        this.maxSpeed = classData.playerSpeed;
        this.baseAcceleration = classData.thrustPower;
        this.health = classData.health;
        this.maxHealth = classData.health;
        this.shootInterval = 1.0; // Base interval, could be class-specific
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
        const distance = Vector2.distance(this.position, otherPlayer.position);
        const minDistance = this.radius + otherPlayer.radius;
        return distance < minDistance;
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
        
        // Draw player
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
}