import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { IHeroConfig } from '../../configs/HeroesConfig';
import { useGameStore } from '../../store/useGameStore';
import { resolveAssetPath } from '../../utils/assetPath';
import { IEffectTarget } from '../systems/EffectsManager';
import { StatusEffectController } from './StatusEffectController';
import { IStatusEffectTarget } from './IStatusEffectTarget';

// New imports from extracted modular files
// EquipmentManager moved to src/future/ — visual equipment overlay system (dormant)
import * as Animations from './HeroUnitAnimations';

/**
 * HeroUnit — Ядро визуализации героя (Approach E).
 * Специализирован на сборке тела и оружия с использованием "Железной математики".
 */
export class HeroUnit extends PIXI.Container implements IEffectTarget, IStatusEffectTarget {
    public baseSize = 512;
    public bodyContainer!: PIXI.Container;
    public bodySprite!: PIXI.Sprite;
    public weaponSocketContainer: PIXI.Container | null = null;
    public weaponSprite: PIXI.Sprite | null = null;
    public helmetSocketContainer: PIXI.Container | null = null;
    public helmetSprite: PIXI.Sprite | null = null;
    public armorSocketContainer: PIXI.Container | null = null;
    public armorSprite: PIXI.Sprite | null = null;
    public shieldSocketContainer: PIXI.Container | null = null;
    public shieldSprite: PIXI.Sprite | null = null;
    public config!: IHeroConfig;
    public heroInstanceId: string = Math.random().toString(36).substr(2, 9);
    public posesTextures: PIXI.Texture[] = [];
    public calculatedBaseScale: number = 1.0;
    public nextAttackPose: number = 3;
    public idleFrameIdx: number = 0;
    public defendFrameIdx: number = 1;
    public runFrameIdx: number = 2;
    public hitFrameIdx: number = 5;
    public deathFrameIdx: number = 7;
    public attackFrameIdxs: number[] = [3, 4, 6];
    public statusEffectController: StatusEffectController;

    public showStunEffect(): void {
        this.statusEffectController.showStunEffect();
    }
    public removeStunEffect(): void {
        this.statusEffectController.removeStunEffect();
    }
    public showFreezeEffect(): void {
        this.statusEffectController.showFreezeEffect();
    }
    public removeFreezeEffect(): void {
        this.statusEffectController.removeFreezeEffect();
    }
    public showPoisonEffect(): void {
        this.statusEffectController.showPoisonEffect();
    }
    public removePoisonEffect(): void {
        this.statusEffectController.removePoisonEffect();
    }
    public showBurnEffect(): void {
        this.statusEffectController.showBurnEffect();
    }
    public removeBurnEffect(): void {
        this.statusEffectController.removeBurnEffect();
    }

    // ── Кастомные визуальные эффекты для новых статусов ──────────────────────
    private _customEffects: Map<string, PIXI.Container> = new Map();

    private _getEffectColor(effectId: string): number {
        const colors: Record<string, number> = {
            shadow_mark: 0x7b2d8b,
            crystal_shield: 0x00d4ff,
            storm_charge: 0xf5e642,
            nature_regen: 0x3ecf4f,
            void_slow: 0x4a1a8c,
        };
        return colors[effectId] ?? 0xffffff;
    }

    public showCustomEffect(effectId: string): void {
        if (this._customEffects.has(effectId) || this.destroyed) return;
        const color = this._getEffectColor(effectId);
        const gfx = new PIXI.Graphics();
        // Рисуем круг-ауру над персонажем
        gfx.lineStyle(3, color, 0.85);
        gfx.drawCircle(0, -110, 55);
        gfx.zIndex = 200;
        this.addChild(gfx);
        this._customEffects.set(effectId, gfx);
    }

    public removeCustomEffect(effectId: string): void {
        const effect = this._customEffects.get(effectId);
        if (effect) {
            if (!effect.destroyed) {
                this.removeChild(effect);
                effect.destroy();
            }
            this._customEffects.delete(effectId);
        }
    }

    public get isStunnedStatus(): boolean {
        return this.statusEffectController.isStunned;
    }
    public set isStunnedStatus(val: boolean) {
        this.statusEffectController.isStunned = val;
    }

    public get isBurningStatus(): boolean {
        return this.statusEffectController.isBurning;
    }
    public set isBurningStatus(val: boolean) {
        this.statusEffectController.isBurning = val;
    }

    public get isFrozenStatus(): boolean {
        return this.statusEffectController.isFrozen;
    }
    public set isFrozenStatus(val: boolean) {
        this.statusEffectController.isFrozen = val;
    }

    public get isPoisonedStatus(): boolean {
        return this.statusEffectController.isPoisoned;
    }
    public set isPoisonedStatus(val: boolean) {
        this.statusEffectController.isPoisoned = val;
    }

    public get stunEffectContainer(): PIXI.Container | null {
        return this.statusEffectController.stunEffectContainer;
    }
    public set stunEffectContainer(val: PIXI.Container | null) {
        this.statusEffectController.stunEffectContainer = val;
    }

    public get stunTween(): gsap.core.Tween | null {
        return (this.statusEffectController as any).stunTween;
    }
    public set stunTween(val: gsap.core.Tween | null) {
        (this.statusEffectController as any).stunTween = val;
    }

    public get burnEffectContainer(): PIXI.Container | null {
        return this.statusEffectController.burnEffectContainer;
    }
    public set burnEffectContainer(val: PIXI.Container | null) {
        this.statusEffectController.burnEffectContainer = val;
    }

    public get freezeEffectContainer(): PIXI.Container | null {
        return this.statusEffectController.freezeEffectContainer;
    }
    public set freezeEffectContainer(val: PIXI.Container | null) {
        this.statusEffectController.freezeEffectContainer = val;
    }

    public get poisonEffectContainer(): PIXI.Container | null {
        return this.statusEffectController.poisonEffectContainer;
    }
    public set poisonEffectContainer(val: PIXI.Container | null) {
        this.statusEffectController.poisonEffectContainer = val;
    }

    public currentWeaponId: string | null = null;
    private weaponTrailPositions: PIXI.Point[] = [];
    private weaponTrailGraphics: PIXI.Graphics | null = null;
    public isMob: boolean = false;

    public attackCounter: number = 0;
    public statusEffects: any[] = [];
    private currentResolve: (() => void) | null = null;
    private trailInterval: any = null;
    private timers: ReturnType<typeof setTimeout>[] = [];
    public isLunging: boolean = false;
    public activeTimelines: any[] = [];

    public defaultX: number = 0;
    public defaultY: number = 0;
    public defaultScaleX: number = 1.0;
    public defaultScaleY: number = 1.0;
    public parentDefaultScaleX: number = 1.0;
    public parentDefaultScaleY: number = 1.0;
    public get _burnCleanupTimer(): any {
        return (this.statusEffectController as any).burnCleanupTimer;
    }
    public set _burnCleanupTimer(val: any) {
        (this.statusEffectController as any).burnCleanupTimer = val;
    }

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

    public clearCurrentResolve() {
        if (this.currentResolve) {
            const res = this.currentResolve;
            this.currentResolve = null;
            res();
            this.resetToIdle();
        }
    }

    constructor() {
        super();
        this.statusEffectController = new StatusEffectController(this);
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

    private parseSpritesheetFrames(sheet: any) {
        this.posesTextures = [];
        this.attackFrameIdxs = [];
        this.idleFrameIdx = 0;
        this.defendFrameIdx = 1;
        this.runFrameIdx = 2;
        this.hitFrameIdx = 5;
        this.deathFrameIdx = 5; // fallback is hit frame if no death frame exists

        const heroPrefix = `${this.config.id}_`;

        // Prefix frame keys with the hero name/ID to prevent PixiJS cache conflicts
        const originalFrames = { ...sheet.data.frames };
        const originalTextures = { ...sheet.textures };

        sheet.data.frames = {};
        sheet.textures = {};

        for (const key of Object.keys(originalFrames)) {
            const prefixedKey = key.startsWith(heroPrefix) ? key : `${heroPrefix}${key}`;

            sheet.data.frames[prefixedKey] = originalFrames[key];
            sheet.textures[prefixedKey] = originalTextures[key];

            // Re-cache with the prefixed key
            if (originalTextures[key]) {
                if (PIXI.Cache.has(key) && PIXI.Cache.get(key) === originalTextures[key]) {
                    PIXI.Cache.remove(key);
                }
                PIXI.Cache.set(prefixedKey, originalTextures[key]);
            }
        }

        const frameKeys = Object.keys(sheet.data.frames);
        const indexRegex = new RegExp(`^(?:${heroPrefix})?(\\d+)`);

        for (const key of frameKeys) {
            const match = key.match(indexRegex);
            if (match) {
                const idx = parseInt(match[1], 10);
                const texture = sheet.textures[key];
                this.posesTextures[idx] = texture;

                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('idle')) {
                    this.idleFrameIdx = idx;
                } else if (lowerKey.includes('defend')) {
                    this.defendFrameIdx = idx;
                } else if (lowerKey.includes('run')) {
                    this.runFrameIdx = idx;
                } else if (lowerKey.includes('hit')) {
                    this.hitFrameIdx = idx;
                } else if (lowerKey.includes('death') || lowerKey.includes('dead')) {
                    this.deathFrameIdx = idx;
                } else if (lowerKey.includes('attack')) {
                    this.attackFrameIdxs.push(idx);
                }
            }
        }

        // Sort attack frames numerically
        this.attackFrameIdxs.sort((a, b) => a - b);

        // Fallback for death if not explicitly found
        if (this.deathFrameIdx === 5 && !this.posesTextures[5]) {
            this.deathFrameIdx = this.idleFrameIdx;
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
        this.isMob = !hero && !!mob;
        console.log(`[HeroUnit] Starting load for: ${this.config.id} (Type: ${hero ? 'Hero' : 'Mob'})`);

        let tex: PIXI.Texture;
        if (this.config.id === 'panda' || this.config.image.includes('panda')) {
            try {
                const equippedSkin = useGameStore.getState().equippedSkins?.['panda'] || 'default';
                const jsonPath = resolveAssetPath(
                    equippedSkin === 'panda_frost'
                        ? '/assets/characters/panda/panda_frost_poses.png.json'
                        : '/assets/characters/panda/panda_poses.png.json',
                );
                const sheet = await PIXI.Assets.load(jsonPath);
                this.parseSpritesheetFrames(sheet);
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for panda.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice panda_poses.png, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else if (this.config.id === 'raccoon' || this.config.image.includes('raccoon')) {
            try {
                const sheet = await PIXI.Assets.load(
                    resolveAssetPath('/assets/characters/raccoon/raccoon_poses.png.json'),
                );
                this.parseSpritesheetFrames(sheet);
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for raccoon.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice raccoon_poses.png.json, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else if (this.config.id === 'minotaur') {
            try {
                const sheet = await PIXI.Assets.load(
                    resolveAssetPath('/assets/characters/minotaur/minotaur_poses.png.json'),
                );
                this.parseSpritesheetFrames(sheet);
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for minotaur.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice minotaur_poses.png.json, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else if (this.config.id === 'tiger_warrior') {
            try {
                const sheet = await PIXI.Assets.load(
                    resolveAssetPath('/assets/characters/tiger_warrior/tiger_warrior_poses.png.json'),
                );
                this.parseSpritesheetFrames(sheet);
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for tiger_warrior.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice tiger_warrior_poses.png.json, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else if (this.config.id === 'lion_knight') {
            try {
                const sheet = await PIXI.Assets.load(
                    resolveAssetPath('/assets/characters/lion_knight/lion_knight_poses.png.json'),
                );
                this.parseSpritesheetFrames(sheet);
                tex = this.posesTextures[0]; // default is Idle frame
                console.log(`[HeroUnit] Spritesheet loaded via JSON successfully for lion_knight.`);
            } catch (err) {
                console.error(`[HeroUnit] Failed to load or slice lion_knight_poses.png.json, falling back:`, err);
                tex = PIXI.Texture.WHITE;
            }
        } else {
            try {
                tex = await PIXI.Assets.load(resolveAssetPath(this.config.image));
                console.log(
                    `[DEBUG_HERO_UNIT] ID: ${id}, Config Image: ${this.config.image}, Texture: ${tex.width}x${tex.height}`,
                );
            } catch (err) {
                console.warn(
                    `[HeroUnit] Failed to load body image ${this.config.image}, using fallback panda_poses:`,
                    err,
                );
                try {
                    const posesBaseTex = await PIXI.Assets.load(
                        resolveAssetPath('/assets/characters/panda/panda_poses.png.png'),
                    );
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
                    this.idleFrameIdx = 0;
                    this.defendFrameIdx = 1;
                    this.runFrameIdx = 2;
                    this.hitFrameIdx = 5;
                    this.deathFrameIdx = 7;
                    this.attackFrameIdxs = [3, 4, 6];
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
        const internalScaleX = this.calculatedBaseScale;
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

    // --- Equipment Delegation (dormant — visual overlay system in src/future/HeroEquipmentManager.ts) ---
    public equipWeapon(_itemId: string | null): Promise<void> {
        return Promise.resolve();
    }
    public equipHelmet(_itemId: string | null): Promise<void> {
        return Promise.resolve();
    }
    public equipArmor(_itemId: string | null): Promise<void> {
        return Promise.resolve();
    }
    public equipShield(_itemId: string | null): Promise<void> {
        return Promise.resolve();
    }
    public updateEquipment(_equipment: Record<string, string | null>): Promise<void> {
        return Promise.resolve();
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
     * Получить глобальные координаты сокета персонажа
     */
    public getSocketGlobalPosition(socketKey: 'rightHand' | 'leftHand' | 'head' | 'feet' | 'center'): PIXI.Point {
        try {
            if (!this.bodySprite || this.bodySprite.destroyed || !this.bodySprite.texture) {
                return this.getVisualCenter();
            }
            const socket = this.config?.anchors?.[socketKey] || { x: 0.5, y: 0.5 };
            const feet = this.config?.anchors?.feet || { x: 0.5, y: 0.95 };
            const texWidth = this.bodySprite.texture.width || 1;
            const texHeight = this.bodySprite.texture.height || 1;

            const lx = (socket.x - feet.x) * texWidth;
            const ly = (socket.y - feet.y) * texHeight;

            return this.bodySprite.toGlobal(new PIXI.Point(lx, ly));
        } catch (e) {
            console.warn(`[HeroUnit] Failed to get socket ${socketKey} position, fallback to center:`, e);
            return this.getVisualCenter();
        }
    }

    /**
     * Анимация атаки (GSAP взмах оружием и наклон корпуса)
     */
    public playAttackAnimation() {
        const timeScale = useGameStore.getState().timeScale || 1;

        const hasPoses = this.posesTextures && this.posesTextures.length > 0;

        if (hasPoses) {
            const attackList =
                this.attackFrameIdxs && this.attackFrameIdxs.length > 0 ? this.attackFrameIdxs : [3, 4, 6];
            const chosenPose = attackList[Math.floor(Math.random() * attackList.length)];
            this.setFrame(chosenPose);

            const attackIndex = attackList.indexOf(chosenPose);

            if (attackIndex === 2) {
                gsap.killTweensOf(this.bodyContainer.scale);
                const baseScale = this.calculatedBaseScale;
                const squashTl = gsap.timeline();
                squashTl.timeScale(timeScale);
                squashTl
                    .to(this.bodyContainer.scale, {
                        x: baseScale * 1.05,
                        y: baseScale * 0.95,
                        duration: 0.15,
                        ease: 'power1.out',
                    })
                    .to(this.bodyContainer.scale, {
                        x: baseScale,
                        y: baseScale,
                        duration: 0.2,
                        ease: 'power1.inOut',
                    });
                this.timers.push(
                    setTimeout(() => {
                        this.setFrame(this.idleFrameIdx); // return to Idle
                    }, 700 / timeScale),
                );
            } else if (attackIndex === 1) {
                gsap.killTweensOf(this.bodyContainer.scale);
                const baseScale = this.calculatedBaseScale;
                const stretchTl = gsap.timeline();
                stretchTl.timeScale(timeScale);
                stretchTl
                    .to(this.bodyContainer.scale, {
                        x: baseScale * 1.06,
                        y: baseScale * 0.94,
                        duration: 0.12,
                        ease: 'power2.out',
                    })
                    .to(this.bodyContainer.scale, {
                        x: baseScale,
                        y: baseScale,
                        duration: 0.22,
                        ease: 'sine.inOut',
                    });
                this.timers.push(
                    setTimeout(() => {
                        this.setFrame(this.idleFrameIdx);
                    }, 600 / timeScale),
                );
            } else if (attackIndex >= 3) {
                gsap.killTweensOf(this.bodyContainer);
                const rotationTl = gsap.timeline();
                rotationTl.timeScale(timeScale);
                rotationTl
                    .to(this.bodyContainer, {
                        angle: 18,
                        duration: 0.15,
                        ease: 'power1.out',
                    })
                    .to(this.bodyContainer, {
                        angle: 0,
                        duration: 0.35,
                        ease: 'elastic.out(1, 0.4)',
                    });
                this.timers.push(
                    setTimeout(() => {
                        this.setFrame(this.idleFrameIdx);
                    }, 650 / timeScale),
                );
            } else {
                gsap.killTweensOf(this.bodyContainer);
                const swingAnimTl = gsap.timeline();
                swingAnimTl.timeScale(timeScale);
                swingAnimTl
                    .to(this.bodyContainer, {
                        angle: -10,
                        duration: 0.15,
                        ease: 'power1.out',
                    })
                    .to(this.bodyContainer, {
                        angle: 0,
                        duration: 0.25,
                        ease: 'back.out(2)',
                    });
                this.timers.push(
                    setTimeout(() => {
                        this.setFrame(this.idleFrameIdx);
                    }, 550 / timeScale),
                );
            }
        }

        if (this.weaponSocketContainer) {
            const socket = this.config.anchors.rightHand;
            const originalAngle = socket.angle ?? 0;

            gsap.killTweensOf(this.weaponSocketContainer);
            const swingTl = gsap.timeline();
            swingTl.timeScale(timeScale);

            swingTl.to(this.weaponSocketContainer, {
                angle: originalAngle - 45,
                duration: 0.2,
                ease: 'power1.out',
            });

            swingTl.to(this.weaponSocketContainer, {
                angle: originalAngle + 75,
                duration: 0.25,
                ease: 'power3.out',
            });

            swingTl.to(this.weaponSocketContainer, {
                angle: originalAngle,
                duration: 0.5,
                ease: 'power2.out',
            });
        }

        if (this.bodyContainer) {
            gsap.killTweensOf(this.bodyContainer, { rotation: true });
            const bodyTl = gsap.timeline();
            bodyTl.timeScale(timeScale);

            bodyTl.to(this.bodyContainer, {
                rotation: 0.08,
                duration: 0.25,
                ease: 'power1.out',
            });
            bodyTl.to(this.bodyContainer, {
                rotation: 0,
                duration: 0.5,
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

            const label = new PIXI.Text({
                text: key,
                style: {
                    fontSize: 12,
                    fill: cfg.color,
                    stroke: { color: 0x000000, width: 2 },
                },
            });
            label.position.set(px + 8, py - 6);
            this.addChild(label);
        }
        g.zIndex = 100;
        this.addChild(g);
    }

    public animTime: number = 0;

    /**
     * Обновление анимации (Idle дыхание с проверкой твинов)
     */
    public update(dt: number) {
        if (!this.bodySprite || !this.bodySprite.texture) return;

        let speedMultiplier = 1.0;
        if (this.isFrozenStatus) {
            speedMultiplier = 0.25;
        }

        this.animTime += dt * 0.08 * speedMultiplier;
        const breathY = Math.sin(this.animTime) * 0.035; // 3.5% height squash/stretch
        const breathX = -Math.sin(this.animTime) * 0.025; // opposite width stretch/squash

        const baseScale = this.calculatedBaseScale;

        // Если идет анимация масштаба от удара/крита, не перезаписываем ее idle-дыханием
        if (!gsap.isTweening(this.bodyContainer) && !gsap.isTweening(this.bodyContainer.scale)) {
            this.bodyContainer.scale.y = baseScale + breathY;
            this.bodyContainer.scale.x = (this.bodyContainer.scale.x >= 0 ? 1 : -1) * (baseScale + breathX);
        }

        // Update Status Effects
        this.statusEffectController.update(dt);

        // Update Weapon Trail
        try {
            if (this.weaponSocketContainer && this.weaponSocketContainer.parent && this.parent) {
                if (!this.weaponTrailGraphics) {
                    this.weaponTrailGraphics = new PIXI.Graphics();
                    this.parent.addChild(this.weaponTrailGraphics);
                }

                const currentPos = this.getSocketGlobalPosition('rightHand');
                if (currentPos) {
                    const parentPos = this.parent.toLocal(currentPos);
                    if (parentPos && typeof parentPos.x === 'number' && typeof parentPos.y === 'number') {
                        this.weaponTrailPositions.push(parentPos);
                        if (this.weaponTrailPositions.length > 8) {
                            this.weaponTrailPositions.shift();
                        }
                    }
                }

                this.weaponTrailGraphics.clear();
                if (this.weaponTrailPositions.length >= 2) {
                    let trailColor = 0xffffff;
                    if (this.isBurningStatus) {
                        trailColor = 0xff6600;
                    } else if (this.isFrozenStatus) {
                        trailColor = 0x88ccff;
                    } else if (this.isPoisonedStatus) {
                        trailColor = 0x44ff44;
                    } else if (this.currentWeaponId) {
                        const idLower = this.currentWeaponId.toLowerCase();
                        if (
                            idLower.includes('fire') ||
                            idLower.includes('lava') ||
                            idLower.includes('blaze') ||
                            idLower.includes('burn')
                        ) {
                            trailColor = 0xff6600;
                        } else if (
                            idLower.includes('ice') ||
                            idLower.includes('frost') ||
                            idLower.includes('cold') ||
                            idLower.includes('freeze')
                        ) {
                            trailColor = 0x88ccff;
                        } else if (
                            idLower.includes('poison') ||
                            idLower.includes('venom') ||
                            idLower.includes('acid') ||
                            idLower.includes('toxic') ||
                            idLower.includes('spider')
                        ) {
                            trailColor = 0x44ff44;
                        }
                    }

                    for (let i = 0; i < this.weaponTrailPositions.length - 1; i++) {
                        const p1 = this.weaponTrailPositions[i];
                        const p2 = this.weaponTrailPositions[i + 1];
                        const alpha = i / (this.weaponTrailPositions.length - 1);

                        this.weaponTrailGraphics.beginPath();
                        this.weaponTrailGraphics.moveTo(p1.x, p1.y);
                        this.weaponTrailGraphics.lineTo(p2.x, p2.y);
                        this.weaponTrailGraphics.stroke({
                            color: trailColor,
                            width: 4 + alpha * 6,
                            alpha: alpha * 0.7,
                        });
                    }
                }
            } else {
                if (this.weaponTrailGraphics) {
                    this.weaponTrailGraphics.clear();
                }
            }
        } catch (err) {
            console.warn('[HeroUnit] Weapon trail update error:', err);
        }
    }

    public destroy(options?: any) {
        this.timers.forEach((t) => clearTimeout(t));
        this.timers = [];

        if (this.trailInterval) {
            clearInterval(this.trailInterval);
            this.trailInterval = null;
        }

        if (this.activeTimelines) {
            this.activeTimelines.forEach((tl) => {
                try {
                    tl.kill();
                } catch (e) {}
            });
            this.activeTimelines = [];
        }

        this.statusEffectController.destroy();

        if (this.weaponTrailGraphics) {
            if (this.weaponTrailGraphics.parent) {
                this.weaponTrailGraphics.parent.removeChild(this.weaponTrailGraphics);
            }
            this.weaponTrailGraphics.destroy();
            this.weaponTrailGraphics = null;
        }

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

        super.destroy(options);
    }

    // --- Animation Delegation ---
    public teleportTo(newX: number, newY: number): Promise<void> {
        return Animations.teleportTo(this, newX, newY);
    }

    public jumpSlam(targetX: number): Promise<void> {
        return Animations.jumpSlam(this, targetX);
    }

    public spawnLandingEffect(): void {
        Animations.spawnLandingEffect(this);
    }

    public animateLungeForward(isPlayer: boolean, poseOverride?: number, victimX?: number): Promise<void> {
        return Animations.animateLungeForward(this, isPlayer, poseOverride, victimX);
    }

    public animateLungeReturn(startX: number, startY: number): Promise<void> {
        return Animations.animateLungeReturn(this, startX, startY);
    }

    public animateTeleportOut(): Promise<void> {
        return Animations.animateTeleportOut(this);
    }

    public animateTeleportIn(targetX: number, faceScaleX: number): Promise<void> {
        return Animations.animateTeleportIn(this, targetX, faceScaleX);
    }

    public animateDeath(isPlayer: boolean): Promise<void> {
        return Animations.animateDeath(this, isPlayer);
    }

    public animateHitReaction(isCrit: boolean): Promise<void> {
        return Animations.animateHitReaction(this, isCrit);
    }

    public animateDefend(): Promise<void> {
        return Animations.animateDefend(this);
    }

    public animateDodge(isPlayer: boolean): Promise<void> {
        return Animations.animateDodge(this, isPlayer);
    }
}
