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
        name: 'Панда Сенсей',
        path: '/assets/images/avatars/panda.webp',
        description: 'Мастер Диких Земель, мудрый и спокойный.',
    },
    {
        id: 'lion',
        name: 'Царь Лео',
        path: '/assets/images/avatars/lion.webp',
        description: 'Грозный предводитель прайда.',
        requiredLevel: 5,
    },
    {
        id: 'tiger',
        name: 'Тигр Шерхан',
        path: '/assets/images/avatars/tiger.webp',
        description: 'Хладнокровный и молниеносный убийца.',
        requiredLevel: 12,
    },
    {
        id: 'panther',
        name: 'Пантера Багира',
        path: '/assets/images/avatars/panther.webp',
        description: 'Грациозная тень ночных джунглей.',
        requiredLevel: 18,
    },
    {
        id: 'bear',
        name: 'Медведь Балу',
        path: '/assets/images/avatars/bear.webp',
        description: 'Несокрушимая стена мощи.',
        requiredLevel: 25,
    },
    {
        id: 'cat',
        name: 'Сфинкс Маг',
        path: '/assets/images/avatars/cat.webp',
        description: 'Загадочный кот, видящий другие миры.',
        requiredLevel: 30,
    },
    {
        id: 'monkey',
        name: 'Король Обезьян',
        path: '/assets/images/avatars/monkey.webp',
        description: 'Ловкий трикстер и хулиган.',
        requiredVip: 1,
    },
    {
        id: 'moose',
        name: 'Лесной Вождь',
        path: '/assets/images/avatars/moose.webp',
        description: 'Гордый повелитель северной чащи.',
        requiredLevel: 15,
    },
    {
        id: 'boar',
        name: 'Вепрь Разрушитель',
        path: '/assets/images/avatars/boar.webp',
        description: 'Яростный таран, не знающий пощады.',
        requiredLevel: 8,
    },
    {
        id: 'rhino',
        name: 'Носорог Броня',
        path: '/assets/images/avatars/rhino.webp',
        description: 'Живой доспех, идущий напролом.',
        requiredLevel: 22,
    },
    {
        id: 'ram',
        name: 'Горный Баран',
        path: '/assets/images/avatars/ram.webp',
        description: 'Упрямый воин каменистых вершин.',
        requiredLevel: 10,
    },
    {
        id: 'crocodile',
        name: 'Аллигатор Гектор',
        path: '/assets/images/avatars/crocodile.webp',
        description: 'Хищник древних болот.',
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
/* eslint-disable @typescript-eslint/no-unused-vars */
export function getAvatarImageStyle(avatarPath: string): React.CSSProperties {
    const isBear =
        avatarPath && (avatarPath.includes('bear.webp') || avatarPath.includes('bear') || avatarPath === 'bear');
    return {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: isBear ? 'scale(1.3)' : 'scale(1.05)',
        transition: 'transform 0.2s',
    };
}

export function isAvatarUnlocked(avatar: AvatarOption, _playerLevel: number, _playerVip: number): boolean {
    // Только дефолтный аватар панды разблокирован по умолчанию
    if (avatar.id === 'panda') return true;
    return false;
}

export function isFrameUnlocked(
    frame: AvatarFrameOption,
    _playerLevel: number,
    _playerVip: number,
    _playerTitle: string,
): boolean {
    // Только стандартная рамка разблокирована по умолчанию
    if (frame.id === 'none') return true;
    return false;
}

export function isTitleUnlocked(
    title: TitleOption,
    _playerLevel: number,
    _playerVip: number,
    _playerTrophies: number,
): boolean {
    // Только титул Странника разблокирован по умолчанию
    if (title.id === 'wanderer') return true;
    return false;
}
/* eslint-enable @typescript-eslint/no-unused-vars */
