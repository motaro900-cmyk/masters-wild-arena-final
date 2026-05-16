import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiApp } from '../core/PixiApp';
import { SoundManager } from './SoundManager';

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
 * @class EffectsManager
 * Singleton для управления игровыми эффектами
 *
 * Функции:
 * - Screen Shake (тряска камеры)
 * - Color Flash (вспышка цвета)
 * - Particle Burst (взрыв частиц)
 * - Slow Motion (замедление времени)
 * - Fade In/Out (плавное появление/исчезновение)
 * - Lerp интерполяция
 *
 * AAA-инди стандарт:
 * - Все эффекты плавные (Lerp, GSAP)
 * - Стекируются (можно применить несколько)
 * - Object Pooling для частиц
 *
 * @example
 * const fx = EffectsManager.getInstance();
 * fx.screenShake(10, 0.95);
 * fx.colorFlash(0xff0000, 0.3);
 */
export class EffectsManager {
    private static instance: EffectsManager | null = null;

    private pixiApp: PixiApp;
    private activeEffects: Map<string, gsap.core.Tween | gsap.core.Timeline> = new Map();
    private timeScale: number = 1.0;
    private particlePool: PIXI.Graphics[] = [];
    private effectCounter: number = 0;

    /**
     * Приватный конструктор (Singleton)
     */
    private constructor() {
        this.pixiApp = PixiApp.getInstance();
        this.initParticlePool();
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
     * Инициализировать пул частиц (Object Pooling)
     * @private
     */
    private initParticlePool(size: number = 100): void {
        try {
            for (let i = 0; i < size; i++) {
                const particle = new PIXI.Graphics();
                particle.visible = false;
                this.pixiApp.effectsLayer.addChild(particle);
                this.particlePool.push(particle);
            }
            console.log(`🎨 Particle pool initialized with ${size} particles`);
        } catch (error) {
            console.error('❌ Particle pool initialization error:', error);
        }
    }

    /**
     * Получить частицу из пула
     * @private
     */
    private getParticle(): PIXI.Graphics | null {
        for (const particle of this.particlePool) {
            if (!particle.visible) {
                particle.visible = true;
                return particle;
            }
        }
        return null;
    }

    /**
     * Вернуть частицу в пул
     * @private
     */
    private releaseParticle(particle: PIXI.Graphics): void {
        particle.visible = false;
        particle.clear();
    }

    /**
     * Тряска экрана (Screen Shake)
     * Применяет случайное смещение с затуханием
     *
     * @param intensity Интенсивность (1-100)
     * @param damping Коэффициент затухания (0-1)
     * @param duration Длительность в мс
     */
    public screenShake(intensity: number = 5, damping: number = 0.95, duration: number = 500): void {
        try {
            const effectId = `shake_${this.effectCounter++}`;

            // Останавливаем предыдущий shake если существует
            if (this.activeEffects.has('shake')) {
                const prev = this.activeEffects.get('shake');
                if (prev) prev.kill();
            }

            this.pixiApp.screenShake(intensity, damping);

            // Автоматически отключаем через длительность
            const timeline = gsap.timeline({
                onComplete: () => this.activeEffects.delete(effectId),
            });

            timeline.to({}, { duration: duration / 1000, onUpdate: () => {} });
            this.activeEffects.set(effectId, timeline);

            console.log(`⚡ Screen shake: intensity=${intensity}, duration=${duration}ms`);
        } catch (error) {
            console.error('❌ Screen shake error:', error);
        }
    }

    /**
     * Вспышка цвета на целевом объекте
     * Полезно для показания урона персонажу
     *
     * @param target Целевой объект PIXI
     * @param color Цвет вспышки (0xRRGGBB)
     * @param duration Длительность вспышки
     */
    public colorFlash(target: PIXI.Sprite, color: number = 0xffffff, duration: number = 0.2): void {
        try {
            const effectId = `flash_${this.effectCounter++}`;

            const filter = new PIXI.ColorMatrixFilter();
            target.filters = [filter];

            // Вспышка на максимум
            const timeline = gsap.timeline({
                onComplete: () => {
                    target.filters = [];
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

            console.log(`🔴 Color flash: color=${color.toString(16)}, duration=${duration}s`);
        } catch (error) {
            console.error('❌ Color flash error:', error);
        }
    }

    /**
     * Взрыв частиц в точке
     * AAA-инди эффект: использует пул частиц
     *
     * @param x Позиция X
     * @param y Позиция Y
     * @param particleCount Количество частиц
     * @param color Цвет частиц
     * @param force Сила взрыва
     */
    public particleBurst(
        x: number,
        y: number,
        particleCount: number = 10,
        color: number = 0xffff00,
        force: number = 200,
    ): void {
        try {
            for (let i = 0; i < particleCount; i++) {
                const particle = this.getParticle();
                if (!particle) break;

                // Случайный угол
                const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
                const vx = Math.cos(angle) * force;
                const vy = Math.sin(angle) * force;

                // Рисуем частицу (маленький квадрат)
                particle.clear();
                particle.rect(-2, -2, 4, 4).fill(color);

                particle.position.set(x, y);
                particle.alpha = 1;

                // Анимируем частицу (падение + затухание)
                gsap.to(particle, {
                    x: x + vx,
                    y: y + vy,
                    alpha: 0,
                    duration: 0.8 + Math.random() * 0.4,
                    ease: 'power2.out',
                    onComplete: () => this.releaseParticle(particle),
                });
            }

            console.log(`💥 Particle burst: ${particleCount} particles at (${x}, ${y})`);
        } catch (error) {
            console.error('❌ Particle burst error:', error);
        }
    }

    /**
     * Замедление времени (Slow Motion / Bullet Time)
     * Полезно для критических ударов
     *
     * @param speedMultiplier Множитель скорости (0.1 = 10% скорости)
     * @param duration Длительность эффекта
     */
    public slowMotion(speedMultiplier: number = 0.3, duration: number = 0.5): void {
        try {
            const effectId = `slowmo_${this.effectCounter++}`;

            const pixiApp = this.pixiApp.getApp();
            const originalSpeed = pixiApp.ticker.speed;

            // Плавное замедление
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

            console.log(`⏱️ Slow motion: ${speedMultiplier * 100}% speed for ${duration}s`);
        } catch (error) {
            console.error('❌ Slow motion error:', error);
        }
    }

    /**
     * Плавное появление (Fade In)
     *
     * @param target Целевой объект
     * @param duration Длительность
     * @param onComplete Callback при завершении
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
     *
     * @param target Целевой объект
     * @param duration Длительность
     * @param onComplete Callback при завершении
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
     *
     * @param target Целевой объект
     * @param fromX Начальная X
     * @param fromY Начальная Y
     * @param toX Конечная X
     * @param toY Конечная Y
     * @param duration Длительность
     * @param ease GSAP ease функция
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

    /**
     * Комбо эффект: Screen Shake + Color Flash + Particle Burst
     * Используется для критических ударов
     *
     * @param target Целевой объект
     * @param intensity Интенсивность эффекта
     */
    public criticalHit(target: PIXI.Sprite, intensity: number = 1.5): void {
        try {
            console.log(`🌟 CRITICAL HIT EFFECT!`);

            // Звук критического удара
            SoundManager.getInstance().playCrit();

            // Тряска
            this.screenShake(15 * intensity, 0.92, 400);

            // Вспышка желтого
            this.colorFlash(target, 0xffff00, 0.3);

            // Взрыв золотых частиц
            this.particleBurst(target.position.x, target.position.y, 20, 0xffdd00, 250 * intensity);

            // Замедление времени
            this.slowMotion(0.4, 0.3);
        } catch (error) {
            console.error('❌ Critical hit error:', error);
        }
    }

    /**
     * Эффект обычного удара
     * @param target Целевой объект
     */
    public normalHit(target: PIXI.Sprite): void {
        try {
            SoundManager.getInstance().playHit();
            this.screenShake(5, 0.95, 200);
            this.colorFlash(target, 0xff6666, 0.15);
            this.particleBurst(target.position.x, target.position.y, 8, 0xff8888, 150);
        } catch (error) {
            console.error('❌ Normal hit error:', error);
        }
    }

    /**
     * Эффект смерти персонажа
     * @param target Целевой объект
     */
    public deathEffect(target: PIXI.Container): void {
        try {
            this.screenShake(8, 0.9, 300);
            this.particleBurst(target.position.x, target.position.y, 30, 0xff0000, 300);
            this.fadeOut(target, 0.8);
        } catch (error) {
            console.error('❌ Death effect error:', error);
        }
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
            for (const [, effect] of this.activeEffects) {
                if (effect) effect.kill();
            }
            this.activeEffects.clear();
            console.log('🛑 All effects stopped');
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
            console.log(`⏰ Time scale set to ${this.timeScale}`);
        } catch (error) {
            console.error('❌ Set time scale error:', error);
        }
    }

    /**
     * Получить количество активных частиц
     */
    public getActiveParticleCount(): number {
        return this.particlePool.filter((p) => p.visible).length;
    }

    /**
     * Очистить все ресурсы
     */
    public destroy(): void {
        try {
            this.stopAllEffects();
            for (const particle of this.particlePool) {
                particle.destroy();
            }
            this.particlePool = [];
            console.log('💥 EffectsManager destroyed');
        } catch (error) {
            console.error('❌ Destroy error:', error);
        }
    }
}
