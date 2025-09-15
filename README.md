# Space Wars - Battle Arena

A fast-paced multiplayer space combat game with character classes.

## 🚀 Play Now

**Live Demo:** https://trygveruudshift.github.io/spaceWars/

## 🕹️ How to Play

### Controls

- **Mobile:** Touch and drag virtual joysticks to move and aim
- **Desktop:** Click and drag joysticks with mouse

### Game Setup

1. Choose your character class (each has unique weapons)
2. Player 1 (Red) controls bottom joystick
3. Player 2 (Blue) controls top joystick (rotated view)
4. Battle until one player's health reaches zero!

### Character Classes

- **🚀 Demolition** - Explosive rocket launcher
- **⚡ Bouncer** - Ricocheting energy balls
- **👻 Phase** - Bullets that phase through walls
- **🔥 Rapid** - High-speed bullet barrage
- **💥 Scatter** - Shotgun-style spread shots
- **🎯 Sniper** - Precise long-range rifle

## 🛠️ Local Development

### Prerequisites

- Node.js installed on your system

### Setup

```bash
# Clone the repository
git clone https://github.com/TrygveRuudShift/spaceWars.git
cd spaceWars

# Start development server
npx live-server --port=8080

# Or use basic http server
npx http-server -p 8080
```

Open `http://localhost:8080` in your browser.

## 📱 Mobile Installation

This game is a Progressive Web App (PWA). On mobile devices:

1. Open the game in your mobile browser
2. Tap "Add to Home Screen" when prompted
3. Launch from your home screen for full-screen experience

## 🏗️ Project Structure

```
spaceWars/
├── index.html          # Main entry point
├── manifest.json       # PWA configuration
├── assets/            # Images and icons
│   ├── icon-192.png
│   └── icon-512.png
├── css/              # Stylesheets
│   └── styles.css    # Main game styles
└── js/               # JavaScript modules
    ├── main.js       # Game initialization & loop
    ├── Vector2.js    # 2D vector math utilities
    ├── gameClasses.js # Character class definitions
    ├── Joystick.js   # Virtual joystick system
    ├── Player.js     # Player entity with physics
    └── gameEntities.js # Bullets & explosions
```

## 🎯 Features

- **Modern ES6 Modules** - Clean, maintainable code architecture
- **Responsive Design** - Works on phones, tablets, and desktops
- **Touch Optimized** - Perfect for mobile gaming
- **PWA Ready** - Installable as native app
- **No Dependencies** - Pure vanilla JavaScript

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Enjoy the battle!** 🚀💥
