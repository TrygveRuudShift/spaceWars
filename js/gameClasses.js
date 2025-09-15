// Game class definitions
export const classes = {
    demolition: {
        name: "Demolition Expert",
        emoji: "🧨",
        playerSize: 25,
        playerSpeed: 5,
        thrustPower: 0.2,
        health: 12,
        bulletSpeed: 3,
        bulletSize: 8,
        weaponType: "explosive",
        color: "#FF8C00",
        description: "HP: 12\nExplosive grenades"
    },
    bouncer: {
        name: "Bouncer",
        emoji: "🏀", 
        playerSize: 20,
        playerSpeed: 7,
        thrustPower: 0.25,
        health: 8,
        bulletSpeed: 8,
        bulletSize: 4,
        weaponType: "bounce",
        color: "#32CD32",
        description: "HP: 8\nRicochet bullets"
    },
    portal: {
        name: "Portal Walker",
        emoji: "🌀",
        playerSize: 25,
        playerSpeed: 5,
        thrustPower: 0.2,
        health: 10,
        bulletSpeed: 6,
        bulletSize: 5,
        weaponType: "portal",
        color: "#8A2BE2",
        description: "HP: 10\nWarp bullets"
    },
    sidewinder: {
        name: "Sidewinder",
        emoji: "↔️",
        playerSize: 30,
        playerSpeed: 3,
        thrustPower: 0.15,
        health: 14,
        bulletSpeed: 5,
        bulletSize: 6,
        weaponType: "side",
        color: "#8B0000",
        description: "HP: 14\nDual side cannons"
    },
    retreat: {
        name: "Retreat Specialist",
        emoji: "⬅️",
        playerSize: 18,
        playerSpeed: 8,
        thrustPower: 0.3,
        health: 6,
        bulletSpeed: 7,
        bulletSize: 4,
        weaponType: "rear",
        color: "#4169E1",
        description: "HP: 6\nRear thrusters"
    },
    quantum: {
        name: "Quantum Assassin",
        emoji: "⚡",
        playerSize: 23,
        playerSpeed: 6,
        thrustPower: 0.22,
        health: 7,
        bulletSpeed: 7,
        bulletSize: 5,
        weaponType: "phase",
        color: "#4B0082",
        description: "HP: 7\nPhase bullets"
    }
};