// Vector2 utility class
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }
    
    copy() {
        return new Vector2(this.x, this.y);
    }
    
    // Get the angle of this vector in radians
    angle() {
        return Math.atan2(this.y, this.x);
    }
    
    // Create a vector from an angle (in radians)
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
    
    // Get the angle difference between two angles, normalized to [-PI, PI]
    static angleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }
    
    static distance(v1, v2) {
        return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
    }
}