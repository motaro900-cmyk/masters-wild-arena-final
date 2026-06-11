/* eslint-disable react-refresh/only-export-components */
import React from 'react';

import { SKINS_DB } from '../../../../configs/SkinsConfig';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';

export const BattlePassStyles = () => (
    <style>{`
        @keyframes bpEmberFloat {
            0% {
                transform: translateY(0) translateX(0) scale(1);
                opacity: 0;
            }
            15% {
                opacity: 0.6;
            }
            85% {
                opacity: 0.6;
            }
            100% {
                transform: translateY(-800px) translateX(var(--drift-x)) scale(0.4);
                opacity: 0;
            }
        }
        
        @keyframes goldGlowShine {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }

        .bp-gold-sweep {
            background-size: 200% 100%;
            animation: goldGlowShine 3s infinite linear;
        }

        .bp-card-hover {
            transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease, border-color 0.25s ease !important;
        }
        .bp-card-hover:hover {
            transform: translateY(-6px) scale(1.03) rotate(0.5deg) !important;
            box-shadow: 0 15px 35px rgba(240, 192, 64, 0.3) !important;
            border-color: #ffd700 !important;
        }
        .bp-card-hover:hover .bp-shine-effect {
            background-position: -150% -150% !important;
        }

        .bp-quest-card-hover {
            transition: transform 0.22s cubic-bezier(0.25, 0.8, 0.25, 1), background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease !important;
        }
        .bp-quest-card-hover:hover {
            transform: translateX(8px) !important;
            background: radial-gradient(circle at center, #241810 0%, #0e0906 100%) !important;
            border-color: #f0c040 !important;
            box-shadow: 0 5px 15px rgba(240, 192, 64, 0.15) !important;
        }
    `}</style>
);

export const CornerOrnament: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{
            position: 'absolute',
            fill: 'none',
            stroke: '#b8860b',
            strokeWidth: 2,
            pointerEvents: 'none',
            zIndex: 20,
            ...style,
        }}
    >
        <path d="M 0 0 L 40 0 L 40 10 L 10 10 L 10 40 L 0 40 Z" />
        <circle cx="5" cy="5" r="2.5" fill="#ffd700" stroke="none" />
        <path d="M 12 12 L 20 12 L 20 20 L 12 20 Z" strokeWidth="1" />
        <line x1="10" y1="10" x2="30" y2="30" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
);

import { AVATARS, AVATAR_FRAMES } from '../../../../configs/ProfileCustomization';

export interface RewardItem {
    id: string;
    name: string;
    icon: string;
    amount?: number;
    type: 'GOLD' | 'ITEM' | 'CHEST' | 'WEAPON' | 'GEMS' | 'SKIN' | 'FRAME' | 'AVATAR' | 'TITLE' | 'ENERGY';
}

export interface Reward {
    level: number;
    free: RewardItem;
    premium: RewardItem;
}

export const BATTLE_PASS_REWARDS: Reward[] = [
    {
        level: 1,
        free: { id: 'gold_500', name: '500 Золота', icon: '💰', amount: 500, type: 'GOLD' },
        premium: { id: 'gems_150', name: '150 Алмазов', icon: '💎', amount: 150, type: 'GEMS' },
    },
    {
        level: 2,
        free: { id: 'energy_25', name: '25 Энергии', icon: '⚡', amount: 25, type: 'ENERGY' },
        premium: { id: 'gold_2000', name: '2000 Золота', icon: '💰', amount: 2000, type: 'GOLD' },
    },
    {
        level: 3,
        free: { id: 'gems_50', name: '50 Алмазов', icon: '💎', amount: 50, type: 'GEMS' },
        premium: { id: 'energy_50', name: '50 Энергии', icon: '⚡', amount: 50, type: 'ENERGY' },
    },
    {
        level: 4,
        free: { id: 'gold_1000', name: '1000 Золота', icon: '💰', amount: 1000, type: 'GOLD' },
        premium: { id: 'gems_200', name: '200 Алмазов', icon: '💎', amount: 200, type: 'GEMS' },
    },
    {
        level: 5,
        free: { id: 'dagger_rusty', name: 'Ржавый Тесак', icon: '⚔️', type: 'WEAPON' },
        premium: { id: 'frame_emerald_dragon', name: 'Изумрудный Дракон', icon: '🖼️', type: 'FRAME' },
    },
    {
        level: 6,
        free: { id: 'energy_30', name: '30 Энергии', icon: '⚡', amount: 30, type: 'ENERGY' },
        premium: { id: 'gold_3000', name: '3000 Золота', icon: '💰', amount: 3000, type: 'GOLD' },
    },
    {
        level: 7,
        free: { id: 'gems_100', name: '100 Алмазов', icon: '💎', amount: 100, type: 'GEMS' },
        premium: { id: 'energy_60', name: '60 Энергии', icon: '⚡', amount: 60, type: 'ENERGY' },
    },
    {
        level: 8,
        free: { id: 'gold_1500', name: '1500 Золота', icon: '💰', amount: 1500, type: 'GOLD' },
        premium: { id: 'gems_250', name: '250 Алмазов', icon: '💎', amount: 250, type: 'GEMS' },
    },
    {
        level: 9,
        free: { id: 'energy_35', name: '35 Энергии', icon: '⚡', amount: 35, type: 'ENERGY' },
        premium: { id: 'gold_4000', name: '4000 Золота', icon: '💰', amount: 4000, type: 'GOLD' },
    },
    {
        level: 10,
        free: { id: 'dagger_bone', name: 'Клык Жнеца', icon: '⚔️', type: 'WEAPON' },
        premium: { id: 'avatar_monkey', name: 'Король Обезьян', icon: '🐵', type: 'AVATAR' },
    },
    {
        level: 11,
        free: { id: 'gold_2000', name: '2000 Золота', icon: '💰', amount: 2000, type: 'GOLD' },
        premium: { id: 'gems_300', name: '300 Алмазов', icon: '💎', amount: 300, type: 'GEMS' },
    },
    {
        level: 12,
        free: { id: 'energy_40', name: '40 Энергии', icon: '⚡', amount: 40, type: 'ENERGY' },
        premium: { id: 'gold_5000', name: '5000 Золота', icon: '💰', amount: 5000, type: 'GOLD' },
    },
    {
        level: 13,
        free: { id: 'gems_150', name: '150 Алмазов', icon: '💎', amount: 150, type: 'GEMS' },
        premium: { id: 'energy_80', name: '80 Энергии', icon: '⚡', amount: 80, type: 'ENERGY' },
    },
    {
        level: 14,
        free: { id: 'gold_3000', name: '3000 Золота', icon: '💰', amount: 3000, type: 'GOLD' },
        premium: { id: 'gems_400', name: '400 Алмазов', icon: '💎', amount: 400, type: 'GEMS' },
    },
    {
        level: 15,
        free: { id: 'weapon_moon_sword', name: 'Меч Луны', icon: '⚔️', type: 'WEAPON' },
        premium: { id: 'gems_500', name: '500 Алмазов', icon: '💎', amount: 500, type: 'GEMS' },
    },
];

export const getRewardImage = (item: RewardItem): string => {
    if (item.type === 'SKIN') {
        const skin = SKINS_DB.find((s) => s.id === item.id);
        if (skin) return skin.image;
    }
    if (item.type === 'GOLD') {
        return '/assets/images/ui/icons/Gold.webp';
    }
    if (item.type === 'GEMS') {
        return '/assets/images/ui/icons/almaz.webp';
    }
    if (item.type === 'ENERGY') {
        return '/assets/images/ui/icons/energy.webp';
    }
    if (item.type === 'FRAME') {
        const frameId = item.id.replace('frame_', '') + '_frame.webp';
        const frame = AVATAR_FRAMES.find((f) => f.id === frameId);
        if (frame) return frame.path;
    }
    if (item.type === 'AVATAR') {
        const avatarId = item.id.replace('avatar_', '');
        const avatar = AVATARS.find((a) => a.id === avatarId);
        if (avatar) return avatar.path;
    }
    if (item.type === 'CHEST') {
        return '/assets/images/ui/icons/season_chest.webp';
    }
    if (item.id.includes('potion_strength')) {
        return '/assets/images/items/potions/strength.webp';
    }
    if (item.id.includes('potion_healing')) {
        return '/assets/images/items/potions/hp_small.webp';
    }
    if (item.id.includes('potion_defense')) {
        return '/assets/images/items/potions/defense.webp';
    }
    if (item.id.includes('shard')) {
        return '/assets/images/resources/runic_shard.webp';
    }
    if (item.id === 'pedestal_legendary') {
        return '/assets/images/items/armor/armor_phoenix.webp';
    }

    let mappedItemId = item.id;
    if (item.id === 'potion_strength') mappedItemId = 'hp_potion_3';
    else if (item.id === 'potion_strength_great') mappedItemId = 'hp_potion_3';
    else if (item.id === 'potion_healing') mappedItemId = 'hp_potion_1';
    else if (item.id === 'potion_defense') mappedItemId = 'hp_potion_2';

    const dbItem = ITEMS_DATABASE[mappedItemId];
    if (dbItem?.image) {
        return dbItem.image;
    }

    return '';
};
