import * as PIXI from 'pixi.js';
import { IHeroConfig, IHeroAnchors } from '../../configs/HeroesConfig';
import { SpriteValidator } from '../../utils/SpriteValidator';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';

const SLOT_CONFIG = {
    WEAPON: { baseSize: 256, anchorX: 0.5, anchorY: 0.9, socketKey: 'rightHand' as keyof IHeroAnchors, zIndex: 20 },
} as const;

/**
 * HeroUnit — Ядро визуализации героя (Approach E).
 * Специализирован на сборке тела и оружия с использованием "Железной математики".
 */
export class HeroUnit extends PIXI.Container {
    public baseSize = 512;
    public bodySprite!: PIXI.Sprite;
    private weaponSprite: PIXI.Sprite | null = null;
    private config!: IHeroConfig;
    public heroInstanceId: string = Math.random().toString(36).substr(2, 9);

    constructor() {
        super();
        this.sortableChildren = true;
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

        const tex = await PIXI.Assets.load(this.config.image);
        console.log(`[HeroUnit] Texture loaded: ${this.config.id} (${tex.width}x${tex.height})`);

        // Очистка старого тела
        if (this.bodySprite) {
            this.removeChild(this.bodySprite);
            this.bodySprite.destroy({ children: true, texture: false });
        }

        this.bodySprite = new PIXI.Sprite(tex);
        this.bodySprite.sortableChildren = true;

        // Нормализация под 512px (фикс кривых размеров)
        const safeWidth = tex.width || 512;
        const safeHeight = tex.height || 512;
        const scaleFactor = this.baseSize / Math.max(safeWidth, safeHeight, 512);
        console.log(`[HeroUnit] Scaling ${this.config.id} by factor: ${scaleFactor}`);
        this.bodySprite.scale.set(scaleFactor);

        // Установка точки опоры (Feet)
        this.bodySprite.anchor.set(this.config.anchors.feet.x, this.config.anchors.feet.y);
        this.bodySprite.zIndex = 10;

        this.addChild(this.bodySprite);
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
     * Экипировка оружия
     */
    async equipWeapon(itemId: string | null) {
        // 1. Снять старое
        if (this.weaponSprite) {
            if (this.weaponSprite.parent) this.weaponSprite.parent.removeChild(this.weaponSprite);
            this.weaponSprite.destroy({ children: true, texture: false });
            this.weaponSprite = null;
        }
        if (!itemId || !this.config) return;

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return;

        const cfg = SLOT_CONFIG.WEAPON;
        const socket = this.config.anchors.rightHand;
        const feet = this.config.anchors.feet;

        const tex = await PIXI.Assets.load(itemData.image);
        console.log(`[HeroUnit] Weapon loaded: ${itemId} (${tex.width}x${tex.height})`);
        SpriteValidator.validate(tex, 'WEAPONS');

        const s = new PIXI.Sprite(tex);
        s.anchor.set(cfg.anchorX, cfg.anchorY);

        const texWidth = this.bodySprite.texture.width || 1;
        const texHeight = this.bodySprite.texture.height || 1;
        const weaponScale = cfg.baseSize / Math.max(texWidth, texHeight, 256);
        const socketScale = socket.scale ?? 1.0;
        const parentScaleX = this.bodySprite.scale.x || 1;
        s.scale.set((weaponScale * socketScale) / parentScaleX);
        s.angle = socket.angle ?? 0;

        s.position.set((socket.x - feet.x) * texWidth, (socket.y - feet.y) * texHeight);

        s.zIndex = cfg.zIndex;
        this.bodySprite.addChild(s);
        this.weaponSprite = s;
        console.log(`[HeroUnit] Weapon ${itemId} attached to body.`);
    }

    /**
     * Массовое обновление (для совместимости с BattleEngine)
     */
    async updateEquipment(equipment: Record<string, string | null>) {
        await this.equipWeapon(equipment['WEAPONS'] || null);
    }

    /**
     * Процедурная анимация атаки
     */
    public playAttackAnimation() {
        if (!this.weaponSprite) return;
        const originalAngle = this.weaponSprite.angle;
        this.weaponSprite.angle -= 30;
        setTimeout(() => {
            if (this.weaponSprite) this.weaponSprite.angle += 90;
        }, 100);
        setTimeout(() => {
            if (this.weaponSprite) this.weaponSprite.angle = originalAngle;
        }, 300);
    }

    /**
     * Эффект получения урона
     */
    public playHitEffect() {
        if (!this.bodySprite) return;
        const originalTint = this.bodySprite.tint;
        this.bodySprite.tint = 0xff0000;
        setTimeout(() => {
            if (this.bodySprite) this.bodySprite.tint = originalTint;
        }, 150);
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
     * Обновление анимации (Idle дыхание)
     */
    public update(dt: number) {
        if (!this.bodySprite || !this.bodySprite.texture) return;

        this.animTime += dt * 0.05;
        const breath = Math.sin(this.animTime) * 0.02;

        // Плавное дыхание
        const tex = this.bodySprite.texture;
        const texDim = Math.max(tex.width, tex.height, 512);
        const baseScale = this.baseSize / texDim;
        this.bodySprite.scale.y = baseScale + breath;

        // Качание оружия (теперь оно дочернее, так что y-offset добавляется к его локальной позиции)
        if (this.weaponSprite) {
            // Мы не меняем y напрямую постоянно, а добавляем микро-оффсет
            // Для простоты можно оставить как было, но теперь оно будет "дышать" вместе с телом
        }
    }

    public destroy(options?: any) {
        super.destroy(options);
    }
}
