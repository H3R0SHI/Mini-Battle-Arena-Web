/**
 * Screen Manager
 * Handles navigation between different game screens
 */

class ScreenManager {
    constructor() {
        this.currentScreen = null;
        this.screens = new Map();
        this.screenHistory = [];
        this.maxHistoryLength = 10;
        
        this.initializeScreens();
        this.setupEventListeners();
        
        console.log('📱 Screen Manager initialized');
    }
    
    /**
     * Initialize all screens
     */
    initializeScreens() {
        // Register all available screens
        const screenElements = document.querySelectorAll('.screen');
        screenElements.forEach(element => {
            this.registerScreen(element.id, element);
        });
        
        // Set initial screen
        this.showScreen('loadingScreen');
        
        // Simulate loading time
        setTimeout(() => {
            this.showScreen('mainMenu');
        }, 2000);
    }
    
    /**
     * Setup event listeners for screen navigation
     */
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('playBtn')?.addEventListener('click', () => {
            this.showScreen('characterSelect');
        });
        
        document.getElementById('shopBtn')?.addEventListener('click', () => {
            this.showScreen('shopScreen');
        });
        
        document.getElementById('battlePassBtn')?.addEventListener('click', () => {
            this.showBattlePassScreen();
        });
        
        document.getElementById('leaderboardBtn')?.addEventListener('click', () => {
            this.showLeaderboardScreen();
        });
        
        document.getElementById('profileBtn')?.addEventListener('click', () => {
            this.showProfileScreen();
        });
        
        // Back buttons
        document.getElementById('backToMenu')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        document.getElementById('shopBackBtn')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Character selection
        document.getElementById('selectCharacterBtn')?.addEventListener('click', () => {
            this.startMatchmaking();
        });
        
        // Victory screen buttons
        document.getElementById('rematchBtn')?.addEventListener('click', () => {
            battleSystem.rematch();
            this.showScreen('gameScreen');
        });
        
        document.getElementById('mainMenuBtn')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Cancel matchmaking
        document.getElementById('cancelMatchmaking')?.addEventListener('click', () => {
            this.cancelMatchmaking();
        });
        
        // Settings
        document.getElementById('closeSettings')?.addEventListener('click', () => {
            this.hideOverlay('settingsOverlay');
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Battle events
        document.addEventListener('battleStarted', () => {
            this.showScreen('gameScreen');
            inputManager.initializeVirtualControls();
        });
        
        document.addEventListener('battleComplete', (e) => {
            // Victory screen is handled by battle system
        });
    }
    
    /**
     * Register a screen
     * @param {string} screenId - Screen identifier
     * @param {HTMLElement} element - Screen element
     */
    registerScreen(screenId, element) {
        this.screens.set(screenId, {
            element,
            isVisible: element.classList.contains('active'),
            onShow: null,
            onHide: null
        });
    }
    
    /**
     * Show a screen
     * @param {string} screenId - Screen to show
     * @param {Object} options - Show options
     */
    showScreen(screenId, options = {}) {
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.error(`Screen not found: ${screenId}`);
            return;
        }
        
        console.log(`📱 Showing screen: ${screenId}`);
        
        // Hide current screen
        if (this.currentScreen && this.currentScreen !== screenId) {
            this.hideScreen(this.currentScreen);
        }
        
        // Add to history (unless it's already the current screen)
        if (this.currentScreen !== screenId) {
            this.addToHistory(this.currentScreen);
        }
        
        // Show new screen
        screen.element.classList.add('active');
        screen.isVisible = true;
        this.currentScreen = screenId;
        
        // Call screen-specific show handler
        if (screen.onShow) {
            screen.onShow(options);
        }
        
        // Update screen-specific UI
        this.updateScreenUI(screenId);
        
        // Dispatch screen change event
        document.dispatchEvent(new CustomEvent('screenChanged', {
            detail: { screenId, options }
        }));
    }
    
    /**
     * Hide a screen
     * @param {string} screenId - Screen to hide
     */
    hideScreen(screenId) {
        const screen = this.screens.get(screenId);
        if (!screen) return;
        
        screen.element.classList.remove('active');
        screen.isVisible = false;
        
        // Call screen-specific hide handler
        if (screen.onHide) {
            screen.onHide();
        }
    }
    
    /**
     * Show overlay
     * @param {string} overlayId - Overlay to show
     */
    showOverlay(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    /**
     * Hide overlay
     * @param {string} overlayId - Overlay to hide
     */
    hideOverlay(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * Go back to previous screen
     */
    goBack() {
        if (this.screenHistory.length > 0) {
            const previousScreen = this.screenHistory.pop();
            if (previousScreen) {
                this.showScreen(previousScreen);
            }
        }
    }
    
    /**
     * Add screen to history
     * @param {string} screenId - Screen to add
     */
    addToHistory(screenId) {
        if (screenId && screenId !== this.currentScreen) {
            this.screenHistory.push(screenId);
            
            // Limit history length
            if (this.screenHistory.length > this.maxHistoryLength) {
                this.screenHistory.shift();
            }
        }
    }
    
    /**
     * Update screen-specific UI
     * @param {string} screenId - Screen ID
     */
    updateScreenUI(screenId) {
        switch (screenId) {
            case 'mainMenu':
                this.updateMainMenuUI();
                break;
            case 'characterSelect':
                this.updateCharacterSelectUI();
                break;
            case 'shopScreen':
                this.updateShopUI();
                break;
            case 'gameScreen':
                this.updateGameScreenUI();
                break;
            case 'victoryScreen':
                this.updateVictoryScreenUI();
                break;
        }
    }
    
    /**
     * Update main menu UI
     */
    updateMainMenuUI() {
        // Update player info
        const playerName = document.querySelector('.player-name');
        const playerRank = document.querySelector('.rank-name');
        const xpBar = document.querySelector('.xp-fill');
        const xpText = document.querySelector('.xp-text');
        const playerCoins = document.getElementById('playerCoins');
        
        const playerData = progressionSystem.getPlayerData();
        
        if (playerName) playerName.textContent = playerData.name;
        if (playerRank) playerRank.textContent = playerData.rank;
        if (playerCoins) playerCoins.textContent = playerData.coins.toLocaleString();
        
        if (xpBar && xpText) {
            const xpPercent = (playerData.xp % playerData.xpToNextLevel) / playerData.xpToNextLevel * 100;
            xpBar.style.width = `${xpPercent}%`;
            xpText.textContent = `${playerData.xp % playerData.xpToNextLevel}/${playerData.xpToNextLevel} XP`;
        }
        
        // Update daily mission
        const mission = progressionSystem.getCurrentDailyMission();
        if (mission) {
            const missionText = document.querySelector('.daily-mission p');
            const missionProgress = document.querySelector('.progress-fill');
            
            if (missionText) {
                missionText.textContent = `${mission.description} (${mission.progress}/${mission.target})`;
            }
            
            if (missionProgress) {
                const percent = (mission.progress / mission.target) * 100;
                missionProgress.style.width = `${Math.min(100, percent)}%`;
            }
        }
    }
    
    /**
     * Update character select UI
     */
    updateCharacterSelectUI() {
        const characterGrid = document.getElementById('characterGrid');
        if (!characterGrid) return;
        
        // Clear existing characters
        characterGrid.innerHTML = '';
        
        const characterTypes = characterSystem.getCharacterTypes();
        let selectedCharacter = localStorage.getItem('selectedCharacter') || 'ninja';
        
        Object.entries(characterTypes).forEach(([type, data]) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.character = type;
            
            const isUnlocked = characterSystem.isCharacterUnlocked(type);
            const isSelected = type === selectedCharacter;
            
            if (!isUnlocked) card.classList.add('locked');
            if (isSelected) card.classList.add('selected');
            
            card.innerHTML = `
                <div class="character-avatar">${this.getCharacterIcon(type)}</div>
                <div class="character-name">${data.name}</div>
                ${!isUnlocked ? `<div class="character-unlock">Level ${data.unlockLevel}</div>` : ''}
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.selectCharacter(type);
                });
            }
            
            characterGrid.appendChild(card);
        });
        
        // Update character info
        this.updateSelectedCharacterInfo(selectedCharacter);
    }
    
    /**
     * Select a character
     * @param {string} characterType - Character type
     */
    selectCharacter(characterType) {
        // Update selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-character="${characterType}"]`)?.classList.add('selected');
        
        // Save selection
        localStorage.setItem('selectedCharacter', characterType);
        
        // Update character info
        this.updateSelectedCharacterInfo(characterType);
    }
    
    /**
     * Update selected character info
     * @param {string} characterType - Character type
     */
    updateSelectedCharacterInfo(characterType) {
        const characterData = characterSystem.getCharacterTypes()[characterType];
        if (!characterData) return;
        
        const nameElement = document.getElementById('selectedCharacterName');
        const descElement = document.getElementById('selectedCharacterDesc');
        
        if (nameElement) nameElement.textContent = characterData.name;
        if (descElement) descElement.textContent = characterData.description;
        
        // Update stats
        const stats = characterData.stats;
        if (stats) {
            this.updateStatBar('Speed', stats.speed);
            this.updateStatBar('Attack', stats.attack);
            this.updateStatBar('Defense', stats.defense);
        }
    }
    
    /**
     * Update stat bar
     * @param {string} statName - Stat name
     * @param {number} value - Stat value (1-5)
     */
    updateStatBar(statName, value) {
        const statElement = Array.from(document.querySelectorAll('.stat'))
            .find(el => el.querySelector('span')?.textContent === statName);
        
        if (statElement) {
            const statFill = statElement.querySelector('.stat-fill');
            if (statFill) {
                const percent = (value / 5) * 100;
                statFill.style.width = `${percent}%`;
            }
        }
    }
    
    /**
     * Update shop UI
     */
    updateShopUI() {
        // This will be handled by shop system
        if (window.shopSystem) {
            shopSystem.updateShopDisplay();
        }
    }
    
    /**
     * Update game screen UI
     */
    updateGameScreenUI() {
        // Enable input controls
        inputManager.setEnabled(true);
        
        // Start battle UI updates
        if (battleSystem.isActive) {
            this.battleUIUpdateInterval = setInterval(() => {
                battleSystem.updateTimer();
            }, 100);
        }
    }
    
    /**
     * Update victory screen UI
     */
    updateVictoryScreenUI() {
        // Disable input controls
        inputManager.setEnabled(false);
        
        // Stop battle UI updates
        if (this.battleUIUpdateInterval) {
            clearInterval(this.battleUIUpdateInterval);
            this.battleUIUpdateInterval = null;
        }
    }
    
    /**
     * Start matchmaking process
     */
    startMatchmaking() {
        const selectedCharacter = localStorage.getItem('selectedCharacter') || 'ninja';
        
        // Show matchmaking screen
        this.showScreen('matchmakingScreen');
        
        // Simulate matchmaking
        let waitTime = 15;
        const waitTimeElement = document.getElementById('waitTime');
        
        const matchmakingTimer = setInterval(() => {
            waitTime--;
            if (waitTimeElement) {
                waitTimeElement.textContent = `${waitTime}s`;
            }
            
            if (waitTime <= 0) {
                clearInterval(matchmakingTimer);
                this.startBattle(selectedCharacter);
            }
        }, 1000);
        
        // Store timer for cancellation
        this.currentMatchmakingTimer = matchmakingTimer;
    }
    
    /**
     * Cancel matchmaking
     */
    cancelMatchmaking() {
        if (this.currentMatchmakingTimer) {
            clearInterval(this.currentMatchmakingTimer);
            this.currentMatchmakingTimer = null;
        }
        
        this.showScreen('characterSelect');
    }
    
    /**
     * Start battle
     * @param {string} playerCharacter - Player character type
     */
    startBattle(playerCharacter) {
        battleSystem.startBattle({
            playerCharacter,
            arena: arenaSystem.getRandomArenaType()
        });
    }
    
    /**
     * Show battle pass screen
     */
    showBattlePassScreen() {
        // Placeholder for battle pass
        alert('Battle Pass feature coming soon!');
    }
    
    /**
     * Show leaderboard screen
     */
    showLeaderboardScreen() {
        // Placeholder for leaderboard
        alert('Leaderboard feature coming soon!');
    }
    
    /**
     * Show profile screen
     */
    showProfileScreen() {
        // Placeholder for profile
        alert('Profile feature coming soon!');
    }
    
    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardNavigation(e) {
        // Handle escape key
        if (e.key === 'Escape') {
            if (this.currentScreen === 'gameScreen' && battleSystem.isActive) {
                battleSystem.pauseBattle();
            } else if (this.currentScreen !== 'mainMenu') {
                this.goBack();
            }
        }
        
        // Handle enter key
        if (e.key === 'Enter') {
            const activeButton = document.querySelector('button:focus');
            if (activeButton) {
                activeButton.click();
            }
        }
    }
    
    /**
     * Get character icon
     * @param {string} characterType - Character type
     * @returns {string} Character icon
     */
    getCharacterIcon(characterType) {
        const icons = {
            ninja: '🥷',
            knight: '🛡️',
            mage: '🧙',
            berserker: '⚔️'
        };
        return icons[characterType] || '👤';
    }
    
    /**
     * Get current screen
     * @returns {string} Current screen ID
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    /**
     * Check if screen is visible
     * @param {string} screenId - Screen ID
     * @returns {boolean} True if visible
     */
    isScreenVisible(screenId) {
        const screen = this.screens.get(screenId);
        return screen ? screen.isVisible : false;
    }
    
    /**
     * Set screen event handlers
     * @param {string} screenId - Screen ID
     * @param {Object} handlers - Event handlers
     */
    setScreenHandlers(screenId, handlers) {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.onShow = handlers.onShow || null;
            screen.onHide = handlers.onHide || null;
        }
    }
    
    /**
     * Clean up screen manager
     */
    destroy() {
        if (this.battleUIUpdateInterval) {
            clearInterval(this.battleUIUpdateInterval);
        }
        
        if (this.currentMatchmakingTimer) {
            clearInterval(this.currentMatchmakingTimer);
        }
        
        console.log('📱 Screen Manager destroyed');
    }
}

// Create global screen manager instance
window.screenManager = new ScreenManager();

console.log('📱 Screen Manager module loaded');
