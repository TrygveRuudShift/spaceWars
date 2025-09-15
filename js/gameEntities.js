import { Vector2 } from './Vector2.js';

// Bullet class for projectiles
export class Bullet {
    constructor(x, y, direction, playerClass, shooterId, canvas) {
        this.position = new Vector2(x, y);
        this.velocity = direction.copy().normalize().multiply(playerClass.bulletSpeed);
        this.radius = playerClass.bulletSize;
        this.color = playerClass.color;
        this.shooterId = shooterId;
        this.weaponType = playerClass.weaponType;
        this.lifetime = this.weaponType === "explosive" ? 1.0 : 0.8;
        this.age = 0;
        this.bounces = 0;
        this.maxBounces = 3;
        this.isVisible = true;
        this.phaseTimer = 0;
        this.canvas = canvas;
    }
    
    update(deltaTime) {
        this.age += deltaTime / 60; // Convert to seconds
        
        // Handle weapon-specific behaviors
        switch(this.weaponType) {
            case "explosive":
                // Explosive bullets explode after 1 second
                if (this.age >= 1.0) {
                    return { explode: true, remove: true };
                }
                break;
                
            case "bounce":
                // Handle wall bouncing
                if (this.position.x <= this.radius || this.position.x >= this.canvas.width - this.radius) {
                    this.velocity.x *= -1;
                    this.bounces++;
                }
                if (this.position.y <= this.radius || this.position.y >= this.canvas.height - this.radius) {
                    this.velocity.y *= -1;
                    this.bounces++;
                }
                if (this.bounces >= this.maxBounces) {
                    return { remove: true };
                }
                break;
                
            case "portal":
                // Portal bullets warp through walls
                if (this.position.x < 0) this.position.x = this.canvas.width;
                if (this.position.x > this.canvas.width) this.position.x = 0;
                if (this.position.y < 0) this.position.y = this.canvas.height;
                if (this.position.y > this.canvas.height) this.position.y = 0;
                break;
                
            case "phase":
                // Phase bullets become invisible periodically
                this.phaseTimer += deltaTime / 60;
                this.isVisible = Math.floor(this.phaseTimer * 4) % 2 === 0;
                break;
        }
        
        this.position.add(this.velocity.copy().multiply(deltaTime));
        
        // Check if bullet is out of bounds or expired (except for portal bullets)
        if (this.weaponType === "portal") {
            return { remove: this.age >= this.lifetime };
        } else {
            const outOfBounds = this.position.x < 0 || this.position.x > this.canvas.width ||
                               this.position.y < 0 || this.position.y > this.canvas.height;
            return { remove: this.age >= this.lifetime || outOfBounds };
        }
    }
    
    draw(ctx) {
        // Don't draw if bullet is in phase mode and invisible
        if (this.weaponType === "phase" && !this.isVisible) {
            return;
        }
        
        const alpha = Math.max(0, 1 - (this.age / this.lifetime)); // Fade out over time
        ctx.globalAlpha = alpha;
        
        // Special visual effects for different weapon types
        switch(this.weaponType) {
            case "explosive":
                // Pulsing red effect for explosives
                const pulseIntensity = 0.5 + 0.5 * Math.sin(this.age * 10);
                ctx.fillStyle = `rgba(255, 100, 0, ${pulseIntensity})`;
                break;
            case "bounce":
                // Green glow for bouncing bullets
                ctx.fillStyle = this.color;
                ctx.shadowColor = "#32CD32";
                ctx.shadowBlur = 15;
                break;
            case "portal":
                // Purple swirling effect for portal bullets
                ctx.fillStyle = this.color;
                ctx.shadowColor = "#8A2BE2";
                ctx.shadowBlur = 20;
                break;
            case "phase":
                // Flickering effect for phase bullets
                ctx.fillStyle = this.color;
                ctx.shadowColor = "#4B0082";
                ctx.shadowBlur = 10;
                break;
            default:
                ctx.fillStyle = this.color;
                break;
        }
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add additional glow effect
        if (this.weaponType !== "bounce") {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    
    checkCollision(other) {
        // Check if other is a player with simplified hitbox
        if (other.classData && other.classData.simpleHitbox) {
            return this.checkCollisionWithSimpleHitbox(other);
        }
        
        // Standard circular collision
        const distance = Vector2.distance(this.position, other.position);
        return distance < (this.radius + other.radius);
    }
    
    checkCollisionWithSimpleHitbox(player) {
        const distance = Vector2.distance(this.position, player.position);
        const hitbox = player.classData.simpleHitbox;
        
        // Use the larger dimension of the hitbox as collision radius
        const hitboxRadius = Math.max(hitbox.width, hitbox.height) / 2;
        
        return distance < (this.radius + hitboxRadius * 0.8); // Slightly smaller for better feel
    }
}

// Explosion class for visual effects
export class Explosion {
    constructor(x, y, radius = 50) {
        this.position = new Vector2(x, y);
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.age = 0;
        this.lifetime = 0.5; // Half second explosion
    }
    
    update(deltaTime) {
        this.age += deltaTime / 60;
        this.currentRadius = this.maxRadius * (this.age / this.lifetime);
        return this.age >= this.lifetime;
    }
    
    draw(ctx) {
        const alpha = 1 - (this.age / this.lifetime);
        
        // Draw explosion rings
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
}