/**
 * Arena System
 * Manages battle arenas, environmental hazards, and arena effects
 */

class Arena {
    constructor(id, config) {
        this.id = id;
        this.name = config.name || 'Basic Arena';
        this.type = config.type || 'basic';
        this.width = gameConfig.arenaWidth;
        this.height = gameConfig.arenaHeight;
        
        // Visual properties
        this.background = config.background || 'default';
        this.theme = config.theme || 'medieval';
        this.lighting = config.lighting || 'normal';
        
        // Hazard configuration
        this.hazards = [];
        this.hazardConfig = config.hazards || this.getDefaultHazards();
        this.hazardSpawnTimer = 0;
        this.hazardSpawnRate = config.hazardSpawnRate || gameConfig.hazardSpawnRate;
        
        // Environmental effects
        this.environmentalEffects = config.environmentalEffects || [];
        this.weather = config.weather || 'none';
        
        // Platforms and obstacles
        this.platforms = config.platforms || [];
        this.obstacles = config.obstacles || [];
        
        // Arena-specific physics
        this.gravity = config.gravity || physicsEngine.gravity;
        this.windForce = config.windForce || { x: 0, y: 0 };
        
        console.log(`🏟️ Arena created: ${this.name}`);
    }
    
    /**
     * Get default hazards for arena type
     */
    getDefaultHazards() {
        const baseHazards = {
            fallingRocks: {
                enabled: true,
                spawnRate: 0.2,
                damage: 20,
                size: { min: 20, max: 40 },
                speed: { min: 100, max: 200 }
            },
            lavaFloor: {
                enabled: false,
                activeDuration: 3,
                cooldownDuration: 5,
                damage: 5, // damage per second
                warningTime: 1
            },
            windGusts: {
                enabled: true,
                force: { min: 50, max: 150 },
                duration: { min: 2, max: 4 },
                cooldown: { min: 5, max: 10 },
                direction: 'random' // 'left', 'right', 'random'
            },
            spikes: {
                enabled: false,
                positions: [], // Will be populated based on arena
                damage: 15,
                activeDuration: 1,
                cooldownDuration: 3
            }
        };
        
        // Customize hazards based on arena type
        switch (this.type) {
            case 'volcanic':
                return {
                    ...baseHazards,
                    fallingRocks: { ...baseHazards.fallingRocks, spawnRate: 0.3 },
                    lavaFloor: { ...baseHazards.lavaFloor, enabled: true }
                };
                
            case 'windy':
                return {
                    ...baseHazards,
                    windGusts: {
                        ...baseHazards.windGusts,
                        force: { min: 100, max: 250 },
                        cooldown: { min: 3, max: 6 }
                    }
                };
                
            case 'spiky':
                return {
                    ...baseHazards,
                    spikes: {
                        ...baseHazards.spikes,
                        enabled: true,
                        positions: this.generateSpikePositions()
                    }
                };
                
            case 'chaotic':
                return {
                    fallingRocks: { ...baseHazards.fallingRocks, spawnRate: 0.4 },
                    lavaFloor: { ...baseHazards.lavaFloor, enabled: true },
                    windGusts: { ...baseHazards.windGusts, force: { min: 75, max: 200 } },
                    spikes: { ...baseHazards.spikes, enabled: true, positions: this.generateSpikePositions() }
                };
                
            default:
                return baseHazards;
        }
    }
    
    /**
     * Generate spike positions for spiky arena
     */
    generateSpikePositions() {
        const positions = [];
        const spacing = 100;
        
        // Add spikes along the floor
        for (let x = spacing; x < this.width - spacing; x += spacing) {
            if (Math.random() > 0.3) { // 70% chance for each position
                positions.push({
                    x: x - 20,
                    y: this.height - 60,
                    width: 40,
                    height: 20
                });
            }
        }
        
        return positions;
    }
    
    /**
     * Initialize arena
     */
    init() {
        // Create platforms as physics bodies
        this.createPlatforms();
        
        // Initialize environmental effects
        this.initEnvironmentalEffects();
        
        // Set arena-specific physics
        physicsEngine.gravity = this.gravity;
        
        console.log(`🏟️ Arena initialized: ${this.name}`);
    }
    
    /**
     * Create platform physics bodies
     */
    createPlatforms() {
        this.platforms.forEach((platform, index) => {
            physicsEngine.createBody(`arena_platform_${index}`, {
                x: platform.x,
                y: platform.y,
                width: platform.width,
                height: platform.height,
                isStatic: true,
                layer: 'platform'
            });
        });
    }
    
    /**
     * Initialize environmental effects
     */
    initEnvironmentalEffects() {
        // Initialize lava floor state
        if (this.hazardConfig.lavaFloor?.enabled) {
            this.lavaFloorState = {
                active: false,
                timer: 0,
                warningTimer: 0,
                isWarning: false
            };
        }
        
        // Initialize wind gust state
        if (this.hazardConfig.windGusts?.enabled) {
            this.windGustState = {
                active: false,
                timer: 0,
                cooldownTimer: 0,
                force: { x: 0, y: 0 }
            };
        }
        
        // Initialize spike state
        if (this.hazardConfig.spikes?.enabled) {
            this.spikeStates = this.hazardConfig.spikes.positions.map(() => ({
                active: false,
                timer: 0,
                cooldownTimer: Math.random() * 5 // Stagger initial activation
            }));
        }
    }
    
    /**
     * Update arena logic
     * @param {number} deltaTime - Time step
     */
    update(deltaTime) {
        // Update hazard spawn timer
        this.hazardSpawnTimer += deltaTime;
        
        // Spawn new hazards
        this.spawnHazards(deltaTime);
        
        // Update existing hazards
        this.updateHazards(deltaTime);
        
        // Update environmental effects
        this.updateEnvironmentalEffects(deltaTime);
        
        // Update arena-specific effects
        this.updateArenaEffects(deltaTime);
    }
    
    /**
     * Spawn new hazards
     * @param {number} deltaTime - Time step
     */
    spawnHazards(deltaTime) {
        // Falling rocks
        if (this.hazardConfig.fallingRocks?.enabled) {
            const config = this.hazardConfig.fallingRocks;
            if (Math.random() < config.spawnRate * deltaTime) {
                this.spawnFallingRock(config);
            }
        }
    }
    
    /**
     * Spawn a falling rock hazard
     * @param {Object} config - Rock configuration
     */
    spawnFallingRock(config) {
        const size = Math.random() * (config.size.max - config.size.min) + config.size.min;
        const speed = Math.random() * (config.speed.max - config.speed.min) + config.speed.min;
        const x = Math.random() * (this.width - size);
        
        const rock = {
            id: `rock_${Date.now()}_${Math.random()}`,
            type: 'fallingRock',
            x,
            y: -size,
            width: size,
            height: size,
            vx: 0,
            vy: speed,
            damage: config.damage,
            life: 10, // Remove after 10 seconds if not hit
            color: '#8B4513',
            rotation: 0,
            rotationSpeed: Math.random() * 10 - 5
        };
        
        this.hazards.push(rock);
        
        // Create physics body for collision detection
        const physicsBody = physicsEngine.createBody(rock.id, {
            x: rock.x,
            y: rock.y,
            width: rock.width,
            height: rock.height,
            isTrigger: true,
            layer: 'hazard',
            onTriggerEnter: (other) => {
                if (other.layer === 'character') {
                    const character = gameEngine.getGameObject(other.id);
                    if (character) {
                        character.takeDamage(rock.damage, null);
                        this.removeHazard(rock.id);
                        
                        // Create impact effect
                        this.createImpactEffect(rock.x + rock.width/2, rock.y + rock.height/2);
                    }
                }
            }
        });
        
        rock.physicsBody = physicsBody;
    }
    
    /**
     * Update all hazards
     * @param {number} deltaTime - Time step
     */
    updateHazards(deltaTime) {
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            
            // Update position
            hazard.x += hazard.vx * deltaTime;
            hazard.y += hazard.vy * deltaTime;
            
            // Update rotation
            if (hazard.rotationSpeed) {
                hazard.rotation += hazard.rotationSpeed * deltaTime;
            }
            
            // Update physics body
            if (hazard.physicsBody) {
                hazard.physicsBody.x = hazard.x;
                hazard.physicsBody.y = hazard.y;
            }
            
            // Update life
            hazard.life -= deltaTime;
            
            // Remove if out of bounds or life expired
            if (hazard.y > this.height + 100 || hazard.life <= 0) {
                this.removeHazard(hazard.id);
            }
        }
    }
    
    /**
     * Update environmental effects
     * @param {number} deltaTime - Time step
     */
    updateEnvironmentalEffects(deltaTime) {
        // Update lava floor
        if (this.lavaFloorState) {
            this.updateLavaFloor(deltaTime);
        }
        
        // Update wind gusts
        if (this.windGustState) {
            this.updateWindGusts(deltaTime);
        }
        
        // Update spikes
        if (this.spikeStates) {
            this.updateSpikes(deltaTime);
        }
    }
    
    /**
     * Update lava floor effect
     * @param {number} deltaTime - Time step
     */
    updateLavaFloor(deltaTime) {
        const config = this.hazardConfig.lavaFloor;
        const state = this.lavaFloorState;
        
        if (!state.active && !state.isWarning) {
            // Check if should start warning
            state.timer += deltaTime;
            if (state.timer >= config.cooldownDuration) {
                state.isWarning = true;
                state.warningTimer = config.warningTime;
                state.timer = 0;
                
                // Visual warning
                this.createLavaWarning();
            }
        } else if (state.isWarning) {
            // Warning phase
            state.warningTimer -= deltaTime;
            if (state.warningTimer <= 0) {
                state.active = true;
                state.isWarning = false;
                state.timer = 0;
                
                // Activate lava
                this.activateLavaFloor();
            }
        } else if (state.active) {
            // Active lava phase
            state.timer += deltaTime;
            
            // Damage players on ground
            this.damageLavaVictims(deltaTime);
            
            if (state.timer >= config.activeDuration) {
                state.active = false;
                state.timer = 0;
                
                // Deactivate lava
                this.deactivateLavaFloor();
            }
        }
    }
    
    /**
     * Update wind gusts
     * @param {number} deltaTime - Time step
     */
    updateWindGusts(deltaTime) {
        const config = this.hazardConfig.windGusts;
        const state = this.windGustState;
        
        if (!state.active) {
            state.cooldownTimer -= deltaTime;
            if (state.cooldownTimer <= 0) {
                // Start new wind gust
                state.active = true;
                state.timer = Math.random() * (config.duration.max - config.duration.min) + config.duration.min;
                
                const force = Math.random() * (config.force.max - config.force.min) + config.force.min;
                let direction = 1;
                
                if (config.direction === 'left') direction = -1;
                else if (config.direction === 'random') direction = Math.random() > 0.5 ? 1 : -1;
                
                state.force.x = force * direction;
                state.force.y = 0;
                
                // Visual effect
                this.createWindEffect(direction);
                
                console.log(`💨 Wind gust started: ${force} force, direction: ${direction > 0 ? 'right' : 'left'}`);
            }
        } else {
            // Active wind phase
            state.timer -= deltaTime;
            
            // Apply wind force to characters
            this.applyWindForce(state.force, deltaTime);
            
            if (state.timer <= 0) {
                state.active = false;
                state.cooldownTimer = Math.random() * (config.cooldown.max - config.cooldown.min) + config.cooldown.min;
                state.force.x = 0;
                state.force.y = 0;
                
                console.log('💨 Wind gust ended');
            }
        }
    }
    
    /**
     * Update spikes
     * @param {number} deltaTime - Time step
     */
    updateSpikes(deltaTime) {
        const config = this.hazardConfig.spikes;
        
        this.spikeStates.forEach((state, index) => {
            if (!state.active) {
                state.cooldownTimer -= deltaTime;
                if (state.cooldownTimer <= 0) {
                    state.active = true;
                    state.timer = config.activeDuration;
                    
                    // Check for character damage
                    this.checkSpikeCollision(index);
                    
                    console.log(`⚡ Spike ${index} activated`);
                }
            } else {
                state.timer -= deltaTime;
                if (state.timer <= 0) {
                    state.active = false;
                    state.cooldownTimer = config.cooldownDuration + Math.random() * 2; // Add some randomness
                }
            }
        });
    }
    
    /**
     * Check spike collision with characters
     * @param {number} spikeIndex - Spike index
     */
    checkSpikeCollision(spikeIndex) {
        const config = this.hazardConfig.spikes;
        const spike = config.positions[spikeIndex];
        
        if (!spike) return;
        
        // Get characters in spike area
        const characters = physicsEngine.getBodiesInRadius(
            spike.x + spike.width / 2,
            spike.y + spike.height / 2,
            Math.max(spike.width, spike.height) / 2,
            'character'
        );
        
        characters.forEach(body => {
            const character = gameEngine.getGameObject(body.id);
            if (character && character.isGrounded) {
                character.takeDamage(config.damage, null);
                
                // Knockback
                physicsEngine.applyImpulse(character.id, 0, -200);
            }
        });
    }
    
    /**
     * Apply wind force to characters
     * @param {Object} force - Wind force vector
     * @param {number} deltaTime - Time step
     */
    applyWindForce(force, deltaTime) {
        // Get all characters
        const characters = Array.from(gameEngine.gameObjects.values())
            .filter(obj => obj instanceof Character && !obj.isDead);
        
        characters.forEach(character => {
            if (!character.isGrounded) {
                // Wind affects airborne characters more
                physicsEngine.applyForce(character.id, force.x * 2 * deltaTime, force.y * deltaTime);
            } else {
                // Slight effect on grounded characters
                physicsEngine.applyForce(character.id, force.x * 0.5 * deltaTime, force.y * deltaTime);
            }
        });
    }
    
    /**
     * Damage characters standing on lava
     * @param {number} deltaTime - Time step
     */
    damageLavaVictims(deltaTime) {
        const config = this.hazardConfig.lavaFloor;
        const characters = Array.from(gameEngine.gameObjects.values())
            .filter(obj => obj instanceof Character && !obj.isDead && obj.isGrounded);
        
        characters.forEach(character => {
            // Check if character is near the ground
            if (character.y + character.height >= this.height - 100) {
                character.takeDamage(config.damage * deltaTime, null);
                
                // Create lava particles around character
                for (let i = 0; i < 3; i++) {
                    gameEngine.createParticle(
                        character.x + Math.random() * character.width,
                        character.y + character.height,
                        'circle',
                        {
                            color: '#ff4136',
                            size: Math.random() * 4 + 2,
                            life: 0.5,
                            vy: -Math.random() * 50 - 25,
                            vx: (Math.random() - 0.5) * 50
                        }
                    );
                }
            }
        });
    }
    
    /**
     * Create visual effects
     */
    createLavaWarning() {
        // Flash the arena red
        document.dispatchEvent(new CustomEvent('arenaEffect', {
            detail: { type: 'lavaWarning' }
        }));
        
        // Create warning particles
        for (let i = 0; i < 20; i++) {
            gameEngine.createParticle(
                Math.random() * this.width,
                this.height - 50,
                'circle',
                {
                    color: '#ff851b',
                    size: Math.random() * 6 + 2,
                    life: 1,
                    vy: -Math.random() * 100 - 50,
                    vx: (Math.random() - 0.5) * 100
                }
            );
        }
    }
    
    activateLavaFloor() {
        document.dispatchEvent(new CustomEvent('arenaEffect', {
            detail: { type: 'lavaActive' }
        }));
        
        // Create lava particles along the floor
        for (let x = 0; x < this.width; x += 20) {
            gameEngine.createParticle(
                x,
                this.height - 30,
                'circle',
                {
                    color: '#ff4136',
                    size: Math.random() * 8 + 4,
                    life: 3,
                    vy: -Math.random() * 30,
                    vx: (Math.random() - 0.5) * 20
                }
            );
        }
    }
    
    deactivateLavaFloor() {
        document.dispatchEvent(new CustomEvent('arenaEffect', {
            detail: { type: 'lavaInactive' }
        }));
    }
    
    createWindEffect(direction) {
        // Create wind particles
        for (let i = 0; i < 30; i++) {
            gameEngine.createParticle(
                direction > 0 ? -10 : this.width + 10,
                Math.random() * this.height,
                'circle',
                {
                    color: 'rgba(255, 255, 255, 0.6)',
                    size: Math.random() * 3 + 1,
                    life: 2,
                    vx: direction * (Math.random() * 200 + 100),
                    vy: (Math.random() - 0.5) * 50
                }
            );
        }
        
        document.dispatchEvent(new CustomEvent('arenaEffect', {
            detail: { type: 'windGust', direction }
        }));
    }
    
    createImpactEffect(x, y) {
        // Create impact particles
        for (let i = 0; i < 10; i++) {
            gameEngine.createParticle(
                x,
                y,
                'circle',
                {
                    color: i % 2 === 0 ? '#8B4513' : '#ffffff',
                    size: Math.random() * 4 + 2,
                    life: 0.5,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200,
                    gravity: 200
                }
            );
        }
        
        // Camera shake
        gameEngine.shakeCamera(8, 0.3);
    }
    
    /**
     * Update arena-specific effects
     * @param {number} deltaTime - Time step
     */
    updateArenaEffects(deltaTime) {
        // Update weather effects
        if (this.weather === 'rain') {
            this.updateRainEffect(deltaTime);
        } else if (this.weather === 'snow') {
            this.updateSnowEffect(deltaTime);
        }
    }
    
    /**
     * Update rain effect
     * @param {number} deltaTime - Time step
     */
    updateRainEffect(deltaTime) {
        // Spawn rain particles
        if (Math.random() < 0.8) {
            gameEngine.createParticle(
                Math.random() * this.width,
                -10,
                'circle',
                {
                    color: 'rgba(173, 216, 230, 0.8)',
                    size: 2,
                    life: 3,
                    vx: -20,
                    vy: 400
                }
            );
        }
    }
    
    /**
     * Update snow effect
     * @param {number} deltaTime - Time step
     */
    updateSnowEffect(deltaTime) {
        // Spawn snow particles
        if (Math.random() < 0.3) {
            gameEngine.createParticle(
                Math.random() * this.width,
                -10,
                'circle',
                {
                    color: 'rgba(255, 255, 255, 0.9)',
                    size: Math.random() * 3 + 1,
                    life: 8,
                    vx: (Math.random() - 0.5) * 20,
                    vy: Math.random() * 50 + 25,
                    friction: 0.99
                }
            );
        }
    }
    
    /**
     * Remove a hazard
     * @param {string} hazardId - Hazard ID
     */
    removeHazard(hazardId) {
        const index = this.hazards.findIndex(h => h.id === hazardId);
        if (index !== -1) {
            const hazard = this.hazards[index];
            
            // Remove physics body
            if (hazard.physicsBody) {
                physicsEngine.removeBody(hazard.id);
            }
            
            this.hazards.splice(index, 1);
        }
    }
    
    /**
     * Render arena
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    render(ctx) {
        // Render background
        this.renderBackground(ctx);
        
        // Render platforms
        this.renderPlatforms(ctx);
        
        // Render environmental effects
        this.renderEnvironmentalEffects(ctx);
        
        // Render hazards
        this.renderHazards(ctx);
    }
    
    /**
     * Render background
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    renderBackground(ctx) {
        // Base background
        let gradient;
        
        switch (this.type) {
            case 'volcanic':
                gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#2c1810');
                gradient.addColorStop(1, '#8B0000');
                break;
                
            case 'windy':
                gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#4682B4');
                break;
                
            case 'spiky':
                gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#2F4F4F');
                gradient.addColorStop(1, '#696969');
                break;
                
            default:
                gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#2c3e50');
                gradient.addColorStop(1, '#34495e');
                break;
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Add arena-specific background elements
        if (this.type === 'volcanic') {
            this.renderVolcanicBackground(ctx);
        }
    }
    
    /**
     * Render volcanic background elements
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    renderVolcanicBackground(ctx) {
        // Render lava pools
        ctx.fillStyle = this.lavaFloorState?.active ? '#ff4136' : '#8B0000';
        ctx.fillRect(0, this.height - 50, this.width, 50);
        
        // Lava glow effect when active
        if (this.lavaFloorState?.active) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff4136';
            ctx.fillRect(0, this.height - 50, this.width, 50);
            ctx.shadowBlur = 0;
        }
    }
    
    /**
     * Render platforms
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    renderPlatforms(ctx) {
        ctx.fillStyle = '#555555';
        this.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Add platform edge highlight
            ctx.fillStyle = '#777777';
            ctx.fillRect(platform.x, platform.y, platform.width, 2);
            ctx.fillStyle = '#555555';
        });
    }
    
    /**
     * Render environmental effects
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    renderEnvironmentalEffects(ctx) {
        // Render wind visual effect
        if (this.windGustState?.active) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'white';
            
            // Draw wind lines
            for (let i = 0; i < 10; i++) {
                const y = (i / 10) * this.height;
                const offset = (Date.now() / 10) % this.width;
                const x = (offset + i * 50) % this.width;
                
                ctx.fillRect(x, y, 20, 2);
            }
            
            ctx.restore();
        }
        
        // Render spikes
        if (this.hazardConfig.spikes?.enabled) {
            this.renderSpikes(ctx);
        }
    }
    
    /**
     * Render spikes
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    renderSpikes(ctx) {
        const config = this.hazardConfig.spikes;
        
        config.positions.forEach((spike, index) => {
            const state = this.spikeStates[index];
            
            ctx.fillStyle = state.active ? '#ff4136' : '#666666';
            
            // Draw spike as triangle
            ctx.beginPath();
            ctx.moveTo(spike.x, spike.y + spike.height);
            ctx.lineTo(spike.x + spike.width / 2, spike.y);
            ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
            ctx.closePath();
            ctx.fill();
            
            // Add glow effect when active
            if (state.active) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff4136';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
    }
    
    /**
     * Render hazards
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    renderHazards(ctx) {
        this.hazards.forEach(hazard => {
            ctx.save();
            
            if (hazard.type === 'fallingRock') {
                // Translate to center and rotate
                ctx.translate(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2);
                ctx.rotate(hazard.rotation);
                
                // Draw rock
                ctx.fillStyle = hazard.color;
                ctx.fillRect(-hazard.width / 2, -hazard.height / 2, hazard.width, hazard.height);
                
                // Add some rock texture
                ctx.fillStyle = '#654321';
                ctx.fillRect(-hazard.width / 4, -hazard.height / 4, hazard.width / 2, hazard.height / 4);
                ctx.fillRect(-hazard.width / 3, 0, hazard.width / 3, hazard.height / 3);
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Clean up arena
     */
    destroy() {
        // Remove all hazards
        this.hazards.forEach(hazard => {
            if (hazard.physicsBody) {
                physicsEngine.removeBody(hazard.id);
            }
        });
        this.hazards = [];
        
        // Remove platforms
        this.platforms.forEach((platform, index) => {
            physicsEngine.removeBody(`arena_platform_${index}`);
        });
        
        // Reset physics
        physicsEngine.gravity = 980;
        
        console.log(`🏟️ Arena destroyed: ${this.name}`);
    }
}

/**
 * Arena System Manager
 */
class ArenaSystem {
    constructor() {
        this.arenaTypes = this.initializeArenaTypes();
        this.currentArena = null;
        this.unlockedArenas = new Set(['basic']); // Start with basic arena unlocked
        
        console.log('🏛️ Arena System initialized');
    }
    
    /**
     * Initialize arena type definitions
     */
    initializeArenaTypes() {
        return {
            basic: {
                name: 'Training Grounds',
                description: 'A simple arena perfect for learning combat',
                unlockLevel: 1,
                hazards: {
                    fallingRocks: { enabled: true, spawnRate: 0.1 },
                    windGusts: { enabled: true }
                }
            },
            volcanic: {
                name: 'Molten Crater',
                description: 'Beware the rising lava and falling volcanic rocks',
                unlockLevel: 5,
                hazards: {
                    fallingRocks: { enabled: true, spawnRate: 0.25 },
                    lavaFloor: { enabled: true }
                }
            },
            windy: {
                name: 'Sky Temple',
                description: 'High altitude arena with powerful wind currents',
                unlockLevel: 8,
                hazards: {
                    windGusts: { 
                        enabled: true,
                        force: { min: 100, max: 250 },
                        cooldown: { min: 2, max: 5 }
                    }
                },
                platforms: [
                    { x: 200, y: 400, width: 100, height: 20 },
                    { x: 500, y: 300, width: 100, height: 20 }
                ]
            },
            spiky: {
                name: 'Thorn Valley',
                description: 'Watch your step! Deadly spikes emerge from the ground',
                unlockLevel: 12,
                hazards: {
                    spikes: { enabled: true },
                    fallingRocks: { enabled: true, spawnRate: 0.15 }
                }
            },
            chaotic: {
                name: 'Chaos Dimension',
                description: 'All hazards active! Only the strongest survive',
                unlockLevel: 20,
                hazards: {
                    fallingRocks: { enabled: true, spawnRate: 0.3 },
                    lavaFloor: { enabled: true },
                    windGusts: { enabled: true },
                    spikes: { enabled: true }
                }
            }
        };
    }
    
    /**
     * Create an arena
     * @param {string} type - Arena type
     * @returns {Arena} New arena instance
     */
    createArena(type) {
        const arenaData = this.arenaTypes[type];
        if (!arenaData) {
            console.error(`Unknown arena type: ${type}`);
            type = 'basic';
        }
        
        const arena = new Arena(`arena_${type}`, {
            type,
            name: arenaData.name,
            hazards: arenaData.hazards,
            platforms: arenaData.platforms || [],
            weather: arenaData.weather || 'none'
        });
        
        return arena;
    }
    
    /**
     * Load an arena
     * @param {string} type - Arena type
     */
    loadArena(type) {
        // Clean up current arena
        if (this.currentArena) {
            this.currentArena.destroy();
        }
        
        // Create new arena
        this.currentArena = this.createArena(type);
        this.currentArena.init();
        
        // Add to game engine
        gameEngine.addGameObject('arena', this.currentArena);
        
        console.log(`🏟️ Arena loaded: ${this.currentArena.name}`);
        return this.currentArena;
    }
    
    /**
     * Get current arena
     * @returns {Arena|null} Current arena
     */
    getCurrentArena() {
        return this.currentArena;
    }
    
    /**
     * Get all arena types
     * @returns {Object} Arena types data
     */
    getArenaTypes() {
        return { ...this.arenaTypes };
    }
    
    /**
     * Check if arena is unlocked
     * @param {string} type - Arena type
     * @returns {boolean} True if unlocked
     */
    isArenaUnlocked(type) {
        return this.unlockedArenas.has(type);
    }
    
    /**
     * Unlock an arena
     * @param {string} type - Arena type
     */
    unlockArena(type) {
        if (this.arenaTypes[type]) {
            this.unlockedArenas.add(type);
            console.log(`🔓 Arena unlocked: ${this.arenaTypes[type].name}`);
            
            // Save to local storage
            localStorage.setItem('unlockedArenas', JSON.stringify([...this.unlockedArenas]));
        }
    }
    
    /**
     * Load unlocked arenas from storage
     */
    loadUnlockedArenas() {
        const saved = localStorage.getItem('unlockedArenas');
        if (saved) {
            this.unlockedArenas = new Set(JSON.parse(saved));
        }
    }
    
    /**
     * Get arena unlock requirements
     * @param {string} type - Arena type
     * @returns {Object} Unlock requirements
     */
    getUnlockRequirements(type) {
        const arenaData = this.arenaTypes[type];
        if (!arenaData) return null;
        
        return {
            level: arenaData.unlockLevel,
            unlocked: this.isArenaUnlocked(type)
        };
    }
    
    /**
     * Get random arena type for matchmaking
     * @returns {string} Random unlocked arena type
     */
    getRandomArenaType() {
        const unlockedTypes = Array.from(this.unlockedArenas);
        return unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)];
    }
}

// Create global arena system instance
window.arenaSystem = new ArenaSystem();

console.log('🏛️ Arena System module loaded');
