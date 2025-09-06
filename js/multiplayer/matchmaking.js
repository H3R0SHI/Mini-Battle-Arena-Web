/**
 * Matchmaking System
 * Handles player matchmaking, fake PvP, and opponent selection
 */

class MatchmakingSystem {
    constructor() {
        this.isSearching = false;
        this.currentQueue = null;
        this.searchStartTime = 0;
        this.maxSearchTime = 30000; // 30 seconds
        this.currentOpponent = null;
        
        // Fake opponent pool for AI matches
        this.opponentPool = this.initializeOpponentPool();
        
        this.setupEventListeners();
        
        console.log('🎯 Matchmaking System initialized');
    }
    
    /**
     * Initialize opponent pool for AI matches
     */
    initializeOpponentPool() {
        return [
            {
                id: 'ai_ninja_master',
                displayName: 'Shadow Ninja',
                character: 'ninja',
                rank: 'Gold',
                rankPoints: 3200,
                level: 15,
                difficulty: 'normal',
                personality: 'aggressive'
            },
            {
                id: 'ai_knight_defender',
                displayName: 'Iron Guardian',
                character: 'knight',
                rank: 'Silver',
                rankPoints: 1800,
                level: 12,
                difficulty: 'easy',
                personality: 'defensive'
            },
            {
                id: 'ai_mage_storm',
                displayName: 'Storm Caller',
                character: 'mage',
                rank: 'Platinum',
                rankPoints: 5500,
                level: 20,
                difficulty: 'hard',
                personality: 'ranged'
            },
            {
                id: 'ai_berserker_fury',
                displayName: 'Rage Beast',
                character: 'berserker',
                rank: 'Diamond',
                rankPoints: 7200,
                level: 24,
                difficulty: 'hard',
                personality: 'berserker'
            },
            {
                id: 'ai_ninja_shadow',
                displayName: 'Dark Assassin',
                character: 'ninja',
                rank: 'Bronze',
                rankPoints: 600,
                level: 8,
                difficulty: 'easy',
                personality: 'hit_and_run'
            },
            {
                id: 'ai_knight_paladin',
                displayName: 'Holy Paladin',
                character: 'knight',
                rank: 'Gold',
                rankPoints: 4100,
                level: 18,
                difficulty: 'normal',
                personality: 'balanced'
            },
            {
                id: 'ai_mage_fire',
                displayName: 'Fire Wizard',
                character: 'mage',
                rank: 'Silver',
                rankPoints: 2100,
                level: 13,
                difficulty: 'normal',
                personality: 'aggressive'
            },
            {
                id: 'ai_berserker_wild',
                displayName: 'Wild Warrior',
                character: 'berserker',
                rank: 'Bronze',
                rankPoints: 800,
                level: 9,
                difficulty: 'easy',
                personality: 'reckless'
            }
        ];
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Firebase events
        document.addEventListener('firebaseAuthReady', () => {
            console.log('🎯 Firebase ready for matchmaking');
        });
        
        document.addEventListener('matchFound', (e) => {
            this.handleMatchFound(e.detail);
        });
        
        document.addEventListener('matchmakingTimeout', (e) => {
            this.handleMatchmakingTimeout(e.detail);
        });
    }
    
    /**
     * Start matchmaking
     * @param {Object} playerData - Player data for matchmaking
     * @returns {Promise<Object>} Match result
     */
    async startMatchmaking(playerData) {
        if (this.isSearching) {
            console.log('🎯 Already searching for match');
            return;
        }
        
        console.log('🎯 Starting matchmaking...');
        
        this.isSearching = true;
        this.searchStartTime = Date.now();
        
        // Show matchmaking UI
        this.showMatchmakingUI();
        
        try {
            // Try Firebase matchmaking first
            if (firebaseManager.isOnline()) {
                this.currentQueue = await firebaseManager.joinMatchmakingQueue({
                    displayName: playerData.name,
                    rank: playerData.rank,
                    rankPoints: playerData.rankPoints,
                    character: playerData.selectedCharacter || 'ninja'
                });
                
                console.log('🎯 Joined online matchmaking queue');
            } else {
                // Immediate fallback to AI opponent
                setTimeout(() => {
                    this.handleMatchmakingTimeout({ queueId: 'offline' });
                }, 2000); // Short delay for UI feedback
            }
        } catch (error) {
            console.error('🎯 Matchmaking error:', error);
            this.handleMatchmakingTimeout({ queueId: 'error' });
        }
    }
    
    /**
     * Cancel matchmaking
     */
    async cancelMatchmaking() {
        if (!this.isSearching) return;
        
        console.log('🎯 Canceling matchmaking...');
        
        this.isSearching = false;
        
        // Leave Firebase queue
        if (this.currentQueue && this.currentQueue !== 'offline') {
            try {
                await firebaseManager.leaveMatchmakingQueue(this.currentQueue);
            } catch (error) {
                console.error('🎯 Error leaving queue:', error);
            }
        }
        
        this.currentQueue = null;
        this.currentOpponent = null;
        
        // Hide matchmaking UI
        this.hideMatchmakingUI();
        
        // Dispatch cancel event
        document.dispatchEvent(new CustomEvent('matchmakingCancelled'));
    }
    
    /**
     * Handle match found
     * @param {Object} matchData - Match data from Firebase
     */
    handleMatchFound(matchData) {
        console.log('🎯 Match found:', matchData);
        
        this.isSearching = false;
        this.currentOpponent = {
            id: matchData.opponent.uid,
            displayName: matchData.opponent.displayName,
            character: matchData.opponent.character,
            rank: matchData.opponent.rank,
            isAI: false
        };
        
        // Start the match
        this.startMatch();
    }
    
    /**
     * Handle matchmaking timeout
     * @param {Object} timeoutData - Timeout data
     */
    handleMatchmakingTimeout(timeoutData) {
        console.log('🎯 Matchmaking timeout - selecting AI opponent');
        
        this.isSearching = false;
        
        // Select AI opponent
        const playerData = progressionSystem.getPlayerData();
        this.currentOpponent = this.selectAIOpponent(playerData);
        
        // Start the match
        this.startMatch();
    }
    
    /**
     * Select AI opponent based on player skill
     * @param {Object} playerData - Player data
     * @returns {Object} Selected AI opponent
     */
    selectAIOpponent(playerData) {
        // Filter opponents by similar rank
        const playerRankOrder = this.getRankOrder(playerData.rank);
        const suitableOpponents = this.opponentPool.filter(opponent => {
            const opponentRankOrder = this.getRankOrder(opponent.rank);
            return Math.abs(opponentRankOrder - playerRankOrder) <= 1; // Within 1 rank
        });
        
        // If no suitable opponents, use all
        const candidatePool = suitableOpponents.length > 0 ? suitableOpponents : this.opponentPool;
        
        // Select based on player level and rank points
        let selectedOpponent;
        
        if (playerData.rankPoints < 1000) {
            // New players get easier opponents
            const easyOpponents = candidatePool.filter(opp => opp.difficulty === 'easy');
            selectedOpponent = easyOpponents[Math.floor(Math.random() * easyOpponents.length)] || candidatePool[0];
        } else if (playerData.rankPoints > 5000) {
            // High rank players get harder opponents
            const hardOpponents = candidatePool.filter(opp => opp.difficulty === 'hard');
            selectedOpponent = hardOpponents[Math.floor(Math.random() * hardOpponents.length)] || candidatePool[candidatePool.length - 1];
        } else {
            // Random selection from suitable pool
            selectedOpponent = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        }
        
        // Add some randomization to make it less predictable
        const variation = (Math.random() - 0.5) * 200; // ±100 rank points
        selectedOpponent = {
            ...selectedOpponent,
            rankPoints: Math.max(0, selectedOpponent.rankPoints + variation),
            isAI: true
        };
        
        console.log('🎯 Selected AI opponent:', selectedOpponent.displayName);
        return selectedOpponent;
    }
    
    /**
     * Get rank order for comparison
     * @param {string} rank - Rank name
     * @returns {number} Rank order
     */
    getRankOrder(rank) {
        const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Mythic'];
        return ranks.indexOf(rank);
    }
    
    /**
     * Start the match
     */
    startMatch() {
        console.log('🎯 Starting match with opponent:', this.currentOpponent.displayName);
        
        // Hide matchmaking UI
        this.hideMatchmakingUI();
        
        // Dispatch match start event
        document.dispatchEvent(new CustomEvent('matchReady', {
            detail: {
                opponent: this.currentOpponent,
                isAI: this.currentOpponent.isAI
            }
        }));
        
        // Start battle with selected opponent
        const playerCharacter = localStorage.getItem('selectedCharacter') || 'ninja';
        battleSystem.startBattle({
            playerCharacter,
            opponentCharacter: this.currentOpponent.character,
            opponentData: this.currentOpponent,
            arena: arenaSystem.getRandomArenaType()
        });
    }
    
    /**
     * Show matchmaking UI
     */
    showMatchmakingUI() {
        const waitTimeElement = document.getElementById('waitTime');
        
        // Update wait time display
        let timeElapsed = 0;
        const updateTimer = setInterval(() => {
            timeElapsed++;
            const remaining = Math.max(0, 30 - timeElapsed);
            
            if (waitTimeElement) {
                waitTimeElement.textContent = `${remaining}s`;
            }
            
            if (!this.isSearching || remaining <= 0) {
                clearInterval(updateTimer);
            }
        }, 1000);
        
        this.matchmakingTimer = updateTimer;
    }
    
    /**
     * Hide matchmaking UI
     */
    hideMatchmakingUI() {
        if (this.matchmakingTimer) {
            clearInterval(this.matchmakingTimer);
            this.matchmakingTimer = null;
        }
    }
    
    /**
     * Get opponent replay data (for fake PvP)
     * @param {Object} opponent - Opponent data
     * @returns {Object} Replay data
     */
    getOpponentReplay(opponent) {
        // Generate realistic replay data based on opponent stats
        const replayData = {
            opponentId: opponent.id,
            actions: this.generateOpponentActions(opponent),
            timing: this.generateOpponentTiming(opponent),
            difficulty: opponent.difficulty
        };
        
        return replayData;
    }
    
    /**
     * Generate opponent actions for replay
     * @param {Object} opponent - Opponent data
     * @returns {Array} Action sequence
     */
    generateOpponentActions(opponent) {
        const actions = [];
        const battleDuration = 30; // seconds
        const personality = opponent.personality || 'balanced';
        
        // Generate actions based on personality
        switch (personality) {
            case 'aggressive':
                // More attacks, less blocking
                for (let t = 0; t < battleDuration; t += 0.5) {
                    if (Math.random() < 0.7) {
                        actions.push({ time: t, type: 'attack', direction: Math.random() > 0.5 ? 1 : -1 });
                    }
                    if (Math.random() < 0.2) {
                        actions.push({ time: t + 0.2, type: 'dash', direction: Math.random() > 0.5 ? 1 : -1 });
                    }
                }
                break;
                
            case 'defensive':
                // More blocking, fewer attacks
                for (let t = 0; t < battleDuration; t += 0.8) {
                    if (Math.random() < 0.4) {
                        actions.push({ time: t, type: 'attack', direction: Math.random() > 0.5 ? 1 : -1 });
                    }
                    if (Math.random() < 0.6) {
                        actions.push({ time: t + 0.3, type: 'block', duration: 1 });
                    }
                }
                break;
                
            case 'hit_and_run':
                // Quick attacks followed by dashes
                for (let t = 0; t < battleDuration; t += 1.2) {
                    actions.push({ time: t, type: 'attack', direction: Math.random() > 0.5 ? 1 : -1 });
                    actions.push({ time: t + 0.3, type: 'dash', direction: Math.random() > 0.5 ? 1 : -1 });
                }
                break;
                
            default: // balanced
                for (let t = 0; t < battleDuration; t += 0.6) {
                    const rand = Math.random();
                    if (rand < 0.5) {
                        actions.push({ time: t, type: 'attack', direction: Math.random() > 0.5 ? 1 : -1 });
                    } else if (rand < 0.7) {
                        actions.push({ time: t, type: 'block', duration: 0.8 });
                    } else {
                        actions.push({ time: t, type: 'dash', direction: Math.random() > 0.5 ? 1 : -1 });
                    }
                }
                break;
        }
        
        return actions;
    }
    
    /**
     * Generate opponent timing patterns
     * @param {Object} opponent - Opponent data
     * @returns {Object} Timing data
     */
    generateOpponentTiming(opponent) {
        const difficulty = opponent.difficulty || 'normal';
        let reactionTime, accuracy, comboChance;
        
        switch (difficulty) {
            case 'easy':
                reactionTime = 0.8; // Slow reactions
                accuracy = 0.6; // 60% accuracy
                comboChance = 0.2; // 20% combo chance
                break;
            case 'hard':
                reactionTime = 0.3; // Fast reactions
                accuracy = 0.9; // 90% accuracy
                comboChance = 0.7; // 70% combo chance
                break;
            default: // normal
                reactionTime = 0.5; // Medium reactions
                accuracy = 0.75; // 75% accuracy
                comboChance = 0.4; // 40% combo chance
                break;
        }
        
        return {
            reactionTime,
            accuracy,
            comboChance,
            moveFrequency: 0.3 + (Math.random() * 0.4) // 0.3-0.7 seconds between moves
        };
    }
    
    /**
     * Record match result for matchmaking rating
     * @param {Object} matchResult - Match result
     */
    recordMatchResult(matchResult) {
        if (!this.currentOpponent) return;
        
        // Submit to Firebase if online match
        if (!this.currentOpponent.isAI && firebaseManager.isOnline()) {
            firebaseManager.submitBattleResult({
                ...matchResult,
                opponentId: this.currentOpponent.id
            });
        }
        
        // Update local AI opponent ratings
        if (this.currentOpponent.isAI) {
            this.updateAIOpponentRating(this.currentOpponent, matchResult);
        }
        
        // Clear current opponent
        this.currentOpponent = null;
        
        console.log('🎯 Match result recorded');
    }
    
    /**
     * Update AI opponent rating based on match result
     * @param {Object} opponent - AI opponent
     * @param {Object} matchResult - Match result
     */
    updateAIOpponentRating(opponent, matchResult) {
        // Find opponent in pool
        const opponentIndex = this.opponentPool.findIndex(opp => opp.id === opponent.id);
        if (opponentIndex === -1) return;
        
        const aiOpponent = this.opponentPool[opponentIndex];
        
        // Adjust rating based on result
        if (matchResult.result === 'victory') {
            // Player won - slightly decrease AI rating
            aiOpponent.rankPoints = Math.max(0, aiOpponent.rankPoints - 10);
        } else if (matchResult.result === 'defeat') {
            // Player lost - slightly increase AI rating
            aiOpponent.rankPoints += 15;
        }
        
        // Update difficulty if needed
        if (aiOpponent.rankPoints < 1000 && aiOpponent.difficulty !== 'easy') {
            aiOpponent.difficulty = 'easy';
        } else if (aiOpponent.rankPoints > 5000 && aiOpponent.difficulty !== 'hard') {
            aiOpponent.difficulty = 'hard';
        } else if (aiOpponent.rankPoints >= 1000 && aiOpponent.rankPoints <= 5000 && aiOpponent.difficulty !== 'normal') {
            aiOpponent.difficulty = 'normal';
        }
        
        console.log(`🎯 AI opponent ${aiOpponent.displayName} rating updated: ${aiOpponent.rankPoints}`);
    }
    
    /**
     * Get matchmaking statistics
     * @returns {Object} Matchmaking stats
     */
    getMatchmakingStats() {
        return {
            totalOpponents: this.opponentPool.length,
            averageSearchTime: 15, // seconds (mock)
            onlinePlayersActive: Math.floor(Math.random() * 500) + 100, // Mock online count
            isSearching: this.isSearching,
            currentOpponent: this.currentOpponent
        };
    }
    
    /**
     * Reset matchmaking system
     */
    reset() {
        this.cancelMatchmaking();
        this.currentOpponent = null;
        console.log('🎯 Matchmaking system reset');
    }
    
    /**
     * Clean up matchmaking system
     */
    destroy() {
        this.cancelMatchmaking();
        console.log('🎯 Matchmaking System destroyed');
    }
}

// Create global matchmaking system instance
window.matchmakingSystem = new MatchmakingSystem();

console.log('🎯 Matchmaking System module loaded');
