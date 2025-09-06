/**
 * Firebase Manager
 * Handles Firebase authentication, database, and cloud functions
 */

class FirebaseManager {
    constructor() {
        this.isInitialized = false;
        this.isAuthenticated = false;
        this.currentUser = null;
        this.database = null;
        this.auth = null;
        this.functions = null;
        
        this.userDataRef = null;
        this.leaderboardRef = null;
        this.matchmakingRef = null;
        
        this.initialize();
        
        console.log('🔥 Firebase Manager initialized');
    }
    
    /**
     * Initialize Firebase
     */
    async initialize() {
        try {
            // Initialize Firebase with config
            if (typeof firebase !== 'undefined' && window.firebaseConfig) {
                firebase.initializeApp(window.firebaseConfig);
                
                this.auth = firebase.auth();
                this.database = firebase.database();
                this.functions = firebase.functions();
                
                // Setup auth state listener
                this.setupAuthStateListener();
                
                this.isInitialized = true;
                console.log('🔥 Firebase initialized successfully');
                
                // Try to sign in anonymously if not authenticated
                if (!this.isAuthenticated) {
                    await this.signInAnonymously();
                }
            } else {
                console.warn('🔥 Firebase SDK not loaded or config missing - using offline mode');
                this.initializeOfflineMode();
            }
        } catch (error) {
            console.error('🔥 Firebase initialization error:', error);
            this.initializeOfflineMode();
        }
    }
    
    /**
     * Initialize offline mode (fallback)
     */
    initializeOfflineMode() {
        console.log('🔥 Running in offline mode');
        this.isInitialized = true;
        this.isAuthenticated = true;
        this.currentUser = {
            uid: 'offline_user_' + Date.now(),
            isAnonymous: true,
            displayName: 'Offline Player'
        };
        
        // Dispatch auth ready event
        document.dispatchEvent(new CustomEvent('firebaseAuthReady', {
            detail: { user: this.currentUser }
        }));
    }
    
    /**
     * Setup authentication state listener
     */
    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.isAuthenticated = true;
                this.currentUser = user;
                this.setupUserDataRef();
                
                console.log('🔥 User authenticated:', user.uid);
                
                // Dispatch auth ready event
                document.dispatchEvent(new CustomEvent('firebaseAuthReady', {
                    detail: { user }
                }));
            } else {
                this.isAuthenticated = false;
                this.currentUser = null;
                this.cleanupRefs();
                
                console.log('🔥 User signed out');
            }
        });
    }
    
    /**
     * Setup user data reference
     */
    setupUserDataRef() {
        if (!this.currentUser || !this.database) return;
        
        this.userDataRef = this.database.ref(`users/${this.currentUser.uid}`);
        this.leaderboardRef = this.database.ref('leaderboard');
        this.matchmakingRef = this.database.ref('matchmaking');
        
        // Initialize user data if first time
        this.initializeUserData();
    }
    
    /**
     * Clean up database references
     */
    cleanupRefs() {
        if (this.userDataRef) {
            this.userDataRef.off();
            this.userDataRef = null;
        }
        if (this.leaderboardRef) {
            this.leaderboardRef.off();
            this.leaderboardRef = null;
        }
        if (this.matchmakingRef) {
            this.matchmakingRef.off();
            this.matchmakingRef = null;
        }
    }
    
    /**
     * Sign in anonymously
     */
    async signInAnonymously() {
        try {
            if (this.auth) {
                const result = await this.auth.signInAnonymously();
                console.log('🔥 Anonymous sign in successful');
                return result.user;
            }
        } catch (error) {
            console.error('🔥 Anonymous sign in error:', error);
            this.initializeOfflineMode();
        }
    }
    
    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            if (!this.auth) {
                throw new Error('Firebase not initialized');
            }
            
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            
            console.log('🔥 Google sign in successful');
            return result.user;
        } catch (error) {
            console.error('🔥 Google sign in error:', error);
            throw error;
        }
    }
    
    /**
     * Sign in with email
     */
    async signInWithEmail(email, password) {
        try {
            if (!this.auth) {
                throw new Error('Firebase not initialized');
            }
            
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('🔥 Email sign in successful');
            return result.user;
        } catch (error) {
            console.error('🔥 Email sign in error:', error);
            throw error;
        }
    }
    
    /**
     * Create account with email
     */
    async createAccountWithEmail(email, password, displayName) {
        try {
            if (!this.auth) {
                throw new Error('Firebase not initialized');
            }
            
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile
            if (displayName) {
                await result.user.updateProfile({ displayName });
            }
            
            console.log('🔥 Account creation successful');
            return result.user;
        } catch (error) {
            console.error('🔥 Account creation error:', error);
            throw error;
        }
    }
    
    /**
     * Sign out
     */
    async signOut() {
        try {
            if (this.auth) {
                await this.auth.signOut();
            }
            console.log('🔥 Sign out successful');
        } catch (error) {
            console.error('🔥 Sign out error:', error);
        }
    }
    
    /**
     * Initialize user data in Firebase
     */
    async initializeUserData() {
        if (!this.userDataRef) return;
        
        try {
            const snapshot = await this.userDataRef.once('value');
            
            if (!snapshot.exists()) {
                // First time user - create initial data
                const initialData = {
                    displayName: this.currentUser.displayName || 'Anonymous Player',
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastActive: firebase.database.ServerValue.TIMESTAMP,
                    stats: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalDamageDealt: 0,
                        currentWinStreak: 0,
                        longestWinStreak: 0
                    },
                    progression: {
                        level: 1,
                        totalXP: 0,
                        rank: 'Bronze',
                        rankPoints: 0
                    }
                };
                
                await this.userDataRef.set(initialData);
                console.log('🔥 User data initialized');
            } else {
                // Update last active time
                await this.userDataRef.child('lastActive').set(firebase.database.ServerValue.TIMESTAMP);
            }
        } catch (error) {
            console.error('🔥 Error initializing user data:', error);
        }
    }
    
    /**
     * Save user progress to Firebase
     * @param {Object} progressData - Progress data to save
     */
    async saveUserProgress(progressData) {
        if (!this.userDataRef || !this.isAuthenticated) {
            console.log('🔥 Cannot save progress - not authenticated or offline');
            return;
        }
        
        try {
            const updateData = {
                'stats/gamesPlayed': progressData.gamesPlayed,
                'stats/gamesWon': progressData.gamesWon,
                'stats/totalDamageDealt': progressData.totalDamageDealt,
                'stats/currentWinStreak': progressData.currentWinStreak,
                'stats/longestWinStreak': progressData.longestWinStreak,
                'progression/level': progressData.level,
                'progression/totalXP': progressData.totalXP,
                'progression/rank': progressData.rank,
                'progression/rankPoints': progressData.rankPoints,
                'lastActive': firebase.database.ServerValue.TIMESTAMP
            };
            
            await this.userDataRef.update(updateData);
            console.log('🔥 User progress saved');
        } catch (error) {
            console.error('🔥 Error saving user progress:', error);
        }
    }
    
    /**
     * Load user progress from Firebase
     * @returns {Object|null} User progress data
     */
    async loadUserProgress() {
        if (!this.userDataRef || !this.isAuthenticated) {
            return null;
        }
        
        try {
            const snapshot = await this.userDataRef.once('value');
            if (snapshot.exists()) {
                console.log('🔥 User progress loaded');
                return snapshot.val();
            }
        } catch (error) {
            console.error('🔥 Error loading user progress:', error);
        }
        
        return null;
    }
    
    /**
     * Update leaderboard entry
     * @param {Object} playerData - Player data for leaderboard
     */
    async updateLeaderboard(playerData) {
        if (!this.leaderboardRef || !this.isAuthenticated) {
            return;
        }
        
        try {
            const leaderboardEntry = {
                uid: this.currentUser.uid,
                displayName: playerData.displayName || 'Anonymous',
                level: playerData.level,
                rank: playerData.rank,
                rankPoints: playerData.rankPoints,
                gamesWon: playerData.gamesWon,
                winStreak: playerData.currentWinStreak,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            };
            
            await this.leaderboardRef.child(this.currentUser.uid).set(leaderboardEntry);
            console.log('🔥 Leaderboard updated');
        } catch (error) {
            console.error('🔥 Error updating leaderboard:', error);
        }
    }
    
    /**
     * Get leaderboard data
     * @param {string} sortBy - Sort criteria ('rankPoints', 'level', 'gamesWon')
     * @param {number} limit - Number of entries to return
     * @returns {Array} Leaderboard entries
     */
    async getLeaderboard(sortBy = 'rankPoints', limit = 100) {
        if (!this.leaderboardRef) {
            return this.getOfflineLeaderboard();
        }
        
        try {
            const snapshot = await this.leaderboardRef
                .orderByChild(sortBy)
                .limitToLast(limit)
                .once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                const entries = Object.values(data).reverse(); // Reverse to get highest first
                console.log('🔥 Leaderboard loaded');
                return entries;
            }
        } catch (error) {
            console.error('🔥 Error loading leaderboard:', error);
        }
        
        return [];
    }
    
    /**
     * Get offline leaderboard (fallback)
     * @returns {Array} Mock leaderboard data
     */
    getOfflineLeaderboard() {
        return [
            { displayName: 'Elite Warrior', rank: 'Diamond', rankPoints: 8500, level: 25, gamesWon: 156 },
            { displayName: 'Shadow Master', rank: 'Platinum', rankPoints: 6200, level: 22, gamesWon: 134 },
            { displayName: 'Fire Knight', rank: 'Gold', rankPoints: 4100, level: 18, gamesWon: 89 },
            { displayName: 'Storm Mage', rank: 'Gold', rankPoints: 3800, level: 17, gamesWon: 76 },
            { displayName: 'You', rank: progressionSystem.getPlayerData().rank, rankPoints: progressionSystem.getPlayerData().rankPoints, level: progressionSystem.getPlayerData().level, gamesWon: progressionSystem.getPlayerData().gamesWon }
        ].sort((a, b) => b.rankPoints - a.rankPoints);
    }
    
    /**
     * Join matchmaking queue
     * @param {Object} playerData - Player matchmaking data
     * @returns {Promise<string>} Queue ID
     */
    async joinMatchmakingQueue(playerData) {
        if (!this.matchmakingRef || !this.isAuthenticated) {
            console.log('🔥 Offline matchmaking - using AI opponent');
            return 'offline_match';
        }
        
        try {
            const queueEntry = {
                uid: this.currentUser.uid,
                displayName: playerData.displayName,
                rank: playerData.rank,
                rankPoints: playerData.rankPoints,
                character: playerData.character,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'waiting'
            };
            
            const newRef = await this.matchmakingRef.child('queue').push(queueEntry);
            const queueId = newRef.key;
            
            // Listen for match found
            this.listenForMatch(queueId);
            
            console.log('🔥 Joined matchmaking queue:', queueId);
            return queueId;
        } catch (error) {
            console.error('🔥 Error joining matchmaking queue:', error);
            return 'offline_match';
        }
    }
    
    /**
     * Leave matchmaking queue
     * @param {string} queueId - Queue entry ID
     */
    async leaveMatchmakingQueue(queueId) {
        if (!this.matchmakingRef || queueId === 'offline_match') {
            return;
        }
        
        try {
            await this.matchmakingRef.child(`queue/${queueId}`).remove();
            console.log('🔥 Left matchmaking queue');
        } catch (error) {
            console.error('🔥 Error leaving matchmaking queue:', error);
        }
    }
    
    /**
     * Listen for match found
     * @param {string} queueId - Queue entry ID
     */
    listenForMatch(queueId) {
        if (!this.matchmakingRef) return;
        
        const queueRef = this.matchmakingRef.child(`queue/${queueId}`);
        
        queueRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (data && data.status === 'matched') {
                console.log('🔥 Match found!');
                
                // Dispatch match found event
                document.dispatchEvent(new CustomEvent('matchFound', {
                    detail: {
                        matchId: data.matchId,
                        opponent: data.opponent
                    }
                }));
                
                // Stop listening
                queueRef.off();
            }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            queueRef.off();
            console.log('🔥 Matchmaking timeout - using AI opponent');
            
            // Dispatch timeout event
            document.dispatchEvent(new CustomEvent('matchmakingTimeout', {
                detail: { queueId }
            }));
        }, 30000);
    }
    
    /**
     * Submit battle result
     * @param {Object} battleResult - Battle result data
     */
    async submitBattleResult(battleResult) {
        if (!this.isAuthenticated || !this.database) {
            console.log('🔥 Cannot submit battle result - offline mode');
            return;
        }
        
        try {
            // Save to battle history
            const battleRef = this.database.ref('battles').push();
            const battleData = {
                player1: this.currentUser.uid,
                player2: battleResult.opponentId || 'ai',
                result: battleResult.result,
                duration: battleResult.duration,
                playerStats: battleResult.stats,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            await battleRef.set(battleData);
            
            // Update player stats
            await this.saveUserProgress(progressionSystem.getPlayerData());
            
            // Update leaderboard
            await this.updateLeaderboard(progressionSystem.getPlayerData());
            
            console.log('🔥 Battle result submitted');
        } catch (error) {
            console.error('🔥 Error submitting battle result:', error);
        }
    }
    
    /**
     * Get battle history
     * @param {number} limit - Number of battles to return
     * @returns {Array} Battle history
     */
    async getBattleHistory(limit = 10) {
        if (!this.isAuthenticated || !this.database) {
            return [];
        }
        
        try {
            const snapshot = await this.database.ref('battles')
                .orderByChild('player1')
                .equalTo(this.currentUser.uid)
                .limitToLast(limit)
                .once('value');
            
            if (snapshot.exists()) {
                const battles = Object.values(snapshot.val()).reverse();
                console.log('🔥 Battle history loaded');
                return battles;
            }
        } catch (error) {
            console.error('🔥 Error loading battle history:', error);
        }
        
        return [];
    }
    
    /**
     * Call cloud function
     * @param {string} functionName - Function name
     * @param {Object} data - Function parameters
     * @returns {any} Function result
     */
    async callCloudFunction(functionName, data = {}) {
        if (!this.functions) {
            console.log('🔥 Cloud functions not available - offline mode');
            return null;
        }
        
        try {
            const func = this.functions.httpsCallable(functionName);
            const result = await func(data);
            console.log(`🔥 Cloud function ${functionName} called successfully`);
            return result.data;
        } catch (error) {
            console.error(`🔥 Error calling cloud function ${functionName}:`, error);
            throw error;
        }
    }
    
    /**
     * Validate battle result (anti-cheat)
     * @param {Object} battleResult - Battle result to validate
     * @returns {boolean} True if valid
     */
    async validateBattleResult(battleResult) {
        try {
            const result = await this.callCloudFunction('validateBattleResult', battleResult);
            return result?.isValid || false;
        } catch (error) {
            console.error('🔥 Error validating battle result:', error);
            // Allow in offline mode
            return true;
        }
    }
    
    /**
     * Report cheating
     * @param {Object} reportData - Cheating report data
     */
    async reportCheating(reportData) {
        try {
            await this.callCloudFunction('reportCheating', {
                reporterId: this.currentUser?.uid,
                ...reportData
            });
            console.log('🔥 Cheating report submitted');
        } catch (error) {
            console.error('🔥 Error reporting cheating:', error);
        }
    }
    
    /**
     * Get server timestamp
     * @returns {number} Server timestamp
     */
    getServerTimestamp() {
        return firebase.database.ServerValue.TIMESTAMP;
    }
    
    /**
     * Check if online
     * @returns {boolean} True if online
     */
    isOnline() {
        return this.isInitialized && this.isAuthenticated && navigator.onLine;
    }
    
    /**
     * Get current user
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Clean up Firebase manager
     */
    destroy() {
        this.cleanupRefs();
        
        if (this.auth) {
            this.auth.signOut();
        }
        
        console.log('🔥 Firebase Manager destroyed');
    }
}

// Create global Firebase manager instance
window.firebaseManager = new FirebaseManager();

console.log('🔥 Firebase Manager module loaded');
