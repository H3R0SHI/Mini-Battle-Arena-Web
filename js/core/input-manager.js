/**
 * Input Manager
 * Handles all input including touch, mouse, keyboard, and virtual controls
 */

class InputManager {
    constructor() {
        this.keys = new Map();
        this.touches = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            button: -1
        };
        
        // Virtual joystick state
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0,
            distance: 0,
            angle: 0,
            element: null,
            knob: null
        };
        
        // Action button state
        this.actionButton = {
            isPressed: false,
            pressTime: 0,
            lastTap: 0,
            tapCount: 0,
            element: null
        };
        
        // Input state
        this.inputState = {
            moveX: 0,
            moveY: 0,
            isAttacking: false,
            isBlocking: false,
            isDashing: false,
            lastAction: null
        };
        
        // Configuration
        this.config = {
            joystickDeadzone: 0.1,
            joystickMaxDistance: 50,
            doubleTapDelay: 300, // milliseconds
            holdDelay: 200, // milliseconds for hold detection
            dashCooldown: 2000 // milliseconds
        };
        
        // State tracking
        this.lastDashTime = 0;
        
        this.setupEventListeners();
        console.log('🎮 Input Manager initialized');
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch events
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent scrolling on touch devices
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.game-controls') || e.target.closest('#gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    /**
     * Initialize virtual controls
     */
    initializeVirtualControls() {
        this.joystick.element = document.getElementById('joystick');
        this.joystick.knob = this.joystick.element?.querySelector('.joystick-knob');
        this.actionButton.element = document.getElementById('actionBtn');
        
        if (this.joystick.element) {
            this.setupJoystick();
        }
        
        if (this.actionButton.element) {
            this.setupActionButton();
        }
        
        console.log('🎮 Virtual controls initialized');
    }
    
    /**
     * Setup virtual joystick
     */
    setupJoystick() {
        const joystick = this.joystick.element;
        const knob = this.joystick.knob;
        
        if (!joystick || !knob) return;
        
        const startTouch = (e) => {
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystick.getBoundingClientRect();
            
            this.joystick.active = true;
            this.joystick.startX = rect.left + rect.width / 2;
            this.joystick.startY = rect.top + rect.height / 2;
            this.joystick.currentX = touch.clientX;
            this.joystick.currentY = touch.clientY;
            
            joystick.classList.add('active');
            this.updateJoystick();
        };
        
        const moveTouch = (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            this.joystick.currentX = touch.clientX;
            this.joystick.currentY = touch.clientY;
            
            this.updateJoystick();
        };
        
        const endTouch = (e) => {
            e.preventDefault();
            
            this.joystick.active = false;
            this.joystick.deltaX = 0;
            this.joystick.deltaY = 0;
            this.joystick.distance = 0;
            
            joystick.classList.remove('active');
            knob.style.transform = 'translate(-50%, -50%)';
            
            this.updateInputState();
        };
        
        // Touch events
        joystick.addEventListener('touchstart', startTouch);
        joystick.addEventListener('touchmove', moveTouch);
        joystick.addEventListener('touchend', endTouch);
        joystick.addEventListener('touchcancel', endTouch);
        
        // Mouse events for desktop testing
        joystick.addEventListener('mousedown', startTouch);
        document.addEventListener('mousemove', moveTouch);
        document.addEventListener('mouseup', endTouch);
    }
    
    /**
     * Setup action button
     */
    setupActionButton() {
        const button = this.actionButton.element;
        if (!button) return;
        
        const startAction = (e) => {
            e.preventDefault();
            
            const now = Date.now();
            this.actionButton.isPressed = true;
            this.actionButton.pressTime = now;
            
            // Check for double tap
            if (now - this.actionButton.lastTap < this.config.doubleTapDelay) {
                this.actionButton.tapCount++;
                if (this.actionButton.tapCount >= 2) {
                    this.handleDash();
                    this.actionButton.tapCount = 0;
                    return;
                }
            } else {
                this.actionButton.tapCount = 1;
            }
            
            this.actionButton.lastTap = now;
            
            // Start attack immediately for responsive feel
            this.handleAttack();
        };
        
        const endAction = (e) => {
            e.preventDefault();
            
            const now = Date.now();
            const holdDuration = now - this.actionButton.pressTime;
            
            this.actionButton.isPressed = false;
            
            // Determine action based on hold duration
            if (holdDuration >= this.config.holdDelay && this.actionButton.tapCount === 1) {
                this.handleBlock(false); // End block
            }
            
            this.updateInputState();
        };
        
        // Touch events
        button.addEventListener('touchstart', startAction);
        button.addEventListener('touchend', endAction);
        button.addEventListener('touchcancel', endAction);
        
        // Mouse events
        button.addEventListener('mousedown', startAction);
        button.addEventListener('mouseup', endAction);
    }
    
    /**
     * Update joystick position and calculate values
     */
    updateJoystick() {
        if (!this.joystick.active || !this.joystick.knob) return;
        
        const deltaX = this.joystick.currentX - this.joystick.startX;
        const deltaY = this.joystick.currentY - this.joystick.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = this.config.joystickMaxDistance;
        
        // Constrain to max distance
        let constrainedX = deltaX;
        let constrainedY = deltaY;
        
        if (distance > maxDistance) {
            const ratio = maxDistance / distance;
            constrainedX = deltaX * ratio;
            constrainedY = deltaY * ratio;
        }
        
        // Update knob position
        this.joystick.knob.style.transform = 
            `translate(calc(-50% + ${constrainedX}px), calc(-50% + ${constrainedY}px))`;
        
        // Calculate normalized values
        this.joystick.deltaX = constrainedX / maxDistance;
        this.joystick.deltaY = constrainedY / maxDistance;
        this.joystick.distance = Math.min(distance / maxDistance, 1);
        this.joystick.angle = Math.atan2(deltaY, deltaX);
        
        // Apply deadzone
        if (this.joystick.distance < this.config.joystickDeadzone) {
            this.joystick.deltaX = 0;
            this.joystick.deltaY = 0;
            this.joystick.distance = 0;
        }
        
        this.updateInputState();
    }
    
    /**
     * Update input state based on all inputs
     */
    updateInputState() {
        // Movement from joystick or keyboard
        let moveX = this.joystick.deltaX;
        let moveY = this.joystick.deltaY;
        
        // Add keyboard input
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) moveX -= 1;
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) moveX += 1;
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) moveY -= 1;
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) moveY += 1;
        
        // Normalize movement
        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > 1) {
            moveX /= moveLength;
            moveY /= moveLength;
        }
        
        this.inputState.moveX = moveX;
        this.inputState.moveY = moveY;
        
        // Check for block hold
        const now = Date.now();
        const holdDuration = now - this.actionButton.pressTime;
        
        if (this.actionButton.isPressed && holdDuration >= this.config.holdDelay) {
            if (!this.inputState.isBlocking) {
                this.handleBlock(true);
            }
        }
        
        // Dispatch input event
        document.dispatchEvent(new CustomEvent('inputUpdate', {
            detail: { ...this.inputState }
        }));
    }
    
    /**
     * Handle attack action
     */
    handleAttack() {
        if (this.inputState.isBlocking || this.inputState.isDashing) return;
        
        this.inputState.isAttacking = true;
        this.inputState.lastAction = 'attack';
        
        // Visual feedback
        if (this.actionButton.element) {
            this.actionButton.element.classList.add('attacking');
            setTimeout(() => {
                this.actionButton.element?.classList.remove('attacking');
            }, 200);
        }
        
        // Dispatch attack event
        document.dispatchEvent(new CustomEvent('playerAttack', {
            detail: { type: 'light' }
        }));
        
        console.log('⚔️ Attack triggered');
        
        // Reset attack state after animation
        setTimeout(() => {
            this.inputState.isAttacking = false;
        }, 300);
    }
    
    /**
     * Handle block action
     * @param {boolean} start - True to start blocking, false to stop
     */
    handleBlock(start) {
        this.inputState.isBlocking = start;
        this.inputState.lastAction = start ? 'block' : null;
        
        // Visual feedback
        if (this.actionButton.element) {
            if (start) {
                this.actionButton.element.classList.add('blocking');
            } else {
                this.actionButton.element.classList.remove('blocking');
            }
        }
        
        // Dispatch block event
        document.dispatchEvent(new CustomEvent('playerBlock', {
            detail: { active: start }
        }));
        
        console.log(`🛡️ Block ${start ? 'started' : 'ended'}`);
    }
    
    /**
     * Handle dash action
     */
    handleDash() {
        const now = Date.now();
        
        // Check cooldown
        if (now - this.lastDashTime < this.config.dashCooldown) {
            console.log('🏃 Dash on cooldown');
            return;
        }
        
        this.lastDashTime = now;
        this.inputState.isDashing = true;
        this.inputState.lastAction = 'dash';
        
        // Visual feedback
        if (this.actionButton.element) {
            this.actionButton.element.classList.add('dashing');
            setTimeout(() => {
                this.actionButton.element?.classList.remove('dashing');
            }, 300);
        }
        
        // Dispatch dash event
        document.dispatchEvent(new CustomEvent('playerDash', {
            detail: {
                direction: {
                    x: this.inputState.moveX || 1,
                    y: this.inputState.moveY || 0
                }
            }
        }));
        
        console.log('🏃 Dash triggered');
        
        // Reset dash state
        setTimeout(() => {
            this.inputState.isDashing = false;
        }, 300);
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        this.keys.set(e.code, true);
        
        // Handle special keys
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.handleAttack();
                break;
            case 'KeyQ':
                this.handleDash();
                break;
            case 'KeyE':
                this.handleBlock(true);
                break;
            case 'Escape':
                if (gameEngine.gameState.isPlaying) {
                    gameEngine.togglePause();
                }
                break;
        }
        
        this.updateInputState();
    }
    
    handleKeyUp(e) {
        this.keys.set(e.code, false);
        
        switch (e.code) {
            case 'KeyE':
                this.handleBlock(false);
                break;
        }
        
        this.updateInputState();
    }
    
    /**
     * Handle mouse input
     */
    handleMouseDown(e) {
        this.mouse.isDown = true;
        this.mouse.button = e.button;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    handleMouseUp(e) {
        this.mouse.isDown = false;
        this.mouse.button = -1;
    }
    
    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    /**
     * Handle touch input
     */
    handleTouchStart(e) {
        for (const touch of e.changedTouches) {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            });
        }
    }
    
    handleTouchEnd(e) {
        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }
    }
    
    handleTouchMove(e) {
        for (const touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                touchData.x = touch.clientX;
                touchData.y = touch.clientY;
            }
        }
    }
    
    handleTouchCancel(e) {
        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }
    }
    
    /**
     * Check if a key is currently pressed
     * @param {string} keyCode - Key code to check
     * @returns {boolean} True if pressed
     */
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    /**
     * Get current input state
     * @returns {Object} Current input state
     */
    getInputState() {
        return { ...this.inputState };
    }
    
    /**
     * Get joystick state
     * @returns {Object} Joystick state
     */
    getJoystickState() {
        return {
            deltaX: this.joystick.deltaX,
            deltaY: this.joystick.deltaY,
            distance: this.joystick.distance,
            angle: this.joystick.angle,
            active: this.joystick.active
        };
    }
    
    /**
     * Reset input manager
     */
    reset() {
        this.keys.clear();
        this.touches.clear();
        this.inputState = {
            moveX: 0,
            moveY: 0,
            isAttacking: false,
            isBlocking: false,
            isDashing: false,
            lastAction: null
        };
        
        // Reset visual states
        if (this.actionButton.element) {
            this.actionButton.element.classList.remove('attacking', 'blocking', 'dashing');
        }
        
        if (this.joystick.element) {
            this.joystick.element.classList.remove('active');
        }
        
        console.log('🎮 Input Manager reset');
    }
    
    /**
     * Enable/disable input
     * @param {boolean} enabled - Whether input should be enabled
     */
    setEnabled(enabled) {
        const controls = document.querySelector('.game-controls');
        if (controls) {
            controls.style.display = enabled ? 'flex' : 'none';
        }
        
        if (!enabled) {
            this.reset();
        }
    }
}

// Create global input manager instance
window.inputManager = new InputManager();

console.log('🎮 Input Manager module loaded');
