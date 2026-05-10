import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { GlowFilter } from 'pixi-filters';

export enum EntityState {
    IDLE = 'IDLE',
    WALK = 'WALK',
    ATTACK = 'ATTACK',
    TAKE_DAMAGE = 'TAKE_DAMAGE',
    DIE = 'DIE'
}

/**
 * @interface IEntityStats
 * Финальные статы сущности (уже с модификаторами)
 */
export interface IEntityStats {
    hp: number;
    attack: number;
    speed: number;
    critChance: number;
    weaponTexture: string | null;
}

/**
 * @class BaseEntity
 * Базовый класс для любого боевого персонажа
 * Поддерживает Socket System для экипировки оружия
 * State Machine для управления состояниями
 */
export class BaseEntity extends PIXI.Container {
    protected view: PIXI.Sprite;
    protected weaponSprite: PIXI.Sprite | null = null;
    protected shadow: PIXI.Graphics;
    public currentState: EntityState = EntityState.IDLE;
    
    public stats: any; // IEntityStats
    private animationTimeline: gsap.core.Timeline | null = null;

    constructor(texture: PIXI.Texture, stats: any, weaponTexture?: PIXI.Texture) {
        super();
        this.stats = stats;

        // 1. Тень
        this.shadow = new PIXI.Graphics();
        this.shadow.beginFill(0x000000, 0.3);
        this.shadow.drawEllipse(0, 0, 40, 15);
        this.shadow.endFill();
        this.shadow.y = 60;
        this.addChild(this.shadow);

        // 2. Тело персонажа
        this.view = new PIXI.Sprite(texture);
        this.view.anchor.set(0.5, 1);
        this.addChild(this.view);

        // 3. Оружие (Socket System)
        if (weaponTexture) {
            this.weaponSprite = new PIXI.Sprite(weaponTexture);
            this.weaponSprite.anchor.set(0.5, 0.9);
            // Позиционируем в "руку" (цифры зависят от спрайта)
            this.weaponSprite.position.set(30, -60); 
            this.addChild(this.weaponSprite);
            
            // Анимация покачивания оружия на Idle
            gsap.to(this.weaponSprite, {
                rotation: 0.1,
                duration: 1.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
            
            // Эпичное свечение вокруг оружия
            const glow = new GlowFilter({ distance: 15, outerStrength: 2, color: 0xffaa00 });
            this.weaponSprite.filters = [glow];
        }

        this.initIdleAnimation();
    }

    /**
     * Анимация дыхания/движения на месте в режиме IDLE
     */
    private initIdleAnimation(): void {
        gsap.to(this.view.scale, {
            y: 0.96,
            x: 1.04,
            duration: 0.8 + Math.random() * 0.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }

    /**
     * Установить новое состояние с запуском соответствующей анимации
     */
    public setState(newState: EntityState): void {
        if (this.currentState === newState || this.currentState === EntityState.DIE) return;
        this.currentState = newState;

        switch (newState) {
            case EntityState.ATTACK:
                this.playAttackAnimation();
                break;
            case EntityState.TAKE_DAMAGE:
                this.playDamageAnimation();
                break;
            case EntityState.DIE:
                this.playDeathAnimation();
                break;
            case EntityState.IDLE:
                // Возврат в IDLE, уже обработано в других анимациях
                break;
        }
    }

    /**
     * Базовая анимация замаха (Сам рывок теперь контролируется BattleState для кинематографичности)
     */
    private playAttackAnimation(): void {
        // Замах
        gsap.to(this.view, { rotation: -0.2, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => {
            if (this.currentState === EntityState.ATTACK) this.setState(EntityState.IDLE);
        }});
        if (this.weaponSprite) {
            gsap.to(this.weaponSprite, { rotation: -0.5, duration: 0.1, yoyo: true, repeat: 1 });
        }
    }

    /**
     * Анимация получения урона: вспышка + тряска
     */
    private playDamageAnimation(): void {
        if (this.animationTimeline) {
            this.animationTimeline.kill();
        }

        const tl = gsap.timeline({
            onComplete: () => {
                this.view.filters = [];
                if (this.stats.hp > 0 && this.currentState === EntityState.TAKE_DAMAGE) {
                    this.setState(EntityState.IDLE);
                }
            }
        });

        this.animationTimeline = tl;

        // Вспышка белого
        const filter = new PIXI.ColorMatrixFilter();
        this.view.filters = [filter];
        filter.brightness(3, false);

        tl.to(filter, {
            brightness: 1,
            duration: 0.15
        }, 0);

        // Тряска влево-вправо
        tl.to(this.view, { x: -8, duration: 0.05 }, 0);
        tl.to(this.view, { x: 8, duration: 0.05 });
        tl.to(this.view, { x: -8, duration: 0.05 });
        tl.to(this.view, { x: 0, duration: 0.05 });
    }

    /**
     * Анимация смерти: затухание и падение
     */
    private playDeathAnimation(): void {
        if (this.animationTimeline) {
            this.animationTimeline.kill();
        }

        const tl = gsap.timeline({
            onComplete: () => {
                this.destroy({ children: true });
            }
        });

        this.animationTimeline = tl;

        tl.to(this, {
            alpha: 0,
            y: this.y + 40,
            duration: 0.6
        });
    }

    /**
     * Вызывается каждый кадр из BattleState
     */
    public update(_dt: number): void {
        // Логика обновления в кадре
        // Можно добавить дополнительные вычисления
    }

    /**
     * Получить текущее количество HP
     */
    public getHp(): number {
        return this.stats.hp;
    }

    /**
     * Установить новое значение HP
     */
    public setHp(newHp: number): void {
        this.stats.hp = Math.max(0, newHp);
    }

    /**
     * Проверить, жив ли персонаж
     */
    public isAlive(): boolean {
        return this.stats.hp > 0 && this.currentState !== EntityState.DIE;
    }
}
