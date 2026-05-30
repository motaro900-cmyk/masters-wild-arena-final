import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { IHeroConfig, IHeroAnchors } from '../../configs/HeroesConfig';
import { SpriteValidator } from '../../utils/SpriteValidator';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { useGameStore } from '../../store/useGameStore';

import { EffectsManager } from '../systems/EffectsManager';

interface WeaponVisualConfig {
    anchorX: number;
    anchorY: number;
    angleOffset?: number;
    scaleMultiplier?: number;
}

const WEAPON_VISUAL_CONFIGS: Record<string, WeaponVisualConfig> = {
    // Staffs (held in upper middle part, slightly angled)
    stick_oak: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_shadow: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_celestial: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_gold: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_galaxy: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_skull_green: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },
    staff_sun_burst: { anchorX: 0.5, anchorY: 0.7, angleOffset: -10, scaleMultiplier: 1.0 },

    // Bows (held exactly in the middle)
    bow_griffin: { anchorX: 0.5, anchorY: 0.5, angleOffset: 0, scaleMultiplier: 1.15 },

    // Claws (centered)
    claws_ice_fire: { anchorX: 0.5, anchorY: 0.5, angleOffset: 0, scaleMultiplier: 1.0 },

    // Slings (centered)
    sling_leather: { anchorX: 0.5, anchorY: 0.5, angleOffset: 0, scaleMultiplier: 0.95 },

    // Frying Pan
    pan_master: { anchorX: 0.5, anchorY: 0.9, angleOffset: 15, scaleMultiplier: 1.0 },

    // Default Swords, Axes, Daggers (held at hilt/handle)
    default: { anchorX: 0.5, anchorY: 0.85, angleOffset: 0, scaleMultiplier: 1.0 },
};

function getWeaponVisualConfig(itemId: string): WeaponVisualConfig {
    if (WEAPON_VISUAL_CONFIGS[itemId]) return WEAPON_VISUAL_CONFIGS[itemId];
    const idLower = itemId.toLowerCase();
    if (idLower.includes('staff') || idLower.includes('stick') || idLower.includes('wand')) {
        return WEAPON_VISUAL_CONFIGS['stick_oak'];
    }
    if (idLower.includes('bow')) {
        return WEAPON_VISUAL_CONFIGS['bow_griffin'];
    }
    if (idLower.includes('claws')) {
        return WEAPON_VISUAL_CONFIGS['claws_ice_fire'];
    }
    if (idLower.includes('sling')) {
        return WEAPON_VISUAL_CONFIGS['sling_leather'];
    }
    if (idLower.includes('pan')) {
        return WEAPON_VISUAL_CONFIGS['pan_master'];
    }
    return WEAPON_VISUAL_CONFIGS['default'];
}

const SLOT_CONFIG = {
    WEAPON: { baseSize: 256, socketKey: 'rightHand' as keyof IHeroAnchors, zIndex: 25 },
    HELMET: { baseSize: 100, socketKey: 'head' as keyof IHeroAnchors, zIndex: 30 },
    ARMOR: { baseSize: 210, socketKey: 'center' as keyof IHeroAnchors, zIndex: 15 },
    SHIELD: { baseSize: 105, socketKey: 'leftHand' as keyof IHeroAnchors, zIndex: 18 },
} as const;

/**
 * HeroUnit — Ядро визуализации героя (Approach E).
 * Специализирован на сборке тела и оружия с использованием "Железной математики".
 */
export class HeroUnit extends PIXI.Container {
    public baseSize = 512;
    public bodyContainer!: PIXI.Container;
    public bodySprite!: PIXI.Sprite;
    public weaponSocketContainer: PIXI.Container | null = null;
    private weaponSprite: PIXI.Sprite | null = null;
    public helmetSocketContainer: PIXI.Container | null = null;
    private helmetSprite: PIXI.Sprite | null = null;
    public armorSocketContainer: PIXI.Container | null = null;
    private armorSprite: PIXI.Sprite | null = null;
    public shieldSocketContainer: PIXI.Container | null = null;
    private shieldSprite: PIXI.Sprite | null = null;
    public config!: IHeroConfig;
    public heroInstanceId: string = Math.random().toString(36).substr(2, 9);
    public posesTextures: PIXI.Texture[] = [];
    public calculatedBaseScale: number = 1.0;
    public nextAttackPose: number = 3;
    public isStunnedStatus: boolean = false;
    private currentResolve: (() => void) | null = null;
    private trailInterval: any = null;
    
    public defaultX: number = 0;
    public defaultY: number = 0;
    public defaultScaleX: number = 1.0;
    public defaultScaleY: number = 1.0;
    public parentDefaultScaleX: number = 1.0;
    public parentDefaultScaleY: number = 1.0;

    public resetToIdle() {
        if (this.destroyed || !this.scale) return;
        gsap.killTweensOf(this);
        gsap.killTweensOf(this.scale);
        if (this.trailInterval) {
            clearInterval(this.trailInterval);
            this.trailInterval = null;
        }
        if (this.bodyContainer) {
            if (!this.bodyContainer.destroyed && this.bodyContainer.scale) {
                gsap.killTweensOf(this.bodyContainer.scale);
                gsap.killTweensOf(this.bodyContainer);
                this.bodyContainer.scale.set(this.defaultScaleX, this.defaultScaleY);
            }
        }
        if (this.bodySprite) gsap.killTweensOf(this.bodySprite);
        if (this.defaultX) this.x = this.defaultX;
        if (this.defaultY) this.y = this.defaultY;
        this.scale.set(this.parentDefaultScaleX, this.parentDefaultScaleY);
        this.rotation = 0;
        this.angle = 0;
        this.alpha = 1;
        this.setFrame(0);
    }

    private clearCurrentResolve() {
        if (this.currentResolve) {
            const res = this.currentResolve;
            this.currentResolve = null;
            res();
            this.resetToIdle();
        }
    }

    constructor() {
        super();
        this.sortableChildren = true;
        this.bodyContainer = new PIXI.Container();
        this.bodyContainer.sortableChildren = true;
        this.bodyContainer.zIndex = 10;
        this.addChild(this.bodyContainer);
    }

    public setFrame(index: number) {
        if (this.posesTextures && this.posesTextures[index] && this.bodySprite) {
            this.bodySprite.texture = this.posesTextures[index];
        }
    }

    /**
     * Загрузка тела (Герой или Моб)
     */
    async loadHero(id: string) {
        const { HEROES_DB } = await import('../../configs/HeroesConfig');
        const { MOBS_DB } = await import('../../configs/MobsConfig');

        const hero = HEROES_DB.find((h) => h.id === id);
        const mob = MOBS_DB.find((m) => m.id === id);

        this.config = (hero || mob || HEROES_DB[0]) as any;
        console.log(`[HeroUnit] Starting load for: ${this.config.id} (Type: ${hero ? 'Hero' : 'Mob'})`);

        let tex: PIXI.Texture;
        if (this.config.id === 'panda' || this.config.image.includes('panda')) {
            try {
                const sheet = await PIXI.Assets.load('/assets/characters/panda/panda_poses.png.json');
                this.posesTextures = [];
                const frameKeys = Object.keys(sheet.data.frames);
                for (const key of frameKeys) {
                    const match = key.match(/^(\d+)/);
                    if (match) {
                        const idx = parseInt(match[1], 10);
                        this.posesTextures[idx] = sheet.textures[key];
                    }
                }
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for panda.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice panda_poses.png, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else if (this.config.id === 'raccoon' || this.config.image.includes('raccoon')) {
            try {
                const sheet = await PIXI.Assets.load('/assets/characters/raccoon/raccoon_poses.png.json');
                this.posesTextures = [];
                const frameKeys = Object.keys(sheet.data.frames);
                for (const key of frameKeys) {
                    const match = key.match(/^(\d+)/);
                    if (match) {
                        const idx = parseInt(match[1], 10);
                        this.posesTextures[idx] = sheet.textures[key];
                    }
                }
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for raccoon.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice raccoon_poses.png.json, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else {
            try {
                tex = await PIXI.Assets.load(this.config.image);
                console.log(
                    `[DEBUG_HERO_UNIT] ID: ${id}, Config Image: ${this.config.image}, Texture: ${tex.width}x${tex.height}`,
                );
            } catch (err) {
                console.warn(`[HeroUnit] Failed to load body image ${this.config.image}, using fallback panda_poses:`, err);
                try {
                    const posesBaseTex = await PIXI.Assets.load('/assets/characters/panda/panda_poses.png.png');
                    this.posesTextures = [];
                    const frameW = posesBaseTex.width / 4;
                    const frameH = posesBaseTex.height / 2;
                    for (let r = 0; r < 2; r++) {
                        for (let c = 0; c < 4; c++) {
                            const frameTex = new PIXI.Texture({
                                source: posesBaseTex.source,
                                frame: new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH),
                            });
                            this.posesTextures.push(frameTex);
                        }
                    }
                    tex = this.posesTextures[0]; // default is Idle frame
                    console.log(`[HeroUnit] Poses spritesheet loaded and sliced successfully for fallback panda.`);
                } catch (fallbackErr) {
                    console.error(`[HeroUnit] Critical: Failed to load fallback body texture:`, fallbackErr);
                    tex = PIXI.Texture.WHITE;
                }
            }
        }

        // Очистка старого тела
        if (this.bodySprite) {
            this.bodyContainer.removeChild(this.bodySprite);
            this.bodySprite.destroy({ children: true, texture: false });
        }

        this.bodySprite = new PIXI.Sprite(tex);
        this.bodySprite.sortableChildren = true;

        // Нормализация под 512px (фикс кривых размеров)
        const safeWidth = tex.width || 512;
        const safeHeight = tex.height || 512;
        const isFallback = tex === PIXI.Texture.WHITE || safeWidth < 30 || safeHeight < 30;
        this.calculatedBaseScale = this.baseSize / Math.max(safeWidth, safeHeight, isFallback ? 512 : 0);
        // Ensure the character faces RIGHT by default internally.
        // Both Panda and Raccoon poses spritesheets face right by default.
        const facesRightByDefault =
            this.config.id === 'raccoon' ||
            this.config.id === 'panda' ||
            this.config.image.includes('raccoon') ||
            this.config.image.includes('panda');
        const internalScaleX = facesRightByDefault ? this.calculatedBaseScale : this.calculatedBaseScale;
        this.bodyContainer.scale.set(internalScaleX, this.calculatedBaseScale);
        this.defaultScaleX = internalScaleX;
        this.defaultScaleY = this.calculatedBaseScale;

        // Установка точки опоры (Feet)
        this.bodySprite.anchor.set(this.config.anchors.feet.x, this.config.anchors.feet.y);
        this.bodySprite.zIndex = 10;

        this.bodySprite.tint = 0xffffff;

        this.bodyContainer.addChild(this.bodySprite);
        this.createShadow();
        console.log(`[HeroUnit] Hero ${this.config.id} added to container.`);
    }

    private createShadow() {
        const shadow = new PIXI.Graphics();
        shadow.ellipse(0, 0, 60, 20).fill({ color: 0x000000, alpha: 0.3 });
        shadow.zIndex = 1;
        this.addChild(shadow);
    }

    /**
     * Экипировка оружия с использованием контейнера-сокета
     */
    async equipWeapon(itemId: string | null) {
        const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');
        const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
        if (isPanda || isRaccoon) return;
        // Очистка старых спрайтов и контейнеров
        if (this.weaponSprite) {
            gsap.killTweensOf(this.weaponSprite);
            this.weaponSprite.destroy({ children: true, texture: false });
            this.weaponSprite = null;
        }
        if (this.weaponSocketContainer) {
            gsap.killTweensOf(this.weaponSocketContainer);
            if (this.weaponSocketContainer.parent) {
                this.weaponSocketContainer.parent.removeChild(this.weaponSocketContainer);
            }
            this.weaponSocketContainer.destroy({ children: true });
            this.weaponSocketContainer = null;
        }

        if (!itemId || !this.config) return;

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return;

        const socket = this.config.anchors.rightHand;
        const feet = this.config.anchors.feet;

        let tex: PIXI.Texture;
        try {
            tex = await PIXI.Assets.load(itemData.image);
            console.log(`[HeroUnit] Weapon loaded: ${itemId} (${tex.width}x${tex.height})`);
            SpriteValidator.validate(tex, 'WEAPONS');
        } catch (err) {
            console.warn(`[HeroUnit] Failed to load weapon image ${itemData.image}, using fallback texture:`, err);
            tex = PIXI.Texture.WHITE;
        }

        // Создаем контейнер-сокет
        this.weaponSocketContainer = new PIXI.Container();
        this.weaponSocketContainer.zIndex = SLOT_CONFIG.WEAPON.zIndex;
        this.bodyContainer.addChild(this.weaponSocketContainer);

        // Позиционируем контейнер-сокет по координатам руки
        const texWidth = this.bodySprite.texture.width || 1;
        const texHeight = this.bodySprite.texture.height || 1;
        this.weaponSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
        this.weaponSocketContainer.angle = socket.angle ?? 0;

        // Создаем и настраиваем спрайт оружия
        const s = new PIXI.Sprite(tex);
        const wVisual = getWeaponVisualConfig(itemId);
        s.anchor.set(wVisual.anchorX, wVisual.anchorY);

        const weaponTexWidth = tex.width || 256;
        const weaponTexHeight = tex.height || 256;
        const weaponScale = SLOT_CONFIG.WEAPON.baseSize / Math.max(weaponTexWidth, weaponTexHeight, 256);
        const socketScale = socket.scale ?? 1.0;
        const visualScale = wVisual.scaleMultiplier ?? 1.0;
        const parentScaleX = this.bodyContainer.scale.x || 1;

        s.scale.set((weaponScale * socketScale * visualScale) / Math.abs(parentScaleX));
        s.angle = wVisual.angleOffset ?? 0;
        s.position.set(0, 0);

        this.weaponSocketContainer.addChild(s);
        this.weaponSprite = s;

        console.log(`[HeroUnit] Weapon ${itemId} attached to body via socket container.`);
    }

    async equipHelmet(itemId: string | null) {
        const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');
        const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
        if (isPanda || isRaccoon) return;
        if (this.helmetSprite) {
            gsap.killTweensOf(this.helmetSprite);
            this.helmetSprite.destroy({ children: true, texture: false });
            this.helmetSprite = null;
        }
        if (this.helmetSocketContainer) {
            gsap.killTweensOf(this.helmetSocketContainer);
            if (this.helmetSocketContainer.parent) {
                this.helmetSocketContainer.parent.removeChild(this.helmetSocketContainer);
            }
            this.helmetSocketContainer.destroy({ children: true });
            this.helmetSocketContainer = null;
        }

        if (!itemId || !this.config) return;

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return;

        const socket = this.config.anchors.head;
        const feet = this.config.anchors.feet;

        let tex: PIXI.Texture;
        try {
            tex = await PIXI.Assets.load(itemData.image);
        } catch (err) {
            console.warn(`[HeroUnit] Failed to load helmet image ${itemData.image}, using fallback texture:`, err);
            tex = PIXI.Texture.WHITE;
        }

        this.helmetSocketContainer = new PIXI.Container();
        this.helmetSocketContainer.zIndex = SLOT_CONFIG.HELMET.zIndex;
        this.bodyContainer.addChild(this.helmetSocketContainer);

        const texWidth = this.bodySprite.texture.width || 1;
        const texHeight = this.bodySprite.texture.height || 1;
        this.helmetSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
        this.helmetSocketContainer.angle = socket.angle ?? 0;

        const s = new PIXI.Sprite(tex);
        s.anchor.set(0.5, 0.5);

        const itemTexWidth = tex.width || 256;
        const itemTexHeight = tex.height || 256;
        const helmetScale = SLOT_CONFIG.HELMET.baseSize / Math.max(itemTexWidth, itemTexHeight, 256);
        const socketScale = socket.scale ?? 1.0;
        const parentScaleX = this.bodyContainer.scale.x || 1;

        s.scale.set((helmetScale * socketScale) / Math.abs(parentScaleX));
        s.position.set(0, 0);

        this.helmetSocketContainer.addChild(s);
        this.helmetSprite = s;
    }

    async equipArmor(itemId: string | null) {
        const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');
        const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
        if (isPanda || isRaccoon) return;
        if (this.armorSprite) {
            gsap.killTweensOf(this.armorSprite);
            this.armorSprite.destroy({ children: true, texture: false });
            this.armorSprite = null;
        }
        if (this.armorSocketContainer) {
            gsap.killTweensOf(this.armorSocketContainer);
            if (this.armorSocketContainer.parent) {
                this.armorSocketContainer.parent.removeChild(this.armorSocketContainer);
            }
            this.armorSocketContainer.destroy({ children: true });
            this.armorSocketContainer = null;
        }

        if (!itemId || !this.config) return;

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return;

        const socket = this.config.anchors.center;
        const feet = this.config.anchors.feet;

        let tex: PIXI.Texture;
        try {
            tex = await PIXI.Assets.load(itemData.image);
        } catch (err) {
            console.warn(`[HeroUnit] Failed to load armor image ${itemData.image}, using fallback texture:`, err);
            tex = PIXI.Texture.WHITE;
        }

        this.armorSocketContainer = new PIXI.Container();
        this.armorSocketContainer.zIndex = SLOT_CONFIG.ARMOR.zIndex;
        this.bodyContainer.addChild(this.armorSocketContainer);

        const texWidth = this.bodySprite.texture.width || 1;
        const texHeight = this.bodySprite.texture.height || 1;
        this.armorSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
        this.armorSocketContainer.angle = socket.angle ?? 0;

        const s = new PIXI.Sprite(tex);
        s.anchor.set(0.5, 0.5);

        const itemTexWidth = tex.width || 256;
        const itemTexHeight = tex.height || 256;
        const armorScale = SLOT_CONFIG.ARMOR.baseSize / Math.max(itemTexWidth, itemTexHeight, 256);
        const socketScale = socket.scale ?? 1.0;
        const parentScaleX = this.bodyContainer.scale.x || 1;

        s.scale.set((armorScale * socketScale) / Math.abs(parentScaleX));
        s.position.set(0, 0);

        this.armorSocketContainer.addChild(s);
        this.armorSprite = s;
    }

    async equipShield(itemId: string | null) {
        const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');
        const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
        if (isPanda || isRaccoon) return;
        if (this.shieldSprite) {
            gsap.killTweensOf(this.shieldSprite);
            this.shieldSprite.destroy({ children: true, texture: false });
            this.shieldSprite = null;
        }
        if (this.shieldSocketContainer) {
            gsap.killTweensOf(this.shieldSocketContainer);
            if (this.shieldSocketContainer.parent) {
                this.shieldSocketContainer.parent.removeChild(this.shieldSocketContainer);
            }
            this.shieldSocketContainer.destroy({ children: true });
            this.shieldSocketContainer = null;
        }

        if (!itemId || !this.config) return;

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return;

        const socket = this.config.anchors.leftHand || this.config.anchors.center;
        const feet = this.config.anchors.feet;

        let tex: PIXI.Texture;
        try {
            tex = await PIXI.Assets.load(itemData.image);
        } catch (err) {
            console.warn(`[HeroUnit] Failed to load shield image ${itemData.image}, using fallback texture:`, err);
            tex = PIXI.Texture.WHITE;
        }

        this.shieldSocketContainer = new PIXI.Container();
        this.shieldSocketContainer.zIndex = SLOT_CONFIG.SHIELD.zIndex;
        this.bodyContainer.addChild(this.shieldSocketContainer);

        const texWidth = this.bodySprite.texture.width || 1;
        const texHeight = this.bodySprite.texture.height || 1;
        this.shieldSocketContainer.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);
        this.shieldSocketContainer.angle = socket.angle ?? 0;

        const s = new PIXI.Sprite(tex);
        s.anchor.set(0.5, 0.5);

        const itemTexWidth = tex.width || 256;
        const itemTexHeight = tex.height || 256;
        const shieldScale = SLOT_CONFIG.SHIELD.baseSize / Math.max(itemTexWidth, itemTexHeight, 256);
        const socketScale = socket.scale ?? 1.0;
        const parentScaleX = this.bodyContainer.scale.x || 1;

        s.scale.set((shieldScale * socketScale) / Math.abs(parentScaleX));
        s.position.set(0, 0);

        this.shieldSocketContainer.addChild(s);
        this.shieldSprite = s;
    }

    /**
     * Массовое обновление (для совместимости с BattleEngine)
     */
    async updateEquipment(equipment: Record<string, string | null>) {
        await Promise.all([
            this.equipWeapon(equipment['WEAPONS'] || null),
            this.equipHelmet(equipment['HELMETS'] || null),
            this.equipArmor(equipment['ARMOR'] || null),
            this.equipShield(equipment['SHIELDS'] || null),
        ]);
    }

    /**
     * Получить визуальный центр персонажа в глобальных координатах сцены
     */
    public getVisualCenter(): PIXI.Point {
        try {
            if (!this.bodySprite || this.bodySprite.destroyed || !this.bodySprite.parent || !this.bodySprite.texture) {
                return new PIXI.Point(this.x, this.y - 100);
            }
            const center = this.config?.anchors?.center || { x: 0.5, y: 0.5 };
            const tex = this.bodySprite.texture;
            return this.bodySprite.toGlobal(new PIXI.Point(center.x * tex.width, center.y * tex.height));
        } catch (e) {
            console.warn('[HeroUnit] Failed to get visual center, using fallback coordinates:', e);
            return new PIXI.Point(this.x, this.y - 100);
        }
    }

    /**
     * Анимация атаки (GSAP взмах оружием и наклон корпуса)
     */
    public playAttackAnimation() {
        const timeScale = useGameStore.getState().timeScale || 1;

        const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
        const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');

        if (isRaccoon) {
            const attackPoses = [3, 4, 5, 6];
            const chosenPose = attackPoses[Math.floor(Math.random() * attackPoses.length)];
            this.setFrame(chosenPose);

            if (chosenPose === 6) {
                gsap.killTweensOf(this.bodyContainer.scale);
                const baseScale = this.calculatedBaseScale;
                const squashTl = gsap.timeline();
                squashTl.timeScale(timeScale);
                squashTl.to(this.bodyContainer.scale, {
                    x: baseScale * 1.2,
                    y: baseScale * 0.8,
                    duration: 0.15,
                    ease: 'power1.out'
                }).to(this.bodyContainer.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.2,
                    ease: 'power1.inOut'
                });
            } else if (chosenPose === 4) {
                gsap.killTweensOf(this.bodyContainer.scale);
                const baseScale = this.calculatedBaseScale;
                const stretchTl = gsap.timeline();
                stretchTl.timeScale(timeScale);
                stretchTl.to(this.bodyContainer.scale, {
                    x: baseScale * 1.3,
                    y: baseScale * 0.75,
                    duration: 0.12,
                    ease: 'power2.out'
                }).to(this.bodyContainer.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.22,
                    ease: 'sine.inOut'
                });
            } else if (chosenPose === 5) {
                gsap.killTweensOf(this.bodyContainer);
                const rotationTl = gsap.timeline();
                rotationTl.timeScale(timeScale);
                rotationTl.to(this.bodyContainer, {
                    angle: 18,
                    duration: 0.15,
                    ease: 'power1.out'
                }).to(this.bodyContainer, {
                    angle: 0,
                    duration: 0.35,
                    ease: 'elastic.out(1, 0.4)'
                });
            } else {
                gsap.killTweensOf(this.bodyContainer);
                const swingAnimTl = gsap.timeline();
                swingAnimTl.timeScale(timeScale);
                swingAnimTl.to(this.bodyContainer, {
                    angle: -10,
                    duration: 0.15,
                    ease: 'power1.out'
                }).to(this.bodyContainer, {
                    angle: 0,
                    duration: 0.25,
                    ease: 'back.out(2)'
                });
            }

            setTimeout(() => {
                this.setFrame(0); // return to Idle
            }, 800 / timeScale);
            return;
        }

        if (isPanda) {
            const chosenPose = this.nextAttackPose;
            this.setFrame(chosenPose);

            if (chosenPose === 6) {
                // Jump strike animation: squash and stretch on impact
                gsap.killTweensOf(this.bodyContainer.scale);
                const baseScale = this.calculatedBaseScale;
                const squashTl = gsap.timeline();
                squashTl.timeScale(timeScale);

                squashTl.to(this.bodyContainer.scale, {
                    x: baseScale * 1.2,
                    y: baseScale * 0.8,
                    duration: 0.15,
                    ease: 'power1.out'
                });
                squashTl.to(this.bodyContainer.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.2,
                    ease: 'power1.inOut'
                });
                setTimeout(() => {
                    this.setFrame(0); // return to Idle
                }, 700 / timeScale);
            } else if (chosenPose === 4) {
                // Thrust: Horizontal stretch to simulate pierce
                gsap.killTweensOf(this.bodyContainer.scale);
                const baseScale = this.calculatedBaseScale;
                const stretchTl = gsap.timeline();
                stretchTl.timeScale(timeScale);

                stretchTl.to(this.bodyContainer.scale, {
                    x: baseScale * 1.3,
                    y: baseScale * 0.75,
                    duration: 0.12,
                    ease: 'power2.out'
                });
                stretchTl.to(this.bodyContainer.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.22,
                    ease: 'sine.inOut'
                });
                setTimeout(() => {
                    this.setFrame(0);
                }, 600 / timeScale);
            } else if (chosenPose === 5) {
                // Sweep: rotation elastic snap
                gsap.killTweensOf(this.bodyContainer);
                const rotationTl = gsap.timeline();
                rotationTl.timeScale(timeScale);
                rotationTl.to(this.bodyContainer, {
                    angle: 18,
                    duration: 0.15,
                    ease: 'power1.out'
                }).to(this.bodyContainer, {
                    angle: 0,
                    duration: 0.35,
                    ease: 'elastic.out(1, 0.4)'
                });
                setTimeout(() => {
                    this.setFrame(0);
                }, 650 / timeScale);
            } else {
                // Swing (Pose 3)
                gsap.killTweensOf(this.bodyContainer);
                const swingAnimTl = gsap.timeline();
                swingAnimTl.timeScale(timeScale);
                swingAnimTl.to(this.bodyContainer, {
                    angle: -10,
                    duration: 0.15,
                    ease: 'power1.out'
                }).to(this.bodyContainer, {
                    angle: 0,
                    duration: 0.25,
                    ease: 'back.out(2)'
                });
                setTimeout(() => {
                    this.setFrame(0);
                }, 550 / timeScale);
            }
        }

        if (this.weaponSocketContainer) {
            const socket = this.config.anchors.rightHand;
            const originalAngle = socket.angle ?? 0;

            gsap.killTweensOf(this.weaponSocketContainer);
            const swingTl = gsap.timeline();
            swingTl.timeScale(timeScale);

            // 1. Замах назад (Slower)
            swingTl.to(this.weaponSocketContainer, {
                angle: originalAngle - 45,
                duration: 0.2, // Slowed down from 0.08
                ease: 'power1.out',
            });

            // 2. Резкий и мощный удар вперед (Slower)
            swingTl.to(this.weaponSocketContainer, {
                angle: originalAngle + 75,
                duration: 0.25, // Slowed down from 0.1
                ease: 'power3.out',
            });

            // 3. Плавный возврат в исходное положение (Slower)
            swingTl.to(this.weaponSocketContainer, {
                angle: originalAngle,
                duration: 0.5, // Slowed down from 0.25
                ease: 'power2.out',
            });
        }

        if (this.bodyContainer) {
            gsap.killTweensOf(this.bodyContainer, { rotation: true });
            const bodyTl = gsap.timeline();
            bodyTl.timeScale(timeScale);

            // Легкий наклон корпуса вперед при ударе (Slower)
            bodyTl.to(this.bodyContainer, {
                rotation: 0.08,
                duration: 0.25, // Slowed down from 0.1
                ease: 'power1.out',
            });
            bodyTl.to(this.bodyContainer, {
                rotation: 0,
                duration: 0.5, // Slowed down from 0.2
                ease: 'power2.out',
            });
        }
    }

    /**
     * Плавная вспышка урона (GSAP переход от красного к белому)
     */
    public playHitEffect() {
        if (!this.bodySprite) return;
        const timeScale = useGameStore.getState().timeScale || 1;

        const tintObj = { progress: 1 };
        gsap.killTweensOf(tintObj);

        this.bodySprite.tint = 0xff3333; // Сразу краснеем

        gsap.to(tintObj, {
            progress: 0,
            duration: 0.22 / timeScale,
            ease: 'power1.out',
            onUpdate: () => {
                if (!this.bodySprite) return;
                const p = tintObj.progress;
                const r = 255;
                const g = Math.round(51 + (255 - 51) * (1 - p));
                const b = Math.round(51 + (255 - 51) * (1 - p));
                this.bodySprite.tint = (r << 16) | (g << 8) | b;
            },
            onComplete: () => {
                if (this.bodySprite) this.bodySprite.tint = 0xffffff;
            },
        });
    }

    /**
     * Дебаг-оверлей сокетов
     */
    public drawDebugSockets(): void {
        const g = new PIXI.Graphics();
        const anchors = this.config.anchors;
        const sockets = {
            rightHand: { color: 0xff4444 },
            leftHand: { color: 0x4444ff },
            head: { color: 0xffff00 },
            center: { color: 0x44ff44 },
        };

        for (const [key, cfg] of Object.entries(sockets)) {
            const s = (anchors as any)[key];
            if (!s) continue;
            const px = (s.x - anchors.feet.x) * this.baseSize;
            const py = (s.y - anchors.feet.y) * this.baseSize;
            g.circle(px, py, 6).fill({ color: cfg.color, alpha: 0.8 });

            const label = new PIXI.Text(key, {
                fontSize: 12,
                fill: cfg.color,
                stroke: { color: 0x000000, width: 2 },
            });
            label.position.set(px + 8, py - 6);
            this.addChild(label);
        }
        g.zIndex = 100;
        this.addChild(g);
    }

    private animTime: number = 0;

    /**
     * Обновление анимации (Idle дыхание с проверкой твинов)
     */
    public update(dt: number) {
        if (!this.bodySprite || !this.bodySprite.texture) return;

        this.animTime += dt * 0.05;
        const breath = Math.sin(this.animTime) * 0.02;

        const baseScale = this.calculatedBaseScale;

        // Если идет анимация масштаба от удара/крита, не перезаписываем ее idle-дыханием
        if (!gsap.isTweening(this.bodyContainer) && !gsap.isTweening(this.bodyContainer.scale)) {
            this.bodyContainer.scale.y = baseScale + breath;
        }
    }

    public destroy(options?: any) {
        gsap.killTweensOf(this);
        if (this.bodyContainer) {
            gsap.killTweensOf(this.bodyContainer);
            if (this.bodyContainer.scale) gsap.killTweensOf(this.bodyContainer.scale);
        }
        if (this.bodySprite) {
            gsap.killTweensOf(this.bodySprite);
            if (this.bodySprite.scale) gsap.killTweensOf(this.bodySprite.scale);
        }
        if (this.weaponSocketContainer) gsap.killTweensOf(this.weaponSocketContainer);
        if (this.weaponSprite) gsap.killTweensOf(this.weaponSprite);
        if (this.helmetSocketContainer) gsap.killTweensOf(this.helmetSocketContainer);
        if (this.helmetSprite) gsap.killTweensOf(this.helmetSprite);
        if (this.armorSocketContainer) gsap.killTweensOf(this.armorSocketContainer);
        if (this.armorSprite) gsap.killTweensOf(this.armorSprite);
        if (this.shieldSocketContainer) gsap.killTweensOf(this.shieldSocketContainer);
        if (this.shieldSprite) gsap.killTweensOf(this.shieldSprite);
        this.removeStunEffect();
        super.destroy(options);
    }

    /**
     * GSAP-рывок вперед для атаки
     */
    public animateLungeForward(isPlayer: boolean, poseOverride?: number): Promise<void> {
        this.clearCurrentResolve();
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const timeScale = useGameStore.getState().timeScale || 1;
            const startX = this.x;
            const startY = this.y;
            // Let them dash closer so they are almost touching: 490px travel distance
            const targetX = startX + 490 * (isPlayer ? 1 : -1);

            gsap.killTweensOf(this);

            const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
            const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');

            if (poseOverride !== undefined) {
                this.nextAttackPose = poseOverride;
                this.setFrame(2);
            } else if (isPanda) {
                // Randomly select next attack pose index: Swing (3), Thrust (4), Sweep (5), Jump Strike (6)
                this.nextAttackPose = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
                this.setFrame(2); // Set run/lunge pose frame initially
            } else if (isRaccoon) {
                this.nextAttackPose = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
                this.setFrame(2);
            }

            // Start spawning ghost trails (only for ASSASSIN role)
            const isAssassin = this.config?.role === 'ASSASSIN';
            if (this.trailInterval) clearInterval(this.trailInterval);
            if (isAssassin) {
                const fxColor = 0xbd00ff; // Фиолетовый шлейф Убийцы
                this.trailInterval = setInterval(() => {
                    EffectsManager.getInstance().spawnGhostTrail(this, 300, fxColor);
                }, 40);
            }

            const tl = gsap.timeline({
                onComplete: () => {
                    if (this.trailInterval) {
                        clearInterval(this.trailInterval);
                        this.trailInterval = null;
                    }
                    if (this.currentResolve === resolve) {
                        this.currentResolve = null;
                    }
                    resolve();
                },
            });
            tl.timeScale(timeScale);

            if (this.nextAttackPose === 6) {
                // 1. Jump strike lunge: high arc (Y: -220px) to targets
                tl.to(this, {
                    x: targetX,
                    y: startY - 220,
                    duration: 0.35,
                    ease: 'power1.out',
                });
                // 2. Slam down
                tl.to(this, {
                    y: startY,
                    duration: 0.2,
                    ease: 'power2.in',
                });
            } else if (this.nextAttackPose === 4) {
                // 2. Thrust: ultra fast straight line dash
                tl.to(this, {
                    x: targetX,
                    duration: 0.18,
                    ease: 'power3.out',
                });
                tl.to(this, {
                    x: targetX + 15 * (isPlayer ? 1 : -1),
                    duration: 0.12,
                    ease: 'sine.inOut',
                });
            } else {
                // 3. Swing (normal lunge): small hop curve
                tl.to(this, {
                    x: targetX,
                    y: startY - 40,
                    duration: 0.25,
                    ease: 'sine.out',
                });
                tl.to(this, {
                    y: startY,
                    duration: 0.15,
                    ease: 'sine.in',
                });
            }
        });
    }

    public animateLungeReturn(startX: number, startY: number): Promise<void> {
        this.clearCurrentResolve();
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const timeScale = useGameStore.getState().timeScale || 1;

            const isAssassin = this.config?.role === 'ASSASSIN';
            if (this.trailInterval) clearInterval(this.trailInterval);
            if (isAssassin) {
                this.trailInterval = setInterval(() => {
                    EffectsManager.getInstance().spawnGhostTrail(this, 300, 0xbd00ff);
                }, 40);
            }

            const tl = gsap.timeline({
                onComplete: () => {
                    if (this.trailInterval) {
                        clearInterval(this.trailInterval);
                        this.trailInterval = null;
                    }
                    this.x = startX;
                    this.y = startY;
                    this.setFrame(0); // return to Idle
                    if (this.currentResolve === resolve) {
                        this.currentResolve = null;
                    }
                    resolve();
                },
            });
            tl.timeScale(timeScale);

            tl.to(this, {
                x: startX,
                y: startY,
                duration: 0.45,
                ease: 'power2.inOut',
            });
        });
    }

    public showStunEffect() {
        if (this.stunEffectContainer) return;
        this.stunEffectContainer = new PIXI.Container();
        this.addChild(this.stunEffectContainer);

        const headSocket = this.config?.anchors?.head || { x: 0.5, y: 0.2 };
        const feetSocket = this.config?.anchors?.feet || { x: 0.5, y: 0.95 };
        const texWidth = this.bodySprite?.texture?.width || 512;
        const texHeight = this.bodySprite?.texture?.height || 512;

        const hx = (headSocket.x - feetSocket.x) * texWidth * (this.bodyContainer?.scale?.x || 1);
        const hy = (headSocket.y - feetSocket.y) * texHeight * (this.bodyContainer?.scale?.y || 1) - 120; // Raised from -40 to -120 to sit higher above the head
        this.stunEffectContainer.position.set(hx, hy);

        const stars: PIXI.Graphics[] = [];
        const drawStar = (g: PIXI.Graphics, outerRadius: number, innerRadius: number) => {
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / 5;
            g.moveTo(0, -outerRadius);
            for (let i = 0; i < 5; i++) {
                let x = Math.cos(rot) * outerRadius;
                let y = Math.sin(rot) * outerRadius;
                g.lineTo(x, y);
                rot += step;

                x = Math.cos(rot) * innerRadius;
                y = Math.sin(rot) * innerRadius;
                g.lineTo(x, y);
                rot += step;
            }
            g.lineTo(0, -outerRadius);
            g.closePath();
        };

        for (let i = 0; i < 3; i++) {
            const star = new PIXI.Graphics();
            star.beginPath();
            drawStar(star, 10, 4);
            star.fill({ color: 0xffea00 });
            star.stroke({ color: 0xffaa00, width: 1.5 });
            this.stunEffectContainer.addChild(star);
            stars.push(star);
        }

        const animObj = { angle: 0 };
        const tween = gsap.to(animObj, {
            angle: Math.PI * 2,
            duration: 1.8,
            repeat: -1,
            ease: 'none',
            onUpdate: () => {
                if (!this.stunEffectContainer) return;
                stars.forEach((star, index) => {
                    const offset = (index * Math.PI * 2) / 3;
                    const a = animObj.angle + offset;
                    star.x = Math.cos(a) * 35;
                    star.y = Math.sin(a) * 12;
                    star.scale.set(0.6 + Math.sin(a) * 0.4);
                    star.rotation = animObj.angle * 2.5;
                });
            }
        });
        (this.stunEffectContainer as any).gsapTween = tween;
    }

    public removeStunEffect() {
        if (this.stunEffectContainer) {
            const tween = (this.stunEffectContainer as any).gsapTween;
            if (tween) {
                tween.kill();
            }
            gsap.killTweensOf(this.stunEffectContainer);
            this.removeChild(this.stunEffectContainer);
            this.stunEffectContainer.destroy({ children: true });
            this.stunEffectContainer = null;
        }
    }

    /**
     * GSAP-анимация смерти (плавный наклон + растворение + улетание оружия)
     */
    public animateDeath(isPlayer: boolean): Promise<void> {
        this.clearCurrentResolve();
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const timeScale = useGameStore.getState().timeScale || 1;

            gsap.killTweensOf(this);
            if (this.bodyContainer) gsap.killTweensOf(this.bodyContainer);
            if (this.bodySprite) gsap.killTweensOf(this.bodySprite);
            if (this.weaponSocketContainer) gsap.killTweensOf(this.weaponSocketContainer);

            const tl = gsap.timeline({
                onComplete: () => {
                    if (this.currentResolve === resolve) {
                        this.currentResolve = null;
                    }
                    resolve();
                },
            });
            tl.timeScale(timeScale);

            const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
            const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');

            if (isPanda) {
                this.setFrame(7); // Lay-down / sweep pose
            } else if (isRaccoon) {
                this.setFrame(7); // Raccoon fall frame
            }

            const targetRotation = (isPanda || isRaccoon)
                ? 0 // Already flat or fall pose, no extra rotation needed
                : this.rotation + (isPlayer ? -Math.PI / 2.5 : Math.PI / 2.5);

            // Падение тела и растворение (Slower)
            tl.to(this, {
                rotation: targetRotation,
                alpha: 0,
                duration: 1.6, // Slowed down from 0.8
                ease: 'power3.out',
            });

            // Оружие выпадает и вращается отдельно (Slower)
            if (this.weaponSocketContainer) {
                tl.to(
                    this.weaponSocketContainer,
                    {
                        y: this.weaponSocketContainer.y + 160,
                        rotation: this.weaponSocketContainer.rotation + 1.8,
                        alpha: 0,
                        duration: 1.2, // Slowed down from 0.6
                        ease: 'power1.in',
                    },
                    0,
                );
            }
        });
    }

    /**
     * GSAP-отскок при получении урона со Squash & Stretch для критических
     */
    public animateHitReaction(isCrit: boolean): Promise<void> {
        this.clearCurrentResolve();
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const timeScale = useGameStore.getState().timeScale || 1;
            const startX = this.x;
            const knockbackDist = isCrit ? 60 : 30;
            const dir = this.x < 960 ? -1 : 1;

            gsap.killTweensOf(this);

            const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
            const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');

            if (isPanda) {
                this.setFrame(isCrit ? 7 : 5); // Bracing (5) or laydown (7)
            } else if (isRaccoon) {
                this.setFrame(isCrit ? 7 : 6); // Bracing (6) or laydown (7)
            }

            const tl = gsap.timeline({
                onComplete: () => {
                    this.x = startX;
                    if (isPanda || isRaccoon) {
                        this.setFrame(0); // return to Idle
                    }
                    if (this.currentResolve === resolve) {
                        this.currentResolve = null;
                    }
                    resolve();
                },
            });
            tl.timeScale(timeScale);

            // Быстрый отскок назад (Slower)
            tl.to(this, {
                x: startX + knockbackDist * dir,
                duration: 0.2, // Slowed down from 0.08
                ease: 'power1.out',
            });

            // Возвращение на место (Slower)
            tl.to(this, {
                x: startX,
                duration: 0.4, // Slowed down from 0.16
                ease: 'power2.inOut',
            });

            if (isCrit && this.bodyContainer) {
                const baseScaleY = this.bodyContainer.scale.y;
                const baseScaleX = this.bodyContainer.scale.x;

                gsap.killTweensOf(this.bodyContainer.scale);

                const scaleTl = gsap.timeline();
                scaleTl.timeScale(timeScale);

                // Деформация сжатия по вертикали и растяжения по горизонтали (Slower)
                scaleTl.to(this.bodyContainer.scale, {
                    x: baseScaleX * 1.15,
                    y: baseScaleY * 0.85,
                    duration: 0.2, // Slowed down from 0.08
                    ease: 'power1.out',
                });

                // Возврат к нормальному размеру (Slower)
                scaleTl.to(this.bodyContainer.scale, {
                    x: baseScaleX,
                    y: baseScaleY,
                    duration: 0.4, // Slowed down from 0.16
                    ease: 'power2.out',
                });
            }
        });
    }

    public animateDodge(isPlayer: boolean): Promise<void> {
        this.clearCurrentResolve();
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const timeScale = useGameStore.getState().timeScale || 1;
            const startAngle = this.angle;
            const targetAngle = startAngle + (isPlayer ? -15 : 15);
            const startX = this.x;
            const dodgeDist = 140;
            const targetX = startX + dodgeDist * (isPlayer ? -1 : 1);

            gsap.killTweensOf(this);

            const isRaccoon = this.config?.id === 'raccoon' || this.config?.image.includes('raccoon');
            const isPanda = this.config?.id === 'panda' || this.config?.image.includes('panda');

            if (isPanda) {
                this.setFrame(1); // Defend stance (1)
            } else if (isRaccoon) {
                this.setFrame(1); // Defend stance (1)
            }

            const tl = gsap.timeline({
                onComplete: () => {
                    this.angle = startAngle;
                    this.x = startX;
                    if (isPanda || isRaccoon) {
                        this.setFrame(0); // return to Idle
                    }
                    if (this.currentResolve === resolve) {
                        this.currentResolve = null;
                    }
                    resolve();
                },
            });
            tl.timeScale(timeScale);

            // Уклон назад
            tl.to(this, {
                angle: targetAngle,
                x: targetX,
                duration: 0.22,
                ease: 'power2.out',
            });

            // Плавное возвращение
            tl.to(this, {
                angle: startAngle,
                x: startX,
                duration: 0.38,
                ease: 'power1.inOut',
            });
        });
    }
}
