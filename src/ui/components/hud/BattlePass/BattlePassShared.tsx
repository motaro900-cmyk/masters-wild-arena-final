/* eslint-disable react-refresh/only-export-components */
import React from 'react';

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

export interface RewardItem {
    id: string;
    name: string;
    icon: string;
    amount?: number;
    type: 'GOLD' | 'ITEM' | 'CHEST' | 'WEAPON' | 'GEMS' | 'SKIN';
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
        premium: { id: 'weapon_moon_sword', name: 'Меч Луны', icon: '⚔️', type: 'WEAPON' },
    },
    {
        level: 2,
        free: { id: 'chest_small', name: 'Малый Сундук', icon: '📦', type: 'CHEST' },
        premium: { id: 'gems_100', name: '100 Алмазов', icon: '💎', amount: 100, type: 'GEMS' },
    },
    {
        level: 3,
        free: { id: 'potion_strength', name: 'Зелье Силы', icon: '🧪', type: 'ITEM' },
        premium: { id: 'gems_150', name: '150 Алмазов', icon: '💎', amount: 150, type: 'GEMS' },
    },
    {
        level: 4,
        free: { id: 'gold_1000', name: '1000 Золота', icon: '💰', amount: 1000, type: 'GOLD' },
        premium: { id: 'chest_epic', name: 'Эпич. Сундук', icon: 'sprite-gift', type: 'CHEST' },
    },
    {
        level: 5,
        free: { id: 'shard_rare', name: 'Редкий Осколок', icon: '✨', type: 'ITEM' },
        premium: { id: 'pedestal_legendary', name: 'Легенд. Пьедестал', icon: '🏛️', type: 'ITEM' },
    },
    {
        level: 6,
        free: { id: 'gold_1500', name: '1500 Золота', icon: '💰', amount: 1500, type: 'GOLD' },
        premium: { id: 'gems_200', name: '200 Алмазов', icon: '💎', amount: 200, type: 'GEMS' },
    },
    {
        level: 7,
        free: { id: 'potion_healing', name: 'Зелье Жизни', icon: '🧪', type: 'ITEM' },
        premium: { id: 'shard_legendary', name: 'Легенд. Осколок', icon: '✨', type: 'ITEM' },
    },
    {
        level: 8,
        free: { id: 'chest_small', name: 'Малый Сундук', icon: '📦', type: 'CHEST' },
        premium: { id: 'gold_3000', name: '3000 Золота', icon: '💰', amount: 3000, type: 'GOLD' },
    },
    {
        level: 9,
        free: { id: 'gems_50', name: '50 Алмазов', icon: '💎', amount: 50, type: 'GEMS' },
        premium: { id: 'weapon_fire_staff', name: 'Посох Огня', icon: '🔥', type: 'WEAPON' },
    },
    {
        level: 10,
        free: { id: 'chest_epic', name: 'Эпич. Сундук', icon: 'sprite-gift', type: 'CHEST' },
        premium: { id: 'skin_lava_golem', name: 'Облик: Голем', icon: '🌋', type: 'SKIN' },
    },
    {
        level: 11,
        free: { id: 'gold_2000', name: '2000 Золота', icon: '💰', amount: 2000, type: 'GOLD' },
        premium: { id: 'gems_300', name: '300 Алмазов', icon: '💎', amount: 300, type: 'GEMS' },
    },
    {
        level: 12,
        free: { id: 'potion_defense', name: 'Зелье Брони', icon: '🧪', type: 'ITEM' },
        premium: { id: 'chest_legendary', name: 'Легенд. Сундук', icon: 'sprite-gift', type: 'CHEST' },
    },
    {
        level: 13,
        free: { id: 'shard_rare', name: 'Редкий Осколок', icon: '✨', type: 'ITEM' },
        premium: { id: 'gold_5000', name: '5000 Золота', icon: '💰', amount: 5000, type: 'GOLD' },
    },
    {
        level: 14,
        free: { id: 'gems_150', name: '150 Алмазов', icon: '💎', amount: 150, type: 'GEMS' },
        premium: { id: 'potion_strength_great', name: 'Вел. Зелье Силы', icon: '🧪', type: 'ITEM' },
    },
    {
        level: 15,
        free: { id: 'chest_legendary', name: 'Легенд. Сундук', icon: 'sprite-gift', type: 'CHEST' },
        premium: { id: 'weapon_dragon_blade', name: 'Эпич. Клинок Дракона', icon: '⚔️', type: 'WEAPON' },
    },
];
