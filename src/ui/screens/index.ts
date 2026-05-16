import { resolveAssetObject } from '../../utils/assetPath';

const rawCharacters = {
    panda: '/assets/characters/panda.png',
    moose: '/assets/characters/moose.png',
    goose: '/assets/characters/goose.png',
    cat: '/assets/characters/cat.png',
};

const rawUI = {
    heroPanel: '/assets/panels/hero.png',
    statsPanel: '/assets/panels/stats.png',
    inventory: '/assets/panels/inventory.png',
};

const rawButtons = {
    fight: '/assets/buttons/fight.png',
    small: '/assets/buttons/small.png',
};

const rawHUD = {
    hp: '/assets/hud/hp.png',
    energy: '/assets/hud/energy.png',
    xp: '/assets/hud/xp.png',
};

export const Characters = resolveAssetObject(rawCharacters) as typeof rawCharacters;
export const UI = resolveAssetObject(rawUI) as typeof rawUI;
export const Buttons = resolveAssetObject(rawButtons) as typeof rawButtons;
export const HUD = resolveAssetObject(rawHUD) as typeof rawHUD;
