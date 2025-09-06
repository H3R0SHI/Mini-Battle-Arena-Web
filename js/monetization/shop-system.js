/**
 * Shop System
 * Handles in-game shop, cosmetics, and purchases
 */

class ShopSystem {
    constructor() {
        this.shopItems = this.initializeShopItems();
        this.ownedItems = new Set();
        this.equippedItems = new Map();
        this.currentTab = 'skins';
        
        this.loadOwnedItems();
        this.setupEventListeners();
        
        console.log('🛒 Shop System initialized');
    }
    
    /**
     * Initialize shop items
     */
    initializeShopItems() {
        return {
            skins: [
                {
                    id: 'ninja_shadow',
                    name: 'Shadow Ninja',
                    description: 'Blend into the darkness',
                    price: 150,
                    rarity: 'common',
                    character: 'ninja',
                    preview: '🌑'
                },
                {
                    id: 'ninja_fire',
                    name: 'Fire Ninja',
                    description: 'Harness the power of flames',
                    price: 300,
                    rarity: 'rare',
                    character: 'ninja',
                    preview: '🔥'
                },
                {
                    id: 'knight_golden',
                    name: 'Golden Knight',
                    description: 'Armor forged from pure gold',
                    price: 500,
                    rarity: 'epic',
                    character: 'knight',
                    preview: '🏅'
                },
                {
                    id: 'knight_dragon',
                    name: 'Dragon Knight',
                    description: 'Blessed by ancient dragons',
                    price: 800,
                    rarity: 'legendary',
                    character: 'knight',
                    preview: '🐉'
                },
                {
                    id: 'mage_ice',
                    name: 'Ice Mage',
                    description: 'Master of frozen magic',
                    price: 400,
                    rarity: 'epic',
                    character: 'mage',
                    preview: '❄️'
                },
                {
                    id: 'mage_storm',
                    name: 'Storm Mage',
                    description: 'Controller of lightning and thunder',
                    price: 750,
                    rarity: 'legendary',
                    character: 'mage',
                    preview: '⚡'
                },
                {
                    id: 'berserker_blood',
                    name: 'Blood Berserker',
                    description: 'Fueled by endless rage',
                    price: 600,
                    rarity: 'epic',
                    character: 'berserker',
                    preview: '🩸'
                },
                {
                    id: 'berserker_ancient',
                    name: 'Ancient Berserker',
                    description: 'Wielder of forgotten power',
                    price: 1000,
                    rarity: 'legendary',
                    character: 'berserker',
                    preview: '💀'
                }
            ],
            weapons: [
                {
                    id: 'trail_fire',
                    name: 'Fire Trail',
                    description: 'Attacks leave burning trails',
                    price: 100,
                    rarity: 'common',
                    effect: 'fire',
                    preview: '🔥'
                },
                {
                    id: 'trail_ice',
                    name: 'Frost Trail',
                    description: 'Attacks leave freezing trails',
                    price: 120,
                    rarity: 'common',
                    effect: 'ice',
                    preview: '❄️'
                },
                {
                    id: 'trail_lightning',
                    name: 'Lightning Trail',
                    description: 'Attacks crackle with electricity',
                    price: 200,
                    rarity: 'rare',
                    effect: 'lightning',
                    preview: '⚡'
                },
                {
                    id: 'trail_shadow',
                    name: 'Shadow Trail',
                    description: 'Attacks leave dark energy',
                    price: 250,
                    rarity: 'rare',
                    effect: 'shadow',
                    preview: '🌑'
                },
                {
                    id: 'trail_rainbow',
                    name: 'Rainbow Trail',
                    description: 'Attacks shimmer with all colors',
                    price: 500,
                    rarity: 'epic',
                    effect: 'rainbow',
                    preview: '🌈'
                },
                {
                    id: 'trail_cosmic',
                    name: 'Cosmic Trail',
                    description: 'Attacks channel the power of stars',
                    price: 800,
                    rarity: 'legendary',
                    effect: 'cosmic',
                    preview: '✨'
                }
            ],
            emotes: [
                {
                    id: 'dance_victory',
                    name: 'Victory Dance',
                    description: 'Celebrate your wins in style',
                    price: 75,
                    rarity: 'common',
                    animation: 'victory_dance',
                    preview: '💃'
                },
                {
                    id: 'taunt_flex',
                    name: 'Flex Taunt',
                    description: 'Show off your strength',
                    price: 100,
                    rarity: 'common',
                    animation: 'flex',
                    preview: '💪'
                },
                {
                    id: 'emote_laugh',
                    name: 'Mocking Laugh',
                    description: 'Laugh at your defeated foes',
                    price: 150,
                    rarity: 'rare',
                    animation: 'laugh',
                    preview: '😂'
                },
                {
                    id: 'emote_bow',
                    name: 'Respectful Bow',
                    description: 'Honor your worthy opponents',
                    price: 125,
                    rarity: 'rare',
                    animation: 'bow',
                    preview: '🙇'
                },
                {
                    id: 'emote_spin',
                    name: 'Epic Spin',
                    description: 'Spin like a champion',
                    price: 300,
                    rarity: 'epic',
                    animation: 'spin',
                    preview: '🌀'
                },
                {
                    id: 'emote_portal',
                    name: 'Portal Exit',
                    description: 'Disappear through a portal',
                    price: 600,
                    rarity: 'legendary',
                    animation: 'portal',
                    preview: '🌀'
                }
            ]
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Shop tab switching is handled by UI manager
        
        // Purchase confirmations
        document.addEventListener('shopPurchase', (e) => {
            this.handlePurchase(e.detail);
        });
    }
    
    /**
     * Load owned items from storage
     */
    loadOwnedItems() {
        try {
            const saved = localStorage.getItem('ownedItems');
            if (saved) {
                this.ownedItems = new Set(JSON.parse(saved));
            }
            
            const equipped = localStorage.getItem('equippedItems');
            if (equipped) {
                this.equippedItems = new Map(Object.entries(JSON.parse(equipped)));
            }
            
            console.log('🛒 Shop data loaded');
        } catch (error) {
            console.error('Error loading shop data:', error);
        }
    }
    
    /**
     * Save owned items to storage
     */
    saveShopData() {
        try {
            localStorage.setItem('ownedItems', JSON.stringify([...this.ownedItems]));
            localStorage.setItem('equippedItems', JSON.stringify(Object.fromEntries(this.equippedItems)));
        } catch (error) {
            console.error('Error saving shop data:', error);
        }
    }
    
    /**
     * Update shop display
     */
    updateShopDisplay() {
        const shopContent = document.getElementById('shopContent');
        if (!shopContent) return;
        
        shopContent.innerHTML = '';
        
        const items = this.shopItems[this.currentTab] || [];
        
        items.forEach(item => {
            const itemElement = this.createShopItemElement(item);
            shopContent.appendChild(itemElement);
        });
        
        console.log(`🛒 Shop display updated for ${this.currentTab}`);
    }
    
    /**
     * Create shop item element
     * @param {Object} item - Shop item
     * @returns {HTMLElement} Item element
     */
    createShopItemElement(item) {
        const isOwned = this.ownedItems.has(item.id);
        const isEquipped = this.equippedItems.get(item.character || this.currentTab) === item.id;
        
        const element = document.createElement('div');
        element.className = `shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        element.dataset.itemId = item.id;
        
        element.innerHTML = `
            <div class="item-preview ${item.rarity}">${item.preview}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">
                ${isOwned ? (isEquipped ? 'EQUIPPED' : 'OWNED') : `${item.price} 💰`}
            </div>
            <div class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div>
        `;
        
        // Add click handler
        if (!isOwned) {
            element.addEventListener('click', () => {
                this.showPurchaseConfirm(item);
            });
        } else if (!isEquipped) {
            element.addEventListener('click', () => {
                this.equipItem(item);
            });
        }
        
        return element;
    }
    
    /**
     * Show purchase confirmation
     * @param {Object} item - Item to purchase
     */
    showPurchaseConfirm(item) {
        const playerCoins = progressionSystem.getPlayerData().coins;
        
        if (playerCoins < item.price) {
            uiManager.showNotification('Not enough coins!', 'error');
            return;
        }
        
        const confirm = window.confirm(
            `Purchase ${item.name} for ${item.price} coins?\n\n${item.description}`
        );
        
        if (confirm) {
            this.purchaseItem(item);
        }
    }
    
    /**
     * Purchase an item
     * @param {Object} item - Item to purchase
     */
    purchaseItem(item) {
        const success = progressionSystem.spendCoins(item.price);
        
        if (success) {
            this.ownedItems.add(item.id);
            this.saveShopData();
            
            // Auto-equip if it's the first item of this type
            if (item.character && !this.equippedItems.has(item.character)) {
                this.equipItem(item);
            } else if (!item.character && !this.equippedItems.has(this.currentTab)) {
                this.equipItem(item);
            }
            
            uiManager.showNotification(`Purchased: ${item.name}`, 'success');
            this.updateShopDisplay();
            
            // Update coin display
            screenManager.updateMainMenuUI();
            
            console.log(`🛒 Purchased item: ${item.name}`);
            
            // Dispatch purchase event
            document.dispatchEvent(new CustomEvent('itemPurchased', {
                detail: { item }
            }));
        } else {
            uiManager.showNotification('Purchase failed!', 'error');
        }
    }
    
    /**
     * Equip an item
     * @param {Object} item - Item to equip
     */
    equipItem(item) {
        const category = item.character || this.currentTab;
        this.equippedItems.set(category, item.id);
        this.saveShopData();
        
        uiManager.showNotification(`Equipped: ${item.name}`, 'success');
        this.updateShopDisplay();
        
        console.log(`🛒 Equipped item: ${item.name}`);
        
        // Dispatch equip event
        document.dispatchEvent(new CustomEvent('itemEquipped', {
            detail: { item, category }
        }));
    }
    
    /**
     * Show specific tab
     * @param {string} tabName - Tab to show
     */
    showTab(tabName) {
        this.currentTab = tabName;
        this.updateShopDisplay();
    }
    
    /**
     * Get equipped item for category
     * @param {string} category - Item category
     * @returns {Object|null} Equipped item
     */
    getEquippedItem(category) {
        const itemId = this.equippedItems.get(category);
        if (!itemId) return null;
        
        // Find item in all categories
        for (const [tabName, items] of Object.entries(this.shopItems)) {
            const item = items.find(i => i.id === itemId);
            if (item) return item;
        }
        
        return null;
    }
    
    /**
     * Get equipped skin for character
     * @param {string} characterType - Character type
     * @returns {Object|null} Equipped skin
     */
    getEquippedSkin(characterType) {
        return this.getEquippedItem(characterType);
    }
    
    /**
     * Get equipped weapon trail
     * @returns {Object|null} Equipped weapon trail
     */
    getEquippedWeaponTrail() {
        return this.getEquippedItem('weapons');
    }
    
    /**
     * Get equipped emote
     * @returns {Object|null} Equipped emote
     */
    getEquippedEmote() {
        return this.getEquippedItem('emotes');
    }
    
    /**
     * Check if item is owned
     * @param {string} itemId - Item ID
     * @returns {boolean} True if owned
     */
    isItemOwned(itemId) {
        return this.ownedItems.has(itemId);
    }
    
    /**
     * Get all items by category
     * @param {string} category - Category name
     * @returns {Array} Items in category
     */
    getItemsByCategory(category) {
        return this.shopItems[category] || [];
    }
    
    /**
     * Get item by ID
     * @param {string} itemId - Item ID
     * @returns {Object|null} Item or null
     */
    getItemById(itemId) {
        for (const [category, items] of Object.entries(this.shopItems)) {
            const item = items.find(i => i.id === itemId);
            if (item) return { ...item, category };
        }
        return null;
    }
    
    /**
     * Get owned items count by rarity
     * @returns {Object} Rarity counts
     */
    getOwnedItemsStats() {
        const stats = {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            total: this.ownedItems.size
        };
        
        for (const itemId of this.ownedItems) {
            const item = this.getItemById(itemId);
            if (item && stats.hasOwnProperty(item.rarity)) {
                stats[item.rarity]++;
            }
        }
        
        return stats;
    }
    
    /**
     * Get total shop value
     * @returns {Object} Shop statistics
     */
    getShopStats() {
        let totalItems = 0;
        let totalValue = 0;
        let ownedValue = 0;
        
        for (const [category, items] of Object.entries(this.shopItems)) {
            for (const item of items) {
                totalItems++;
                totalValue += item.price;
                
                if (this.ownedItems.has(item.id)) {
                    ownedValue += item.price;
                }
            }
        }
        
        return {
            totalItems,
            ownedItems: this.ownedItems.size,
            totalValue,
            ownedValue,
            completionPercent: (this.ownedItems.size / totalItems * 100).toFixed(1)
        };
    }
    
    /**
     * Add promotional item (for events, achievements, etc.)
     * @param {Object} item - Promotional item
     */
    addPromotionalItem(item) {
        // Add to appropriate category
        const category = item.category || 'skins';
        if (this.shopItems[category]) {
            this.shopItems[category].push(item);
        }
        
        console.log(`🛒 Added promotional item: ${item.name}`);
    }
    
    /**
     * Grant free item (for achievements, events, etc.)
     * @param {string} itemId - Item ID to grant
     */
    grantFreeItem(itemId) {
        if (!this.ownedItems.has(itemId)) {
            this.ownedItems.add(itemId);
            this.saveShopData();
            
            const item = this.getItemById(itemId);
            if (item) {
                uiManager.showNotification(`Unlocked: ${item.name}!`, 'achievement');
                console.log(`🛒 Granted free item: ${item.name}`);
            }
        }
    }
    
    /**
     * Apply daily shop rotation (future feature)
     */
    rotateDailyItems() {
        // Placeholder for daily shop rotation
        // Could feature discounted items, limited-time offers, etc.
        console.log('🛒 Daily shop rotation (not implemented)');
    }
    
    /**
     * Get featured items for promotion
     * @returns {Array} Featured items
     */
    getFeaturedItems() {
        // Return random selection of epic/legendary items
        const featuredItems = [];
        
        for (const [category, items] of Object.entries(this.shopItems)) {
            const highTierItems = items.filter(item => 
                (item.rarity === 'epic' || item.rarity === 'legendary') &&
                !this.ownedItems.has(item.id)
            );
            
            if (highTierItems.length > 0) {
                const randomItem = highTierItems[Math.floor(Math.random() * highTierItems.length)];
                featuredItems.push({ ...randomItem, category });
            }
        }
        
        return featuredItems.slice(0, 3); // Return up to 3 featured items
    }
    
    /**
     * Calculate discount price
     * @param {Object} item - Item to discount
     * @param {number} discountPercent - Discount percentage
     * @returns {number} Discounted price
     */
    calculateDiscountPrice(item, discountPercent) {
        return Math.floor(item.price * (1 - discountPercent / 100));
    }
    
    /**
     * Reset shop data (for testing)
     */
    resetShopData() {
        this.ownedItems.clear();
        this.equippedItems.clear();
        this.saveShopData();
        this.updateShopDisplay();
        
        console.log('🛒 Shop data reset');
    }
    
    /**
     * Import shop data (for cloud sync, etc.)
     * @param {Object} data - Shop data to import
     */
    importShopData(data) {
        if (data.ownedItems) {
            this.ownedItems = new Set(data.ownedItems);
        }
        if (data.equippedItems) {
            this.equippedItems = new Map(Object.entries(data.equippedItems));
        }
        
        this.saveShopData();
        this.updateShopDisplay();
        
        console.log('🛒 Shop data imported');
    }
    
    /**
     * Export shop data (for cloud sync, etc.)
     * @returns {Object} Shop data
     */
    exportShopData() {
        return {
            ownedItems: [...this.ownedItems],
            equippedItems: Object.fromEntries(this.equippedItems)
        };
    }
    
    /**
     * Clean up shop system
     */
    destroy() {
        this.saveShopData();
        console.log('🛒 Shop System destroyed');
    }
}

// Create global shop system instance
window.shopSystem = new ShopSystem();

console.log('🛒 Shop System module loaded');
