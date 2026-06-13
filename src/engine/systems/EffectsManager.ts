import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiApp } from '../core/PixiApp';
import { useGameStore } from '../../store/useGameStore';

// Modularized imports
import { ParticlePool } from './effects/ParticlePool';
import * as SpellEffects from './effects/SpellEffects';
import * as CombatEffects from './effects/CombatEffects';

/**
 * @enum {string}
 * Типы эффектов
 */
export enum EffectType {
    SCREEN_SHAKE = 'SCREEN_SHAKE',
    COLOR_FLASH = 'COLOR_FLASH',
    PARTICLE_BURST = 'PARTICLE_BURST',
    SLOW_MOTION = 'SLOW_MOTION',
    FADE_IN = 'FADE_IN',
    FADE_OUT = 'FADE_OUT',
}

/**
 * @interface IEffectConfig
 * Конфигурация для эффекта
 */
export interface IEffectConfig {
    duration: number;
    intensity?: number;
    color?: number;
    delay?: number;
    onComplete?: () => void;
}

/**
 * Contract interface for any unit/sprite that can be target of visual combat effects.
 * Decouples EffectsManager from the internal structure of HeroUnit.
 */
export interface IEffectTarget extends PIXI.Container {
    defaultX?: number;
    isLunging: boolean;
    bodySprite?: PIXI.Sprite | null;
    isBurningStatus: boolean;
    isFrozenStatus: boolean;
    isPoisonedStatus: boolean;
    getVisualCenter?(): { x: number; y: number } | null;
    getSocketGlobalPosition?(socketName: string): { x: number; y: number };
}

/**
 * @class EffectsManager
 * Singleton для управления игровыми эффектами
 */
export class EffectsManager {
    private static instance: EffectsManager | null = null;

    private pixiApp: PixiApp;
    private activeEffects: Map<string, gsap.core.Tween | gsap.core.Timeline> = new Map();
    private timeScale: number = 1.0;
    public activeTrails: PIXI.Sprite[] = [];
    private effectCounter: number = 0;
    private particlePool: ParticlePool;

    /**
     * Приватный конструктор (Singleton)
     */
    private constructor() {
        this.pixiApp = PixiApp.getInstance();
        this.particlePool = ParticlePool.getInstance(); // Auto-initializes the particle pool
    }

    /**
     * Получить Singleton инстанс
     */
    public static getInstance(): EffectsManager {
        if (!EffectsManager.instance) {
            EffectsManager.instance = new EffectsManager();
        }
        return EffectsManager.instance;
    }

    /**
     * Тряска экрана (Screen Shake)
     */
    public screenShake(intensity: number = 5, damping: number = 0.95, duration: number = 500): void {
        try {
            const effectId = `shake_${this.effectCounter++}`;

            if (this.activeEffects.has('shake')) {
                const prev = this.activeEffects.get('shake');
                if (prev) prev.kill();
            }

            this.pixiApp.screenShake(intensity, damping);

            const timeline = gsap.timeline({
                onComplete: () => this.activeEffects.delete(effectId),
            });

            timeline.to({}, { duration: duration / 1000, onUpdate: () => {} });
            this.activeEffects.set(effectId, timeline);

            if (import.meta.env.DEV) console.log(`⚡ Screen shake: intensity=${intensity}, duration=${duration}ms`);
        } catch (error) {
            console.error('❌ Screen shake error:', error);
        }
    }

    /**
     * Вспышка цвета на целевом объекте
     */
    public colorFlash(target: PIXI.Container, color: number = 0xffffff, duration: number = 0.2): void {
        try {
            const effectId = `flash_${this.effectCounter++}`;

            const filter = new PIXI.ColorMatrixFilter();
            const prevFilters: PIXI.Filter[] = Array.isArray(target.filters)
                ? [...(target.filters as PIXI.Filter[])]
                : [];
            target.filters = [...prevFilters, filter];

            const timeline = gsap.timeline({
                onComplete: () => {
                    if (Array.isArray(target.filters)) {
                        target.filters = (target.filters as PIXI.Filter[]).filter((f) => f !== filter);
                    }
                    this.activeEffects.delete(effectId);
                },
            });

            timeline.to(filter, {
                brightness: 2,
                duration: duration * 0.3,
                ease: 'power2.out',
            });

            timeline.to(
                filter,
                {
                    brightness: 1,
                    duration: duration * 0.7,
                    ease: 'power2.in',
                },
                `-=${duration * 0.3}`,
            );

            this.activeEffects.set(effectId, timeline);

            if (import.meta.env.DEV) console.log(`🔴 Color flash: color=${color.toString(16)}, duration=${duration}s`);
        } catch (error) {
            console.error('❌ Color flash error:', error);
        }
    }

    /**
     * Взрыв частиц в точке
     */
    public particleBurst(
        x: number,
        y: number,
        particleCount: number = 10,
        color: number = 0xffff00,
        force: number = 200,
    ): void {
        try {
            let count = particleCount;
            const isPowerSaving = useGameStore.getState().isPowerSaving;
            if (isPowerSaving) {
                count = Math.min(particleCount, 4);
            }

            const pool = ParticlePool.getInstance();
            for (let i = 0; i < count; i++) {
                const particle = pool.getParticle(i >= 3);
                if (!particle) continue;

                const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
                const vx = Math.cos(angle) * force;
                const vy = Math.sin(angle) * force;

                particle.clear();
                particle.rect(-2, -2, 4, 4).fill(color);

                particle.position.set(x, y);
                particle.alpha = 1;

                gsap.to(particle, {
                    x: x + vx,
                    y: y + vy,
                    alpha: 0,
                    duration: 0.8 + Math.random() * 0.4,
                    ease: 'power2.out',
                    onComplete: () => pool.releaseParticle(particle),
                });
            }

            if (import.meta.env.DEV) console.log(`💥 Particle burst: ${particleCount} particles at (${x}, ${y})`);
        } catch (error) {
            console.error('❌ Particle burst error:', error);
        }
    }

    /**
     * Замедление времени (Slow Motion / Bullet Time)
     */
    public slowMotion(speedMultiplier: number = 0.3, duration: number = 0.5): void {
        try {
            const effectId = `slowmo_${this.effectCounter++}`;

            const pixiApp = this.pixiApp.getApp();
            const originalSpeed = pixiApp.ticker.speed;

            const timeline = gsap.timeline({
                onComplete: () => {
                    pixiApp.ticker.speed = originalSpeed;
                    this.activeEffects.delete(effectId);
                },
            });

            timeline.to(pixiApp.ticker, {
                speed: speedMultiplier,
                duration: 0.1,
                ease: 'power2.out',
            });

            timeline.to(pixiApp.ticker, {
                speed: originalSpeed,
                duration: 0.1,
                ease: 'power2.in',
                delay: duration,
            });

            this.activeEffects.set(effectId, timeline);

            if (import.meta.env.DEV) console.log(`⏱️ Slow motion: ${speedMultiplier * 100}% speed for ${duration}s`);
        } catch (error) {
            console.error('❌ Slow motion error:', error);
        }
    }

    /**
     * Стоп-кадр (Freeze Frame)
     */
    public freezeFrame(durationMs: number = 60, speedMultiplier: number = 0.05): void {
        try {
            const pixiApp = this.pixiApp.getApp();
            if (!pixiApp) return;

            const effectId = `freeze_${this.effectCounter++}`;
            const originalSpeed = pixiApp.ticker.speed;

            pixiApp.ticker.speed = speedMultiplier;

            const tween = gsap.delayedCall(durationMs / 1000, () => {
                if (pixiApp && pixiApp.ticker) {
                    pixiApp.ticker.speed = originalSpeed;
                }
                this.activeEffects.delete(effectId);
            });

            this.activeEffects.set(effectId, tween);
            if (import.meta.env.DEV) console.log(`❄️ Freeze Frame active: speed=${speedMultiplier} for ${durationMs}ms`);
        } catch (error) {
            console.error('❌ Freeze frame error:', error);
        }
    }

    /**
     * Отскок (Knockback) цели при получении урона
     */
    public knockback(
        target: IEffectTarget,
        isPlayerTarget: boolean,
        type: 'HIT' | 'CRIT' | 'HEAVY' | 'ULTIMATE' = 'HIT',
    ): void {
        try {
            if (!target || target.destroyed) return;

            const knockbackTable = {
                HIT: 12,
                CRIT: 28,
                HEAVY: 40,
                ULTIMATE: 60,
            };

            const distance = knockbackTable[type] || 12;
            const direction = isPlayerTarget ? -1 : 1;

            if (target.defaultX === undefined) {
                target.defaultX = target.x;
            }

            if (!target.isLunging) {
                gsap.killTweensOf(target, { x: true });
            }

            gsap.to(target, {
                x: target.defaultX + distance * direction,
                duration: 0.08,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out',
                onComplete: () => {
                    if (!target.destroyed) {
                        target.x = target.defaultX ?? target.x;
                    }
                },
            });
        } catch (error) {
            console.error('❌ Knockback error:', error);
        }
    }

    /**
     * Плавное появление (Fade In)
     */
    public fadeIn(target: PIXI.Container, duration: number = 0.5, onComplete?: () => void): void {
        try {
            const effectId = `fadein_${this.effectCounter++}`;
            target.alpha = 0;

            const tween = gsap.to(target, {
                alpha: 1,
                duration,
                ease: 'power2.out',
                onComplete: () => {
                    this.activeEffects.delete(effectId);
                    onComplete?.();
                },
            });

            this.activeEffects.set(effectId, tween);
        } catch (error) {
            console.error('❌ Fade in error:', error);
        }
    }

    /**
     * Плавное исчезновение (Fade Out)
     */
    public fadeOut(target: PIXI.Container, duration: number = 0.5, onComplete?: () => void): void {
        try {
            const effectId = `fadeout_${this.effectCounter++}`;

            const tween = gsap.to(target, {
                alpha: 0,
                duration,
                ease: 'power2.in',
                onComplete: () => {
                    this.activeEffects.delete(effectId);
                    onComplete?.();
                },
            });

            this.activeEffects.set(effectId, tween);
        } catch (error) {
            console.error('❌ Fade out error:', error);
        }
    }

    /**
     * Lerp интерполяция (плавное движение между двумя точками)
     */
    public lerp(
        target: PIXI.Container,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        duration: number = 0.5,
        ease: string = 'power2.inOut',
    ): void {
        try {
            const effectId = `lerp_${this.effectCounter++}`;
            target.position.set(fromX, fromY);

            const tween = gsap.to(target, {
                x: toX,
                y: toY,
                duration,
                ease,
                onComplete: () => this.activeEffects.delete(effectId),
            });

            this.activeEffects.set(effectId, tween);
        } catch (error) {
            console.error('❌ Lerp error:', error);
        }
    }

    // --- Combat Effects Delegation ---
    public applyHitResolution(
        attackerRole: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT' | undefined,
        defenderRole: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT' | undefined,
        hitType: 'HIT' | 'CRIT' | 'DODGE' | 'BLOCK' | 'INSTINCT' | 'BURN' | 'POISON' | 'FREEZE' | 'STUN',
        targetUnit: IEffectTarget,
        isPlayerTarget: boolean,
        attackerUnit?: IEffectTarget | null,
        damage?: number,
    ): void {
        CombatEffects.applyHitResolution(
            attackerRole,
            defenderRole,
            hitType,
            targetUnit,
            isPlayerTarget,
            attackerUnit,
            damage,
        );
    }

    public criticalHit(target: IEffectTarget, intensity: number = 1.5): void {
        CombatEffects.criticalHit(target, intensity);
    }

    public normalHit(target: IEffectTarget): void {
        CombatEffects.normalHit(target);
    }

    public dodgeEffect(target: IEffectTarget): void {
        CombatEffects.dodgeEffect(target);
    }

    public blockEffect(target: IEffectTarget, attacker?: IEffectTarget | null): void {
        CombatEffects.blockEffect(target, attacker);
    }

    public deathEffect(target: IEffectTarget): void {
        CombatEffects.deathEffect(target);
    }

    public slashEffect(
        x: number,
        y: number,
        isPlayer: boolean,
        attackerRole?: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT',
        isCrit: boolean = false,
    ): void {
        CombatEffects.slashEffect(x, y, isPlayer, attackerRole, isCrit);
    }

    public spawnGhostTrail(target: any, durationMs: number = 320, tint: number = 0xffffff): void {
        CombatEffects.spawnGhostTrail(target, durationMs, tint);
    }

    public spawnDustPuff(x: number, y: number, baseScale: number = 1.0): void {
        CombatEffects.spawnDustPuff(x, y, baseScale);
    }

    public spawnBlockSparks(x: number, y: number): void {
        CombatEffects.spawnBlockSparks(x, y);
    }

    public spawnSmokePuff(x: number, y: number): void {
        CombatEffects.spawnSmokePuff(x, y);
    }

    public spawnImpactParticles(damage: number, x: number, y: number, color: number = 0xff5533): void {
        CombatEffects.spawnImpactParticles(damage, x, y, color);
    }

    // --- Spell Effects Delegation ---
    public spawnLightningStrike(targetX: number, targetY: number): void {
        SpellEffects.spawnLightningStrike(targetX, targetY);
    }

    public spawnFireballProjectile(
        startX: number,
        startY: number,
        targetX: number,
        targetY: number,
        victim: any,
    ): void {
        SpellEffects.spawnFireballProjectile(startX, startY, targetX, targetY, victim);
    }

    public spawnExplosion(x: number, y: number): void {
        SpellEffects.spawnExplosion(x, y);
    }

    /**
     * Получить все активные эффекты
     */
    public getActiveEffects(): string[] {
        return Array.from(this.activeEffects.keys());
    }

    /**
     * Остановить все эффекты
     */
    public stopAllEffects(): void {
        try {
            const app = this.pixiApp.getApp();
            if (app && app.ticker) {
                app.ticker.speed = 1.0;
            }

            for (const [, effect] of this.activeEffects) {
                if (effect) effect.kill();
            }
            this.activeEffects.clear();

            this.activeTrails.forEach((trail) => {
                if (trail) {
                    gsap.killTweensOf(trail);
                    if (!trail.destroyed) {
                        trail.destroy();
                    }
                }
            });
            this.activeTrails = [];

            if (import.meta.env.DEV) console.log('🛑 All effects stopped');
        } catch (error) {
            console.error('❌ Stop all effects error:', error);
        }
    }

    /**
     * Остановить конкретный эффект
     */
    public stopEffect(effectId: string): void {
        try {
            const effect = this.activeEffects.get(effectId);
            if (effect) {
                effect.kill();
                this.activeEffects.delete(effectId);
            }
        } catch (error) {
            console.error(`❌ Stop effect error:`, error);
        }
    }

    /**
     * Установить временной масштаб для всех эффектов
     */
    public setTimeScale(scale: number): void {
        try {
            this.timeScale = Math.max(0.1, Math.min(scale, 2));
            if (import.meta.env.DEV) console.log(`⏰ Time scale set to ${this.timeScale}`);
        } catch (error) {
            console.error('❌ Set time scale error:', error);
        }
    }

    /**
     * Получить количество активных частиц
     */
    public getActiveParticleCount(): number {
        return ParticlePool.getInstance().pool.filter((p) => p.visible).length;
    }

    /**
     * Очистить все ресурсы
     */
    public destroy(): void {
        try {
            this.stopAllEffects();
            this.particlePool.clear();
            if (import.meta.env.DEV) console.log('💥 EffectsManager destroyed');
        } catch (error) {
            console.error('❌ Destroy error:', error);
        }
    }
}
