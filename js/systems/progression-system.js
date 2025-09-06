/**
 * Progression System
 * Handles player XP, levels, ranks, unlocks, and daily missions
 */

class ProgressionSystem {
    constructor() {
        this.playerData = this.getDefaultPlayerData();
        this.dailyMissions = [];
        this.achievements = [];
        this.rankData = this.initializeRanks();
        
        this.loadPlayerData();
        this.initializeDailyMissions();
        this.initializeAchievements();
        
        console.log('📈 Progression System initialized');
    }
    
    /**
     * Get default player data
     */
    getDefaultPlayerData() {
        return {
            name: 'Warrior',
            level: 1,
            xp: 0,
            totalXP: 0,
            coins: 0,
            rank: 'Bronze',
            rankPoints: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalDamageDealt: 0,
            totalKills: 0,
            longestWinStreak: 0,
            currentWinStreak: 0,
            lastPlayDate: null,
            loginStreak: 0,
            achievementsUnlocked: [],
            dailyMissionsCompleted: [],
            lastDailyMissionReset: null
        };
    }
    
    /**
     * Initialize rank system
     */
    initializeRanks() {
        return {
            Bronze: { 
                minPoints: 0, 
                maxPoints: 999,
                color: '#cd7f32',
                icon: '🥉',
                rewards: { coins: 100 }
            },
            Silver: { 
                minPoints: 1000, 
                maxPoints: 2499,
                color: '#c0c0c0',
                icon: '🥈',
                rewards: { coins: 200, character: 'knight' }
            },
            Gold: { 
                minPoints: 2500, 
                maxPoints: 4999,
                color: '#ffd700',
                icon: '🥇',
                rewards: { coins: 300, arena: 'volcanic' }
            },
            Platinum: { 
                minPoints: 5000, 
                maxPoints: 7499,
                color: '#e5e4e2',
                icon: '💎',
                rewards: { coins: 400, character: 'mage' }
            },
            Diamond: { 
                minPoints: 7500, 
                maxPoints: 9999,
                color: '#b9f2ff',
                icon: '💎',
                rewards: { coins: 500, arena: 'windy' }
            },
            Mythic: { 
                minPoints: 10000, 
                maxPoints: 999999,
                color: '#ff6b35',
                icon: '🏆',
                rewards: { coins: 1000, character: 'berserker', arena: 'chaotic' }
            }
        };
    }
    
    /**
     * Initialize daily missions
     */
    initializeDailyMissions() {
        this.resetDailyMissionsIfNeeded();
        
        if (this.dailyMissions.length === 0) {
            this.generateDailyMissions();
        }
        
        console.log('📋 Daily missions initialized');
    }
    
    /**
     * Initialize achievements
     */
    initializeAchievements() {
        this.achievements = [
            {
                id: 'first_win',
                name: 'First Victory',
                description: 'Win your first battle',
                icon: '🏆',
                progress: 0,
                target: 1,
                reward: { xp: 100, coins: 50 },
                condition: (stats) => stats.gamesWon >= 1
            },
            {
                id: 'win_streak_5',
                name: 'Hot Streak',
                description: 'Win 5 battles in a row',
                icon: '🔥',
                progress: 0,
                target: 5,
                reward: { xp: 250, coins: 100 },
                condition: (stats) => stats.currentWinStreak >= 5
            },
            {
                id: 'games_played_10',
                name: 'Warrior',
                description: 'Play 10 battles',
                icon: '⚔️',
                progress: 0,
                target: 10,
                reward: { xp: 200, coins: 75 },
                condition: (stats) => stats.gamesPlayed >= 10
            },
            {
                id: 'damage_1000',
                name: 'Destroyer',
                description: 'Deal 1000 total damage',
                icon: '💥',
                progress: 0,
                target: 1000,
                reward: { xp: 300, coins: 150 },
                condition: (stats) => stats.totalDamageDealt >= 1000
            },
            {
                id: 'level_10',
                name: 'Experienced',
                description: 'Reach level 10',
                icon: '📈',
                progress: 0,
                target: 10,
                reward: { xp: 500, coins: 200 },
                condition: (stats) => stats.level >= 10
            },
            {
                id: 'daily_login_7',
                name: 'Dedicated',
                description: 'Login 7 days in a row',
                icon: '📅',
                progress: 0,
                target: 7,
                reward: { xp: 400, coins: 300 },
                condition: (stats) => stats.loginStreak >= 7
            },
            {
                id: 'rank_gold',
                name: 'Golden Warrior',
                description: 'Reach Gold rank',
                icon: '🥇',
                progress: 0,
                target: 1,
                reward: { xp: 1000, coins: 500 },
                condition: (stats) => stats.rank === 'Gold' || this.getRankOrder(stats.rank) > this.getRankOrder('Gold')
            }
        ];
        
        console.log('🏆 Achievements initialized');
    }
    
    /**
     * Generate random daily missions
     */
    generateDailyMissions() {
        const missionTemplates = [
            {
                type: 'win_games',
                description: 'Win {target} battles',
                target: 2,
                reward: { xp: 100, coins: 50 }
            },
            {
                type: 'play_games',
                description: 'Play {target} battles',
                target: 3,
                reward: { xp: 75, coins: 30 }
            },
            {
                type: 'deal_damage',
                description: 'Deal {target} damage',
                target: 200,
                reward: { xp: 80, coins: 40 }
            },
            {
                type: 'win_with_character',
                description: 'Win 2 matches as {character}',
                characters: ['Ninja', 'Knight', 'Mage', 'Berserker'],
                target: 2,
                reward: { xp: 120, coins: 60 }
            },
            {
                type: 'win_streak',
                description: 'Win {target} battles in a row',
                target: 3,
                reward: { xp: 150, coins: 75 }
            },
            {
                type: 'survive_time',
                description: 'Survive 60 seconds total in battles',
                target: 60,
                reward: { xp: 90, coins: 45 }
            }
        ];
        
        // Generate 3 random missions for today
        this.dailyMissions = [];
        const shuffled = [...missionTemplates].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < 3 && i < shuffled.length; i++) {
            const template = shuffled[i];
            const mission = {
                id: `daily_${Date.now()}_${i}`,
                type: template.type,
                progress: 0,
                target: template.target,
                reward: template.reward,
                completed: false,
                description: template.description.replace('{target}', template.target)
            };
            
            // Handle character-specific missions
            if (template.characters) {
                const character = template.characters[Math.floor(Math.random() * template.characters.length)];
                mission.character = character.toLowerCase();
                mission.description = template.description.replace('{character}', character);
            }
            
            this.dailyMissions.push(mission);
        }
        
        this.saveDailyMissions();
        console.log('📋 Generated new daily missions');
    }
    
    /**
     * Load player data from storage
     */
    loadPlayerData() {
        try {
            const saved = localStorage.getItem('playerData');
            if (saved) {
                const data = JSON.parse(saved);
                this.playerData = { ...this.getDefaultPlayerData(), ...data };
                
                // Check for daily login
                this.checkDailyLogin();
                
                console.log('📈 Player data loaded');
            }
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    }
    
    /**
     * Save player data to storage
     */
    savePlayerData() {
        try {
            localStorage.setItem('playerData', JSON.stringify(this.playerData));
        } catch (error) {
            console.error('Error saving player data:', error);
        }
    }
    
    /**
     * Load daily missions from storage
     */
    loadDailyMissions() {
        try {
            const saved = localStorage.getItem('dailyMissions');
            if (saved) {
                this.dailyMissions = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading daily missions:', error);
        }
    }
    
    /**
     * Save daily missions to storage
     */
    saveDailyMissions() {
        try {
            localStorage.setItem('dailyMissions', JSON.stringify(this.dailyMissions));
        } catch (error) {
            console.error('Error saving daily missions:', error);
        }
    }
    
    /**
     * Check if daily missions need to be reset
     */
    resetDailyMissionsIfNeeded() {
        const today = new Date().toDateString();
        const lastReset = this.playerData.lastDailyMissionReset;
        
        if (!lastReset || lastReset !== today) {
            this.dailyMissions = [];
            this.playerData.lastDailyMissionReset = today;
            this.playerData.dailyMissionsCompleted = [];
            console.log('📋 Daily missions reset for new day');
        } else {
            this.loadDailyMissions();
        }
    }
    
    /**
     * Check daily login and update streak
     */
    checkDailyLogin() {
        const today = new Date().toDateString();
        const lastPlay = this.playerData.lastPlayDate;
        
        if (!lastPlay || lastPlay !== today) {
            // New day login
            if (lastPlay) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();
                
                if (lastPlay === yesterdayStr) {
                    // Consecutive day - increment streak
                    this.playerData.loginStreak++;
                } else {
                    // Missed day(s) - reset streak
                    this.playerData.loginStreak = 1;
                }
            } else {
                // First time playing
                this.playerData.loginStreak = 1;
            }
            
            this.playerData.lastPlayDate = today;
            
            // Give daily login reward
            this.giveDailyLoginReward();
            
            this.savePlayerData();
            console.log(`📅 Daily login: ${this.playerData.loginStreak} day streak`);
        }
    }
    
    /**
     * Give daily login reward
     */
    giveDailyLoginReward() {
        const baseReward = 25;
        const streakBonus = Math.min(this.playerData.loginStreak * 5, 50);
        const totalCoins = baseReward + streakBonus;
        
        this.addCoins(totalCoins);
        
        uiManager.showNotification(`Daily Login Bonus: +${totalCoins} 💰`, 'success');
        
        // Special streak rewards
        if (this.playerData.loginStreak === 7) {
            this.addXP(200);
            uiManager.showNotification('7 Day Streak Bonus: +200 XP!', 'level-up');
        } else if (this.playerData.loginStreak === 30) {
            this.addCoins(500);
            uiManager.showNotification('30 Day Streak Bonus: +500 💰!', 'achievement');
        }
    }
    
    /**
     * Add XP to player
     * @param {number} amount - XP amount
     */
    addXP(amount) {
        this.playerData.xp += amount;
        this.playerData.totalXP += amount;
        
        // Check for level up
        const newLevel = this.calculateLevel(this.playerData.totalXP);
        if (newLevel > this.playerData.level) {
            this.levelUp(newLevel);
        }
        
        this.savePlayerData();
        
        // Dispatch XP gain event
        document.dispatchEvent(new CustomEvent('xpGained', {
            detail: { amount }
        }));
        
        console.log(`📈 Added ${amount} XP (Total: ${this.playerData.totalXP})`);
    }
    
    /**
     * Add coins to player
     * @param {number} amount - Coin amount
     */
    addCoins(amount) {
        this.playerData.coins += amount;
        this.savePlayerData();
        
        // Dispatch coin gain event
        document.dispatchEvent(new CustomEvent('coinGained', {
            detail: { amount }
        }));
        
        console.log(`💰 Added ${amount} coins (Total: ${this.playerData.coins})`);
    }
    
    /**
     * Spend coins
     * @param {number} amount - Coin amount
     * @returns {boolean} True if successful
     */
    spendCoins(amount) {
        if (this.playerData.coins >= amount) {
            this.playerData.coins -= amount;
            this.savePlayerData();
            console.log(`💰 Spent ${amount} coins (Remaining: ${this.playerData.coins})`);
            return true;
        }
        return false;
    }
    
    /**
     * Calculate level from total XP
     * @param {number} totalXP - Total XP
     * @returns {number} Level
     */
    calculateLevel(totalXP) {
        // Level formula: level = floor(sqrt(totalXP / 100)) + 1
        return Math.floor(Math.sqrt(totalXP / 100)) + 1;
    }
    
    /**
     * Calculate XP required for next level
     * @param {number} level - Current level
     * @returns {number} XP required
     */
    calculateXPForLevel(level) {
        // XP required = (level - 1)^2 * 100
        return Math.pow(level - 1, 2) * 100;
    }
    
    /**
     * Level up player
     * @param {number} newLevel - New level
     */
    levelUp(newLevel) {
        const oldLevel = this.playerData.level;
        this.playerData.level = newLevel;
        
        // Give level up rewards
        const coinsReward = newLevel * 10;
        this.addCoins(coinsReward);
        
        // Check for unlocks
        this.checkLevelUnlocks(newLevel);
        
        this.savePlayerData();
        
        // Dispatch level up event
        document.dispatchEvent(new CustomEvent('levelUp', {
            detail: { oldLevel, newLevel }
        }));
        
        uiManager.showLevelUp(newLevel);
        
        console.log(`📈 Level up! ${oldLevel} → ${newLevel}`);
    }
    
    /**
     * Check for level-based unlocks
     * @param {number} level - New level
     */
    checkLevelUnlocks(level) {
        // Check character unlocks
        const characterTypes = characterSystem.getCharacterTypes();
        Object.entries(characterTypes).forEach(([type, data]) => {
            if (data.unlockLevel === level) {
                characterSystem.unlockCharacter(type);
                uiManager.showNotification(`Character Unlocked: ${data.name}!`, 'achievement');
            }
        });
        
        // Check arena unlocks
        const arenaTypes = arenaSystem.getArenaTypes();
        Object.entries(arenaTypes).forEach(([type, data]) => {
            if (data.unlockLevel === level) {
                arenaSystem.unlockArena(type);
                uiManager.showNotification(`Arena Unlocked: ${data.name}!`, 'achievement');
            }
        });
    }
    
    /**
     * Add rank points
     * @param {number} points - Points to add
     */
    addRankPoints(points) {
        this.playerData.rankPoints += points;
        
        // Check for rank up
        const newRank = this.calculateRank(this.playerData.rankPoints);
        if (newRank !== this.playerData.rank) {
            this.rankUp(newRank);
        }
        
        this.savePlayerData();
        console.log(`🏆 Added ${points} rank points (Total: ${this.playerData.rankPoints})`);
    }
    
    /**
     * Calculate rank from points
     * @param {number} points - Rank points
     * @returns {string} Rank name
     */
    calculateRank(points) {
        for (const [rank, data] of Object.entries(this.rankData)) {
            if (points >= data.minPoints && points <= data.maxPoints) {
                return rank;
            }
        }
        return 'Bronze';
    }
    
    /**
     * Rank up player
     * @param {string} newRank - New rank
     */
    rankUp(newRank) {
        const oldRank = this.playerData.rank;
        this.playerData.rank = newRank;
        
        // Give rank up rewards
        const rankRewards = this.rankData[newRank].rewards;
        if (rankRewards.coins) {
            this.addCoins(rankRewards.coins);
        }
        if (rankRewards.character) {
            characterSystem.unlockCharacter(rankRewards.character);
        }
        if (rankRewards.arena) {
            arenaSystem.unlockArena(rankRewards.arena);
        }
        
        this.savePlayerData();
        
        uiManager.showNotification(`Rank Up! ${oldRank} → ${newRank}`, 'achievement');
        
        console.log(`🏆 Rank up! ${oldRank} → ${newRank}`);
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
     * Record battle result
     * @param {Object} battleResult - Battle result data
     */
    recordBattleResult(battleResult) {
        this.playerData.gamesPlayed++;
        
        if (battleResult.result === 'victory') {
            this.playerData.gamesWon++;
            this.playerData.currentWinStreak++;
            this.playerData.longestWinStreak = Math.max(
                this.playerData.longestWinStreak,
                this.playerData.currentWinStreak
            );
            
            // Add rank points for wins
            this.addRankPoints(25);
        } else {
            this.playerData.currentWinStreak = 0;
            
            // Lose fewer points for losses
            this.addRankPoints(-10);
        }
        
        // Add damage stats
        this.playerData.totalDamageDealt += battleResult.stats.playerDamageDealt || 0;
        
        // Update daily missions
        this.updateDailyMissions(battleResult);
        
        // Check achievements
        this.checkAchievements();
        
        this.savePlayerData();
        
        console.log(`📊 Battle recorded: ${battleResult.result}`);
    }
    
    /**
     * Update daily mission progress
     * @param {Object} battleResult - Battle result data
     */
    updateDailyMissions(battleResult) {
        this.dailyMissions.forEach(mission => {
            if (mission.completed) return;
            
            switch (mission.type) {
                case 'win_games':
                    if (battleResult.result === 'victory') {
                        mission.progress++;
                    }
                    break;
                    
                case 'play_games':
                    mission.progress++;
                    break;
                    
                case 'deal_damage':
                    mission.progress += battleResult.stats.playerDamageDealt || 0;
                    break;
                    
                case 'win_with_character':
                    if (battleResult.result === 'victory' && 
                        battleResult.playerCharacter === mission.character) {
                        mission.progress++;
                    }
                    break;
                    
                case 'win_streak':
                    if (this.playerData.currentWinStreak >= mission.target) {
                        mission.progress = mission.target;
                    }
                    break;
                    
                case 'survive_time':
                    mission.progress += battleResult.duration || 0;
                    break;
            }
            
            // Check if mission completed
            if (mission.progress >= mission.target && !mission.completed) {
                this.completeDailyMission(mission);
            }
        });
        
        this.saveDailyMissions();
    }
    
    /**
     * Complete a daily mission
     * @param {Object} mission - Mission to complete
     */
    completeDailyMission(mission) {
        mission.completed = true;
        this.playerData.dailyMissionsCompleted.push(mission.id);
        
        // Give rewards
        if (mission.reward.xp) {
            this.addXP(mission.reward.xp);
        }
        if (mission.reward.coins) {
            this.addCoins(mission.reward.coins);
        }
        
        uiManager.showNotification(`Mission Complete: ${mission.description}`, 'achievement');
        
        console.log(`📋 Daily mission completed: ${mission.description}`);
    }
    
    /**
     * Check achievements
     */
    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (this.playerData.achievementsUnlocked.includes(achievement.id)) return;
            
            // Update progress
            if (achievement.condition(this.playerData)) {
                achievement.progress = achievement.target;
                
                // Unlock achievement
                this.unlockAchievement(achievement);
            }
        });
    }
    
    /**
     * Unlock an achievement
     * @param {Object} achievement - Achievement to unlock
     */
    unlockAchievement(achievement) {
        this.playerData.achievementsUnlocked.push(achievement.id);
        
        // Give rewards
        if (achievement.reward.xp) {
            this.addXP(achievement.reward.xp);
        }
        if (achievement.reward.coins) {
            this.addCoins(achievement.reward.coins);
        }
        
        // Dispatch achievement event
        document.dispatchEvent(new CustomEvent('achievementUnlocked', {
            detail: achievement
        }));
        
        this.savePlayerData();
        
        console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    }
    
    /**
     * Get player data
     * @returns {Object} Player data
     */
    getPlayerData() {
        const currentLevelXP = this.calculateXPForLevel(this.playerData.level);
        const nextLevelXP = this.calculateXPForLevel(this.playerData.level + 1);
        
        return {
            ...this.playerData,
            xpToNextLevel: nextLevelXP - currentLevelXP,
            currentLevelProgress: this.playerData.totalXP - currentLevelXP,
            rankData: this.rankData[this.playerData.rank] || this.rankData.Bronze
        };
    }
    
    /**
     * Get current daily mission
     * @returns {Object|null} Current daily mission
     */
    getCurrentDailyMission() {
        return this.dailyMissions.find(mission => !mission.completed) || null;
    }
    
    /**
     * Get all daily missions
     * @returns {Array} Daily missions
     */
    getDailyMissions() {
        return [...this.dailyMissions];
    }
    
    /**
     * Get achievements
     * @returns {Array} Achievements
     */
    getAchievements() {
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.playerData.achievementsUnlocked.includes(achievement.id)
        }));
    }
    
    /**
     * Get player statistics
     * @returns {Object} Player statistics
     */
    getPlayerStats() {
        const winRate = this.playerData.gamesPlayed > 0 ? 
            (this.playerData.gamesWon / this.playerData.gamesPlayed * 100).toFixed(1) : 0;
        
        return {
            level: this.playerData.level,
            rank: this.playerData.rank,
            totalXP: this.playerData.totalXP,
            coins: this.playerData.coins,
            gamesPlayed: this.playerData.gamesPlayed,
            gamesWon: this.playerData.gamesWon,
            winRate: `${winRate}%`,
            currentWinStreak: this.playerData.currentWinStreak,
            longestWinStreak: this.playerData.longestWinStreak,
            totalDamageDealt: this.playerData.totalDamageDealt,
            loginStreak: this.playerData.loginStreak,
            achievementsUnlocked: this.playerData.achievementsUnlocked.length,
            totalAchievements: this.achievements.length
        };
    }
    
    /**
     * Reset player progress (for testing/demo)
     */
    resetProgress() {
        this.playerData = this.getDefaultPlayerData();
        this.dailyMissions = [];
        this.generateDailyMissions();
        this.savePlayerData();
        this.saveDailyMissions();
        
        // Clear character and arena unlocks
        localStorage.removeItem('unlockedCharacters');
        localStorage.removeItem('unlockedArenas');
        
        console.log('📈 Player progress reset');
    }
    
    /**
     * Clean up progression system
     */
    destroy() {
        this.savePlayerData();
        console.log('📈 Progression System destroyed');
    }
}

// Create global progression system instance
window.progressionSystem = new ProgressionSystem();

console.log('📈 Progression System module loaded');
