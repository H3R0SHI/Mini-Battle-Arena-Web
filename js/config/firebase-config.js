/**
 * Firebase Configuration
 * Configure your Firebase project settings here
 */

// Firebase configuration object
const firebaseConfig = {
    // Replace with your Firebase project configuration
    apiKey: "your-api-key",
    authDomain: "mini-battle-arena.firebaseapp.com",
    databaseURL: "https://mini-battle-arena-default-rtdb.firebaseio.com",
    projectId: "mini-battle-arena",
    storageBucket: "mini-battle-arena.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdefghijk"
};

// Initialize Firebase (will be done in firebase-manager.js)
window.firebaseConfig = firebaseConfig;

// Development mode flag
window.isDevelopment = true; // Set to false for production

// Game configuration
window.gameConfig = {
    // Battle settings
    battleDuration: 30, // seconds
    maxHealth: 100,
    
    // Character balance
    attackDamage: {
        light: 15,
        heavy: 25,
        special: 35
    },
    
    // Movement settings
    moveSpeed: 200, // pixels per second
    dashSpeed: 400,
    dashDuration: 0.3, // seconds
    dashCooldown: 2, // seconds
    
    // Block settings
    blockReduction: 0.5, // 50% damage reduction when blocking
    blockCooldown: 1, // seconds
    
    // Arena settings
    arenaWidth: 800,
    arenaHeight: 600,
    
    // Hazard settings
    hazardSpawnRate: 0.3, // probability per second
    
    // XP and progression
    xpPerWin: 50,
    xpPerLoss: 15,
    xpPerDailyMission: 100,
    
    // Rank thresholds
    rankThresholds: {
        bronze: 0,
        silver: 500,
        gold: 1500,
        platinum: 3000,
        diamond: 5000,
        mythic: 8000
    },
    
    // Shop prices
    skinPrices: {
        common: 100,
        rare: 250,
        epic: 500,
        legendary: 1000
    },
    
    // Battle pass
    battlePassLevels: 30,
    battlePassXpPerLevel: 100,
    
    // Ads
    adRewardMultiplier: 2,
    adCooldown: 300 // 5 minutes in seconds
};

console.log('🔥 Firebase config loaded');
