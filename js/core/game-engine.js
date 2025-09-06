/**
 * Core Game Engine
 * Handles game loop, rendering, and core game mechanics
 */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.targetFrameTime = 1000 / this.fps;
        
        // Game objects
        this.gameObjects = new Map();
        this.particles = [];
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            shake: 0,
            shakeIntensity: 0
        };
        
        // Game state
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            timeRemaining: 30,
            winner: null
        };
        
        // Performance monitoring
        this.frameCount = 0;
        this.fpsDisplay = 0;
        this.lastFpsUpdate = 0;
        
        console.log('🎮 Game Engine initialized');
    }
    
    /**
     * Initialize the game engine with canvas
     * @param {HTMLCanvasElement} canvas - The game canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.resize();
        
        // Setup context settings
        this.ctx.imageSmoothingEnabled = false; // Pixel perfect rendering
        
        // Bind resize handler
        window.addEventListener('resize', () => this.resize());
        
        console.log('🎮 Game Engine canvas initialized');
        return this;
    }
    
    /**
     * Resize canvas to fit container
     */
    resize() {
        if (!this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual size in memory (scaled by device pixel ratio)
        this.canvas.width = gameConfig.arenaWidth * dpr;
        this.canvas.height = gameConfig.arenaHeight * dpr;
        
        // Scale the drawing context back down
        this.ctx.scale(dpr, dpr);
        
        // Set display size (CSS pixels)
        this.canvas.style.width = gameConfig.arenaWidth + 'px';
        this.canvas.style.height = gameConfig.arenaHeight + 'px';
    }
    
    /**
     * Add a game object to the engine
     * @param {string} id - Unique identifier
     * @param {Object} gameObject - Game object with update/render methods
     */
    addGameObject(id, gameObject) {
        this.gameObjects.set(id, gameObject);
        if (gameObject.init) {
            gameObject.init();
        }
    }
    
    /**
     * Remove a game object from the engine
     * @param {string} id - Unique identifier
     */
    removeGameObject(id) {
        const obj = this.gameObjects.get(id);
        if (obj && obj.destroy) {
            obj.destroy();
        }
        this.gameObjects.delete(id);
    }
    
    /**
     * Get a game object by ID
     * @param {string} id - Unique identifier
     * @returns {Object|null} Game object or null if not found
     */
    getGameObject(id) {
        return this.gameObjects.get(id) || null;
    }
    
    /**
     * Create a particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Particle type
     * @param {Object} options - Additional options
     */
    createParticle(x, y, type, options = {}) {
        const particle = {
            x, y,
            vx: options.vx || (Math.random() - 0.5) * 200,
            vy: options.vy || (Math.random() - 0.5) * 200,
            life: options.life || 1,
            maxLife: options.life || 1,
            size: options.size || 4,
            color: options.color || '#ff6b35',
            type,
            gravity: options.gravity || 0,
            friction: options.friction || 0.98
        };
        
        this.particles.push(particle);
    }
    
    /**
     * Shake the camera
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Shake duration in seconds
     */
    shakeCamera(intensity, duration) {
        this.camera.shakeIntensity = intensity;
        this.camera.shake = duration;
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameState.isPlaying = true;
        this.lastTime = performance.now();
        
        this.gameLoop();
        console.log('🎮 Game Engine started');
    }
    
    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        this.gameState.isPlaying = false;
        console.log('🎮 Game Engine stopped');
    }
    
    /**
     * Pause/unpause the game
     */
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        if (!this.gameState.isPaused) {
            this.lastTime = performance.now();
        }
        console.log(`🎮 Game ${this.gameState.isPaused ? 'paused' : 'unpaused'}`);
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Limit delta time to prevent spiral of death
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        if (!this.gameState.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        // Calculate FPS
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > 1000) {
            this.fpsDisplay = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update game logic
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update camera shake
        if (this.camera.shake > 0) {
            this.camera.shake -= deltaTime;
            this.camera.x = (Math.random() - 0.5) * this.camera.shakeIntensity;
            this.camera.y = (Math.random() - 0.5) * this.camera.shakeIntensity;
        } else {
            this.camera.x = 0;
            this.camera.y = 0;
        }
        
        // Update game objects
        for (const [id, gameObject] of this.gameObjects) {
            if (gameObject.update) {
                gameObject.update(deltaTime);
            }
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update game timer
        if (this.gameState.isPlaying && this.gameState.timeRemaining > 0) {
            this.gameState.timeRemaining -= deltaTime;
            if (this.gameState.timeRemaining <= 0) {
                this.gameState.timeRemaining = 0;
                this.endBattle();
            }
        }
    }
    
    /**
     * Update particle system
     * @param {number} deltaTime - Time since last update
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Apply gravity
            particle.vy += particle.gravity * deltaTime;
            
            // Apply friction
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            // Update life
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Render everything
     */
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(this.camera.x, this.camera.y);
        
        // Render background
        this.renderBackground();
        
        // Render game objects (sorted by z-index)
        const sortedObjects = Array.from(this.gameObjects.values())
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        for (const gameObject of sortedObjects) {
            if (gameObject.render) {
                this.ctx.save();
                gameObject.render(this.ctx);
                this.ctx.restore();
            }
        }
        
        // Render particles
        this.renderParticles();
        
        // Restore context
        this.ctx.restore();
        
        // Render UI elements (not affected by camera)
        this.renderUI();
    }
    
    /**
     * Render background
     */
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, gameConfig.arenaHeight);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, gameConfig.arenaWidth, gameConfig.arenaHeight);
        
        // Grid pattern
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < gameConfig.arenaWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, gameConfig.arenaHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < gameConfig.arenaHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(gameConfig.arenaWidth, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * Render particles
     */
    renderParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (particle.type === 'square') {
                const size = particle.size * alpha;
                this.ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);
            }
            
            this.ctx.restore();
        }
    }
    
    /**
     * Render UI elements
     */
    renderUI() {
        // Debug info (only in development)
        if (isDevelopment) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 150, 80);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`FPS: ${this.fpsDisplay}`, 20, 30);
            this.ctx.fillText(`Objects: ${this.gameObjects.size}`, 20, 45);
            this.ctx.fillText(`Particles: ${this.particles.length}`, 20, 60);
            this.ctx.fillText(`Time: ${this.gameState.timeRemaining.toFixed(1)}s`, 20, 75);
        }
    }
    
    /**
     * End the current battle
     */
    endBattle() {
        this.gameState.isPlaying = false;
        
        // Determine winner based on health
        const player = this.getGameObject('player');
        const opponent = this.getGameObject('opponent');
        
        if (player && opponent) {
            if (player.health > opponent.health) {
                this.gameState.winner = 'player';
            } else if (opponent.health > player.health) {
                this.gameState.winner = 'opponent';
            } else {
                this.gameState.winner = 'draw';
            }
        }
        
        // Trigger battle end event
        document.dispatchEvent(new CustomEvent('battleEnd', {
            detail: {
                winner: this.gameState.winner,
                playerHealth: player?.health || 0,
                opponentHealth: opponent?.health || 0
            }
        }));
        
        console.log('⚔️ Battle ended, winner:', this.gameState.winner);
    }
    
    /**
     * Reset the game engine
     */
    reset() {
        this.gameObjects.clear();
        this.particles = [];
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            timeRemaining: gameConfig.battleDuration,
            winner: null
        };
        this.camera = {
            x: 0,
            y: 0,
            shake: 0,
            shakeIntensity: 0
        };
        
        console.log('🎮 Game Engine reset');
    }
}

// Create global game engine instance
window.gameEngine = new GameEngine();

console.log('🎮 Game Engine module loaded');
