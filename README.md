# Mini Battle Arena

A fast-paced multiplayer battle arena game built for the web with Firebase backend integration.

## 🎮 Game Features

### Core Gameplay
- **30-second 1v1 battles** in small arenas
- **Simple one-button controls**:
  - Tap = Attack
  - Hold = Block  
  - Double-tap = Dash/Jump
- **4 unique characters** with special abilities
- **5 dynamic arenas** with random hazards

### Progression System
- **Rank system**: Bronze → Silver → Gold → Platinum → Diamond → Mythic
- **XP-based leveling** that unlocks characters, skins, and arenas
- **Daily missions** with rotating objectives
- **Achievement system** with rewards

### Multiplayer
- **Real-time PvP matchmaking** via Firebase
- **Private friend matches** (when implemented)
- **Fake-PvP fallback**: AI opponents when no players online
- **Anti-cheat validation** via cloud functions

### Monetization
- **Cosmetics-only shop**: character skins, weapon trails, victory dances
- **Battle Pass system** (framework ready)
- **Rewarded ads** for bonus rewards
- **No pay-to-win mechanics**

### Retention Features
- **Daily login rewards** with streak bonuses
- **Global leaderboards** 
- **Push notifications** (framework ready)
- **Limited-time events** (framework ready)

## 🚀 Quick Start

### Option 1: Direct Play
1. Open `index.html` in a modern web browser
2. The game runs entirely client-side with offline AI opponents
3. All data is stored locally in localStorage

### Option 2: Firebase Integration
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Anonymous + Google/Email)
3. Enable Realtime Database
4. Enable Cloud Functions (optional, for anti-cheat)
5. Replace the config in `js/config/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com", 
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### Option 3: Development Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP  
php -S localhost:8000
```

Then open http://localhost:8000

## 📁 Project Structure

```
Mini Battle Arena/
├── index.html                 # Main game file
├── README.md                  # This file
├── styles/                    # CSS stylesheets
│   ├── main.css              # Core styles and variables
│   ├── ui.css                # UI component styles  
│   └── game.css              # Game-specific styles
└── js/                       # JavaScript modules
    ├── config/
    │   └── firebase-config.js # Firebase configuration
    ├── core/                 # Core game systems
    │   ├── game-engine.js    # Main game loop and rendering
    │   ├── physics.js        # Physics and collision detection
    │   └── input-manager.js  # Input handling and controls
    ├── systems/              # Game systems
    │   ├── character-system.js  # Character management
    │   ├── arena-system.js      # Arena and hazards
    │   ├── battle-system.js     # Battle logic and AI
    │   └── progression-system.js # XP, ranks, achievements
    ├── ui/                   # User interface
    │   ├── screen-manager.js # Screen navigation
    │   └── ui-manager.js     # UI updates and effects
    ├── multiplayer/          # Multiplayer features
    │   ├── firebase-manager.js  # Firebase integration
    │   └── matchmaking.js       # Matchmaking and AI opponents
    ├── monetization/         # Monetization features
    │   ├── shop-system.js    # In-game shop
    │   └── ads-manager.js    # Advertisement integration
    └── app.js               # Main application controller
```

## 🎯 Game Systems

### Character System
- **4 Character Types**: Ninja, Knight, Mage, Berserker
- **Unique Abilities**: Each character has special attacks
- **Unlock System**: Characters unlock via level progression
- **Customization**: Skins and cosmetics available in shop

### Arena System  
- **5 Arena Types**: Basic, Volcanic, Windy, Spiky, Chaotic
- **Dynamic Hazards**: Falling rocks, lava floor, wind gusts, spikes
- **Environmental Effects**: Weather, lighting, particles
- **Random Generation**: Hazard timing and placement

### Battle System
- **30-second matches** with health-based victory
- **Smart AI opponents** with different personalities  
- **Combo system** and special attacks
- **Damage indicators** and visual feedback

### Progression System
- **XP Formula**: `level = floor(sqrt(totalXP / 100)) + 1`
- **Rank Points**: Win/loss affects ranking
- **Daily Missions**: 3 random missions per day
- **Achievements**: 7 different achievement categories

## 🛠️ Development

### Adding New Characters
1. Add character data to `characterSystem.initializeCharacterTypes()`
2. Create abilities in `Character.getDefaultAbilities()`
3. Add unlock requirements
4. Add shop skins if desired

```javascript
newCharacter: {
    name: 'New Character',
    description: 'Character description',
    color: '#hexcolor',
    unlockLevel: 25,
    stats: { speed: 4, attack: 5, defense: 3 },
    abilities: ['lightAttack', 'dash', 'specialMove']
}
```

### Adding New Arenas
1. Add arena data to `arenaSystem.initializeArenaTypes()`
2. Configure hazards and effects
3. Add unlock requirements
4. Create visual theme

```javascript
newArena: {
    name: 'New Arena',
    description: 'Arena description', 
    unlockLevel: 15,
    hazards: {
        customHazard: { enabled: true, /* config */ }
    }
}
```

### Adding Shop Items
1. Add items to `shopSystem.initializeShopItems()`
2. Set rarity and pricing
3. Add preview icon/emoji
4. Implement visual effects if needed

```javascript
{
    id: 'item_id',
    name: 'Item Name',
    description: 'Item description',
    price: 150,
    rarity: 'rare',
    preview: '🎨'
}
```

## 🔧 Configuration

### Game Balance
Edit values in `js/config/firebase-config.js`:

```javascript
window.gameConfig = {
    battleDuration: 30,        // Battle length in seconds
    maxHealth: 100,           // Player max health
    attackDamage: {           // Damage values
        light: 15,
        heavy: 25, 
        special: 35
    },
    moveSpeed: 200,           // Movement speed
    dashSpeed: 400,           // Dash speed
    // ... more config options
};
```

### Progression Tuning
- **XP per win**: `gameConfig.xpPerWin`
- **Rank thresholds**: `gameConfig.rankThresholds`
- **Shop prices**: `gameConfig.skinPrices`

## 🔍 Debug Features

Open browser console and use:

```javascript
// Add resources
debug.addCoins(1000);
debug.addXP(500);

// Unlock all content
debug.unlockAll();

// Reset progress
debug.resetData();

// View statistics
debug.getStats();

// Test ads
debug.showAd();
```

## 📱 Mobile Support

The game is fully responsive and touch-optimized:
- **Virtual joystick** for movement
- **Action button** for attacks/blocks/dash
- **Touch-friendly UI** with large buttons
- **Responsive design** for all screen sizes
- **PWA ready** (service worker framework included)

## 🔒 Security Features

### Anti-Cheat
- **Client-side validation** of game actions
- **Server-side verification** via Firebase Cloud Functions
- **Rate limiting** on score submissions
- **Replay validation** for suspicious matches

### Data Protection
- **Anonymous authentication** by default
- **Local data encryption** (framework ready)
- **Secure cloud sync** via Firebase
- **No sensitive data storage**

## 🌐 Browser Support

- **Chrome 60+** ✅
- **Firefox 55+** ✅  
- **Safari 12+** ✅
- **Edge 79+** ✅
- **Mobile browsers** ✅

### Required APIs
- Canvas 2D
- Local Storage
- WebSockets (for Firebase)
- Touch Events
- Device Orientation (optional)

## 📊 Analytics Integration

Framework ready for analytics providers:

```javascript
// Track events
analytics.track('battle_completed', {
    result: 'victory',
    duration: 25,
    character: 'ninja'
});

// Track progression
analytics.track('level_up', {
    level: 5,
    xp: 500
});
```

## 🚀 Deployment Options

### Static Hosting
- **GitHub Pages**: Push to `gh-pages` branch
- **Netlify**: Connect repository 
- **Vercel**: Import project
- **Firebase Hosting**: `firebase deploy`

### CDN Integration
- Add CDN links for Firebase SDK
- Optimize images with CDN
- Enable compression and caching

### PWA Deployment
1. Complete service worker implementation
2. Add web app manifest
3. Enable offline caching
4. Submit to app stores

## 🤝 Contributing

### Adding Features
1. Follow existing code structure
2. Add comprehensive comments
3. Update this README
4. Test on multiple devices

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions focused and small

### Testing
- Test all game mechanics
- Verify Firebase integration
- Check mobile responsiveness  
- Validate offline functionality

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🎮 Credits

**Game Design**: Unity-inspired battle arena mechanics  
**Art Style**: Emoji-based placeholder graphics  
**Architecture**: Modular JavaScript with Firebase backend  
**UI/UX**: Mobile-first responsive design

---

## 🚀 Ready to Battle!

Open `index.html` in your browser and start fighting! The game works immediately with AI opponents, and you can add Firebase integration for real multiplayer when ready.

**Pro tip**: Try the debug console commands to explore all features quickly!

🎯 **Have fun and may the best warrior win!** ⚔️
