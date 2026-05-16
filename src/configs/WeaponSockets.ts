/**
 * WEAPON_SOCKETS — Профессиональная система точек крепления оружия.
 * Каждая запись определяет позицию (x, y), поворот (rotation) и масштаб (scale)
 * оружия для конкретного героя в конкретном состоянии.
 */

export interface SocketPoint {
    x: number;
    y: number;
    rotation: number;
    scale?: number;
}

export type HeroSockets = Record<string, SocketPoint>;

export const WEAPON_SOCKETS: Record<string, HeroSockets> = {
    panda: {
        // --- WEAPONS ---
        '0': { x: -10, y: -325, rotation: 0.86, scale: 1.0 }, // IDLE
        '1': { x: 80, y: -340, rotation: 0.8, scale: 1.0 }, // RUN
        '2': { x: 20, y: -340, rotation: -0.5, scale: 1.0 }, // HURT
        '3': { x: 0, y: 0, rotation: 0, scale: 1.0 }, // DEATH
        '4': { x: 50, y: -350, rotation: 0.3, scale: 1.0 }, // WALK
        '5': { x: 130, y: -450, rotation: -0.5, scale: 1.0 }, // ATTACK WINDUP
        '6': { x: 280, y: -330, rotation: 1.8, scale: 1.0 }, // ATTACK ACTIVE
        '7': { x: -10, y: -325, rotation: 0.86, scale: 1.0 }, // VICTORY

        // --- HELMETS (Relative to head) ---
        HELMET: { x: 0, y: -580, rotation: 0, scale: 0.85 },

        // --- ARMOR (Over torso) ---
        ARMOR: { x: 0, y: -380, rotation: 0, scale: 1.15 },

        // --- SHIELDS (Left hand) ---
        SHIELD: { x: -120, y: -300, rotation: -0.4, scale: 0.9 },
    },
    // Здесь можно легко добавить других героев
    fox: {
        '0': { x: 50, y: -200, rotation: 0, scale: 0.8 },
        // ... и так далее
    },
};
