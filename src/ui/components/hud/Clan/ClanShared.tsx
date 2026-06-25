/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { motion } from 'framer-motion';
import { resolveAssetPath } from '../../../../utils/assetPath';

export interface ClanMember {
    name: string;
    role: 'LEADER' | 'OFFICER' | 'MEMBER';
    trophies: number;
    lastSeen: string;
    isOnline: boolean;
    avatar: string;
    frame?: string;
    contribution: number; // Вклад за неделю
    level?: number;
}

export interface ClanData {
    id: string;
    name: string;
    motto: string;
    level: number;
    membersCount: number;
    maxMembers: number;
    totalTrophies: number;
    emblem: string;
    minTrophies: number;
    type: 'OPEN' | 'INVITE' | 'CLOSED';
    onlineCount: number;
    xp: number;
    maxXp: number;
    tag?: string;
    bonus?: string;
    goldBank?: number;
    crystalsBank?: number;
    bankLevel?: number;
    officersCanWithdraw?: boolean;
    bankTransactions?: any[];
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

import { MOCK_CLANS } from './ClanMockData';
export { MOCK_CLANS };

export const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'c_chest_1',
        name: 'КЛАНОВЫЙ СУНДУК',
        description: 'Случайные ресурсы и осколки героев.',
        price: 500,
        icon: '📦',
        rarity: 'RARE',
    },
    {
        id: 'c_shards_1',
        name: 'ОСКОЛКИ ГЕРОЯ (x5)',
        description: '5 случайных осколков эпического героя.',
        price: 200,
        icon: '/assets/images/ui/icons/almaz.webp',
        rarity: 'EPIC',
    },
    {
        id: 'c_gold_1',
        name: 'СУМКА ЗОЛОТА',
        description: 'Мгновенно дает 5,000 золота.',
        price: 300,
        icon: '/assets/images/ui/icons/Gold.webp',
        rarity: 'COMMON',
    },
];

export const EMBLEMS = ['lion', 'bear', 'eagle', 'wolf', 'fox', 'tiger', 'dragon', 'owl'];

export const CurrencyIcon: React.FC<{ type: 'GOLD' | 'ALMAZ'; size?: number }> = ({ type, size = 20 }) => (
    <img
        src={resolveAssetPath(
            type === 'ALMAZ' ? '/assets/images/ui/icons/almaz.webp' : '/assets/images/ui/icons/Gold.webp',
        )}
        style={{
            width: size,
            height: size,
            objectFit: 'contain',
            verticalAlign: 'middle',
            display: 'inline-block',
            marginLeft: '4px',
        }}
        alt={type}
    />
);

export const TabButton: React.FC<{ active: boolean; label: string; onClick: () => void; colors: any }> = ({
    active,
    label,
    onClick,
    colors,
}) => (
    <button
        onClick={onClick}
        style={{
            padding: '8px 16px',
            background: active ? colors.accent : 'transparent',
            border: `1px solid ${active ? colors.accent : colors.border}`,
            color: active ? '#000' : colors.text,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        }}
    >
        {label}
    </button>
);

export const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: 900 }}>{value}</div>
    </div>
);

export const StatBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 800 }}>{label}</div>
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900 }}>{value}</div>
    </div>
);

export const PerkItem: React.FC<{ icon: string; label: string; locked?: boolean }> = ({ icon, label, locked }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            opacity: locked ? 0.4 : 1,
        }}
    >
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{label}</span>
        {locked && <span style={{ fontSize: '12px' }}>🔒</span>}
    </div>
);

export const ActionButton: React.FC<{ label: string; color: string; onClick: () => void }> = ({
    label,
    color,
    onClick,
}) => (
    <motion.button
        whileHover={{ scale: 1.02, backgroundColor: color, color: '#fff' }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        style={{
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${color}`,
            borderRadius: '12px',
            color: color,
            fontWeight: 900,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        }}
    >
        {label}
    </motion.button>
);
