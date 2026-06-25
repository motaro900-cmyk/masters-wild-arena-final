import React from 'react';
import { resolveAssetPath } from '../utils/assetPath';

export interface AvatarOption {
    id: string;
    name: string;
    path: string;
    description: string;
    requiredLevel?: number;
    requiredVip?: number;
}

export interface AvatarFrameOption {
    id: string;
    name: string;
    path: string;
    description: string;
    glowClass?: string;
    requiredLevel?: number;
    requiredVip?: number;
    requiresTitle?: string;
}

export interface TitleOption {
    id: string;
    name: string;
    description: string;
    requiredLevel?: number;
    requiredVip?: number;
    requiredTrophies?: number;
}

export const AVATARS: AvatarOption[] = [
    {
        id: 'panda',
        name: 'Нефритовый Клинок',
        path: '/assets/images/avatars/panda.webp',
        description: 'Острее клинка, тверже нефрита — мудрость, ставшая оружием.',
    },
    {
        id: 'lion',
        name: 'Солнцеликий Владыка',
        path: '/assets/images/avatars/lion.webp',
        description: 'Его рёв будит рассвет, а взгляд гасит звёзды.',
        requiredLevel: 5,
    },
    {
        id: 'tiger',
        name: 'Коготь Рока',
        path: '/assets/images/avatars/tiger.webp',
        description: 'Каждый удар — приговор. Каждый след — конец пути.',
        requiredLevel: 12,
    },
    {
        id: 'panther',
        name: 'Охотница Полуночи',
        path: '/assets/images/avatars/panther.webp',
        description: 'Там, где гаснет свет, начинается её охота.',
        requiredLevel: 18,
    },
    {
        id: 'bear',
        name: 'Скала Королевства',
        path: '/assets/images/avatars/bear.webp',
        description: 'Не двигается. Не сдаётся. Стоит вечно.',
        requiredLevel: 25,
    },
    {
        id: 'cat',
        name: 'Кот-Оракул',
        path: '/assets/images/avatars/cat.webp',
        description: 'Видит прошлое, настоящее и то, что ещё не случилось.',
        requiredLevel: 30,
    },
    {
        id: 'monkey',
        name: 'Ловчий Ветра',
        path: '/assets/images/avatars/monkey.webp',
        description: 'Быстрее слуха, легче мысли — его не поймать.',
        requiredVip: 1,
    },
    {
        id: 'moose',
        name: 'Страж Леса',
        path: '/assets/images/avatars/moose.webp',
        description: 'Пока он жив, чаща непроходима для врагов.',
        requiredLevel: 15,
    },
    {
        id: 'boar',
        name: 'Разрушитель Преисподни',
        path: '/assets/images/avatars/boar.webp',
        description: 'Из самых тёмных глубин — чтобы стереть всё на своём пути.',
        requiredLevel: 8,
    },
    {
        id: 'rhino',
        name: 'Сокрушитель Цитаделей',
        path: '/assets/images/avatars/rhino.webp',
        description: 'Нет стен, которых он не пробил.',
        requiredLevel: 22,
    },
    {
        id: 'ram',
        name: 'Гордость Утёсов',
        path: '/assets/images/avatars/ram.webp',
        description: 'Рождён в буре, закалён в камне, непобедим на вершине.',
        requiredLevel: 10,
    },
    {
        id: 'crocodile',
        name: 'Повелитель Древних Вод',
        path: '/assets/images/avatars/crocodile.webp',
        description: 'Старше любой легенды, глубже любой бездны.',
        requiredLevel: 35,
    },
];

export const AVATAR_FRAMES: AvatarFrameOption[] = [
    {
        id: 'none',
        name: 'Стандартная',
        path: '/assets/images/ui/avatar_frame.png',
        description: 'Базовая рамка вашего аватара.',
    },
    {
        id: 'harvest_wheat_frame.webp',
        name: 'Золотая пшеница',
        path: '/assets/images/frames/harvest_wheat_frame.webp',
        description: 'Классическая золотая рама Диких Земель.',
        requiredLevel: 80,
    },
    {
        id: 'angel_wings_frame.webp',
        name: 'Крылья ангела',
        path: '/assets/images/frames/angel_wings_frame.webp',
        description: 'Чистая небесная рама с белыми перьями.',
        requiredLevel: 10,
    },
    {
        id: 'emerald_dragon_frame.webp',
        name: 'Изумрудный дракон',
        path: '/assets/images/frames/emerald_dragon_frame.webp',
        description: 'Выкована из чешуи древнего зеленого змея.',
        glowClass: 'emerald-avatar-glow',
        requiredLevel: 20,
    },
    {
        id: 'fire_lord_frame.webp',
        name: 'Повелитель огня',
        path: '/assets/images/frames/fire_lord_frame.webp',
        description: 'Пылающая рама, наполненная яростью лавы.',
        glowClass: 'crimson-avatar-glow',
        requiredLevel: 30,
    },
    {
        id: 'frost_ice_frame.webp',
        name: 'Морозный лед',
        path: '/assets/images/frames/frost_ice_frame.webp',
        description: 'Окутана ледяным дыханием севера.',
        glowClass: 'sapphire-avatar-glow',
        requiredLevel: 15,
    },
    {
        id: 'lava_runic_frame.webp',
        name: 'Лавовые руны',
        path: '/assets/images/frames/lava_runic_frame.webp',
        description: 'Испещрена раскаленными рунами земли.',
        requiredLevel: 25,
    },
    {
        id: 'martial_arts_frame.webp',
        name: 'Боевые искусства',
        path: '/assets/images/frames/martial_arts_frame.webp',
        description: 'Рама признанного мастера восточных единоборств.',
        requiredLevel: 35,
    },
    {
        id: 'necromancer_bone_frame.webp',
        name: 'Кости некроманта',
        path: '/assets/images/frames/necromancer_bone_frame.webp',
        description: 'Украшена черепами павших соперников арены.',
        requiredLevel: 40,
    },
    {
        id: 'oak_leaves_frame.webp',
        name: 'Дубовые листья',
        path: '/assets/images/frames/oak_leaves_frame.webp',
        description: 'Гармония природы и силы столетнего дуба.',
        requiredLevel: 5,
    },
    {
        id: 'peach_garden_frame.webp',
        name: 'Персиковый сад',
        path: '/assets/images/frames/peach_garden_frame.webp',
        description: 'Выдается за достижения на цветущих террасах.',
        requiredLevel: 8,
    },
    {
        id: 'storm_lightning_frame.webp',
        name: 'Штормовая молния',
        path: '/assets/images/frames/storm_lightning_frame.webp',
        description: 'Сверкающие молнии грозового перевала.',
        glowClass: 'vip-avatar-glow-premium',
        requiresTitle: 'Разработчик',
    },
];

export const TITLES: TitleOption[] = [
    { id: 'wanderer', name: 'Странник', description: 'Новичок в этих диких краях.', requiredLevel: 1 },
    { id: 'novice', name: 'Послушник', description: 'Постигающий основы выживания.', requiredLevel: 8 },
    { id: 'seeker', name: 'Искатель', description: 'Следопыт и охотник.', requiredLevel: 16 },
    { id: 'adept', name: 'Адепт', description: 'Уверенно владеющий оружием.', requiredLevel: 24 },
    { id: 'blade_master', name: 'Мастер Клинка', description: 'Признанный мастер ближнего боя.', requiredLevel: 32 },
    { id: 'mentor', name: 'Наставник', description: 'Обучающий других искусству боя.', requiredLevel: 40 },
    { id: 'sage', name: 'Мудрец', description: 'Познавший тайны дикой природы.', requiredLevel: 48 },
    { id: 'seer', name: 'Провидец', description: 'Видящий суть вещей.', requiredLevel: 56 },
    { id: 'elder', name: 'Старейшина', description: 'Почтенный и мудрый предводитель.', requiredLevel: 64 },
    { id: 'guardian', name: 'Хранитель Равновесия', description: 'Защитник порядка Диких Земель.', requiredLevel: 72 },
    {
        id: 'master_wild',
        name: 'Мастер Дикой Природы',
        description: 'Преодолевший весь Легендарный путь.',
        requiredLevel: 80,
    },
    { id: 'arena_king', name: 'Король Арены', description: 'Величайший боец среди равных.', requiredLevel: 50 },
    { id: 'vip', name: 'VIP Персона', description: 'Особо важный гость Диких Земель.', requiredVip: 1 },
    { id: 'developer', name: 'Разработчик', description: 'Создатель этой вселенной.', requiredVip: 5 },
];

export function getAvatarFramePath(frameId: string): string {
    if (!frameId || frameId === 'none') {
        return resolveAssetPath('/assets/images/ui/avatar_frame.png');
    }
    const frame = AVATAR_FRAMES.find((f) => f.id === frameId);
    if (frame) return resolveAssetPath(frame.path);
    // Fallback parsing
    if (frameId && (frameId.endsWith('.webp') || frameId.startsWith('/'))) {
        return resolveAssetPath(frameId.startsWith('/') ? frameId : `/assets/images/frames/${frameId}`);
    }
    return resolveAssetPath('/assets/images/ui/avatar_frame.png'); // Default basic frame
}

export function getAvatarFrameStyle(frameId: string): { glowClass: string } {
    const frame = AVATAR_FRAMES.find((f) => f.id === frameId);
    if (!frame) {
        return { glowClass: '' };
    }
    return {
        glowClass: frame.glowClass || '',
    };
}

export function getAvatarImageStyle(avatarPath: string): React.CSSProperties {
    const isBear =
        avatarPath && (avatarPath.includes('bear.webp') || avatarPath.includes('bear') || avatarPath === 'bear');
    return {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: isBear ? 'scale(1.1)' : 'scale(1.05)',
        transition: 'transform 0.2s',
    };
}

export function isAvatarUnlocked(
    avatar: AvatarOption,
    playerLevel: number,
    playerVip: number,
    claimedRewards: string[] = [],
): boolean {
    if (avatar.id === 'panda') return true;
    if (avatar.id === 'monkey' && claimedRewards.includes('avatar_monkey')) return true;
    if (avatar.requiredLevel && playerLevel >= avatar.requiredLevel) return true;
    if (avatar.requiredVip && playerVip >= avatar.requiredVip) return true;
    return false;
}

export function isFrameUnlocked(
    frame: AvatarFrameOption,
    playerLevel: number,
    playerVip: number,
    playerTitle: string,
    claimedRewards: string[] = [],
): boolean {
    if (frame.id === 'none') return true;
    if (frame.id === 'emerald_dragon_frame.webp' && claimedRewards.includes('frame_emerald_dragon')) return true;
    if (frame.requiredLevel && playerLevel >= frame.requiredLevel) return true;
    if (frame.requiredVip && playerVip >= frame.requiredVip) return true;
    if (frame.requiresTitle && playerTitle === frame.requiresTitle) return true;
    return false;
}

export function isTitleUnlocked(
    title: TitleOption,
    playerLevel: number,
    playerVip: number,
    playerTrophies: number,
    claimedRewards: string[] = [],
): boolean {
    if (title.id === 'wanderer') return true;
    if (title.id === 'arena_king' && claimedRewards.includes('avatar_monkey')) return true;
    if (title.requiredLevel && playerLevel >= title.requiredLevel) return true;
    if (title.requiredVip && playerVip >= title.requiredVip) return true;
    if (title.requiredTrophies && playerTrophies >= title.requiredTrophies) return true;
    return false;
}

export function resolveAvatarPath(avatarVal: string | undefined | null): string {
    let clean = avatarVal ? avatarVal.trim() : '';
    if (!clean || clean === '🐺' || clean === 'none' || clean.startsWith('sprite:')) {
        return resolveAssetPath('/assets/images/avatars/panda.webp');
    }
    if (clean.startsWith('http') || clean.startsWith('data:')) {
        return clean;
    }
    if (clean.startsWith('/')) {
        return resolveAssetPath(clean);
    }
    return resolveAssetPath(`/assets/images/avatars/${clean.replace(/\.(png|webp)$/, '')}.webp`);
}
