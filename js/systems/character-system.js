/**
 * Character System
 * Manages character creation, abilities, animations, and behavior
 */

class Character {
    constructor(id, config) {
        this.id = id;
        this.name = config.name || 'Warrior';
        this.type = config.type || 'base';
        
        // Physics body
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 40;
        this.height = config.height || 60;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.maxHealth = config.maxHealth || gameConfig.maxHealth;
        this.health = this.maxHealth;
        this.speed = config.speed || gameConfig.moveSpeed;
        this.attackDamage = config.attackDamage || gameConfig.attackDamage.light;
        this.attackRange = config.attackRange || 50;
        this.defense = config.defense || 0;
        
        // State
        this.facingRight = true;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isBlocking = false;
        this.isDashing = false;
        this.isStunned = false;
        this.isDead = false;
        
        // Timers
        this.attackCooldown = 0;
        this.blockCooldown = 0;
        this.dashCooldown = 0;
        this.stunDuration = 0;
        this.invulnerabilityTime = 0;
        
        // Animation
        this.animation = {
            current: 'idle',
            frame: 0,
            timer: 0,
            speed: 8 // frames per second
        };
        
        // Abilities
        this.abilities = config.abilities || this.getDefaultAbilities();
        
        // Visual
        this.color = config.color || '#ff6b35';
        this.size = config.size || 1;
        this.zIndex = 1;
        
        // Create physics body
        this.createPhysicsBody();
        
        console.log(`👤 Character created: ${this.name}`);
    }
    
    /**
     * Get default abilities for character type
     */
    getDefaultAbilities() {
        const baseAbilities = {
            lightAttack: {
                damage: gameConfig.attackDamage.light,
                range: 50,
                cooldown: 0.5,
                knockback: 100
            },
            block: {
                reduction: gameConfig.blockReduction,
                cooldown: gameConfig.blockCooldown
            },
            dash: {
                speed: gameConfig.dashSpeed,
                duration: gameConfig.dashDuration,
                cooldown: gameConfig.dashCooldown
            }
        };
        
        // Customize abilities based on character type
        switch (this.type) {
            case 'ninja':
                return {
                    ...baseAbilities,
                    lightAttack: { ...baseAbilities.lightAttack, damage: 12, cooldown: 0.3 },
                    dash: { ...baseAbilities.dash, cooldown: 1.5 },
                    shadowStrike: {
                        damage: 20,
                        range: 80,
                        cooldown: 3,
                        teleport: true
                    }
                };
                
            case 'knight':
                return {
                    ...baseAbilities,
                    lightAttack: { ...baseAbilities.lightAttack, damage: 20, knockback: 150 },
                    block: { ...baseAbilities.block, reduction: 0.7 },
                    shieldBash: {
                        damage: 15,
                        range: 40,
                        cooldown: 2,
                        stun: 1
                    }
                };
                
            case 'mage':
                return {
                    ...baseAbilities,
                    lightAttack: { ...baseAbilities.lightAttack, damage: 18, range: 70 },
                    fireball: {
                        damage: 25,
                        range: 120,
                        cooldown: 2.5,
                        projectile: true
                    }
                };
                
            case 'berserker':
                return {
                    ...baseAbilities,
                    lightAttack: { ...baseAbilities.lightAttack, damage: 25, cooldown: 0.6 },
                    rage: {
                        duration: 5,
                        cooldown: 15,
                        damageMultiplier: 1.5,
                        speedMultiplier: 1.3
                    }
                };
                
            default:
                return baseAbilities;
        }
    }
    
    /**
     * Create physics body for character
     */
    createPhysicsBody() {
        this.physicsBody = physicsEngine.createBody(this.id, {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            mass: 1,
            friction: 0.8,
            restitution: 0.1,
            layer: 'character',
            onCollisionEnter: (other) => this.handleCollision(other),
            onTriggerEnter: (other) => this.handleTrigger(other)
        });
    }
    
    /**
     * Update character logic
     * @param {number} deltaTime - Time step
     */
    update(deltaTime) {
        if (this.isDead) return;
        
        // Update timers
        this.updateTimers(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update physics position
        this.updatePosition();
        
        // Update abilities
        this.updateAbilities(deltaTime);
        
        // Check death
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    }
    
    /**
     * Update all timers
     * @param {number} deltaTime - Time step
     */
    updateTimers(deltaTime) {
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.blockCooldown = Math.max(0, this.blockCooldown - deltaTime);
        this.dashCooldown = Math.max(0, this.dashCooldown - deltaTime);
        this.stunDuration = Math.max(0, this.stunDuration - deltaTime);
        this.invulnerabilityTime = Math.max(0, this.invulnerabilityTime - deltaTime);
        
        // Update state based on timers
        if (this.stunDuration <= 0) this.isStunned = false;
    }
    
    /**
     * Update animation
     * @param {number} deltaTime - Time step
     */
    updateAnimation(deltaTime) {
        this.animation.timer += deltaTime;
        
        const frameTime = 1 / this.animation.speed;
        if (this.animation.timer >= frameTime) {
            this.animation.frame++;
            this.animation.timer = 0;
            
            // Loop animation or end
            const animData = this.getAnimationData(this.animation.current);
            if (this.animation.frame >= animData.frames) {
                if (animData.loop) {
                    this.animation.frame = 0;
                } else {
                    this.setAnimation('idle');
                }
            }
        }
        
        // Auto-set animation based on state
        if (!this.isAttacking && !this.isDashing) {
            if (Math.abs(this.vx) > 10) {
                this.setAnimation('run');
            } else {
                this.setAnimation('idle');
            }
        }
    }
    
    /**
     * Update position from physics body
     */
    updatePosition() {
        if (this.physicsBody) {
            this.x = this.physicsBody.x;
            this.y = this.physicsBody.y;
            this.vx = this.physicsBody.vx;
            this.vy = this.physicsBody.vy;
            this.isGrounded = this.physicsBody.grounded;
        }
    }
    
    /**
     * Update abilities
     * @param {number} deltaTime - Time step
     */
    updateAbilities(deltaTime) {
        // Update special ability states based on character type
        switch (this.type) {
            case 'berserker':
                this.updateRage(deltaTime);
                break;
        }
    }
    
    /**
     * Set animation
     * @param {string} animationName - Animation to play
     */
    setAnimation(animationName) {
        if (this.animation.current !== animationName) {
            this.animation.current = animationName;
            this.animation.frame = 0;
            this.animation.timer = 0;
        }
    }
    
    /**
     * Get animation data
     * @param {string} animationName - Animation name
     * @returns {Object} Animation data
     */
    getAnimationData(animationName) {
        const animations = {
            idle: { frames: 4, loop: true },
            run: { frames: 6, loop: true },
            attack: { frames: 4, loop: false },
            block: { frames: 1, loop: true },
            dash: { frames: 3, loop: false },
            hurt: { frames: 2, loop: false },
            death: { frames: 5, loop: false }
        };
        
        return animations[animationName] || animations.idle;
    }
    
    /**
     * Move character
     * @param {number} deltaX - X movement
     * @param {number} deltaY - Y movement
     */
    move(deltaX, deltaY) {
        if (this.isStunned || this.isDashing || this.isDead) return;
        
        const moveSpeed = this.speed * this.getSpeedMultiplier();
        
        // Apply movement to physics body
        if (this.physicsBody) {
            this.physicsBody.vx = deltaX * moveSpeed;
            // Don't override Y velocity directly (gravity handles it)
        }
        
        // Update facing direction
        if (deltaX > 0.1) this.facingRight = true;
        else if (deltaX < -0.1) this.facingRight = false;
    }
    
    /**
     * Perform light attack
     */
    lightAttack() {
        if (this.attackCooldown > 0 || this.isStunned || this.isDead) return false;
        
        const ability = this.abilities.lightAttack;
        this.attack(ability);
        this.attackCooldown = ability.cooldown;
        
        return true;
    }
    
    /**
     * Perform heavy attack
     */
    heavyAttack() {
        if (this.attackCooldown > 0 || this.isStunned || this.isDead) return false;
        
        const ability = this.abilities.heavyAttack || this.abilities.lightAttack;
        this.attack({ ...ability, damage: ability.damage * 1.5, cooldown: ability.cooldown * 2 });
        this.attackCooldown = ability.cooldown * 2;
        
        return true;
    }
    
    /**
     * Perform special attack
     */
    specialAttack() {
        if (this.isStunned || this.isDead) return false;
        
        switch (this.type) {
            case 'ninja':
                return this.shadowStrike();
            case 'knight':
                return this.shieldBash();
            case 'mage':
                return this.fireball();
            case 'berserker':
                return this.rage();
            default:
                return this.lightAttack();
        }
    }
    
    /**
     * Generic attack method
     * @param {Object} ability - Attack ability data
     */
    attack(ability) {
        this.isAttacking = true;
        this.setAnimation('attack');
        
        // Create attack hitbox
        const attackX = this.facingRight ? 
            this.x + this.width : 
            this.x - ability.range;
        const attackY = this.y;
        const attackWidth = ability.range;
        const attackHeight = this.height;
        
        // Visual effect
        this.createAttackEffect(attackX, attackY, attackWidth, attackHeight);
        
        // Check for hits
        const targets = physicsEngine.getBodiesInRadius(
            attackX + attackWidth / 2,
            attackY + attackHeight / 2,
            ability.range / 2,
            'character'
        );
        
        for (const target of targets) {
            const character = gameEngine.getGameObject(target.id);
            if (character && character !== this) {
                this.dealDamage(character, ability);
            }
        }
        
        // Reset attack state after animation
        setTimeout(() => {
            this.isAttacking = false;
        }, 400);
    }
    
    /**
     * Deal damage to target
     * @param {Character} target - Target character
     * @param {Object} ability - Attack ability
     */
    dealDamage(target, ability) {
        if (target.invulnerabilityTime > 0) return;
        
        let damage = ability.damage * this.getDamageMultiplier();
        
        // Apply defense and blocking
        if (target.isBlocking) {
            damage *= (1 - target.abilities.block.reduction);
        }
        damage = Math.max(1, damage - target.defense);
        
        // Apply damage
        target.takeDamage(damage, this);
        
        // Apply knockback
        if (ability.knockback && !target.isBlocking) {
            const knockbackX = this.facingRight ? ability.knockback : -ability.knockback;
            physicsEngine.applyImpulse(target.id, knockbackX, -50);
        }
        
        // Apply stun
        if (ability.stun) {
            target.stun(ability.stun);
        }
        
        console.log(`⚔️ ${this.name} dealt ${damage} damage to ${target.name}`);
    }
    
    /**
     * Take damage
     * @param {number} amount - Damage amount
     * @param {Character} attacker - Attacking character
     */
    takeDamage(amount, attacker) {
        if (this.invulnerabilityTime > 0 || this.isDead) return;
        
        this.health = Math.max(0, this.health - amount);
        this.invulnerabilityTime = 0.2; // Brief invulnerability
        
        // Visual feedback
        this.createDamageIndicator(amount);
        this.setAnimation('hurt');
        
        // Camera shake
        gameEngine.shakeCamera(5, 0.2);
        
        // Create blood particles
        gameEngine.createParticle(
            this.x + this.width / 2,
            this.y + this.height / 2,
            'circle',
            { color: '#ff4136', size: 3, life: 1 }
        );
        
        console.log(`💔 ${this.name} took ${amount} damage (${this.health}/${this.maxHealth} HP)`);
        
        // Dispatch damage event
        document.dispatchEvent(new CustomEvent('characterDamaged', {
            detail: { character: this, damage: amount, attacker }
        }));
    }
    
    /**
     * Start blocking
     */
    startBlock() {
        if (this.blockCooldown > 0 || this.isStunned || this.isDead) return false;
        
        this.isBlocking = true;
        this.setAnimation('block');
        return true;
    }
    
    /**
     * Stop blocking
     */
    stopBlock() {
        this.isBlocking = false;
        this.blockCooldown = this.abilities.block.cooldown;
    }
    
    /**
     * Perform dash
     * @param {number} directionX - Dash direction X
     * @param {number} directionY - Dash direction Y
     */
    dash(directionX = 1, directionY = 0) {
        if (this.dashCooldown > 0 || this.isStunned || this.isDead) return false;
        
        this.isDashing = true;
        this.setAnimation('dash');
        
        const ability = this.abilities.dash;
        const dashSpeed = ability.speed * this.getSpeedMultiplier();
        
        // Apply dash impulse
        physicsEngine.setVelocity(this.id, directionX * dashSpeed, directionY * dashSpeed * 0.5);
        
        // Create dash effect
        this.createDashEffect();
        
        this.dashCooldown = ability.cooldown;
        
        // End dash after duration
        setTimeout(() => {
            this.isDashing = false;
        }, ability.duration * 1000);
        
        return true;
    }
    
    /**
     * Stun character
     * @param {number} duration - Stun duration in seconds
     */
    stun(duration) {
        this.isStunned = true;
        this.stunDuration = duration;
        
        // Stop movement
        if (this.physicsBody) {
            this.physicsBody.vx *= 0.1;
        }
        
        console.log(`😵 ${this.name} stunned for ${duration}s`);
    }
    
    /**
     * Die
     */
    die() {
        this.isDead = true;
        this.health = 0;
        this.setAnimation('death');
        
        // Stop all movement
        if (this.physicsBody) {
            this.physicsBody.vx = 0;
            this.physicsBody.vy = 0;
        }
        
        // Create death effect
        this.createDeathEffect();
        
        console.log(`💀 ${this.name} died`);
        
        // Dispatch death event
        document.dispatchEvent(new CustomEvent('characterDeath', {
            detail: { character: this }
        }));
    }
    
    /**
     * Heal character
     * @param {number} amount - Heal amount
     */
    heal(amount) {
        if (this.isDead) return;
        
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // Create heal effect
        gameEngine.createParticle(
            this.x + this.width / 2,
            this.y + this.height / 2,
            'circle',
            { color: '#2ecc40', size: 4, life: 1, vy: -50 }
        );
        
        console.log(`💚 ${this.name} healed ${amount} HP`);
    }
    
    /**
     * Special abilities for different character types
     */
    shadowStrike() {
        const ability = this.abilities.shadowStrike;
        if (!ability || this.attackCooldown > 0) return false;
        
        // Find nearest enemy
        const enemies = Array.from(gameEngine.gameObjects.values())
            .filter(obj => obj instanceof Character && obj !== this && !obj.isDead);
        
        if (enemies.length === 0) return false;
        
        const target = enemies[0]; // Simplified - just pick first
        
        // Teleport near target
        if (ability.teleport) {
            this.x = target.x + (this.facingRight ? -60 : 60);
            this.y = target.y;
            if (this.physicsBody) {
                this.physicsBody.x = this.x;
                this.physicsBody.y = this.y;
            }
        }
        
        // Perform attack
        this.attack(ability);
        this.attackCooldown = ability.cooldown;
        
        return true;
    }
    
    shieldBash() {
        const ability = this.abilities.shieldBash;
        if (!ability || this.attackCooldown > 0) return false;
        
        this.attack(ability);
        this.attackCooldown = ability.cooldown;
        
        return true;
    }
    
    fireball() {
        const ability = this.abilities.fireball;
        if (!ability || this.attackCooldown > 0) return false;
        
        // Create projectile
        this.createProjectile(ability);
        this.attackCooldown = ability.cooldown;
        
        return true;
    }
    
    rage() {
        const ability = this.abilities.rage;
        if (!ability || this.rageActive || this.rageCooldown > 0) return false;
        
        this.rageActive = true;
        this.rageDuration = ability.duration;
        this.rageCooldown = ability.cooldown;
        
        // Visual effect
        this.color = '#ff4136';
        
        setTimeout(() => {
            this.rageActive = false;
            this.color = '#ff6b35';
        }, ability.duration * 1000);
        
        return true;
    }
    
    /**
     * Get damage multiplier based on character state
     * @returns {number} Damage multiplier
     */
    getDamageMultiplier() {
        let multiplier = 1;
        
        if (this.type === 'berserker' && this.rageActive) {
            multiplier *= this.abilities.rage.damageMultiplier;
        }
        
        return multiplier;
    }
    
    /**
     * Get speed multiplier based on character state
     * @returns {number} Speed multiplier
     */
    getSpeedMultiplier() {
        let multiplier = 1;
        
        if (this.type === 'berserker' && this.rageActive) {
            multiplier *= this.abilities.rage.speedMultiplier;
        }
        
        return multiplier;
    }
    
    /**
     * Update rage state for berserker
     * @param {number} deltaTime - Time step
     */
    updateRage(deltaTime) {
        if (this.rageDuration > 0) {
            this.rageDuration -= deltaTime;
        }
        if (this.rageCooldown > 0) {
            this.rageCooldown -= deltaTime;
        }
    }
    
    /**
     * Create visual effects
     */
    createAttackEffect(x, y, width, height) {
        // Create attack particles
        for (let i = 0; i < 5; i++) {
            gameEngine.createParticle(
                x + Math.random() * width,
                y + Math.random() * height,
                'circle',
                {
                    color: '#ffd23f',
                    size: Math.random() * 3 + 2,
                    life: 0.3,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100
                }
            );
        }
    }
    
    createDashEffect() {
        for (let i = 0; i < 8; i++) {
            gameEngine.createParticle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                'circle',
                {
                    color: this.color,
                    size: Math.random() * 4 + 1,
                    life: 0.5,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200
                }
            );
        }
    }
    
    createDeathEffect() {
        for (let i = 0; i < 15; i++) {
            gameEngine.createParticle(
                this.x + Math.random() * this.width,
                this.y + Math.random() * this.height,
                'circle',
                {
                    color: i % 2 === 0 ? '#ff4136' : '#ffffff',
                    size: Math.random() * 5 + 2,
                    life: 2,
                    vx: (Math.random() - 0.5) * 300,
                    vy: (Math.random() - 0.5) * 300,
                    gravity: 100
                }
            );
        }
    }
    
    createDamageIndicator(damage) {
        const indicator = document.createElement('div');
        indicator.className = 'damage-indicator';
        indicator.textContent = `-${Math.floor(damage)}`;
        indicator.style.left = (this.x + this.width / 2) + 'px';
        indicator.style.top = (this.y - 20) + 'px';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 1000);
    }
    
    createProjectile(ability) {
        const projectile = {
            x: this.x + (this.facingRight ? this.width : 0),
            y: this.y + this.height / 2,
            vx: (this.facingRight ? 1 : -1) * 300,
            vy: 0,
            size: 8,
            color: '#ff851b',
            damage: ability.damage,
            owner: this,
            life: 2
        };
        
        // Add to game engine as temporary object
        gameEngine.addGameObject(`projectile_${Date.now()}`, {
            update: (dt) => {
                projectile.x += projectile.vx * dt;
                projectile.y += projectile.vy * dt;
                projectile.life -= dt;
                
                if (projectile.life <= 0) {
                    gameEngine.removeGameObject(`projectile_${Date.now()}`);
                }
                
                // Check collision with characters
                const targets = physicsEngine.getBodiesInRadius(
                    projectile.x, projectile.y, projectile.size, 'character'
                );
                
                for (const target of targets) {
                    const character = gameEngine.getGameObject(target.id);
                    if (character && character !== projectile.owner) {
                        character.takeDamage(projectile.damage, projectile.owner);
                        gameEngine.removeGameObject(`projectile_${Date.now()}`);
                        break;
                    }
                }
            },
            render: (ctx) => {
                ctx.fillStyle = projectile.color;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    /**
     * Handle collision with other objects
     * @param {Object} other - Other physics body
     */
    handleCollision(other) {
        // Handle collision logic
        if (other.layer === 'hazard') {
            this.takeDamage(10, null);
        }
    }
    
    /**
     * Handle trigger events
     * @param {Object} other - Other physics body
     */
    handleTrigger(other) {
        // Handle trigger logic
    }
    
    /**
     * Render character
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     */
    render(ctx) {
        if (this.isDead && this.animation.current === 'death' && this.animation.frame >= 4) {
            return; // Don't render fully dead characters
        }
        
        ctx.save();
        
        // Flip sprite if facing left
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        }
        
        // Flash white when taking damage
        if (this.invulnerabilityTime > 0) {
            ctx.globalAlpha = Math.sin(this.invulnerabilityTime * 20) * 0.5 + 0.5;
        }
        
        // Draw character (simplified rectangle for now)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw eyes
        ctx.fillStyle = 'white';
        const eyeSize = 4;
        const eyeY = this.y + 10;
        ctx.fillRect(this.x + 8, eyeY, eyeSize, eyeSize);
        ctx.fillRect(this.x + this.width - 12, eyeY, eyeSize, eyeSize);
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = this.y - 8;
            
            // Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(this.x, barY, barWidth, barHeight);
            
            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#2ecc40' : healthPercent > 0.25 ? '#ff851b' : '#ff4136';
            ctx.fillRect(this.x, barY, barWidth * healthPercent, barHeight);
        }
        
        // Draw status effects
        let statusY = this.y - 20;
        if (this.isBlocking) {
            ctx.fillStyle = '#0074d9';
            ctx.fillText('🛡️', this.x + this.width / 2 - 8, statusY);
            statusY -= 15;
        }
        if (this.isStunned) {
            ctx.fillStyle = '#ffdc00';
            ctx.fillText('😵', this.x + this.width / 2 - 8, statusY);
            statusY -= 15;
        }
        if (this.rageActive) {
            ctx.fillStyle = '#ff4136';
            ctx.fillText('💢', this.x + this.width / 2 - 8, statusY);
        }
        
        ctx.restore();
    }
    
    /**
     * Clean up character
     */
    destroy() {
        if (this.physicsBody) {
            physicsEngine.removeBody(this.id);
        }
        console.log(`👤 Character destroyed: ${this.name}`);
    }
}

/**
 * Character System Manager
 */
class CharacterSystem {
    constructor() {
        this.characterTypes = this.initializeCharacterTypes();
        this.unlockedCharacters = new Set(['ninja']); // Start with ninja unlocked
        
        console.log('👥 Character System initialized');
    }
    
    /**
     * Initialize character type definitions
     */
    initializeCharacterTypes() {
        return {
            ninja: {
                name: 'Shadow Ninja',
                description: 'Fast and agile warrior with quick strikes',
                color: '#2c3e50',
                unlockLevel: 1,
                stats: {
                    speed: 5,
                    attack: 3,
                    defense: 2
                },
                abilities: ['lightAttack', 'dash', 'shadowStrike']
            },
            knight: {
                name: 'Holy Knight',
                description: 'Balanced warrior with strong defense',
                color: '#3498db',
                unlockLevel: 5,
                stats: {
                    speed: 3,
                    attack: 4,
                    defense: 5
                },
                abilities: ['lightAttack', 'block', 'shieldBash']
            },
            mage: {
                name: 'Fire Mage',
                description: 'Ranged spellcaster with devastating magic',
                color: '#e74c3c',
                unlockLevel: 10,
                stats: {
                    speed: 2,
                    attack: 5,
                    defense: 2
                },
                abilities: ['lightAttack', 'dash', 'fireball']
            },
            berserker: {
                name: 'Wild Berserker',
                description: 'Powerful warrior that grows stronger in combat',
                color: '#f39c12',
                unlockLevel: 15,
                stats: {
                    speed: 4,
                    attack: 5,
                    defense: 3
                },
                abilities: ['lightAttack', 'dash', 'rage']
            }
        };
    }
    
    /**
     * Create a new character
     * @param {string} id - Character ID
     * @param {string} type - Character type
     * @param {Object} config - Additional configuration
     * @returns {Character} New character instance
     */
    createCharacter(id, type, config = {}) {
        const typeData = this.characterTypes[type];
        if (!typeData) {
            console.error(`Unknown character type: ${type}`);
            type = 'ninja';
        }
        
        const characterConfig = {
            type,
            name: typeData.name,
            color: typeData.color,
            ...config
        };
        
        return new Character(id, characterConfig);
    }
    
    /**
     * Get all character types
     * @returns {Object} Character types data
     */
    getCharacterTypes() {
        return { ...this.characterTypes };
    }
    
    /**
     * Check if character is unlocked
     * @param {string} type - Character type
     * @returns {boolean} True if unlocked
     */
    isCharacterUnlocked(type) {
        return this.unlockedCharacters.has(type);
    }
    
    /**
     * Unlock a character
     * @param {string} type - Character type
     */
    unlockCharacter(type) {
        if (this.characterTypes[type]) {
            this.unlockedCharacters.add(type);
            console.log(`🔓 Character unlocked: ${this.characterTypes[type].name}`);
            
            // Save to local storage
            localStorage.setItem('unlockedCharacters', JSON.stringify([...this.unlockedCharacters]));
        }
    }
    
    /**
     * Load unlocked characters from storage
     */
    loadUnlockedCharacters() {
        const saved = localStorage.getItem('unlockedCharacters');
        if (saved) {
            this.unlockedCharacters = new Set(JSON.parse(saved));
        }
    }
    
    /**
     * Get character unlock requirements
     * @param {string} type - Character type
     * @returns {Object} Unlock requirements
     */
    getUnlockRequirements(type) {
        const typeData = this.characterTypes[type];
        if (!typeData) return null;
        
        return {
            level: typeData.unlockLevel,
            unlocked: this.isCharacterUnlocked(type)
        };
    }
}

// Create global character system instance
window.characterSystem = new CharacterSystem();

console.log('👥 Character System module loaded');
