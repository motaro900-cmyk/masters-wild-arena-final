import { useGameStore } from '../store/useGameStore';
import { ITEMS_DATABASE } from '../game/configs/ItemsConfig';
import { HEROES_DB } from '../configs/HeroesConfig';

export interface IAvatarLayer {
    id: string;
    type: 'body' | 'item' | 'aura';
    src: string;
    x: number;
    y: number;
    offsetY?: number; // Дистанция от стоп в %
    rotation: number;
    scale: number;
    zIndex: number;
    rarity?: string;
    spriteClass?: string;
}

/**
 * АВАТАРНАЯ СИСТЕМА ПРИВЯЗОК (Attachment System)
 *
 * Стандарты:
 * - Pivot Point: feet_center (ноги персонажа всегда на линии земли)
 * - Coordinate Space: Normalized (0.0 to 1.0)
 * - Inheritance: Предметы наследуют трансформы сокетов
 */

export const useAvatarRenderer = (heroId: string, size: number = 512) => {
    const { heroEquipment } = useGameStore();
    const heroConfig = HEROES_DB.find((h) => h.id === heroId) || HEROES_DB[0];

    console.log(
        `[AvatarRenderer] Rendering Hero: ${heroId}, Found Config: ${heroConfig.id}, Image: ${heroConfig.image}`,
    );

    const currentEquipment = heroEquipment[heroId] || {};

    const BASE_SIZE = 512;
    // Уменьшаем масштаб до 0.7 (Cinematic Framing)
    const cameraScale = 0.7;
    const scaleFactor = (size / BASE_SIZE) * (heroConfig.baseScale || 1.0) * cameraScale;

    // Линия пола (Ground Line) - фиксированная
    const groundY = size * 0.85;
    const centerX = size * 0.5;

    // Расчет корневой точки (Root/Pivot)
    const rootX = centerX - heroConfig.anchors.feet.x * BASE_SIZE * scaleFactor;
    const rootY = groundY - heroConfig.anchors.feet.y * BASE_SIZE * scaleFactor;

    const layers: IAvatarLayer[] = [];

    // 1. ТЕЛО
    layers.push({
        id: 'body',
        type: 'body',
        src: heroConfig.image,
        x: rootX,
        y: rootY,
        rotation: 0,
        scale: scaleFactor,
        zIndex: 10,
    });

    // 2. СОКЕТЫ
    const socketMap: Record<string, string> = {
        WEAPONS: 'rightHand',
        SHIELDS: 'leftHand',
        HELMETS: 'head',
        ARMOR: 'center',
    };

    const socketAliases: Record<string, string> = {
        MainHand: 'rightHand',
        OffHand: 'leftHand',
        Head: 'head',
        Chest: 'center',
    };

    Object.entries(socketMap).forEach(([slot, socketKey]) => {
        // ОГРАНИЧЕНИЕ: Отображаем только оружие
        if (slot !== 'WEAPONS') return;

        const itemId = currentEquipment[slot];
        if (!itemId) return;

        const item = ITEMS_DATABASE[itemId] as any;
        if (!item) return;

        const isWeapon = slot === 'WEAPONS';

        // [SMART ASSET RESOLUTION]
        // 1. Пытаемся взять прямую картинку
        // 2. Если её нет, пытаемся собрать путь из textureKey
        let itemImage = item.image;
        if ((!itemImage || itemImage === '') && item.textureKey) {
            const fileName =
                item.textureKey.replace('weapon_', '').replace('helm_', '').replace('armor_', '') + '.webp';
            const folder = isWeapon ? 'weapons' : slot === 'HELMETS' ? 'helms' : 'armor';
            itemImage = `/assets/images/items/${folder}/${fileName}`;
        }

        // Лог для отладки (виден в консоли браузера)
        console.log(`[DEBUG_HERO_VIEW] Hero:${heroId}, Item:${item.name}, File:${itemImage}`);

        const itemSocket = item.visualSocket;
        const normalizedItemSocket = socketAliases[itemSocket] || itemSocket;
        if (!isWeapon && slot !== 'SHIELDS' && itemSocket && normalizedItemSocket !== socketKey) return;

        const socket = (heroConfig.anchors as any)[socketKey];
        if (!socket) return;

        const WEAPON_BASE = 256;
        const HERO_BASE = 512;

        const itemScale = (socket.scale || 1.0) * (isWeapon ? WEAPON_BASE / HERO_BASE : 0.8) * scaleFactor;

        const itemX = rootX + socket.x * BASE_SIZE * scaleFactor;
        const itemY = rootY + socket.y * BASE_SIZE * scaleFactor;

        layers.push({
            id: `item-${slot}`,
            type: 'item',
            src: itemImage,
            spriteClass: item.spriteClass, // Передаем класс спрайта
            x: itemX,
            y: itemY,
            offsetY: heroConfig.anchors.feet.y - socket.y,
            rotation: socket.angle || 0,
            scale: itemScale,
            zIndex: socketKey === 'head' ? 30 : 20,
            rarity: item.rarity,
        });
    });

    return {
        layers,
        heroConfig,
        dimensions: { size, groundY, centerX, rootX, rootY, scaleFactor },
    };
};
