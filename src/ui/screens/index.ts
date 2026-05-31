import { resolveAssetObject } from '../../utils/assetPath';

const rawCharacters = {
    panda: '/assets/characters/panda.webp',
    moose: '/assets/characters/moose.webp',
    goose: '/assets/characters/goose.webp',
    cat: '/assets/characters/cat.webp',
};

const rawUI = {
    heroPanel: '/assets/panels/hero.webp',
    statsPanel: '/assets/panels/stats.webp',
    inventory: '/assets/panels/inventory.webp',
};

const rawButtons = {
    fight: '/assets/buttons/fight.webp',
    small: '/assets/buttons/small.webp',
};

const rawHUD = {
    hp: '/assets/hud/hp.webp',
    energy: '/assets/hud/energy.webp',
    xp: '/assets/hud/xp.webp',
};

export const Characters = resolveAssetObject(rawCharacters) as typeof rawCharacters;
export const UI = resolveAssetObject(rawUI) as typeof rawUI;
export const Buttons = resolveAssetObject(rawButtons) as typeof rawButtons;
export const HUD = resolveAssetObject(rawHUD) as typeof rawHUD;
