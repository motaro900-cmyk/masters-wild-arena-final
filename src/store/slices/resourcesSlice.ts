// resourcesSlice.ts — craft resources state initialization
// Mutations happen inline via set() in forgeSlice actions (upgradeItem, dismantleItem, etc.)
// since all slices share a single Zustand store set() instance.

export const createResourcesSlice = (_set: any, _get: any) => ({
    coal: 0,
    steel_bars: 0,
    runic_shards: 0,
    ancient_compass: 0,
    astral_crystal: 0,
    void_sphere: 0,
    golden_sprout: 0,
    dragon_scale: 0,
    lava_heart: 0,
    protection_stones: 0,
});
