import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiApp } from '../core/PixiApp';
import { SoundManager } from './SoundManager';
import { useGameStore } from '../../store/useGameStore';

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
        // Фильтруем уничтоженные частицы из пула (например, после очистки слоев)
        this.particlePool = this.particlePool.filter((p) => !p.destroyed);

        // Если пул опустел, пересоздаем его
        if (this.particlePool.length === 0) {
            this.initParticlePool();
        }

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
        if (particle.destroyed) return;
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
            let count = particleCount;
            // Limit active particles under power saving mode (Step 10)
            const isPowerSaving = useGameStore.getState().isPowerSaving;
            if (isPowerSaving) {
                count = Math.min(particleCount, 4); // Limit to max 4 particles
            }

            for (let i = 0; i < count; i++) {
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
     * Стоп-кадр (Freeze Frame) для сочности критических ударов и способностей
     * Замораживает игровой тикер на указанное время
     *
     * @param durationMs Длительность остановки в миллисекундах
     * @param speedMultiplier Коэффициент замедления (0.05 = почти полная остановка)
     */
    public freezeFrame(durationMs: number = 60, speedMultiplier: number = 0.05): void {
        try {
            const pixiApp = this.pixiApp.getApp();
            if (!pixiApp) return;

            const effectId = `freeze_${this.effectCounter++}`;
            const originalSpeed = pixiApp.ticker.speed;

            // Устанавливаем замедленную скорость
            pixiApp.ticker.speed = speedMultiplier;

            // Запускаем таймер возврата через GSAP (который работает независимо от тикера Pixi)
            const tween = gsap.delayedCall(durationMs / 1000, () => {
                if (pixiApp && pixiApp.ticker) {
                    pixiApp.ticker.speed = originalSpeed;
                }
                this.activeEffects.delete(effectId);
            });

            this.activeEffects.set(effectId, tween);
            console.log(`❄️ Freeze Frame active: speed=${speedMultiplier} for ${durationMs}ms`);
        } catch (error) {
            console.error('❌ Freeze frame error:', error);
        }
     }

    /**
     * Отскок (Knockback) цели при получении урона
     *
     * @param target Целевой объект PIXI.Container
     * @param isPlayerTarget Находится ли цель на стороне игрока
     * @param type Тип попадания ('HIT' | 'CRIT' | 'HEAVY' | 'ULTIMATE')
     */
    public knockback(
        target: any,
        isPlayerTarget: boolean,
        type: 'HIT' | 'CRIT' | 'HEAVY' | 'ULTIMATE' = 'HIT'
    ): void {
        try {
            if (!target || target.destroyed) return;

            // Таблица величин отскока
            const knockbackTable = {
                HIT: 12,
                CRIT: 28,
                HEAVY: 40,
                ULTIMATE: 60
            };

            const distance = knockbackTable[type] || 12;
            const direction = isPlayerTarget ? -1 : 1; // Удар отбрасывает игрока влево (-1), врага вправо (+1)
            
            // Запоминаем базовую x-координату персонажа если ее нет
            if (target.defaultX === undefined) {
                target.defaultX = target.x;
            }

            // Защита от наложения анимаций: сбрасываем предыдущие анимации X
            gsap.killTweensOf(target, { x: true });

            // Анимируем смещение и плавный возврат
            gsap.to(target, {
                x: target.defaultX + (distance * direction),
                duration: 0.08,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out',
                onComplete: () => {
                    // Возвращаем в дефолтную позицию на случай микро-погрешностей
                    if (!target.destroyed) {
                        target.x = target.defaultX;
                    }
                }
            });
        } catch (error) {
            console.error('❌ Knockback error:', error);
        }
    }

    /**
     * Комплексная визуализация попадания в зависимости от типа события и классов
     *
     * @param attackerRole Роль атакующего ('WARRIOR' | 'TANK' | 'ASSASSIN')
     * @param defenderRole Роль защищающегося ('WARRIOR' | 'TANK' | 'ASSASSIN')
     * @param hitType Тип попадания ('HIT' | 'CRIT' | 'DODGE' | 'BLOCK' | 'INSTINCT')
     * @param targetUnit Ссылка на модель цели (PIXI.Container / HeroUnit)
     * @param isPlayerTarget Является ли цель игроком
     */
    public applyHitResolution(
        attackerRole: 'WARRIOR' | 'TANK' | 'ASSASSIN',
        defenderRole: 'WARRIOR' | 'TANK' | 'ASSASSIN',
        hitType: 'HIT' | 'CRIT' | 'DODGE' | 'BLOCK' | 'INSTINCT',
        targetUnit: any,
        isPlayerTarget: boolean
    ): void {
        try {
            if (!targetUnit || targetUnit.destroyed) return;

            // 1. Обработка уклонения (DODGE)
            if (hitType === 'DODGE') {
                this.dodgeEffect(targetUnit);
                // Плавное быстрое отклонение в сторону
                gsap.killTweensOf(targetUnit, { x: true });
                const direction = isPlayerTarget ? 1 : -1; // Уворот смещает вперед/в сторону
                gsap.to(targetUnit, {
                    x: targetUnit.x + (25 * direction),
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: 'sine.inOut',
                    onComplete: () => {
                        if (!targetUnit.destroyed) {
                            targetUnit.x = targetUnit.defaultX ?? targetUnit.x;
                        }
                    }
                });
                return;
            }

            // 2. Обработка блокирования (BLOCK)
            if (hitType === 'BLOCK') {
                this.blockEffect(targetUnit);
                this.knockback(targetUnit, isPlayerTarget, 'HIT'); // Легкий отскок
                return;
            }

            // 3. Цветная вспышка (Hit Flash)
            let flashColor = 0xff6666; // Дефолтный красный
            if (hitType === 'CRIT') {
                if (attackerRole === 'TANK') flashColor = 0xffd700; // Золотая вспышка
                else if (attackerRole === 'ASSASSIN') flashColor = 0xbd00ff; // Фиолетовая вспышка
                else flashColor = 0x00ffff; // Бирюзовая вспышка
            }
            const flashSprite = targetUnit.bodySprite || targetUnit;
            if (flashSprite) {
                this.colorFlash(flashSprite, flashColor, hitType === 'CRIT' ? 0.25 : 0.15);
            }

            // 4. Физический отскок (Knockback)
            const knockbackType = hitType === 'CRIT' ? 'CRIT' : 'HIT';
            this.knockback(targetUnit, isPlayerTarget, knockbackType);

            // 5. Тряска экрана (Camera Shake)
            if (hitType === 'CRIT') {
                const shakeIntensity = attackerRole === 'TANK' ? 14 : (attackerRole === 'ASSASSIN' ? 8 : 10);
                this.screenShake(shakeIntensity, 0.93, 300);
            } else {
                const shakeIntensity = attackerRole === 'TANK' ? 6 : 3;
                this.screenShake(shakeIntensity, 0.95, 150);
            }

            // 6. Стоп-кадр (Freeze Frame) для Критов
            if (hitType === 'CRIT') {
                const freezeDuration = attackerRole === 'TANK' ? 80 : (attackerRole === 'ASSASSIN' ? 50 : 65);
                this.freezeFrame(freezeDuration, 0.05);
            }

            // 7. Взрыв искр/частиц (Particle Burst)
            let pColor = 0xff8888;
            if (attackerRole === 'TANK') pColor = 0xffbb00;
            else if (attackerRole === 'ASSASSIN') pColor = 0xda70d6;
            else pColor = 0x80ffdb;

            let px = targetUnit.x;
            let py = targetUnit.y - 80;
            if (typeof targetUnit.getVisualCenter === 'function') {
                const center = targetUnit.getVisualCenter();
                if (center) {
                    px = center.x;
                    py = center.y;
                }
            }
            this.particleBurst(px, py, hitType === 'CRIT' ? 16 : 6, pColor, hitType === 'CRIT' ? 220 : 130);

        } catch (error) {
            console.error('❌ applyHitResolution error:', error);
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
    public criticalHit(target: PIXI.Container, intensity: number = 1.5): void {
        try {
            console.log(`🌟 CRITICAL HIT EFFECT!`);

            // Звук критического удара
            SoundManager.getInstance().playCrit();

            // Тряска
            this.screenShake(15 * intensity, 0.92, 400);

            // Вспышка желтого
            const flashSprite = (target as any).bodySprite || target;
            if (flashSprite instanceof PIXI.Sprite) {
                this.colorFlash(flashSprite, 0xffff00, 0.3);
            }

            // Нахождение центра мишени
            let px = target.x;
            let py = target.y - 100;
            if (typeof (target as any).getVisualCenter === 'function') {
                const center = (target as any).getVisualCenter();
                if (center) {
                    px = center.x;
                    py = center.y;
                }
            } else if (target.parent) {
                const globalPos = target.toGlobal(new PIXI.Point(0, 0));
                px = globalPos.x;
                py = globalPos.y;
            }

            // Взрыв золотых частиц
            this.particleBurst(px, py, 20, 0xffdd00, 250 * intensity);

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
    public normalHit(target: PIXI.Container): void {
        try {
            SoundManager.getInstance().playHit();
            this.screenShake(5, 0.95, 200);

            const flashSprite = (target as any).bodySprite || target;
            if (flashSprite instanceof PIXI.Sprite) {
                this.colorFlash(flashSprite, 0xff6666, 0.15);
            }

            // Нахождение центра мишени
            let px = target.x;
            let py = target.y - 100;
            if (typeof (target as any).getVisualCenter === 'function') {
                const center = (target as any).getVisualCenter();
                if (center) {
                    px = center.x;
                    py = center.y;
                }
            } else if (target.parent) {
                const globalPos = target.toGlobal(new PIXI.Point(0, 0));
                px = globalPos.x;
                py = globalPos.y;
            }

            this.particleBurst(px, py, 8, 0xff8888, 150);
        } catch (error) {
            console.error('❌ Normal hit error:', error);
        }
    }

    /**
     * Эффект уклонения
     */
    public dodgeEffect(target: PIXI.Container): void {
        try {
            let px = target.x;
            let py = target.y - 100;
            if (typeof (target as any).getVisualCenter === 'function') {
                const center = (target as any).getVisualCenter();
                if (center) {
                    px = center.x;
                    py = center.y;
                }
            }
            this.particleBurst(px, py, 6, 0xaaccff, 120);
        } catch (error) {
            console.error('❌ Dodge effect error:', error);
        }
    }

    /**
     * Эффект блокирования
     */
    public blockEffect(target: PIXI.Container): void {
        try {
            let px = target.x;
            let py = target.y - 100;
            if (typeof (target as any).getVisualCenter === 'function') {
                const center = (target as any).getVisualCenter();
                if (center) {
                    px = center.x;
                    py = center.y;
                }
            }
            this.particleBurst(px, py, 12, 0x3b82f6, 180);
        } catch (error) {
            console.error('❌ Block effect error:', error);
        }
    }

    /**
     * Эффект смерти персонажа
     * @param target Целевой объект
     */
    public deathEffect(target: PIXI.Container): void {
        try {
            this.screenShake(8, 0.9, 300);

            // Нахождение центра мишени
            let px = target.x;
            let py = target.y - 100;
            if (typeof (target as any).getVisualCenter === 'function') {
                const center = (target as any).getVisualCenter();
                if (center) {
                    px = center.x;
                    py = center.y;
                }
            } else if (target.parent) {
                const globalPos = target.toGlobal(new PIXI.Point(0, 0));
                px = globalPos.x;
                py = globalPos.y;
            }

            this.particleBurst(px, py, 30, 0xff0000, 300);
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
     * Эффект взмаха оружия (Slash/Swipe)
     */
    public slashEffect(x: number, y: number, isPlayer: boolean, weaponArchetype?: string): void {
        try {
            const container = new PIXI.Container();
            this.pixiApp.effectsLayer.addChild(container);

            const slash = new PIXI.Graphics();
            
            let colorOuter = 0x00ffff;
            let colorInner = 0xffffff;
            let pColor = 0x00ffff;
            let pCount = 10;
            let pForce = 160;

            if (weaponArchetype === 'STAFF') {
                // Magic void/violet blast
                colorOuter = 0xbd00ff;
                colorInner = 0xffa6ff;
                pColor = 0xda70d6;
                pCount = 18;
                pForce = 220;
                
                // Draw a mystical magic ring/spiral
                slash.arc(0, 0, 90, 0, Math.PI * 1.5)
                     .stroke({ color: colorOuter, width: 20, cap: 'round' })
                     .stroke({ color: colorInner, width: 6, cap: 'round' });
            } else if (weaponArchetype === 'BOW') {
                // Wind swirl / arrow sparks
                colorOuter = 0x00ff88;
                colorInner = 0xe0ffff;
                pColor = 0x80ffdb;
                pCount = 12;
                pForce = 200;
                
                // Draw a swift wind flow
                slash.moveTo(-60, 0)
                     .quadraticCurveTo(0, -90, 80, -20)
                     .stroke({ color: colorOuter, width: 14, cap: 'round' })
                     .stroke({ color: colorInner, width: 4, cap: 'round' });
            } else if (weaponArchetype === 'DAGGER') {
                // Double quick yellow critical cross slashes
                colorOuter = 0xffd700;
                colorInner = 0xffffff;
                pColor = 0xffea00;
                pCount = 14;
                pForce = 180;
                
                // Draw cross slashes
                slash.moveTo(-50, -50).lineTo(50, 50)
                     .moveTo(50, -50).lineTo(-50, 50)
                     .stroke({ color: colorOuter, width: 10, cap: 'round' })
                     .stroke({ color: colorInner, width: 3, cap: 'round' });
            } else if (weaponArchetype === 'SWORD') {
                // Fire/heavy orange-red slash
                colorOuter = 0xff4500;
                colorInner = 0xffcc00;
                pColor = 0xffaa00;
                pCount = 20;
                pForce = 240;

                slash.arc(0, 0, 130, -Math.PI / 3, Math.PI / 3)
                     .stroke({ color: colorOuter, width: 28, cap: 'round' })
                     .stroke({ color: colorInner, width: 8, cap: 'round' });
            } else {
                // Default: Standard sword slash
                slash.arc(0, 0, 120, -Math.PI / 4, Math.PI / 4)
                     .stroke({ color: 0xffffff, width: 24, cap: 'round' })
                     .stroke({ color: 0x00ffff, width: 8, cap: 'round' });
            }

            slash.scale.x = isPlayer ? 1 : -1;
            slash.rotation = isPlayer ? -0.2 : 0.2;
            
            container.addChild(slash);
            container.position.set(x - (isPlayer ? 50 : -50), y - 100);
            container.alpha = 0.9;
            container.scale.set(0.2);

            gsap.to(container.scale, {
                x: isPlayer ? 1.4 : -1.4,
                y: 1.4,
                duration: 0.22,
                ease: 'power2.out',
            });
            gsap.to(container, {
                alpha: 0,
                rotation: isPlayer ? 0.5 : -0.5,
                duration: 0.22,
                ease: 'power2.inOut',
                onComplete: () => {
                    container.destroy({ children: true });
                }
            });

            // Trigger corresponding particle burst for extra impact juice!
            this.particleBurst(x, y, pCount, pColor, pForce);
        } catch (error) {
            console.error('❌ Slash effect error:', error);
        }
    }

    /**
     * Эффект полупрозрачного силуэта (призрачного шлейфа / Ghost Trail)
     */
    public spawnGhostTrail(target: any, durationMs: number = 320, tint: number = 0xffffff): void {
        try {
            if (!target || !target.bodySprite || !target.bodySprite.texture) return;
            
            const ghost = new PIXI.Sprite(target.bodySprite.texture);
            ghost.anchor.set(target.config?.anchors?.feet?.x ?? 0.5, target.config?.anchors?.feet?.y ?? 0.95);
            
            // Match position and scale (base scale and body Container scale combined)
            // Slightly offset trail positions backwards depending on facing direction to make it clearly visible even in static/near-static states
            const isPlayerSide = target.x < 960;
            const offsetDir = isPlayerSide ? -1 : 1;
            const trailOffset = (target.trailCount || 0) * 15 * offsetDir;
            target.trailCount = ((target.trailCount || 0) + 1) % 4;

            ghost.x = target.x - trailOffset;
            ghost.y = target.y;
            ghost.scale.set(
                target.scale.x * (target.bodyContainer?.scale?.x ?? 1),
                target.scale.y * (target.bodyContainer?.scale?.y ?? 1)
            );
            ghost.rotation = target.rotation + (target.bodyContainer?.rotation ?? 0);
            ghost.alpha = 0.6;
            ghost.tint = tint;
            
            this.pixiApp.effectsLayer.addChild(ghost);
            
            gsap.to(ghost, {
                alpha: 0,
                duration: durationMs / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    ghost.destroy();
                }
            });
        } catch (error) {
            console.error('❌ Ghost trail spawn error:', error);
        }
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
