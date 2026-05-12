/**
 * GameIcons — Центральный реестр иконок для Masters of the Wild.
 * 
 * Два источника:
 *  1. lucide-react   — чистые UI-иконки (закрыть, настройки, навигация)
 *  2. @iconify/react — RPG/фэнтези иконки из набора game-icons
 * 
 * Использование:
 *   import { CloseIcon, SwordIcon, SettingsIcon } from '../components/GameIcons';
 *   <CloseIcon size={24} color="#f0c040" />
 */

import React from 'react';
import { Icon } from '@iconify/react';
import {
    X, Settings, ChevronLeft, ChevronRight, Volume2, VolumeX,
    Star, Trophy, ShoppingBag, Users, Menu, ArrowLeft,
    Zap, Heart, Shield, Swords, FlaskConical, Coins
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// БАЗОВЫЕ ПРОПСЫ
// ─────────────────────────────────────────────────────────────────────────────

interface IconProps {
    size?: number;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
    onClick?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI ИКОНКИ (Lucide — для кнопок и элементов интерфейса)
// ─────────────────────────────────────────────────────────────────────────────

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff', style, onClick }) => (
    <X size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#c8a870', style, onClick }) => (
    <Settings size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#f0c040', style, onClick }) => (
    <ArrowLeft size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#f0c040', style, onClick }) => (
    <ChevronLeft size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#f0c040', style, onClick }) => (
    <ChevronRight size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const VolumeOnIcon: React.FC<IconProps> = ({ size = 24, color = '#c8a870', style, onClick }) => (
    <Volume2 size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const VolumeOffIcon: React.FC<IconProps> = ({ size = 24, color = '#666', style, onClick }) => (
    <VolumeX size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const StarIcon: React.FC<IconProps> = ({ size = 24, color = '#f0c040', style, onClick }) => (
    <Star size={size} color={color} fill={color} style={style} onClick={onClick} />
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 24, color = '#f0c040', style, onClick }) => (
    <Trophy size={size} color={color} style={style} onClick={onClick} />
);

export const ShopIcon: React.FC<IconProps> = ({ size = 24, color = '#c8a870', style, onClick }) => (
    <ShoppingBag size={size} color={color} style={style} onClick={onClick} />
);

export const UsersIcon: React.FC<IconProps> = ({ size = 24, color = '#c8a870', style, onClick }) => (
    <Users size={size} color={color} style={style} onClick={onClick} />
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#c8a870', style, onClick }) => (
    <Menu size={size} color={color} style={{ cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick} />
);

export const EnergyIcon: React.FC<IconProps> = ({ size = 24, color = '#fbbf24', style, onClick }) => (
    <Zap size={size} color={color} fill={color} style={style} onClick={onClick} />
);

export const HeartIcon: React.FC<IconProps> = ({ size = 24, color = '#ef4444', style, onClick }) => (
    <Heart size={size} color={color} fill={color} style={style} onClick={onClick} />
);

export const ShieldLucideIcon: React.FC<IconProps> = ({ size = 24, color = '#3b82f6', style, onClick }) => (
    <Shield size={size} color={color} style={style} onClick={onClick} />
);

export const SwordsIcon: React.FC<IconProps> = ({ size = 24, color = '#f97316', style, onClick }) => (
    <Swords size={size} color={color} style={style} onClick={onClick} />
);

export const PotionIcon: React.FC<IconProps> = ({ size = 24, color = '#a855f7', style, onClick }) => (
    <FlaskConical size={size} color={color} style={style} onClick={onClick} />
);

export const CoinIcon: React.FC<IconProps> = ({ size = 24, color = '#f0c040', style, onClick }) => (
    <Coins size={size} color={color} style={style} onClick={onClick} />
);

// ─────────────────────────────────────────────────────────────────────────────
// RPG ИКОНКИ (Game Icons — тематические для фэнтези-игры)
// ─────────────────────────────────────────────────────────────────────────────

interface RPGIconProps extends IconProps {
    /** Иконка из набора game-icons. Полный список: https://icones.js.org/collection/game-icons */
    icon: string;
}

/** Базовый компонент для любой game-icons иконки */
export const RPGIcon: React.FC<RPGIconProps> = ({ icon, size = 32, color = '#f0c040', style, onClick }) => (
    <Icon
        icon={`game-icons:${icon}`}
        width={size}
        height={size}
        color={color}
        style={{ cursor: onClick ? 'pointer' : 'default', flexShrink: 0, ...style }}
        onClick={onClick}
    />
);

// Предопределённые RPG иконки

/** ⚔️ Скрещённые мечи (бой) */
export const BattleIcon: React.FC<IconProps> = (props) => <RPGIcon icon="crossed-swords" {...props} />;

/** 🏆 Корона (рейтинг/VIP) */
export const CrownIcon: React.FC<IconProps> = (props) => <RPGIcon icon="crown" {...props} />;

/** 💀 Череп */
export const SkullIcon: React.FC<IconProps> = (props) => <RPGIcon icon="skull" {...props} color={props.color ?? '#9ca3af'} />;

/** 🧪 Зелье */
export const RPGPotionIcon: React.FC<IconProps> = (props) => <RPGIcon icon="potion-ball" {...props} color={props.color ?? '#a855f7'} />;

/** 🛡️ Щит */
export const RPGShieldIcon: React.FC<IconProps> = (props) => <RPGIcon icon="shield" {...props} color={props.color ?? '#3b82f6'} />;

/** 🗡️ Кинжал */
export const DaggerIcon: React.FC<IconProps> = (props) => <RPGIcon icon="stiletto" {...props} color={props.color ?? '#f97316'} />;

/** 🪖 Шлем */
export const HelmetIcon: React.FC<IconProps> = (props) => <RPGIcon icon="visored-helm" {...props} />;

/** 📜 Свиток квестов */
export const ScrollIcon: React.FC<IconProps> = (props) => <RPGIcon icon="scroll-unfurled" {...props} color={props.color ?? '#c8a870'} />;

/** ⭐ Рунический символ */
export const RuneIcon: React.FC<IconProps> = (props) => <RPGIcon icon="rune-stone" {...props} color={props.color ?? '#8b5cf6'} />;

/** 🔥 Огонь / Сила */
export const FlameIcon: React.FC<IconProps> = (props) => <RPGIcon icon="flame" {...props} color={props.color ?? '#ef4444'} />;

/** ❤️ Сердце / HP */
export const RPGHeartIcon: React.FC<IconProps> = (props) => <RPGIcon icon="heart-plus" {...props} color={props.color ?? '#ef4444'} />;

/** ⚡ Молния / Атака */
export const LightningIcon: React.FC<IconProps> = (props) => <RPGIcon icon="lightning-sword" {...props} color={props.color ?? '#fbbf24'} />;

/** 🏰 Замок / Клан */
export const CastleIcon: React.FC<IconProps> = (props) => <RPGIcon icon="castle" {...props} />;

/** 🎭 Маска / Облики */
export const MaskIcon: React.FC<IconProps> = (props) => <RPGIcon icon="domino-mask" {...props} color={props.color ?? '#c8a870'} />;

/** 💰 Золотые монеты */
export const GoldBagIcon: React.FC<IconProps> = (props) => <RPGIcon icon="coins" {...props} color={props.color ?? '#f0c040'} />;

/** 💎 Кристалл / Алмаз */
export const GemIcon: React.FC<IconProps> = (props) => <RPGIcon icon="gem-pendant" {...props} color={props.color ?? '#00ffff'} />;

/** 🗺️ Карта мира / Рейтинг */
export const RankIcon: React.FC<IconProps> = (props) => <RPGIcon icon="podium" {...props} color={props.color ?? '#f0c040'} />;

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM SPRITE ICONS (Custom Art)
// ─────────────────────────────────────────────────────────────────────────────

/** 🎁 Подарок (Премиум) */
export const PremiumGiftIcon: React.FC<IconProps> = ({ size = 48, style, className, onClick }) => (
    <div 
        className={`sprite-gift ${className || ''}`} 
        style={{ width: size, height: size, backgroundSize: '300% 100%', cursor: onClick ? 'pointer' : 'default', ...style }} 
        onClick={onClick}
    />
);

/** 🏆 Кубок (Премиум) */
export const PremiumTrophyIcon: React.FC<IconProps> = ({ size = 48, style, className, onClick }) => (
    <div 
        className={`sprite-trophy ${className || ''}`} 
        style={{ width: size, height: size, backgroundSize: '300% 100%', cursor: onClick ? 'pointer' : 'default', ...style }} 
        onClick={onClick}
    />
);

/** 🦁 Герб Клана (Премиум) */
export const ClanEmblemIcon: React.FC<IconProps & { emblem: string }> = ({ emblem, size = 64, style, className, onClick }) => (
    <div 
        className={`sprite-clan clan-${emblem} ${className || ''}`} 
        style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default', ...style }} 
        onClick={onClick}
    />
);
