import { Vector2 } from './Vector2.js';

// Virtual Joystick class for touch-based movement controls
export class Joystick {
    constructor(containerId, canvasElement, screenHalf = 'both') {
        this.container = document.getElementById(containerId);
        this.canvas = canvasElement;
        this.knob = this.container.querySelector('.joystick-knob');
        this.screenHalf = screenHalf; // 'top', 'bottom', or 'both'
        this.isActive = false;
        this.currentTouch = null;
        this.startPos = new Vector2();
        this.currentPos = new Vector2();
        this.vector = new Vector2();
        this.maxDistance = 60; // Maximum distance knob can move from center
        this.deadZone = 0.15; // Minimum input threshold (0-1)
    }
    
    isInCorrectScreenHalf(touchY) {
        if (this.screenHalf === 'both') return true;
        
        const screenMiddle = this.canvas.height / 2;
        if (this.screenHalf === 'top') {
            return touchY < screenMiddle;
        } else if (this.screenHalf === 'bottom') {
            return touchY >= screenMiddle;
        }
        return false;
    }
    
    showAt(x, y) {
        this.container.style.left = (x - 60) + 'px';
        this.container.style.top = (y - 60) + 'px';
        this.container.classList.add('active');
        this.startPos.x = x;
        this.startPos.y = y;
        this.isActive = true;
        this.resetKnob();
    }
    
    hide() {
        this.container.classList.remove('active');
        this.isActive = false;
        this.currentTouch = null;
        this.vector.x = 0;
        this.vector.y = 0;
        this.resetKnob();
    }
    
    resetKnob() {
        this.knob.style.transform = 'translate(-50%, -50%)';
    }
    
    updateKnobPosition(x, y) {
        const deltaX = x - this.startPos.x;
        const deltaY = y - this.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let finalX = deltaX;
        let finalY = deltaY;
        
        // Constrain knob to circle
        if (distance > this.maxDistance) {
            finalX = (deltaX / distance) * this.maxDistance;
            finalY = (deltaY / distance) * this.maxDistance;
        }
        
        this.knob.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;
        
        // Calculate normalized vector
        const normalizedDistance = Math.min(distance / this.maxDistance, 1.0);
        if (normalizedDistance > this.deadZone) {
            const magnitude = (normalizedDistance - this.deadZone) / (1.0 - this.deadZone);
            this.vector.x = (finalX / this.maxDistance) * magnitude;
            this.vector.y = (finalY / this.maxDistance) * magnitude;
        } else {
            this.vector.x = 0;
            this.vector.y = 0;
        }
    }
    
    getInputVector() {
        return this.vector.copy();
    }
    
    // Handle touch events from external canvas listeners
    handleTouchStart(touchId, x, y) {
        if (!this.isActive && this.isInCorrectScreenHalf(y)) {
            this.currentTouch = touchId;
            this.showAt(x, y);
            return true; // Consumed this touch
        }
        return false; // Not consumed
    }
    
    handleTouchMove(touchId, x, y) {
        if (this.isActive && this.currentTouch === touchId) {
            this.updateKnobPosition(x, y);
            return true; // Consumed this touch
        }
        return false; // Not consumed
    }
    
    handleTouchEnd(touchId) {
        if (this.isActive && this.currentTouch === touchId) {
            this.hide();
            return true; // Consumed this touch
        }
        return false; // Not consumed
    }
}