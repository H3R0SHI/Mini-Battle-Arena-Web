/**
 * Ads Manager
 * Handles advertisement integration and rewards
 */

class AdsManager {
    constructor() {
        this.isAdReady = false;
        this.lastAdTime = 0;
        this.adCooldown = gameConfig.adCooldown * 1000; // Convert to milliseconds
        this.rewardedAdCallbacks = new Map();
        this.adProviders = [];
        
        this.initializeAdProviders();
        this.setupEventListeners();
        
        console.log('📺 Ads Manager initialized');
    }
    
    /**
     * Initialize ad providers (placeholder implementations)
     */
    initializeAdProviders() {
        // In a real implementation, you would initialize actual ad SDKs here
        // For demo purposes, we'll simulate ad behavior
        
        this.adProviders = [
            {
                name: 'Demo Ads',
                isLoaded: true,
                showRewardedAd: this.showDemoRewardedAd.bind(this),
                showInterstitialAd: this.showDemoInterstitialAd.bind(this),
                showBannerAd: this.showDemoBannerAd.bind(this)
            }
        ];
        
        // Simulate ad loading
        setTimeout(() => {
            this.isAdReady = true;
            console.log('📺 Ads loaded and ready');
        }, 1000);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Battle completion events
        document.addEventListener('battleComplete', (e) => {
            this.handleBattleComplete(e.detail);
        });
        
        // Shop purchase events
        document.addEventListener('itemPurchased', (e) => {
            this.handleItemPurchased(e.detail);
        });
        
        // Level up events
        document.addEventListener('levelUp', (e) => {
            this.handleLevelUp(e.detail);
        });
    }
    
    /**
     * Check if ads are available
     * @returns {boolean} True if ads are ready
     */
    areAdsReady() {
        return this.isAdReady && this.adProviders.some(provider => provider.isLoaded);
    }
    
    /**
     * Check if ad cooldown has passed
     * @returns {boolean} True if can show ad
     */
    canShowAd() {
        const now = Date.now();
        return now - this.lastAdTime >= this.adCooldown;
    }
    
    /**
     * Show rewarded ad
     * @param {string} placement - Ad placement identifier
     * @param {Function} onReward - Callback for successful ad completion
     * @param {Function} onError - Callback for ad error
     */
    showRewardedAd(placement, onReward, onError) {
        if (!this.areAdsReady()) {
            console.log('📺 Ads not ready');
            if (onError) onError('Ads not ready');
            return;
        }
        
        if (!this.canShowAd()) {
            const remainingTime = Math.ceil((this.adCooldown - (Date.now() - this.lastAdTime)) / 1000);
            console.log(`📺 Ad cooldown active, ${remainingTime}s remaining`);
            if (onError) onError(`Please wait ${remainingTime} seconds`);
            return;
        }
        
        console.log(`📺 Showing rewarded ad for: ${placement}`);
        
        // Store callbacks
        this.rewardedAdCallbacks.set(placement, { onReward, onError });
        
        // Show ad through provider
        const provider = this.adProviders.find(p => p.isLoaded);
        if (provider) {
            provider.showRewardedAd(placement);
        }
        
        this.lastAdTime = Date.now();
    }
    
    /**
     * Show interstitial ad
     * @param {string} placement - Ad placement identifier
     */
    showInterstitialAd(placement) {
        if (!this.areAdsReady()) {
            console.log('📺 Interstitial ads not ready');
            return;
        }
        
        console.log(`📺 Showing interstitial ad for: ${placement}`);
        
        const provider = this.adProviders.find(p => p.isLoaded);
        if (provider) {
            provider.showInterstitialAd(placement);
        }
    }
    
    /**
     * Show banner ad
     * @param {string} placement - Ad placement identifier
     * @param {string} position - Banner position
     */
    showBannerAd(placement, position = 'bottom') {
        if (!this.areAdsReady()) {
            console.log('📺 Banner ads not ready');
            return;
        }
        
        console.log(`📺 Showing banner ad for: ${placement} at ${position}`);
        
        const provider = this.adProviders.find(p => p.isLoaded);
        if (provider) {
            provider.showBannerAd(placement, position);
        }
    }
    
    /**
     * Hide banner ad
     */
    hideBannerAd() {
        // Remove banner if showing
        const banner = document.getElementById('adBanner');
        if (banner) {
            banner.remove();
        }
    }
    
    /**
     * Demo implementation of rewarded ad
     * @param {string} placement - Ad placement
     */
    showDemoRewardedAd(placement) {
        // Create ad overlay
        const overlay = document.createElement('div');
        overlay.id = 'adOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 20px;">
                <h2 style="margin-bottom: 20px;">📺 Demo Advertisement</h2>
                <div style="width: 300px; height: 200px; background: linear-gradient(45deg, #ff6b35, #ffd23f); 
                           border-radius: 10px; display: flex; align-items: center; justify-content: center;
                           margin: 20px auto; font-size: 24px; font-weight: bold;">
                    🎮 PLAY NOW!
                </div>
                <p style="margin: 20px 0; opacity: 0.8;">This is a demo ad. In a real game, this would be a real advertisement.</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="adSkip" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Skip (${this.getAdDuration()}s)
                    </button>
                    <button id="adClose" style="padding: 10px 20px; background: #ff4136; color: white; border: none; border-radius: 5px; cursor: pointer; display: none;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Handle ad duration
        let timeLeft = this.getAdDuration();
        const skipBtn = overlay.querySelector('#adSkip');
        const closeBtn = overlay.querySelector('#adClose');
        
        const timer = setInterval(() => {
            timeLeft--;
            skipBtn.textContent = `Skip (${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                skipBtn.style.display = 'none';
                closeBtn.style.display = 'inline-block';
                closeBtn.textContent = 'Claim Reward';
            }
        }, 1000);
        
        // Skip button (no reward)
        skipBtn.addEventListener('click', () => {
            clearInterval(timer);
            overlay.remove();
            
            const callbacks = this.rewardedAdCallbacks.get(placement);
            if (callbacks?.onError) {
                callbacks.onError('Ad skipped');
            }
            this.rewardedAdCallbacks.delete(placement);
        });
        
        // Close button (give reward)
        closeBtn.addEventListener('click', () => {
            overlay.remove();
            
            const callbacks = this.rewardedAdCallbacks.get(placement);
            if (callbacks?.onReward) {
                callbacks.onReward();
            }
            this.rewardedAdCallbacks.delete(placement);
        });
    }
    
    /**
     * Demo implementation of interstitial ad
     * @param {string} placement - Ad placement
     */
    showDemoInterstitialAd(placement) {
        // Similar to rewarded ad but simpler
        const overlay = document.createElement('div');
        overlay.id = 'adOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center;">
                <h2>📺 Demo Interstitial</h2>
                <div style="width: 300px; height: 200px; background: linear-gradient(45deg, #3498db, #9b59b6); 
                           border-radius: 10px; display: flex; align-items: center; justify-content: center;
                           margin: 20px auto; font-size: 24px; font-weight: bold;">
                    🛒 SHOP NOW!
                </div>
                <button id="adClose" style="padding: 10px 20px; background: #2ecc40; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Continue
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            overlay.remove();
        }, 3000);
        
        overlay.querySelector('#adClose').addEventListener('click', () => {
            overlay.remove();
        });
    }
    
    /**
     * Demo implementation of banner ad
     * @param {string} placement - Ad placement
     * @param {string} position - Banner position
     */
    showDemoBannerAd(placement, position) {
        // Remove existing banner
        this.hideBannerAd();
        
        const banner = document.createElement('div');
        banner.id = 'adBanner';
        banner.style.cssText = `
            position: fixed;
            ${position === 'top' ? 'top: 0;' : 'bottom: 0;'}
            left: 0;
            width: 100%;
            height: 60px;
            background: linear-gradient(45deg, #e74c3c, #f39c12);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            z-index: 9999;
            cursor: pointer;
        `;
        
        banner.innerHTML = `
            📺 Demo Banner Ad - Click Here!
            <button style="position: absolute; right: 10px; background: none; border: none; color: white; cursor: pointer; font-size: 18px;"
                    onclick="this.parentElement.remove()">×</button>
        `;
        
        banner.addEventListener('click', () => {
            console.log('📺 Banner ad clicked');
            // In real implementation, this would open the advertiser's page
        });
        
        document.body.appendChild(banner);
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            banner.remove();
        }, 30000);
    }
    
    /**
     * Get ad duration based on placement
     * @param {string} placement - Ad placement
     * @returns {number} Duration in seconds
     */
    getAdDuration(placement = 'default') {
        const durations = {
            'bonus_chest': 15,
            'double_coins': 20,
            'instant_rematch': 10,
            'extra_life': 25,
            'default': 15
        };
        
        return durations[placement] || durations.default;
    }
    
    /**
     * Handle battle completion
     * @param {Object} battleResult - Battle result data
     */
    handleBattleComplete(battleResult) {
        // Show optional rewarded ad for bonus rewards
        if (battleResult.result === 'victory' && Math.random() < 0.3) { // 30% chance
            this.showAdOffer('double_coins', 'Double your coin reward!', () => {
                this.showRewardedAd('double_coins', 
                    () => {
                        // Double the coins from the battle
                        const bonusCoins = battleResult.rewards?.coins || 0;
                        progressionSystem.addCoins(bonusCoins);
                        uiManager.showNotification(`Bonus: +${bonusCoins} 💰`, 'success');
                    },
                    (error) => {
                        uiManager.showNotification('Ad failed to load', 'error');
                    }
                );
            });
        }
        
        // Show interstitial ad occasionally
        if (Math.random() < 0.2) { // 20% chance
            setTimeout(() => {
                this.showInterstitialAd('post_battle');
            }, 2000);
        }
    }
    
    /**
     * Handle item purchased
     * @param {Object} purchaseData - Purchase data
     */
    handleItemPurchased(purchaseData) {
        // Show banner ad after purchases
        if (Math.random() < 0.4) { // 40% chance
            setTimeout(() => {
                this.showBannerAd('post_purchase', 'bottom');
            }, 1000);
        }
    }
    
    /**
     * Handle level up
     * @param {Object} levelData - Level up data
     */
    handleLevelUp(levelData) {
        // Offer bonus chest for watching ad
        this.showAdOffer('bonus_chest', 'Watch ad for bonus level up reward!', () => {
            this.showRewardedAd('bonus_chest',
                () => {
                    // Give bonus rewards
                    const bonusXP = 50;
                    const bonusCoins = 25;
                    progressionSystem.addXP(bonusXP);
                    progressionSystem.addCoins(bonusCoins);
                    uiManager.showNotification(`Level Up Bonus: +${bonusXP} XP, +${bonusCoins} 💰`, 'achievement');
                },
                (error) => {
                    uiManager.showNotification('Ad not available', 'error');
                }
            );
        });
    }
    
    /**
     * Show ad offer popup
     * @param {string} placement - Ad placement
     * @param {string} message - Offer message
     * @param {Function} onAccept - Callback when user accepts
     */
    showAdOffer(placement, message, onAccept) {
        if (!this.areAdsReady() || !this.canShowAd()) {
            return;
        }
        
        const offer = document.createElement('div');
        offer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            text-align: center;
            max-width: 300px;
            color: #333;
            font-family: Arial, sans-serif;
        `;
        
        offer.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 24px;">📺</div>
            <h3 style="margin: 0 0 10px 0; color: #333;">Ad Reward</h3>
            <p style="margin: 0 0 15px 0; color: #666;">${message}</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="acceptAd" style="padding: 8px 16px; background: #2ecc40; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Watch Ad
                </button>
                <button id="declineAd" style="padding: 8px 16px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    No Thanks
                </button>
            </div>
        `;
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(offer);
        
        const cleanup = () => {
            backdrop.remove();
            offer.remove();
        };
        
        offer.querySelector('#acceptAd').addEventListener('click', () => {
            cleanup();
            onAccept();
        });
        
        offer.querySelector('#declineAd').addEventListener('click', cleanup);
        backdrop.addEventListener('click', cleanup);
        
        // Auto-close after 10 seconds
        setTimeout(cleanup, 10000);
    }
    
    /**
     * Show instant rematch ad offer
     */
    showInstantRematchOffer() {
        this.showAdOffer('instant_rematch', 'Skip matchmaking queue!', () => {
            this.showRewardedAd('instant_rematch',
                () => {
                    // Start instant rematch
                    battleSystem.rematch();
                    screenManager.showScreen('gameScreen');
                    uiManager.showNotification('Instant rematch!', 'success');
                },
                (error) => {
                    uiManager.showNotification('Ad not available', 'error');
                }
            );
        });
    }
    
    /**
     * Show free coins offer
     */
    showFreeCoinsOffer() {
        this.showAdOffer('free_coins', 'Get 100 free coins!', () => {
            this.showRewardedAd('free_coins',
                () => {
                    progressionSystem.addCoins(100);
                    uiManager.showNotification('Free coins earned!', 'success');
                },
                (error) => {
                    uiManager.showNotification('Ad not available', 'error');
                }
            );
        });
    }
    
    /**
     * Get ad statistics
     * @returns {Object} Ad statistics
     */
    getAdStats() {
        return {
            adsWatched: parseInt(localStorage.getItem('adsWatched') || '0'),
            coinsEarned: parseInt(localStorage.getItem('adCoinsEarned') || '0'),
            lastAdTime: this.lastAdTime,
            cooldownRemaining: Math.max(0, this.adCooldown - (Date.now() - this.lastAdTime))
        };
    }
    
    /**
     * Update ad statistics
     * @param {string} type - Ad type
     * @param {number} coinsEarned - Coins earned from ad
     */
    updateAdStats(type, coinsEarned = 0) {
        const currentWatched = parseInt(localStorage.getItem('adsWatched') || '0');
        const currentCoins = parseInt(localStorage.getItem('adCoinsEarned') || '0');
        
        localStorage.setItem('adsWatched', (currentWatched + 1).toString());
        localStorage.setItem('adCoinsEarned', (currentCoins + coinsEarned).toString());
    }
    
    /**
     * Reset ad statistics (for testing)
     */
    resetAdStats() {
        localStorage.removeItem('adsWatched');
        localStorage.removeItem('adCoinsEarned');
        this.lastAdTime = 0;
    }
    
    /**
     * Clean up ads manager
     */
    destroy() {
        this.hideBannerAd();
        
        // Remove any ad overlays
        const adOverlay = document.getElementById('adOverlay');
        if (adOverlay) {
            adOverlay.remove();
        }
        
        console.log('📺 Ads Manager destroyed');
    }
}

// Create global ads manager instance
window.adsManager = new AdsManager();

console.log('📺 Ads Manager module loaded');
