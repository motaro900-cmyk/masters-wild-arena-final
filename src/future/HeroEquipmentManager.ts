import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { resolveAssetPath } from '../../utils/assetPath';
import { SpriteValidator } from '../../utils/SpriteValidator';
import { SLOT_CONFIG, getWeaponVisualConfig } from './HeroUnitConfigs';
import type { HeroUnit } from './HeroUnit';

/**
 * Экипировка оружия с использованием контейнера-сокета
 */
export async function equipWeapon(unit: HeroUnit, itemId: string | null) {
    unit.currentWeaponId = itemId;
    const isPanda = unit.config?.id === 'panda' || unit.config?.image.includes('panda');
    const isRaccoon = unit.config?.id === 'raccoon' || unit.config?.image.includes('raccoon');
    if (isPanda || isRaccoon) return;

    // Очистка старых спрайтов и контейнеров
    const anyUnit = unit as any;
    if (anyUnit.weaponSprite) {
        gsap.killTweensOf(anyUnit.weaponSprite);
        anyUnit.weaponSprite.destroy({ children: true, texture: false });
        anyUnit.weaponSprite = null;
    }
    if (unit.weaponSocketContainer) {
        gsap.killTweensOf(unit.weaponSocketContainer);
        if (unit.weaponSocketContainer.parent) {
            unit.weaponSocketContainer.parent.removeChild(unit.weaponSocketContainer);
        }
        unit.weaponSocketContainer.destroy({ children: true, texture: false });
        unit.weaponSocketContainer = null;
    }

    if (!itemId || !unit.config) return;

    const itemData = ITEMS_DATABASE[itemId];
    if (!itemData) return;

    const socket = unit.config.anchors.rightHand;
    const feet = unit.config.anchors.feet;

    let tex: PIXI.Texture;
    try {
        tex = await PIXI.Assets.load(resolveAssetPath(itemData.image));
        console.log(`[HeroUnit] Weapon loaded: ${itemId} (${tex.width}x${tex.height})`);
        SpriteValidator.validate(tex, 'WEAPONS');
    } catch (err) {
        console.warn(`[HeroUnit] Failed to load weapon image ${itemData.image}, using fallback texture:`, err);
        tex = PIXI.Texture.WHITE;
    }

    // Создаем контейнер-сокет
    unit.weaponSocketContainer = new PIXI.Container();
    unit.weaponSocketContainer.zIndex = SLOT_CONFIG.WEAPON.zIndex;
    unit.bodyContainer.addChild(unit.weaponSocketContainer);

    // Позиционируем контейнер-сокет по координатам руки
    const texWidth = unit.bodySprite.texture.width || 1;
    const texHeight = unit.bodySprite.texture.height || 1;
    unit.weaponSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
    unit.weaponSocketContainer.angle = socket.angle ?? 0;

    // Создаем и настраиваем спрайт оружия
    const s = new PIXI.Sprite(tex);
    const wVisual = getWeaponVisualConfig(itemId);
    s.anchor.set(wVisual.anchorX, wVisual.anchorY);

    const weaponTexWidth = tex.width || 256;
    const weaponTexHeight = tex.height || 256;
    const weaponScale = SLOT_CONFIG.WEAPON.baseSize / Math.max(weaponTexWidth, weaponTexHeight, 256);
    const socketScale = socket.scale ?? 1.0;
    const visualScale = wVisual.scaleMultiplier ?? 1.0;
    const parentScaleX = unit.bodyContainer.scale.x || 1;

    s.scale.set((weaponScale * socketScale * visualScale) / Math.abs(parentScaleX));
    s.angle = wVisual.angleOffset ?? 0;
    s.position.set(0, 0);

    unit.weaponSocketContainer.addChild(s);
    anyUnit.weaponSprite = s;

    console.log(`[HeroUnit] Weapon ${itemId} attached to body via socket container.`);
}

export async function equipHelmet(unit: HeroUnit, itemId: string | null) {
    const isPanda = unit.config?.id === 'panda' || unit.config?.image.includes('panda');
    const isRaccoon = unit.config?.id === 'raccoon' || unit.config?.image.includes('raccoon');
    if (isPanda || isRaccoon) return;

    const anyUnit = unit as any;
    if (anyUnit.helmetSprite) {
        gsap.killTweensOf(anyUnit.helmetSprite);
        anyUnit.helmetSprite.destroy({ children: true, texture: false });
        anyUnit.helmetSprite = null;
    }
    if (unit.helmetSocketContainer) {
        gsap.killTweensOf(unit.helmetSocketContainer);
        if (unit.helmetSocketContainer.parent) {
            unit.helmetSocketContainer.parent.removeChild(unit.helmetSocketContainer);
        }
        unit.helmetSocketContainer.destroy({ children: true, texture: false });
        unit.helmetSocketContainer = null;
    }

    if (!itemId || !unit.config) return;

    const itemData = ITEMS_DATABASE[itemId];
    if (!itemData) return;

    const socket = unit.config.anchors.head;
    const feet = unit.config.anchors.feet;

    let tex: PIXI.Texture;
    try {
        tex = await PIXI.Assets.load(resolveAssetPath(itemData.image));
    } catch (err) {
        console.warn(`[HeroUnit] Failed to load helmet image ${itemData.image}, using fallback texture:`, err);
        tex = PIXI.Texture.WHITE;
    }

    unit.helmetSocketContainer = new PIXI.Container();
    unit.helmetSocketContainer.zIndex = SLOT_CONFIG.HELMET.zIndex;
    unit.bodyContainer.addChild(unit.helmetSocketContainer);

    const texWidth = unit.bodySprite.texture.width || 1;
    const texHeight = unit.bodySprite.texture.height || 1;
    unit.helmetSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
    unit.helmetSocketContainer.angle = socket.angle ?? 0;

    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 0.5);

    const itemTexWidth = tex.width || 256;
    const itemTexHeight = tex.height || 256;
    const helmetScale = SLOT_CONFIG.HELMET.baseSize / Math.max(itemTexWidth, itemTexHeight, 256);
    const socketScale = socket.scale ?? 1.0;
    const parentScaleX = unit.bodyContainer.scale.x || 1;

    s.scale.set((helmetScale * socketScale) / Math.abs(parentScaleX));
    s.position.set(0, 0);

    unit.helmetSocketContainer.addChild(s);
    anyUnit.helmetSprite = s;
}

export async function equipArmor(unit: HeroUnit, itemId: string | null) {
    const isPanda = unit.config?.id === 'panda' || unit.config?.image.includes('panda');
    const isRaccoon = unit.config?.id === 'raccoon' || unit.config?.image.includes('raccoon');
    if (isPanda || isRaccoon) return;

    const anyUnit = unit as any;
    if (anyUnit.armorSprite) {
        gsap.killTweensOf(anyUnit.armorSprite);
        anyUnit.armorSprite.destroy({ children: true, texture: false });
        anyUnit.armorSprite = null;
    }
    if (unit.armorSocketContainer) {
        gsap.killTweensOf(unit.armorSocketContainer);
        if (unit.armorSocketContainer.parent) {
            unit.armorSocketContainer.parent.removeChild(unit.armorSocketContainer);
        }
        unit.armorSocketContainer.destroy({ children: true, texture: false });
        unit.armorSocketContainer = null;
    }

    if (!itemId || !unit.config) return;

    const itemData = ITEMS_DATABASE[itemId];
    if (!itemData) return;

    const socket = unit.config.anchors.center;
    const feet = unit.config.anchors.feet;

    let tex: PIXI.Texture;
    try {
        tex = await PIXI.Assets.load(resolveAssetPath(itemData.image));
    } catch (err) {
        console.warn(`[HeroUnit] Failed to load armor image ${itemData.image}, using fallback texture:`, err);
        tex = PIXI.Texture.WHITE;
    }

    unit.armorSocketContainer = new PIXI.Container();
    unit.armorSocketContainer.zIndex = SLOT_CONFIG.ARMOR.zIndex;
    unit.bodyContainer.addChild(unit.armorSocketContainer);

    const texWidth = unit.bodySprite.texture.width || 1;
    const texHeight = unit.bodySprite.texture.height || 1;
    unit.armorSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
    unit.armorSocketContainer.angle = socket.angle ?? 0;

    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 0.5);

    const itemTexWidth = tex.width || 256;
    const itemTexHeight = tex.height || 256;
    const armorScale = SLOT_CONFIG.ARMOR.baseSize / Math.max(itemTexWidth, itemTexHeight, 256);
    const socketScale = socket.scale ?? 1.0;
    const parentScaleX = unit.bodyContainer.scale.x || 1;

    s.scale.set((armorScale * socketScale) / Math.abs(parentScaleX));
    s.position.set(0, 0);

    unit.armorSocketContainer.addChild(s);
    anyUnit.armorSprite = s;
}

export async function equipShield(unit: HeroUnit, itemId: string | null) {
    const isPanda = unit.config?.id === 'panda' || unit.config?.image.includes('panda');
    const isRaccoon = unit.config?.id === 'raccoon' || unit.config?.image.includes('raccoon');
    if (isPanda || isRaccoon) return;

    const anyUnit = unit as any;
    if (anyUnit.shieldSprite) {
        gsap.killTweensOf(anyUnit.shieldSprite);
        anyUnit.shieldSprite.destroy({ children: true, texture: false });
        anyUnit.shieldSprite = null;
    }
    if (unit.shieldSocketContainer) {
        gsap.killTweensOf(unit.shieldSocketContainer);
        if (unit.shieldSocketContainer.parent) {
            unit.shieldSocketContainer.parent.removeChild(unit.shieldSocketContainer);
        }
        unit.shieldSocketContainer.destroy({ children: true, texture: false });
        unit.shieldSocketContainer = null;
    }

    if (!itemId || !unit.config) return;

    const itemData = ITEMS_DATABASE[itemId];
    if (!itemData) return;

    const socket = unit.config.anchors.leftHand || unit.config.anchors.center;
    const feet = unit.config.anchors.feet;

    let tex: PIXI.Texture;
    try {
        tex = await PIXI.Assets.load(resolveAssetPath(itemData.image));
    } catch (err) {
        console.warn(`[HeroUnit] Failed to load shield image ${itemData.image}, using fallback texture:`, err);
        tex = PIXI.Texture.WHITE;
    }

    unit.shieldSocketContainer = new PIXI.Container();
    unit.shieldSocketContainer.zIndex = SLOT_CONFIG.SHIELD.zIndex;
    unit.bodyContainer.addChild(unit.shieldSocketContainer);

    const texWidth = unit.bodySprite.texture.width || 1;
    const texHeight = unit.bodySprite.texture.height || 1;
    unit.shieldSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
    unit.shieldSocketContainer.angle = socket.angle ?? 0;

    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 0.5);

    const itemTexWidth = tex.width || 256;
    const itemTexHeight = tex.height || 256;
    const shieldScale = SLOT_CONFIG.SHIELD.baseSize / Math.max(itemTexWidth, itemTexHeight, 256);
    const socketScale = socket.scale ?? 1.0;
    const parentScaleX = unit.bodyContainer.scale.x || 1;

    s.scale.set((shieldScale * socketScale) / Math.abs(parentScaleX));
    s.position.set(0, 0);

    unit.shieldSocketContainer.addChild(s);
    anyUnit.shieldSprite = s;
}

/**
 * Массовое обновление (для совместимости с BattleEngine)
 */
export async function updateEquipment(unit: HeroUnit, equipment: Record<string, string | null>) {
    await Promise.all([
        unit.equipWeapon(equipment['WEAPONS'] || null),
        unit.equipHelmet(equipment['HELMETS'] || null),
        unit.equipArmor(equipment['ARMOR'] || null),
        unit.equipShield(equipment['SHIELDS'] || null),
    ]);
}
