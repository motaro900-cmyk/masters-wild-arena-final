export const RESOURCE_METADATA: Record<string, { name: string; image: string; rarity: string }> = {
    coal: { name: 'Уголь', image: '/assets/images/resources/coal.webp', rarity: 'COMMON' },
    steel_bars: { name: 'Стальной слиток', image: '/assets/images/resources/steel_bar.webp', rarity: 'RARE' },
    runic_shards: { name: 'Рунический осколок', image: '/assets/images/resources/runic_shard.webp', rarity: 'EPIC' },
    ancient_compass: {
        name: 'Древний компас',
        image: '/assets/images/resources/ancient_compass.webp',
        rarity: 'RARE',
    },
    astral_crystal: {
        name: 'Астральный кристалл',
        image: '/assets/images/resources/astral_crystal.webp',
        rarity: 'RARE',
    },
    void_sphere: {
        name: 'Сфера бездны',
        image: '/assets/images/resources/void_sphere.webp',
        rarity: 'EPIC',
    },
    golden_sprout: {
        name: 'Золотой росток',
        image: '/assets/images/resources/golden_sprout.webp',
        rarity: 'EPIC',
    },
    dragon_scale: {
        name: 'Чешуя дракона',
        image: '/assets/images/resources/dragon_scale.webp',
        rarity: 'LEGENDARY',
    },
    lava_heart: {
        name: 'Сердце лавы',
        image: '/assets/images/resources/lava_heart.webp',
        rarity: 'LEGENDARY',
    },
};

export const getLootRarityColor = (rarity: string) => {
    switch (rarity) {
        case 'COMMON':
            return '#b0c4de';
        case 'UNCOMMON':
            return '#4ade80';
        case 'RARE':
            return '#3b82f6';
        case 'EPIC':
            return '#a855f7';
        case 'LEGENDARY':
            return '#f97316';
        case 'MYTHIC':
            return '#ef4444';
        default:
            return '#ffffff';
    }
};
