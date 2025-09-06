/**
 * Battle System
 * Manages battle flow, win conditions, and battle logic
 */

class BattleSystem {
    constructor() {
        this.isActive = false;
        this.battleTime = 0;
        this.maxBattleTime = gameConfig.battleDuration;
        
        // Battle participants
        this.player = null;
        this.opponent = null;
        
        // Battle state
        this.battleResult = null;
        this.battleStats = {
            playerDamageDealt: 0,
            playerHitsLanded: 0,
            opponentDamageDealt: 0,
            opponentHitsLanded: 0,
            startTime: 0,
            endTime: 0
        };
        
        // Event listeners
        this.setupEventListeners();
        
        console.log('⚔️ Battle System initialized');
    }
    
    /**
     * Setup event listeners for battle events
     */
    setupEventListeners() {
        // Character damage events
        document.addEventListener('characterDamaged', (e) => {
            this.handleCharacterDamaged(e.detail);
        });
        
        // Character death events
        document.addEventListener('characterDeath', (e) => {
            this.handleCharacterDeath(e.detail);
        });
        
        // Input events for player
        document.addEventListener('playerAttack', (e) => {
            this.handlePlayerAttack(e.detail);
        });
        
        document.addEventListener('playerBlock', (e) => {
            this.handlePlayerBlock(e.detail);
        });
        
        document.addEventListener('playerDash', (e) => {
            this.handlePlayerDash(e.detail);
        });
        
        // Battle end event from game engine
        document.addEventListener('battleEnd', (e) => {
            this.handleBattleEnd(e.detail);
        });
    }
    
    /**
     * Start a new battle
     * @param {Object} config - Battle configuration
     */
    startBattle(config = {}) {
        console.log('⚔️ Starting battle...');
        
        // Reset battle state
        this.isActive = true;
        this.battleTime = 0;
        this.battleResult = null;
        this.battleStats = {
            playerDamageDealt: 0,
            playerHitsLanded: 0,
            opponentDamageDealt: 0,
            opponentHitsLanded: 0,
            startTime: Date.now(),
            endTime: 0
        };
        
        // Load arena
        const arenaType = config.arena || arenaSystem.getRandomArenaType();
        arenaSystem.loadArena(arenaType);
        
        // Create characters
        this.createPlayer(config.playerCharacter || 'ninja');
        this.createOpponent(config.opponentCharacter || this.getRandomOpponentCharacter());
        
        // Initialize game engine
        gameEngine.reset();
        gameEngine.gameState.timeRemaining = this.maxBattleTime;
        
        // Add characters to game engine
        gameEngine.addGameObject('player', this.player);
        gameEngine.addGameObject('opponent', this.opponent);
        
        // Start game engine
        gameEngine.start();
        
        // Update UI
        this.updateBattleUI();
        
        console.log('⚔️ Battle started!');
        
        // Dispatch battle start event
        document.dispatchEvent(new CustomEvent('battleStarted', {
            detail: {
                player: this.player,
                opponent: this.opponent,
                arena: arenaSystem.getCurrentArena()
            }
        }));
    }
    
    /**
     * Create player character
     * @param {string} characterType - Character type
     */
    createPlayer(characterType) {
        this.player = characterSystem.createCharacter('player', characterType, {
            x: 150,
            y: gameConfig.arenaHeight - 200,
            color: '#3498db'
        });
        
        console.log(`👤 Player created: ${this.player.name}`);
    }
    
    /**
     * Create opponent character
     * @param {string} characterType - Character type
     */
    createOpponent(characterType) {
        this.opponent = characterSystem.createCharacter('opponent', characterType, {
            x: gameConfig.arenaWidth - 190,
            y: gameConfig.arenaHeight - 200,
            color: '#e74c3c'
        });
        
        // Start opponent AI
        this.startOpponentAI();
        
        console.log(`🤖 Opponent created: ${this.opponent.name}`);
    }
    
    /**
     * Get random opponent character type
     * @returns {string} Character type
     */
    getRandomOpponentCharacter() {
        const types = Object.keys(characterSystem.getCharacterTypes());
        return types[Math.floor(Math.random() * types.length)];
    }
    
    /**
     * Start opponent AI
     */
    startOpponentAI() {
        if (!this.opponent) return;
        
        // AI state
        this.aiState = {
            attackTimer: 0,
            moveTimer: 0,
            blockTimer: 0,
            dashTimer: 0,
            aggressiveness: Math.random() * 0.5 + 0.3, // 0.3-0.8
            moveDirection: 1,
            lastAction: null,
            difficulty: 'normal' // easy, normal, hard
        };
        
        // Start AI update loop
        this.aiUpdateTimer = setInterval(() => {
            this.updateOpponentAI();
        }, 100); // Update AI every 100ms
    }
    
    /**
     * Update opponent AI
     */
    updateOpponentAI() {
        if (!this.isActive || !this.opponent || this.opponent.isDead || !this.player) return;
        
        const deltaTime = 0.1; // 100ms
        const ai = this.aiState;
        
        // Update timers
        ai.attackTimer += deltaTime;
        ai.moveTimer += deltaTime;
        ai.blockTimer += deltaTime;
        ai.dashTimer += deltaTime;
        
        // Calculate distance to player
        const distance = Math.abs(this.player.x - this.opponent.x);
        const isPlayerLeft = this.player.x < this.opponent.x;
        
        // AI decision making
        this.makeAIDecision(distance, isPlayerLeft, deltaTime);
    }
    
    /**
     * Make AI decision based on situation
     * @param {number} distance - Distance to player
     * @param {boolean} isPlayerLeft - Is player to the left
     * @param {number} deltaTime - Time step
     */
    makeAIDecision(distance, isPlayerLeft, deltaTime) {
        const ai = this.aiState;
        
        // Defensive behavior - block incoming attacks
        if (this.player.isAttacking && distance < 80 && ai.blockTimer > 0.5) {
            if (Math.random() < 0.7) { // 70% chance to block
                this.opponent.startBlock();
                ai.blockTimer = 0;
                ai.lastAction = 'block';
                return;
            }
        } else {
            this.opponent.stopBlock();
        }
        
        // Dash behavior - escape or close distance
        if (ai.dashTimer > 2 && Math.random() < 0.3) {
            const dashDirection = distance > 150 ? (isPlayerLeft ? -1 : 1) : (isPlayerLeft ? 1 : -1);
            this.opponent.dash(dashDirection, 0);
            ai.dashTimer = 0;
            ai.lastAction = 'dash';
            return;
        }
        
        // Attack behavior
        if (distance < this.opponent.attackRange + 20 && ai.attackTimer > 0.8) {
            const attackChance = ai.aggressiveness + (this.opponent.health < 30 ? 0.3 : 0);
            
            if (Math.random() < attackChance) {
                // Choose attack type
                if (Math.random() < 0.7) {
                    this.opponent.lightAttack();
                } else if (Math.random() < 0.9) {
                    this.opponent.heavyAttack();
                } else {
                    this.opponent.specialAttack();
                }
                
                ai.attackTimer = 0;
                ai.lastAction = 'attack';
                return;
            }
        }
        
        // Movement behavior
        if (ai.moveTimer > 0.2) {
            let moveX = 0;
            
            // Move towards player if far, away if too close
            if (distance > 100) {
                moveX = isPlayerLeft ? -0.7 : 0.7; // Move towards player
            } else if (distance < 50) {
                moveX = isPlayerLeft ? 0.5 : -0.5; // Move away from player
            } else {
                // Circle strafe
                ai.moveDirection *= Math.random() < 0.1 ? -1 : 1; // 10% chance to change direction
                moveX = ai.moveDirection * 0.3;
            }
            
            // Add some randomness
            moveX += (Math.random() - 0.5) * 0.2;
            
            this.opponent.move(moveX, 0);
            ai.moveTimer = 0;
        }
    }
    
    /**
     * Handle player input events
     */
    handlePlayerAttack(detail) {
        if (!this.isActive || !this.player) return;
        
        if (detail.type === 'light') {
            this.player.lightAttack();
        } else if (detail.type === 'heavy') {
            this.player.heavyAttack();
        } else if (detail.type === 'special') {
            this.player.specialAttack();
        }
    }
    
    handlePlayerBlock(detail) {
        if (!this.isActive || !this.player) return;
        
        if (detail.active) {
            this.player.startBlock();
        } else {
            this.player.stopBlock();
        }
    }
    
    handlePlayerDash(detail) {
        if (!this.isActive || !this.player) return;
        
        this.player.dash(detail.direction.x, detail.direction.y);
    }
    
    /**
     * Handle character damage events
     * @param {Object} detail - Damage event detail
     */
    handleCharacterDamaged(detail) {
        const { character, damage, attacker } = detail;
        
        if (!this.isActive) return;
        
        // Update battle stats
        if (character === this.player && attacker === this.opponent) {
            this.battleStats.opponentDamageDealt += damage;
            this.battleStats.opponentHitsLanded++;
        } else if (character === this.opponent && attacker === this.player) {
            this.battleStats.playerDamageDealt += damage;
            this.battleStats.playerHitsLanded++;
        }
        
        // Update UI
        this.updateHealthBars();
        
        // Check for low health warnings
        if (character.health < character.maxHealth * 0.25) {
            this.showLowHealthWarning(character);
        }
    }
    
    /**
     * Handle character death events
     * @param {Object} detail - Death event detail
     */
    handleCharacterDeath(detail) {
        const { character } = detail;
        
        if (!this.isActive) return;
        
        // Determine winner
        if (character === this.player) {
            this.endBattle('defeat');
        } else if (character === this.opponent) {
            this.endBattle('victory');
        }
    }
    
    /**
     * Handle battle end from game engine (time up)
     * @param {Object} detail - Battle end detail
     */
    handleBattleEnd(detail) {
        if (!this.isActive) return;
        
        // Determine winner based on health
        if (detail.winner === 'player') {
            this.endBattle('victory');
        } else if (detail.winner === 'opponent') {
            this.endBattle('defeat');
        } else {
            this.endBattle('draw');
        }
    }
    
    /**
     * End the battle
     * @param {string} result - Battle result ('victory', 'defeat', 'draw')
     */
    endBattle(result) {
        if (!this.isActive) return;
        
        console.log(`⚔️ Battle ended: ${result}`);
        
        this.isActive = false;
        this.battleResult = result;
        this.battleStats.endTime = Date.now();
        
        // Stop AI
        if (this.aiUpdateTimer) {
            clearInterval(this.aiUpdateTimer);
            this.aiUpdateTimer = null;
        }
        
        // Stop game engine
        gameEngine.stop();
        
        // Calculate battle duration
        const battleDuration = (this.battleStats.endTime - this.battleStats.startTime) / 1000;
        
        // Calculate rewards
        const rewards = this.calculateRewards(result, battleDuration);
        
        // Show victory screen
        setTimeout(() => {
            this.showVictoryScreen(result, rewards);
        }, 1000);
        
        // Dispatch battle end event
        document.dispatchEvent(new CustomEvent('battleComplete', {
            detail: {
                result,
                stats: this.battleStats,
                rewards,
                duration: battleDuration
            }
        }));
    }
    
    /**
     * Calculate battle rewards
     * @param {string} result - Battle result
     * @param {number} duration - Battle duration in seconds
     * @returns {Object} Rewards object
     */
    calculateRewards(result, duration) {
        const baseXP = gameConfig.xpPerLoss;
        const baseCoins = 10;
        
        let xpMultiplier = 1;
        let coinMultiplier = 1;
        
        // Result multipliers
        if (result === 'victory') {
            xpMultiplier = 2;
            coinMultiplier = 3;
        } else if (result === 'draw') {
            xpMultiplier = 1.5;
            coinMultiplier = 2;
        }
        
        // Performance bonuses
        const accuracyBonus = this.battleStats.playerHitsLanded > 0 ? 
            Math.min(1.5, this.battleStats.playerHitsLanded / 10) : 1;
        
        const speedBonus = duration < 20 ? 1.2 : 1;
        const healthBonus = this.player && this.player.health > 50 ? 1.1 : 1;
        
        // Calculate final rewards
        const totalXP = Math.floor(baseXP * xpMultiplier * accuracyBonus * speedBonus);
        const totalCoins = Math.floor(baseCoins * coinMultiplier * healthBonus);
        
        return {
            xp: totalXP,
            coins: totalCoins,
            bonuses: {
                accuracy: accuracyBonus > 1,
                speed: speedBonus > 1,
                health: healthBonus > 1
            }
        };
    }
    
    /**
     * Show victory screen
     * @param {string} result - Battle result
     * @param {Object} rewards - Rewards object
     */
    showVictoryScreen(result, rewards) {
        // Update victory screen UI
        const victoryTitle = document.getElementById('victoryTitle');
        const damageDealt = document.getElementById('damageDealt');
        const hitsLanded = document.getElementById('hitsLanded');
        const timeSurvived = document.getElementById('timeSurvived');
        
        if (victoryTitle) {
            victoryTitle.textContent = result === 'victory' ? 'VICTORY!' : 
                                     result === 'defeat' ? 'DEFEAT!' : 'DRAW!';
            victoryTitle.className = result === 'victory' ? '' : 'defeat';
        }
        
        if (damageDealt) damageDealt.textContent = Math.floor(this.battleStats.playerDamageDealt);
        if (hitsLanded) hitsLanded.textContent = this.battleStats.playerHitsLanded;
        if (timeSurvived) {
            const duration = (this.battleStats.endTime - this.battleStats.startTime) / 1000;
            timeSurvived.textContent = `${duration.toFixed(1)}s`;
        }
        
        // Apply rewards
        progressionSystem.addXP(rewards.xp);
        progressionSystem.addCoins(rewards.coins);
        
        // Show victory screen
        screenManager.showScreen('victoryScreen');
    }
    
    /**
     * Update battle UI elements
     */
    updateBattleUI() {
        this.updateHealthBars();
        this.updateTimer();
    }
    
    /**
     * Update health bars
     */
    updateHealthBars() {
        const playerHealthBar = document.getElementById('playerHealth');
        const opponentHealthBar = document.getElementById('opponentHealth');
        
        if (playerHealthBar && this.player) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            playerHealthBar.style.width = `${healthPercent}%`;
            
            // Add critical health class
            if (healthPercent < 25) {
                playerHealthBar.classList.add('critical');
            } else {
                playerHealthBar.classList.remove('critical');
            }
        }
        
        if (opponentHealthBar && this.opponent) {
            const healthPercent = (this.opponent.health / this.opponent.maxHealth) * 100;
            opponentHealthBar.style.width = `${healthPercent}%`;
            
            // Add critical health class
            if (healthPercent < 25) {
                opponentHealthBar.classList.add('critical');
            } else {
                opponentHealthBar.classList.remove('critical');
            }
        }
    }
    
    /**
     * Update timer display
     */
    updateTimer() {
        const timerElement = document.getElementById('gameTimer');
        if (timerElement && gameEngine.gameState) {
            const timeRemaining = Math.ceil(gameEngine.gameState.timeRemaining);
            timerElement.textContent = timeRemaining;
            
            // Add warning classes
            timerElement.classList.toggle('warning', timeRemaining <= 10 && timeRemaining > 5);
            timerElement.classList.toggle('critical', timeRemaining <= 5);
        }
    }
    
    /**
     * Show low health warning
     * @param {Character} character - Character with low health
     */
    showLowHealthWarning(character) {
        if (character === this.player) {
            // Screen flash effect
            document.dispatchEvent(new CustomEvent('screenEffect', {
                detail: { type: 'lowHealth' }
            }));
            
            // Camera shake
            gameEngine.shakeCamera(3, 0.5);
        }
    }
    
    /**
     * Pause/unpause battle
     */
    pauseBattle() {
        if (this.isActive) {
            gameEngine.togglePause();
        }
    }
    
    /**
     * Quit current battle
     */
    quitBattle() {
        if (this.isActive) {
            this.endBattle('defeat');
        }
        
        screenManager.showScreen('mainMenu');
    }
    
    /**
     * Start rematch with same configuration
     */
    rematch() {
        if (this.player && this.opponent) {
            this.startBattle({
                playerCharacter: this.player.type,
                opponentCharacter: this.opponent.type,
                arena: arenaSystem.getCurrentArena()?.type
            });
        }
    }
    
    /**
     * Get battle statistics
     * @returns {Object} Battle statistics
     */
    getBattleStats() {
        return { ...this.battleStats };
    }
    
    /**
     * Get current battle state
     * @returns {Object} Battle state
     */
    getBattleState() {
        return {
            isActive: this.isActive,
            timeRemaining: gameEngine.gameState?.timeRemaining || 0,
            player: this.player ? {
                health: this.player.health,
                maxHealth: this.player.maxHealth,
                name: this.player.name
            } : null,
            opponent: this.opponent ? {
                health: this.opponent.health,
                maxHealth: this.opponent.maxHealth,
                name: this.opponent.name
            } : null
        };
    }
    
    /**
     * Clean up battle system
     */
    destroy() {
        if (this.aiUpdateTimer) {
            clearInterval(this.aiUpdateTimer);
        }
        
        this.isActive = false;
        this.player = null;
        this.opponent = null;
        
        console.log('⚔️ Battle System destroyed');
    }
}

// Create global battle system instance
window.battleSystem = new BattleSystem();

console.log('⚔️ Battle System module loaded');
