import { HEROES_DB } from '../configs/HeroesConfig';
import { useGameStore } from '../store/useGameStore';
import { SKINS_DB } from '../configs/SkinsConfig';

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
    style?: any;
}

/**
 * АВАТАРНАЯ СИСТЕМА ПРИВЯЗОК (Attachment System)
 *
 * Стандарты:
 * - Pivot Point: feet_center (ноги персонажа всегда на линии земли)
 * - Coordinate Space: Normalized (0.0 to 1.0)
 * - Inheritance: Предметы наследуют трансформы сокетов
 */

const HERO_TEXTURE_DIMENSIONS: Record<string, { width: number; height: number }> = {
    panda: { width: 1024, height: 1024 },
    cat: { width: 1024, height: 1024 },
    lion_knight: { width: 2048, height: 2048 },
    wolf_knight: { width: 512, height: 537 },
    raccoon: { width: 800, height: 700 },
};

export const useAvatarRenderer = (heroId: string, size: number = 512) => {
    const heroConfig = HEROES_DB.find((h) => h.id === heroId) || HEROES_DB[0];

    console.log(
        `[AvatarRenderer] Rendering Hero: ${heroId}, Found Config: ${heroConfig.id}, Image: ${heroConfig.image}`,
    );

    // const currentEquipment = heroEquipment[heroId] || {};

    const BASE_SIZE = 512;
    // Уменьшаем масштаб до 0.7 (Cinematic Framing)
    const cameraScale = 0.7;
    const scaleFactor = (size / BASE_SIZE) * (heroConfig.baseScale || 1.0) * cameraScale;

    // Линия пола (Ground Line) - фиксированная
    const groundY = size * 0.85;
    const centerX = size * 0.5;

    // Нормализация размеров текстуры
    const texDimensions = HERO_TEXTURE_DIMENSIONS[heroId] || { width: 512, height: 512 };
    const maxDim = Math.max(texDimensions.width, texDimensions.height, 512);
    const normWidth = 512 * (texDimensions.width / maxDim);
    const normHeight = 512 * (texDimensions.height / maxDim);

    // Расчет корневой точки (Root/Pivot) с учетом пропорций
    const rootX = centerX - heroConfig.anchors.feet.x * normWidth * scaleFactor;
    const rootY = groundY - heroConfig.anchors.feet.y * normHeight * scaleFactor;

    const layers: IAvatarLayer[] = [];

    // 1. ТЕЛО
    const bodyStyle: any = {};
    const equippedSkins = useGameStore((s: any) => s.equippedSkins) || {};
    const activeSkinId = equippedSkins[heroId] || 'default';
    const activeSkin = SKINS_DB.find((s) => s.id === activeSkinId && s.heroId === heroId);
    const bodySrc = activeSkin ? activeSkin.image : heroConfig.image;

    layers.push({
        id: 'body',
        type: 'body',
        src: bodySrc,
        x: rootX,
        y: rootY,
        rotation: 0,
        scale: scaleFactor,
        zIndex: 10,
        style: bodyStyle,
    });

    // 2. СОКЕТЫ
    /*
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
    */

    // 2. СОКЕТЫ (Отключено по запросу: вещи на персонаже не отображаются)
    /*
    Object.entries(socketMap).forEach(([slot, socketKey]) => {
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
            let folder = 'weapons';
            if (slot === 'HELMETS') folder = 'helms';
            else if (slot === 'ARMOR') folder = 'armor';
            else if (slot === 'SHIELDS') folder = 'shields';

            const fileName = item.textureKey
                .replace('weapon_', '')
                .replace('helm_', '')
                .replace('armor_', '')
                .replace('shield_', '') + '.webp';
            itemImage = `/assets/images/items/${folder}/${fileName}`;
        }

        // Лог для отладки (виден в консоли браузера)
        console.log(`[DEBUG_HERO_VIEW] Hero:${heroId}, Item:${item.name}, File:${itemImage}`);

        const itemSocket = item.visualSocket;
        const normalizedItemSocket = socketAliases[itemSocket] || itemSocket;
        if (!isWeapon && slot !== 'SHIELDS' && itemSocket && normalizedItemSocket !== socketKey) return;

        const socket = (heroConfig.anchors as any)[socketKey];
        if (!socket) return;

        let sizeMultiplier = 0.8;
        if (slot === 'WEAPONS' || slot === 'SHIELDS') {
            sizeMultiplier = 0.5; // 256 / 512
        } else if (slot === 'HELMETS') {
            sizeMultiplier = 0.45; // Уменьшаем для посадки на голову
        } else if (slot === 'ARMOR') {
            sizeMultiplier = 0.7; // По размеру туловища
        }

        const itemScale = (socket.scale || 1.0) * sizeMultiplier * scaleFactor;

        // Позиционирование с учетом реальных пропорций тела
        const itemX = rootX + socket.x * normWidth * scaleFactor;
        const itemY = rootY + socket.y * normHeight * scaleFactor;

        const itemStyle: any = {};
        if (itemId === 'weapon_moon_sword') {
            itemStyle.filter = 'drop-shadow(0 0 12px rgba(180, 220, 255, 0.95)) brightness(1.2) contrast(1.1)';
        }

        let zIndex = 20;
        if (slot === 'HELMETS') zIndex = 30;
        else if (slot === 'ARMOR') zIndex = 15;
        else if (slot === 'SHIELDS') zIndex = 18;
        else if (slot === 'WEAPONS') zIndex = 25;

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
            zIndex: zIndex,
            rarity: item.rarity,
            style: itemStyle,
        });
    });
    */

    return {
        layers,
        heroConfig,
        dimensions: { size, groundY, centerX, rootX, rootY, scaleFactor, normWidth, normHeight },
    };
};
