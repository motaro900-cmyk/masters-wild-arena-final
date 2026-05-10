import * as PIXI from 'pixi.js';

export interface CharacterConfig {
    id: string;
    name: string;
}

export const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
    panda: { id: 'panda', name: 'Панда' },
    moose: { id: 'moose', name: 'Лось' },
    goose: { id: 'goose', name: 'Гусь' },
    cat: { id: 'cat', name: 'Кот' },
    boar: { id: 'boar', name: 'Кабан' }
};

/**
 * Типы анимаций персонажей
 */
export enum AnimationType {
    IDLE = 'idle',           // Ожидание
    WALK = 'walk',           // Движение
    ATTACK = 'attack',       // Атака
    ATTACK_HEAVY = 'attack_heavy', // Тяжелая атака
    HIT = 'hit',             // Получение урона
    DEATH = 'death',         // Смерть
    SPECIAL = 'special',     // Специальная способность
    POWER_UP = 'power_up',   // Усиление
    WIND_UP = 'wind_up',     // Зарядка
    BLOCK = 'block',         // Блок
    DOUBLE_JUMP = 'double_jump', // Двойной прыжок
}

/**
 * Кадр анимации
 */
export interface AnimationFrame {
    /** Позиция X (0-1 от ширины спрайта) */
    x: number;
    /** Позиция Y (0-1 от высоты спрайта) */
    y: number;
    /** Масштаб */
    scale: number;
    /** Прозрачность (0-1) */
    alpha: number;
    /** Наклон (skew X) */
    skewX: number;
    /** Поворот в градусах */
    rotation: number;
    /** Emoji (если меняется) */
    emoji?: string;
    /** Смещение emoji по X */
    emojiOffsetX: number;
    /** Смещение emoji по Y */
    emojiOffsetY: number;
}

/**
 * Конфиг анимации
 */
export interface AnimationConfig {
    /** Тип анимации */
    type: AnimationType;
    /** Длительность в секундах */
    duration: number;
    /** Кадры анимации (индексы ключевых кадров) */
    frames: { time: number; values: Partial<AnimationFrame> }[];
    /** Easing функция (easeOut, easeIn, bounce и т.д.) */
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
    /** Зацикить анимацию */
    loop?: boolean;
    /** Обратная проигровка (в конце запускает в обратном направлении) */
    pingPong?: boolean;
}

/**
 * Интерполяция между значениями
 */
function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * Easing функции
 */
const EasingFunctions = {
    linear: (t: number): number => t,
    easeIn: (t: number): number => t * t * t,
    easeOut: (t: number): number => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    bounce: (t: number): number => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    elastic: (t: number): number => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    },
};

/**
 * Интерполяция easing между двумя значениями
 */
function applyEasing(value: number, easing: string): number {
    const fn = EasingFunctions[easing as keyof typeof EasingFunctions];
    return fn ? fn(value) : value;
}

/**
 * Генератор анимаций для персонажей
 * Определяет ключевые кадры для каждого типа анимации
 */
export class AnimationConfigGenerator {
    /**
     * Генерация idle анимации (покачивание)
     */
    generateIdle(): AnimationConfig {
        return {
            type: AnimationType.IDLE,
            duration: 2.0,
            easing: 'easeInOut',
            loop: true,
            pingPong: true,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.25, values: { scale: 1.02, y: -0.02, alpha: 1, skewX: 0.03, rotation: 0.02 } },
                { time: 0.5, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.75, values: { scale: 1.02, y: -0.02, alpha: 1, skewX: -0.03, rotation: -0.02 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация walk анимации (подпрыгивание)
     */
    generateWalk(): AnimationConfig {
        return {
            type: AnimationType.WALK,
            duration: 0.6,
            easing: 'easeInOut',
            loop: true,
            pingPong: true,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.25, values: { scale: 1.05, y: -0.03, alpha: 1, skewX: 0.05, rotation: 0.05 } },
                { time: 0.5, values: { scale: 0.95, y: 0.02, alpha: 1, skewX: -0.05, rotation: -0.05 } },
                { time: 0.75, values: { scale: 1.05, y: -0.03, alpha: 1, skewX: 0.05, rotation: 0.05 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация attack анимации (рывок вперед + удар)
     */
    generateAttack(direction: number = 1): AnimationConfig {
        return {
            type: AnimationType.ATTACK,
            duration: 0.4,
            easing: 'easeOut',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.1, values: { scale: 0.9, y: 0.02, alpha: 1, skewX: -direction * 0.1, rotation: -direction * 0.1 } },
                { time: 0.3, values: { scale: 1.3, y: -0.05, alpha: 1, skewX: direction * 0.3, rotation: direction * 0.3 } },
                { time: 0.5, values: { scale: 1.1, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация heavy attack анимации (сильный рывок)
     */
    generateHeavyAttack(direction: number = 1): AnimationConfig {
        return {
            type: AnimationType.ATTACK_HEAVY,
            duration: 0.7,
            easing: 'easeOut',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.15, values: { scale: 0.8, y: 0.05, alpha: 1, skewX: -direction * 0.15, rotation: -direction * 0.15 } },
                { time: 0.4, values: { scale: 1.5, y: -0.1, alpha: 1, skewX: direction * 0.4, rotation: direction * 0.4 } },
                { time: 0.6, values: { scale: 1.2, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация hit анимации (отскок назад)
     */
    generateHit(direction: number = -1): AnimationConfig {
        return {
            type: AnimationType.HIT,
            duration: 0.5,
            easing: 'easeOut',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.1, values: { scale: 1.15, y: 0.05, alpha: 0.7, skewX: direction * 0.2, rotation: direction * 0.2 } },
                { time: 0.3, values: { scale: 0.9, y: -0.03, alpha: 0.8, skewX: direction * -0.15, rotation: direction * -0.15 } },
                { time: 0.6, values: { scale: 1.05, y: 0.02, alpha: 0.9, skewX: direction * 0.05, rotation: direction * 0.05 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация death анимации (сжатие и исчезновение)
     */
    generateDeath(): AnimationConfig {
        return {
            type: AnimationType.DEATH,
            duration: 1.0,
            easing: 'easeIn',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.3, values: { scale: 0.95, y: 0.03, alpha: 0.9, skewX: 0.1, rotation: 0.1 } },
                { time: 0.6, values: { scale: 0.7, y: 0.05, alpha: 0.6, skewX: -0.2, rotation: -0.2 } },
                { time: 1.0, values: { scale: 0.3, y: 0.1, alpha: 0, skewX: 0.3, rotation: 0.5 } },
            ],
        };
    }

    /**
     * Генерация special анимации (прыжок + удар)
     */
    generateSpecial(direction: number = 1): AnimationConfig {
        return {
            type: AnimationType.SPECIAL,
            duration: 0.8,
            easing: 'easeOut',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.15, values: { scale: 0.85, y: 0.05, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.35, values: { scale: 1.4, y: -0.15, alpha: 1, skewX: direction * 0.2, rotation: direction * 0.2 } },
                { time: 0.55, values: { scale: 1.3, y: -0.1, alpha: 1, skewX: direction * 0.3, rotation: direction * 0.3 } },
                { time: 0.7, values: { scale: 1.1, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация power_up анимации (пульсация)
     */
    generatePowerUp(): AnimationConfig {
        return {
            type: AnimationType.POWER_UP,
            duration: 1.5,
            easing: 'easeInOut',
            loop: true,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.25, values: { scale: 1.1, y: -0.03, alpha: 1, skewX: 0.05, rotation: 0.05 } },
                { time: 0.5, values: { scale: 1.0, y: 0.02, alpha: 1, skewX: -0.05, rotation: -0.05 } },
                { time: 0.75, values: { scale: 1.1, y: -0.03, alpha: 1, skewX: 0.05, rotation: 0.05 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация wind_up анимации (зарядка)
     */
    generateWindUp(): AnimationConfig {
        return {
            type: AnimationType.WIND_UP,
            duration: 1.0,
            easing: 'easeIn',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.3, values: { scale: 0.9, y: 0.03, alpha: 1, skewX: -0.1, rotation: -0.1 } },
                { time: 0.6, values: { scale: 0.85, y: 0.05, alpha: 1, skewX: -0.15, rotation: -0.15 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Генерация block анимации (защитная поза)
     */
    generateBlock(): AnimationConfig {
        return {
            type: AnimationType.BLOCK,
            duration: 0.5,
            easing: 'easeOut',
            loop: true,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.3, values: { scale: 0.95, y: 0.02, alpha: 1, skewX: -0.05, rotation: -0.05 } },
                { time: 1.0, values: { scale: 0.95, y: 0.02, alpha: 1, skewX: -0.05, rotation: -0.05 } },
            ],
        };
    }

    /**
     * Генерация double jump анимации
     */
    generateDoubleJump(): AnimationConfig {
        return {
            type: AnimationType.DOUBLE_JUMP,
            duration: 0.6,
            easing: 'easeOut',
            loop: false,
            frames: [
                { time: 0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.2, values: { scale: 0.85, y: 0.05, alpha: 1, skewX: 0, rotation: 0 } },
                { time: 0.5, values: { scale: 1.2, y: -0.1, alpha: 1, skewX: 0.1, rotation: 0.1 } },
                { time: 1.0, values: { scale: 1.0, y: 0, alpha: 1, skewX: 0, rotation: 0 } },
            ],
        };
    }

    /**
     * Получить все доступные анимации для персонажа
     */
    getAllAnimations(): Map<AnimationType, AnimationConfig> {
        const animations = new Map<AnimationType, AnimationConfig>();
        
        // Стандартные анимации
        animations.set(AnimationType.IDLE, this.generateIdle());
        animations.set(AnimationType.WALK, this.generateWalk());
        animations.set(AnimationType.HIT, this.generateHit());
        animations.set(AnimationType.DEATH, this.generateDeath());
        animations.set(AnimationType.POWER_UP, this.generatePowerUp());
        animations.set(AnimationType.WIND_UP, this.generateWindUp());
        animations.set(AnimationType.BLOCK, this.generateBlock());
        
        return animations;
    }
}

const animationConfigGenerator = new AnimationConfigGenerator();

/**
 * Система анимаций для персонажей
 * Управляет интерполяцией между ключевыми кадрами
 */
export class AnimationSystem {
    private currentAnimations: Map<AnimationType, {
        config: AnimationConfig;
        startTime: number;
        currentFrameIndex: number;
    }> = new Map();

    private sprites: Map<AnimationType, PIXI.Sprite> = new Map();
    private isPlaying = false;

    /**
     * Запустить анимацию для спрайта
     */
    playAnimation(
        sprite: PIXI.Sprite,
        animationType: AnimationType,
        config: AnimationConfig,
        extraParams?: { direction?: number }
    ): void {
        // Генерируем конфиг если не предоставлен
        const animationConfig = config || this.generateAnimation(animationType, sprite, extraParams);

        this.currentAnimations.set(animationType, {
            config: animationConfig,
            startTime: performance.now() / 1000,
            currentFrameIndex: 0,
        });

        this.sprites.set(animationType, sprite);
        this.isPlaying = true;

        console.log(`▶️ [AnimationSystem] Playing animation: ${animationType}`);
    }

    /**
     * Остановить анимацию
     */
    stopAnimation(animationType?: AnimationType): void {
        if (animationType) {
            this.currentAnimations.delete(animationType);
            this.sprites.delete(animationType);
        } else {
            this.currentAnimations.clear();
            this.sprites.clear();
        }
        this.isPlaying = false;
    }

    /**
     * Обновить анимации (вызывать каждый кадр)
     */
    update(deltaTime: number = 1 / 60): void {
        if (!this.isPlaying) return;

        const currentTime = performance.now() / 1000;

        for (const [type, anim] of this.currentAnimations) {
            const sprite = this.sprites.get(type);
            if (!sprite) continue;

            const { config } = anim;
            const progress = Math.min((currentTime - anim.startTime) / config.duration, 1.0);

            // Определяем текущий кадр
            let frameIndex = 0;
            for (let i = config.frames.length - 1; i >= 0; i--) {
                if (progress >= config.frames[i].time) {
                    frameIndex = i;
                    break;
                }
            }

            // Интерполяция между кадрами
            const currentFrame = config.frames[frameIndex];
            const nextFrameIndex = Math.min(frameIndex + 1, config.frames.length - 1);
            const nextFrame = config.frames[nextFrameIndex];

            // Время внутри текущего сегмента
            const segmentDuration = nextFrame.time - currentFrame.time;
            let segmentProgress = segmentDuration > 0 ? (progress - currentFrame.time) / segmentDuration : 0;

            // Применяем easing
            if (config.easing) {
                segmentProgress = applyEasing(segmentProgress, config.easing);
            }

            // Применяем pingPong
            if (config.pingPong) {
                const pingPongProgress = segmentProgress < 0.5
                    ? segmentProgress * 2
                    : (1 - segmentProgress) * 2;
                segmentProgress = pingPongProgress;
            }

            // Интерполируем свойства
            const startValues = currentFrame.values;
            const endValues = nextFrame.values;

            // Применяем значение к спрайту
            if (startValues.scale !== undefined && endValues.scale !== undefined) {
                const scale = lerp(startValues.scale, endValues.scale, segmentProgress);
                sprite.scale.set(scale);
            }

            if (startValues.y !== undefined && endValues.y !== undefined) {
                sprite.y += (lerp(startValues.y, endValues.y, segmentProgress) - (startValues.y || 0)) * deltaTime * 60;
            }

            if (startValues.alpha !== undefined && endValues.alpha !== undefined) {
                sprite.alpha = lerp(startValues.alpha, endValues.alpha, segmentProgress);
            }

            if (startValues.skewX !== undefined && endValues.skewX !== undefined) {
                sprite.skew.x = lerp(startValues.skewX, endValues.skewX, segmentProgress);
            }

            if (startValues.rotation !== undefined && endValues.rotation !== undefined) {
                sprite.rotation = lerp(startValues.rotation, endValues.rotation, segmentProgress);
            }

            // Обновляем emoji если изменился
            if (endValues.emoji) {
                this.updateEmoji(sprite, endValues.emoji);
            }

            // Проверяем завершение анимации
            if (progress >= 1.0) {
                if (config.loop) {
                    // Перезапускаем анимацию
                    anim.startTime = currentTime;
                } else {
                    // Удаляем анимацию
                    this.currentAnimations.delete(type);
                    this.sprites.delete(type);
                    if (this.currentAnimations.size === 0) {
                        this.isPlaying = false;
                    }
                }
            }
        }
    }

    /**
     * Обновить emoji на спрайте
     */
    private updateEmoji(sprite: PIXI.Sprite, emoji: string): void {
        // Создаем временный canvas для рендеринга emoji
        const tempCanvas = document.createElement('canvas');
        const size = 256;
        const resolution = 2;
        tempCanvas.width = size * resolution;
        tempCanvas.height = size * resolution;

        const ctx = tempCanvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.font = `${size * resolution}px "Noto Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Arial"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Тень
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = size * 0.06 * resolution;
        ctx.shadowOffsetX = size * 0.02 * resolution;
        ctx.shadowOffsetY = size * 0.02 * resolution;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(emoji, tempCanvas.width / 2, tempCanvas.height / 2);

        // Создаем новую текстуру
        const newTexture = PIXI.Texture.from(tempCanvas);
        sprite.texture = newTexture;
    }

    /**
     * Сгенерировать анимацию по типу
     */
    private generateAnimation(
        type: AnimationType,
        _sprite: PIXI.Sprite,
        extraParams?: { direction?: number }
    ): AnimationConfig {
        switch (type) {
            case AnimationType.IDLE:
                return animationConfigGenerator.generateIdle();
            case AnimationType.WALK:
                return animationConfigGenerator.generateWalk();
            case AnimationType.ATTACK:
                return animationConfigGenerator.generateAttack(extraParams?.direction || 1);
            case AnimationType.ATTACK_HEAVY:
                return animationConfigGenerator.generateHeavyAttack(extraParams?.direction || 1);
            case AnimationType.HIT:
                return animationConfigGenerator.generateHit(extraParams?.direction || -1);
            case AnimationType.DEATH:
                return animationConfigGenerator.generateDeath();
            case AnimationType.SPECIAL:
                return animationConfigGenerator.generateSpecial(extraParams?.direction || 1);
            case AnimationType.POWER_UP:
                return animationConfigGenerator.generatePowerUp();
            case AnimationType.WIND_UP:
                return animationConfigGenerator.generateWindUp();
            case AnimationType.BLOCK:
                return animationConfigGenerator.generateBlock();
            case AnimationType.DOUBLE_JUMP:
                return animationConfigGenerator.generateDoubleJump();
            default:
                return animationConfigGenerator.generateIdle();
        }
    }

    /**
     * Получить текущую анимацию
     */
    getCurrentAnimation(type: AnimationType): AnimationConfig | undefined {
        const anim = this.currentAnimations.get(type);
        return anim?.config;
    }

    /**
     * Проверить запущена ли анимация
     */
    isAnimationPlaying(type: AnimationType): boolean {
        return this.currentAnimations.has(type);
    }

    /**
     * Проверить запущены ли какие-либо анимации
     */
    get isAnyAnimationPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Очистить все анимации
     */
    clear(): void {
        this.currentAnimations.clear();
        this.sprites.clear();
        this.isPlaying = false;
    }
}

// Экспорт единого экземпляра
export const animationSystem = new AnimationSystem();

// Экспорт генератора для создания кастомных анимаций
export { animationConfigGenerator };
