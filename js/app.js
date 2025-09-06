/**
 * Main Application
 * Initializes and coordinates all game systems
 */

class Application {
    constructor() {
        this.isInitialized = false;
        this.gameCanvas = null;
        this.currentScreen = 'loadingScreen';
        
        console.log('🚀 Mini Battle Arena starting...');
        this.initialize();
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Initializing application systems...');
            
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Initialize core systems
            this.initializeCanvas();
            this.setupEventListeners();
            
            // Load player data and settings
            await this.loadGameData();
            
            // Initialize all game systems
            this.initializeGameSystems();
            
            // Start the game
            this.startGame();
            
            console.log('🚀 Application initialized successfully');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('🚀 Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Wait for DOM to be ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Initialize game canvas
     */
    initializeCanvas() {
        this.gameCanvas = document.getElementById('gameCanvas');
        if (!this.gameCanvas) {
            throw new Error('Game canvas not found');
        }
        
        // Initialize game engine with canvas
        gameEngine.init(this.gameCanvas);
        
        console.log('🚀 Game canvas initialized');
    }
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Firebase authentication ready
        document.addEventListener('firebaseAuthReady', (e) => {
            this.handleFirebaseReady(e.detail);
        });
        
        // Battle system events
        document.addEventListener('battleStarted', (e) => {
            this.handleBattleStarted(e.detail);
        });
        
        document.addEventListener('battleComplete', (e) => {
            this.handleBattleComplete(e.detail);
        });
        
        // Matchmaking events
        document.addEventListener('matchReady', (e) => {
            this.handleMatchReady(e.detail);
        });
        
        document.addEventListener('matchmakingCancelled', () => {
            screenManager.showScreen('characterSelect');
        });
        
        // Screen events
        document.addEventListener('screenChanged', (e) => {
            this.handleScreenChanged(e.detail);
        });
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });
        
        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });
        
        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });
        
        // Error handling
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.handleUnhandledRejection(e);
        });
        
        console.log('🚀 Event listeners setup complete');
    }
    
    /**
     * Load game data from storage
     */
    async loadGameData() {
        try {
            // Load character unlocks
            characterSystem.loadUnlockedCharacters();
            
            // Load arena unlocks
            arenaSystem.loadUnlockedArenas();
            
            // Load shop data
            shopSystem.loadOwnedItems();
            
            // Load player progression
            progressionSystem.loadPlayerData();
            
            console.log('🚀 Game data loaded');
        } catch (error) {
            console.error('🚀 Error loading game data:', error);
        }
    }
    
    /**
     * Initialize all game systems
     */
    initializeGameSystems() {
        // Initialize input controls
        inputManager.initializeVirtualControls();
        
        // Setup shop display
        shopSystem.updateShopDisplay();
        
        // Initialize UI
        screenManager.updateScreenUI('mainMenu');
        
        console.log('🚀 Game systems initialized');
    }
    
    /**
     * Start the game
     */
    startGame() {
        // Show loading screen initially
        screenManager.showScreen('loadingScreen');
        
        // Simulate loading time and show main menu
        setTimeout(() => {
            screenManager.showScreen('mainMenu');
            this.showWelcomeMessage();
        }, 2500);
        
        console.log('🚀 Game started');
    }
    
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const playerData = progressionSystem.getPlayerData();
        const isFirstTime = playerData.gamesPlayed === 0;
        
        if (isFirstTime) {
            uiManager.showNotification('Welcome to Mini Battle Arena!', 'success');
            
            // Show tutorial hint
            setTimeout(() => {
                uiManager.showNotification('Tap BATTLE to start your first fight!', 'info');
            }, 2000);
        } else {
            uiManager.showNotification(`Welcome back, ${playerData.name}!`, 'success');
        }
    }
    
    /**
     * Handle Firebase ready
     * @param {Object} detail - Firebase auth detail
     */
    handleFirebaseReady(detail) {
        console.log('🚀 Firebase ready, user:', detail.user?.uid || 'offline');
        
        // Sync data with Firebase if online
        if (firebaseManager.isOnline()) {
            this.syncWithFirebase();
        }
    }
    
    /**
     * Sync data with Firebase
     */
    async syncWithFirebase() {
        try {
            // Load remote progress
            const remoteProgress = await firebaseManager.loadUserProgress();
            if (remoteProgress) {
                // Merge with local progress (keep highest values)
                this.mergeProgressData(remoteProgress);
            }
            
            // Save current progress to Firebase
            await firebaseManager.saveUserProgress(progressionSystem.getPlayerData());
            
            console.log('🚀 Data synced with Firebase');
        } catch (error) {
            console.error('🚀 Error syncing with Firebase:', error);
        }
    }
    
    /**
     * Merge remote and local progress data
     * @param {Object} remoteData - Remote progress data
     */
    mergeProgressData(remoteData) {
        const localData = progressionSystem.getPlayerData();
        
        // Keep the highest values for stats
        const mergedData = {
            level: Math.max(localData.level, remoteData.progression?.level || 1),
            totalXP: Math.max(localData.totalXP, remoteData.progression?.totalXP || 0),
            rankPoints: Math.max(localData.rankPoints, remoteData.progression?.rankPoints || 0),
            gamesPlayed: Math.max(localData.gamesPlayed, remoteData.stats?.gamesPlayed || 0),
            gamesWon: Math.max(localData.gamesWon, remoteData.stats?.gamesWon || 0),
            longestWinStreak: Math.max(localData.longestWinStreak, remoteData.stats?.longestWinStreak || 0),
            totalDamageDealt: Math.max(localData.totalDamageDealt, remoteData.stats?.totalDamageDealt || 0)
        };
        
        // Update local data if remote is higher
        if (mergedData.totalXP > localData.totalXP) {
            progressionSystem.playerData = { ...progressionSystem.playerData, ...mergedData };
            progressionSystem.savePlayerData();
            
            uiManager.showNotification('Progress synced from cloud!', 'success');
        }
    }
    
    /**
     * Handle battle started
     * @param {Object} detail - Battle start detail
     */
    handleBattleStarted(detail) {
        console.log('🚀 Battle started');
        
        // Hide any ad banners during battle
        adsManager.hideBannerAd();
        
        // Start battle music (if audio system exists)
        this.playBattleMusic();
    }
    
    /**
     * Handle battle complete
     * @param {Object} detail - Battle complete detail
     */
    handleBattleComplete(detail) {
        console.log('🚀 Battle completed:', detail.result);
        
        // Record match result in matchmaking
        matchmakingSystem.recordMatchResult(detail);
        
        // Record in progression system
        progressionSystem.recordBattleResult(detail);
        
        // Update leaderboard if online
        if (firebaseManager.isOnline()) {
            firebaseManager.updateLeaderboard(progressionSystem.getPlayerData());
        }
        
        // Show ads occasionally
        this.handlePostBattleAds(detail);
        
        // Stop battle music
        this.stopBattleMusic();
    }
    
    /**
     * Handle post-battle ads
     * @param {Object} battleResult - Battle result
     */
    handlePostBattleAds(battleResult) {
        // Show rewarded ad offer for victories
        if (battleResult.result === 'victory' && Math.random() < 0.3) {
            setTimeout(() => {
                adsManager.showAdOffer(
                    'double_reward',
                    'Double your rewards by watching an ad!',
                    () => {
                        adsManager.showRewardedAd('double_reward',
                            () => {
                                // Double the rewards
                                if (battleResult.rewards?.coins) {
                                    progressionSystem.addCoins(battleResult.rewards.coins);
                                }
                                if (battleResult.rewards?.xp) {
                                    progressionSystem.addXP(battleResult.rewards.xp);
                                }
                                uiManager.showNotification('Rewards doubled!', 'success');
                            },
                            (error) => {
                                console.log('Ad not available:', error);
                            }
                        );
                    }
                );
            }, 3000);
        }
    }
    
    /**
     * Handle match ready
     * @param {Object} detail - Match ready detail
     */
    handleMatchReady(detail) {
        console.log('🚀 Match ready with opponent:', detail.opponent.displayName);
        
        if (detail.isAI) {
            uiManager.showNotification(`Fighting AI: ${detail.opponent.displayName}`, 'info');
        } else {
            uiManager.showNotification(`Matched with: ${detail.opponent.displayName}`, 'success');
        }
    }
    
    /**
     * Handle screen changed
     * @param {Object} detail - Screen change detail
     */
    handleScreenChanged(detail) {
        this.currentScreen = detail.screenId;
        
        // Screen-specific logic
        switch (detail.screenId) {
            case 'gameScreen':
                this.enterGameMode();
                break;
            case 'mainMenu':
                this.enterMenuMode();
                break;
            case 'shopScreen':
                this.enterShopMode();
                break;
        }
    }
    
    /**
     * Enter game mode
     */
    enterGameMode() {
        // Hide UI elements that shouldn't be visible during gameplay
        adsManager.hideBannerAd();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
    }
    
    /**
     * Enter menu mode
     */
    enterMenuMode() {
        // Update UI with latest data
        screenManager.updateMainMenuUI();
        
        // Show banner ads occasionally
        if (Math.random() < 0.3) {
            setTimeout(() => {
                adsManager.showBannerAd('main_menu', 'bottom');
            }, 1000);
        }
        
        // Stop performance monitoring
        this.stopPerformanceMonitoring();
    }
    
    /**
     * Enter shop mode
     */
    enterShopMode() {
        // Update shop display
        shopSystem.updateShopDisplay();
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if (this.performanceMonitor) return;
        
        this.performanceMonitor = setInterval(() => {
            const fps = gameEngine.fpsDisplay;
            if (fps < 30) {
                console.warn('🚀 Low FPS detected:', fps);
            }
        }, 5000);
    }
    
    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
            this.performanceMonitor = null;
        }
    }
    
    /**
     * Play battle music
     */
    playBattleMusic() {
        // Placeholder for audio system
        console.log('🎵 Playing battle music');
    }
    
    /**
     * Stop battle music
     */
    stopBattleMusic() {
        // Placeholder for audio system
        console.log('🎵 Stopping battle music');
    }
    
    /**
     * Handle window focus
     */
    handleWindowFocus() {
        // Resume game if paused
        if (battleSystem.isActive && gameEngine.gameState.isPaused) {
            gameEngine.togglePause();
        }
    }
    
    /**
     * Handle window blur
     */
    handleWindowBlur() {
        // Pause game if active
        if (battleSystem.isActive && !gameEngine.gameState.isPaused) {
            gameEngine.togglePause();
        }
    }
    
    /**
     * Handle before unload
     */
    handleBeforeUnload() {
        // Save all data before closing
        this.saveAllData();
    }
    
    /**
     * Save all game data
     */
    saveAllData() {
        try {
            progressionSystem.savePlayerData();
            shopSystem.saveShopData();
            
            // Save to Firebase if online
            if (firebaseManager.isOnline()) {
                firebaseManager.saveUserProgress(progressionSystem.getPlayerData());
            }
            
            console.log('🚀 All data saved');
        } catch (error) {
            console.error('🚀 Error saving data:', error);
        }
    }
    
    /**
     * Handle global errors
     * @param {ErrorEvent} error - Error event
     */
    handleGlobalError(error) {
        console.error('🚀 Global error:', error.error);
        
        // Show user-friendly error message
        uiManager.showNotification('An error occurred. Please refresh if problems persist.', 'error');
        
        // Report to analytics (if available)
        this.reportError(error.error);
    }
    
    /**
     * Handle unhandled promise rejections
     * @param {PromiseRejectionEvent} event - Rejection event
     */
    handleUnhandledRejection(event) {
        console.error('🚀 Unhandled promise rejection:', event.reason);
        
        // Report to analytics (if available)
        this.reportError(event.reason);
    }
    
    /**
     * Handle initialization error
     * @param {Error} error - Initialization error
     */
    handleInitializationError(error) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: #1a1a2e;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <h1 style="color: #ff6b35; margin-bottom: 20px;">⚠️ Initialization Failed</h1>
                <p style="margin-bottom: 20px;">Mini Battle Arena failed to load properly.</p>
                <p style="margin-bottom: 30px; opacity: 0.7;">Error: ${error.message}</p>
                <button onclick="location.reload()" style="
                    padding: 12px 24px;
                    background: #ff6b35;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                ">
                    Reload Game
                </button>
            </div>
        `;
    }
    
    /**
     * Report error to analytics
     * @param {Error} error - Error to report
     */
    reportError(error) {
        // Placeholder for error reporting
        // In production, this would send to analytics service
        console.log('🚀 Error reported:', error);
    }
    
    /**
     * Get application statistics
     * @returns {Object} App statistics
     */
    getAppStats() {
        return {
            initialized: this.isInitialized,
            currentScreen: this.currentScreen,
            fps: gameEngine.fpsDisplay,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null,
            uptime: Date.now() - window.startTime,
            gameVersion: '1.0.0'
        };
    }
    
    /**
     * Reset application data (for testing)
     */
    resetApplicationData() {
        if (confirm('Reset all game data? This cannot be undone!')) {
            // Clear local storage
            localStorage.clear();
            
            // Reset all systems
            progressionSystem.resetProgress();
            shopSystem.resetShopData();
            characterSystem.unlockedCharacters = new Set(['ninja']);
            arenaSystem.unlockedArenas = new Set(['basic']);
            
            // Reload page
            location.reload();
        }
    }
    
    /**
     * Clean up application
     */
    destroy() {
        // Save all data
        this.saveAllData();
        
        // Stop monitoring
        this.stopPerformanceMonitoring();
        
        // Destroy all systems
        gameEngine.stop();
        battleSystem.destroy();
        matchmakingSystem.destroy();
        firebaseManager.destroy();
        adsManager.destroy();
        uiManager.destroy();
        screenManager.destroy();
        shopSystem.destroy();
        progressionSystem.destroy();
        
        console.log('🚀 Application destroyed');
    }
}

// Initialize application when DOM is ready
window.startTime = Date.now();

// Global error handler for immediate errors
window.addEventListener('error', (e) => {
    console.error('Early error:', e.error);
});

// Create global application instance
window.app = new Application();

// Expose debug functions in development
if (window.isDevelopment) {
    window.debug = {
        resetData: () => app.resetApplicationData(),
        getStats: () => app.getAppStats(),
        addCoins: (amount) => progressionSystem.addCoins(amount),
        addXP: (amount) => progressionSystem.addXP(amount),
        unlockAll: () => {
            Object.keys(characterSystem.getCharacterTypes()).forEach(type => {
                characterSystem.unlockCharacter(type);
            });
            Object.keys(arenaSystem.getArenaTypes()).forEach(type => {
                arenaSystem.unlockArena(type);
            });
        },
        showAd: () => adsManager.showFreeCoinsOffer()
    };
    
    console.log('🛠️ Debug functions available: window.debug');
}

console.log('🚀 Mini Battle Arena loaded successfully!');
console.log('🎮 Ready to fight! Tap BATTLE to begin.');

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // await navigator.serviceWorker.register('/sw.js');
            // console.log('🚀 Service Worker registered');
        } catch (error) {
            console.log('🚀 Service Worker registration failed:', error);
        }
    });
}
