import { IHeroAnchors } from '../../configs/HeroesConfig';

export interface WeaponVisualConfig {
    anchorX: number;
    anchorY: number;
    angleOffset?: number;
    scaleMultiplier?: number;
}

export const WEAPON_VISUAL_CONFIGS: Record<string, WeaponVisualConfig> = {
    // Staffs (held in upper middle part, slightly angled)
    stick_oak: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_shadow: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_celestial: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_gold: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_galaxy: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_skull_green: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_sun_burst: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },

    // Bows (held exactly in the middle)
    bow_griffin: { anchorX: 0.5, anchorY: 0.5, angleOffset: 0, scaleMultiplier: 1.15 },

    // Claws (centered)
    claws_ice_fire: { anchorX: 0.5, anchorY: 0.5, angleOffset: 0, scaleMultiplier: 1.0 },

    // Slings (centered)
    sling_leather: { anchorX: 0.5, anchorY: 0.5, angleOffset: 0, scaleMultiplier: 0.95 },

    // Frying Pan
    pan_master: { anchorX: 0.5, anchorY: 0.9, angleOffset: 15, scaleMultiplier: 1.0 },

    // Default Swords, Axes, Daggers (held at hilt/handle)
    default: { anchorX: 0.5, anchorY: 0.85, angleOffset: 0, scaleMultiplier: 1.0 },
};

export function getWeaponVisualConfig(itemId: string): WeaponVisualConfig {
    if (WEAPON_VISUAL_CONFIGS[itemId]) return WEAPON_VISUAL_CONFIGS[itemId];
    const idLower = itemId.toLowerCase();
    if (idLower.includes('staff') || idLower.includes('stick') || idLower.includes('wand')) {
        return WEAPON_VISUAL_CONFIGS['stick_oak'];
    }
    if (idLower.includes('bow')) {
        return WEAPON_VISUAL_CONFIGS['bow_griffin'];
    }
    if (idLower.includes('claws')) {
        return WEAPON_VISUAL_CONFIGS['claws_ice_fire'];
    }
    if (idLower.includes('sling')) {
        return WEAPON_VISUAL_CONFIGS['sling_leather'];
    }
    if (idLower.includes('pan')) {
        return WEAPON_VISUAL_CONFIGS['pan_master'];
    }
    return WEAPON_VISUAL_CONFIGS['default'];
}

export const SLOT_CONFIG = {
    WEAPON: { baseSize: 256, socketKey: 'rightHand' as keyof IHeroAnchors, zIndex: 25 },
    HELMET: { baseSize: 100, socketKey: 'head' as keyof IHeroAnchors, zIndex: 30 },
    ARMOR: { baseSize: 210, socketKey: 'center' as keyof IHeroAnchors, zIndex: 15 },
    SHIELD: { baseSize: 105, socketKey: 'leftHand' as keyof IHeroAnchors, zIndex: 18 },
} as const;
