/**
 * UI Manager
 * Handles UI updates, animations, and user interface logic
 */

class UIManager {
    constructor() {
        this.animations = new Map();
        this.notificationQueue = [];
        this.isShowingNotification = false;
        
        this.setupEventListeners();
        this.initializeUIElements();
        
        console.log('🎨 UI Manager initialized');
    }
    
    /**
     * Setup event listeners for UI updates
     */
    setupEventListeners() {
        // Battle events
        document.addEventListener('characterDamaged', (e) => {
            this.showDamageIndicator(e.detail);
        });
        
        document.addEventListener('screenEffect', (e) => {
            this.handleScreenEffect(e.detail);
        });
        
        document.addEventListener('arenaEffect', (e) => {
            this.handleArenaEffect(e.detail);
        });
        
        // Progress events
        document.addEventListener('xpGained', (e) => {
            this.showXPGain(e.detail.amount);
        });
        
        document.addEventListener('levelUp', (e) => {
            this.showLevelUp(e.detail.newLevel);
        });
        
        document.addEventListener('coinGained', (e) => {
            this.showCoinGain(e.detail.amount);
        });
        
        // Achievement events
        document.addEventListener('achievementUnlocked', (e) => {
            this.showAchievement(e.detail);
        });
        
        // Input feedback
        document.addEventListener('inputUpdate', (e) => {
            this.updateInputFeedback(e.detail);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Focus/blur events for pause
        window.addEventListener('blur', () => {
            if (battleSystem.isActive) {
                this.showPausePrompt();
            }
        });
    }
    
    /**
     * Initialize UI elements
     */
    initializeUIElements() {
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize shop tabs
        this.initializeShopTabs();
        
        // Initialize progress bars
        this.initializeProgressBars();
        
        // Initialize touch feedback
        this.initializeTouchFeedback();
    }
    
    /**
     * Initialize tooltips
     */
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    /**
     * Initialize shop tabs
     */
    initializeShopTabs() {
        const shopTabs = document.querySelectorAll('.shop-tab');
        shopTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchShopTab(tab.dataset.tab);
            });
        });
    }
    
    /**
     * Initialize progress bars
     */
    initializeProgressBars() {
        // Animate progress bars when they come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateProgressBar(entry.target);
                }
            });
        });
        
        document.querySelectorAll('.progress-bar, .xp-bar, .stat-bar').forEach(bar => {
            observer.observe(bar);
        });
    }
    
    /**
     * Initialize touch feedback
     */
    initializeTouchFeedback() {
        // Add touch feedback to buttons
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('touchstart', () => {
                this.addTouchFeedback(button);
            });
        });
    }
    
    /**
     * Show damage indicator
     * @param {Object} detail - Damage detail
     */
    showDamageIndicator(detail) {
        const { character, damage } = detail;
        
        // Get character position on screen
        const canvas = document.getElementById('gameCanvas');
        if (!canvas || !character) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = rect.left + character.x + character.width / 2;
        const y = rect.top + character.y;
        
        // Create damage indicator
        const indicator = document.createElement('div');
        indicator.className = 'damage-indicator';
        indicator.textContent = `-${Math.floor(damage)}`;
        indicator.style.position = 'fixed';
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        indicator.style.zIndex = '1000';
        indicator.style.pointerEvents = 'none';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '18px';
        indicator.style.color = '#ff4136';
        indicator.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        
        document.body.appendChild(indicator);
        
        // Animate
        this.animateDamageIndicator(indicator);
        
        // Remove after animation
        setTimeout(() => {
            indicator.remove();
        }, 1000);
    }
    
    /**
     * Animate damage indicator
     * @param {HTMLElement} indicator - Damage indicator element
     */
    animateDamageIndicator(indicator) {
        let progress = 0;
        const startY = parseFloat(indicator.style.top);
        
        const animate = () => {
            progress += 0.02;
            
            if (progress >= 1) return;
            
            const y = startY - (progress * 50);
            const scale = 1 + (Math.sin(progress * Math.PI) * 0.3);
            const opacity = 1 - (progress * progress);
            
            indicator.style.top = y + 'px';
            indicator.style.transform = `scale(${scale})`;
            indicator.style.opacity = opacity;
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Handle screen effects
     * @param {Object} detail - Effect detail
     */
    handleScreenEffect(detail) {
        const { type } = detail;
        
        switch (type) {
            case 'lowHealth':
                this.showLowHealthEffect();
                break;
            case 'victory':
                this.showVictoryEffect();
                break;
            case 'defeat':
                this.showDefeatEffect();
                break;
        }
    }
    
    /**
     * Handle arena effects
     * @param {Object} detail - Effect detail
     */
    handleArenaEffect(detail) {
        const { type } = detail;
        
        switch (type) {
            case 'lavaWarning':
                this.showLavaWarning();
                break;
            case 'lavaActive':
                this.showLavaActive();
                break;
            case 'windGust':
                this.showWindGust(detail.direction);
                break;
        }
    }
    
    /**
     * Show low health effect
     */
    showLowHealthEffect() {
        const effect = document.createElement('div');
        effect.style.position = 'fixed';
        effect.style.top = '0';
        effect.style.left = '0';
        effect.style.width = '100%';
        effect.style.height = '100%';
        effect.style.background = 'rgba(255, 65, 54, 0.3)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '999';
        effect.style.animation = 'pulse 0.5s ease-in-out';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 500);
    }
    
    /**
     * Show lava warning effect
     */
    showLavaWarning() {
        document.body.style.animation = 'flash-red 0.2s ease-in-out 3';
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 600);
    }
    
    /**
     * Show wind gust effect
     * @param {number} direction - Wind direction
     */
    showWindGust(direction) {
        // Create wind lines effect
        for (let i = 0; i < 20; i++) {
            const line = document.createElement('div');
            line.style.position = 'fixed';
            line.style.top = Math.random() * window.innerHeight + 'px';
            line.style.left = (direction > 0 ? -10 : window.innerWidth + 10) + 'px';
            line.style.width = '20px';
            line.style.height = '2px';
            line.style.background = 'rgba(255, 255, 255, 0.7)';
            line.style.pointerEvents = 'none';
            line.style.zIndex = '998';
            
            document.body.appendChild(line);
            
            // Animate across screen
            line.animate([
                { left: (direction > 0 ? -20 : window.innerWidth + 20) + 'px' },
                { left: (direction > 0 ? window.innerWidth + 20 : -20) + 'px' }
            ], {
                duration: 1000,
                easing: 'ease-out'
            }).onfinish = () => {
                line.remove();
            };
        }
    }
    
    /**
     * Show XP gain notification
     * @param {number} amount - XP amount
     */
    showXPGain(amount) {
        this.showNotification(`+${amount} XP`, 'success');
    }
    
    /**
     * Show coin gain notification
     * @param {number} amount - Coin amount
     */
    showCoinGain(amount) {
        this.showNotification(`+${amount} 💰`, 'success');
    }
    
    /**
     * Show level up notification
     * @param {number} newLevel - New level
     */
    showLevelUp(newLevel) {
        this.showNotification(`LEVEL UP! Level ${newLevel}`, 'level-up');
    }
    
    /**
     * Show achievement notification
     * @param {Object} achievement - Achievement data
     */
    showAchievement(achievement) {
        this.showNotification(`🏆 ${achievement.name}`, 'achievement');
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        this.notificationQueue.push({ message, type });
        
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
    }
    
    /**
     * Process notification queue
     */
    processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }
        
        this.isShowingNotification = true;
        const notification = this.notificationQueue.shift();
        
        // Create notification element
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.textContent = notification.message;
        element.style.position = 'fixed';
        element.style.top = '20px';
        element.style.right = '20px';
        element.style.padding = '12px 24px';
        element.style.background = this.getNotificationColor(notification.type);
        element.style.color = 'white';
        element.style.borderRadius = '8px';
        element.style.fontWeight = 'bold';
        element.style.zIndex = '1001';
        element.style.transform = 'translateX(100%)';
        element.style.transition = 'transform 0.3s ease';
        
        document.body.appendChild(element);
        
        // Animate in
        setTimeout(() => {
            element.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and process next
        setTimeout(() => {
            element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                element.remove();
                this.processNotificationQueue();
            }, 300);
        }, 2000);
    }
    
    /**
     * Get notification color
     * @param {string} type - Notification type
     * @returns {string} Color
     */
    getNotificationColor(type) {
        const colors = {
            info: '#3498db',
            success: '#2ecc40',
            warning: '#ff851b',
            error: '#ff4136',
            'level-up': '#9b59b6',
            achievement: '#f39c12'
        };
        return colors[type] || colors.info;
    }
    
    /**
     * Switch shop tab
     * @param {string} tabName - Tab name
     */
    switchShopTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Update content
        if (window.shopSystem) {
            shopSystem.showTab(tabName);
        }
    }
    
    /**
     * Animate progress bar
     * @param {HTMLElement} progressBar - Progress bar element
     */
    animateProgressBar(progressBar) {
        const fill = progressBar.querySelector('.progress-fill, .xp-fill, .stat-fill');
        if (!fill) return;
        
        const targetWidth = fill.style.width;
        fill.style.width = '0%';
        
        setTimeout(() => {
            fill.style.transition = 'width 1s ease-out';
            fill.style.width = targetWidth;
        }, 100);
    }
    
    /**
     * Add touch feedback to element
     * @param {HTMLElement} element - Element to add feedback to
     */
    addTouchFeedback(element) {
        element.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            element.style.transform = '';
        }, 100);
    }
    
    /**
     * Update input feedback
     * @param {Object} inputState - Input state
     */
    updateInputFeedback(inputState) {
        // Update joystick visual feedback (handled by input manager)
        
        // Update action button state
        const actionBtn = document.getElementById('actionBtn');
        if (actionBtn) {
            if (inputState.isAttacking) {
                actionBtn.classList.add('attacking');
            } else if (inputState.isBlocking) {
                actionBtn.classList.add('blocking');
            } else if (inputState.isDashing) {
                actionBtn.classList.add('dashing');
            }
        }
    }
    
    /**
     * Show tooltip
     * @param {HTMLElement} element - Element to show tooltip for
     * @param {string} text - Tooltip text
     */
    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.position = 'absolute';
        tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.zIndex = '1002';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'nowrap';
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width - tooltipRect.width) / 2;
        let top = rect.top - tooltipRect.height - 8;
        
        // Adjust if tooltip goes off screen
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top < 8) {
            top = rect.bottom + 8;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        this.currentTooltip = tooltip;
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    /**
     * Show pause prompt
     */
    showPausePrompt() {
        if (battleSystem.isActive && !gameEngine.gameState.isPaused) {
            battleSystem.pauseBattle();
            this.showNotification('Game paused - focus window to resume', 'info');
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update canvas size
        if (gameEngine.canvas) {
            gameEngine.resize();
        }
        
        // Hide tooltip on resize
        this.hideTooltip();
    }
    
    /**
     * Create loading animation
     * @param {HTMLElement} element - Element to animate
     */
    createLoadingAnimation(element) {
        element.classList.add('loading');
        
        return {
            stop: () => {
                element.classList.remove('loading');
            }
        };
    }
    
    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.flexDirection = 'column';
        overlay.style.zIndex = '9999';
        
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <p style="color: white; margin-top: 20px; font-size: 18px;">${message}</p>
        `;
        
        document.body.appendChild(overlay);
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    /**
     * Animate element
     * @param {HTMLElement} element - Element to animate
     * @param {Object} animation - Animation config
     */
    animateElement(element, animation) {
        const { keyframes, options } = animation;
        
        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards',
            ...options
        });
    }
    
    /**
     * Clean up UI manager
     */
    destroy() {
        this.hideTooltip();
        this.hideLoadingOverlay();
        
        // Clear animations
        this.animations.clear();
        
        console.log('🎨 UI Manager destroyed');
    }
}

// Create global UI manager instance
window.uiManager = new UIManager();

console.log('🎨 UI Manager module loaded');
