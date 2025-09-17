// Game class definitions
export const classes = {
    demolition: {
        name: "Demolition Expert",
        emoji: "🧨",
        playerSize: 25,
        playerSpeed: 2.5, // Reduced from 5
        thrustPower: 0.1, // Reduced from 0.2
        health: 12,
        bulletSpeed: 4,
        bulletSize: 8,
        weaponType: "explosive",
        shootingFrequency: 45, // Slower shooting due to powerful explosives
        hitboxShape: "composite",
        hitboxParts: [
            { type: "rectangle", x: 0, y: -8, width: 30, height: 16 }, // Main body
            { type: "triangle", x: 0, y: -16, width: 20, height: 12 }, // Nose
            { type: "rectangle", x: -18, y: 0, width: 8, height: 24 }, // Left wing
            { type: "rectangle", x: 18, y: 0, width: 8, height: 24 }, // Right wing
            { type: "circle", x: 0, y: 8, radius: 8 } // Engine compartment
        ],
        // Simplified hitbox for collision detection
        simpleHitbox: { type: "rectangle", width: 35, height: 40 },
        // Sprite information
        spriteUrl: "assets/sprites/class_demolition_expert.png",
        spriteSize: 32, // Assuming 32x32 pixel sprites
        color: "#FF8C00",
        description: "HP: 12\nExplosive grenades\nSlow firing"
    },
    bouncer: {
        name: "Bouncer",
        emoji: "🏀", 
        playerSize: 20,
        playerSpeed: 3.5, // Reduced from 7
        thrustPower: 0.125, // Reduced from 0.25
        health: 8,
        bulletSpeed: 8,
        bulletSize: 4,
        weaponType: "bounce",
        shootingFrequency: 25, // Fast shooting
        hitboxShape: "composite",
        hitboxParts: [
            { type: "circle", x: 0, y: -5, radius: 15 }, // Main spherical body
            { type: "rectangle", x: 0, y: -20, width: 8, height: 12 }, // Forward cannon
            { type: "circle", x: -12, y: 8, radius: 6 }, // Left bounce pod
            { type: "circle", x: 12, y: 8, radius: 6 }, // Right bounce pod
            { type: "rectangle", x: -8, y: 15, width: 4, height: 8 }, // Left thruster
            { type: "rectangle", x: 8, y: 15, width: 4, height: 8 }, // Right thruster
            { type: "triangle", x: 0, y: 12, width: 10, height: 6 } // Central stabilizer fin
        ],
        // Simplified hitbox for collision detection
        simpleHitbox: { type: "oval", width: 28, height: 35 },
        // Sprite information
        spriteUrl: "assets/sprites/class_bouncer.png",
        spriteSize: 32,
        color: "#32CD32",
        description: "HP: 8\nRicochet bullets\nFast firing"
    },
    portal: {
        name: "Portal Walker",
        emoji: "🌀",
        playerSize: 25,
        playerSpeed: 2.5, // Reduced from 5
        thrustPower: 0.1, // Reduced from 0.2
        health: 10,
        bulletSpeed: 6,
        bulletSize: 5,
        weaponType: "portal",
        shootingFrequency: 35, // Medium shooting
        hitboxShape: "composite",
        hitboxParts: [
            { type: "hexagon", x: 0, y: 0, radius: 20 }, // Main hexagonal body
            { type: "triangle", x: 0, y: -25, width: 16, height: 10 }, // Forward section
            { type: "rectangle", x: -22, y: -5, width: 10, height: 20 }, // Left portal wing
            { type: "rectangle", x: 22, y: -5, width: 10, height: 20 }, // Right portal wing
            { type: "diamond", x: 0, y: 15, width: 12, height: 12 } // Engine crystal
        ],
        // Simplified hitbox for collision detection
        simpleHitbox: { type: "rectangle", width: 45, height: 40 },
        // Sprite information
        spriteUrl: "assets/sprites/class_portal_walker.png",
        spriteSize: 32,
        color: "#8A2BE2",
        description: "HP: 10\nWarp bullets\nMedium firing"
    },
    sidewinder: {
        name: "Sidewinder",
        emoji: "↔️",
        playerSize: 30,
        playerSpeed: 1.5, // Reduced from 3
        thrustPower: 0.075, // Reduced from 0.15
        health: 14,
        bulletSpeed: 5,
        bulletSize: 6,
        weaponType: "side",
        shootingFrequency: 40, // Slower due to dual cannons
        hitboxShape: "composite",
        hitboxParts: [
            { type: "rectangle", x: 0, y: 0, width: 40, height: 20 }, // Wide main body
            { type: "triangle", x: 0, y: -15, width: 24, height: 10 }, // Nose section
            { type: "rectangle", x: -25, y: -8, width: 12, height: 16 }, // Left cannon mount
            { type: "rectangle", x: 25, y: -8, width: 12, height: 16 }, // Right cannon mount
            { type: "rectangle", x: -20, y: 12, width: 8, height: 8 }, // Left engine
            { type: "rectangle", x: 20, y: 12, width: 8, height: 8 } // Right engine
        ],
        // Simplified hitbox for collision detection
        simpleHitbox: { type: "rectangle", width: 50, height: 35 },
        // Sprite information
        spriteUrl: "assets/sprites/class_sidewinder.png",
        spriteSize: 32,
        color: "#8B0000",
        description: "HP: 14\nDual side cannons\nSlow firing"
    },
    retreat: {
        name: "Retreat Specialist",
        emoji: "⬅️",
        playerSize: 18,
        playerSpeed: 4, // Reduced from 8
        thrustPower: 0.15, // Reduced from 0.3
        health: 6,
        bulletSpeed: 7,
        bulletSize: 4,
        weaponType: "rear",
        shootingFrequency: 20, // Very fast shooting
        hitboxShape: "composite",
        hitboxParts: [
            { type: "triangle", x: 0, y: 0, width: 20, height: 30 }, // Arrow-like main body
            { type: "rectangle", x: -12, y: 10, width: 8, height: 12 }, // Left stabilizer
            { type: "rectangle", x: 12, y: 10, width: 8, height: 12 }, // Right stabilizer
            { type: "circle", x: 0, y: 18, radius: 6 } // Rear thruster
        ],
        // Simplified hitbox for collision detection
        simpleHitbox: { type: "oval", width: 24, height: 32 },
        // Sprite information
        spriteUrl: "assets/sprites/class_retreat_specialist.png",
        spriteSize: 32,
        color: "#4169E1",
        description: "HP: 6\nRear thrusters\nVery fast firing"
    },
    quantum: {
        name: "Quantum Assassin",
        emoji: "⚡",
        playerSize: 23,
        playerSpeed: 3, // Reduced from 6
        thrustPower: 0.11, // Reduced from 0.22
        health: 7,
        bulletSpeed: 7,
        bulletSize: 5,
        weaponType: "phase",
        shootingFrequency: 30, // Fast shooting
        hitboxShape: "composite",
        hitboxParts: [
            { type: "diamond", x: 0, y: 0, width: 24, height: 36 }, // Main diamond body
            { type: "triangle", x: 0, y: -20, width: 14, height: 8 }, // Sharp nose
            { type: "rectangle", x: -16, y: 8, width: 6, height: 16 }, // Left energy wing
            { type: "rectangle", x: 16, y: 8, width: 6, height: 16 }, // Right energy wing
            { type: "star", x: 0, y: 12, radius: 8 } // Quantum core
        ],
        // Simplified hitbox for collision detection
        simpleHitbox: { type: "rectangle", width: 32, height: 40 },
        // Sprite information
        spriteUrl: "assets/sprites/class_quantum_assasin.png",
        spriteSize: 32,
        color: "#4B0082",
        description: "HP: 7\nPhase bullets\nFast firing"
    }
};