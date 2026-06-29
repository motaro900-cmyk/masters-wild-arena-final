import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiApp } from '../../core/PixiApp';
import { SoundManager } from '../SoundManager';
import { EffectsManager } from '../EffectsManager';
import { IEffectTarget } from '../EffectsManager';

/**
 * Комплексная визуализация попадания в зависимости от типа события и классов
 */
export function applyHitResolution(
    attackerRole: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT' | undefined,
    _defenderRole: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT' | undefined,
    hitType: 'HIT' | 'CRIT' | 'DODGE' | 'BLOCK' | 'INSTINCT' | 'BURN' | 'POISON' | 'FREEZE' | 'STUN',
    targetUnit: IEffectTarget,
    isPlayerTarget: boolean,
    attackerUnit?: IEffectTarget | null,
    damage?: number,
): void {
    try {
        if (!targetUnit || targetUnit.destroyed) return;

        const fx = EffectsManager.getInstance();

        // 1. Обработка уклонения (DODGE)
        if (hitType === 'DODGE') {
            dodgeEffect(targetUnit);
            // Плавное быстрое отклонение в сторону (только если не в броске)
            if (!targetUnit.isLunging) {
                gsap.killTweensOf(targetUnit, { x: true });
                const direction = isPlayerTarget ? 1 : -1; // Уворот смещает вперед/в сторону
                gsap.to(targetUnit, {
                    x: targetUnit.x + 25 * direction,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: 'sine.inOut',
                    onComplete: () => {
                        if (!targetUnit.destroyed) {
                            targetUnit.x = targetUnit.defaultX ?? targetUnit.x;
                        }
                    },
                });
            }
            return;
        }

        // 2. Обработка блокирования (BLOCK)
        if (hitType === 'BLOCK') {
            blockEffect(targetUnit, attackerUnit);
            const shieldColor = (targetUnit as any).config?.color ?? 0x00d4ff;
            spawnBastionShield(targetUnit.x, targetUnit.y, shieldColor, !isPlayerTarget);
            fx.knockback(targetUnit, isPlayerTarget, 'HIT'); // Легкий отскок
            return;
        }

        // 3. Цветная вспышка (Hit Flash)
        let flashColor = 0xff6666; // Дефолтный красный
        if (hitType === 'CRIT') {
            if (attackerRole === 'TANK')
                flashColor = 0xffd700; // Золотая вспышка
            else if (attackerRole === 'ASSASSIN')
                flashColor = 0xbd00ff; // Фиолетовая вспышка
            else flashColor = 0x00ffff; // Бирюзовая вспышка
        }
        const flashSprite = targetUnit.bodySprite || targetUnit;
        if (flashSprite) {
            fx.colorFlash(flashSprite, flashColor, hitType === 'CRIT' ? 0.25 : 0.15);
        }

        // 4. Физический отскок (Knockback)
        const knockbackType = hitType === 'CRIT' ? 'CRIT' : 'HIT';
        fx.knockback(targetUnit, isPlayerTarget, knockbackType);

        // 5. Тряска экрана (Camera Shake) & Earthquake Slam для Бойцов
        if (hitType === 'CRIT') {
            const shakeIntensity = attackerRole === 'TANK' ? 14 : attackerRole === 'ASSASSIN' ? 8 : 10;
            fx.screenShake(shakeIntensity, 0.93, 300);

            if (attackerRole === 'WARRIOR') {
                const crackColor = attackerUnit && (attackerUnit as any).config?.color ? (attackerUnit as any).config.color : 0xd4a373;
                spawnEarthquakeFissures(targetUnit.x, targetUnit.y, crackColor);
            }
        } else {
            const shakeIntensity = attackerRole === 'TANK' ? 6 : 3;
            fx.screenShake(shakeIntensity, 0.95, 150);
        }

        // 6. Стоп-кадр (Freeze Frame) для Критов
        if (hitType === 'CRIT') {
            const freezeDuration = attackerRole === 'TANK' ? 80 : attackerRole === 'ASSASSIN' ? 50 : 65;
            fx.freezeFrame(freezeDuration, 0.05);
        }

        // 7. Взрыв искр/частиц (Particle Burst)
        let pColor = 0xff8888;
        if (attackerRole === 'TANK') pColor = 0xffbb00;
        else if (attackerRole === 'ASSASSIN') pColor = 0xda70d6;
        else pColor = 0x80ffdb;

        if (targetUnit.isBurningStatus) pColor = 0xff5500;
        else if (targetUnit.isFrozenStatus) pColor = 0x88ccff;
        else if (targetUnit.isPoisonedStatus) pColor = 0x44ff44;

        let px = targetUnit.x;
        let py = targetUnit.y - 80;
        if (typeof targetUnit.getVisualCenter === 'function') {
            const center = targetUnit.getVisualCenter();
            if (center) {
                px = center.x;
                py = center.y;
            }
        }

        if (hitType === 'HIT' || hitType === 'CRIT') {
            spawnImpactParticles(damage || 0, px, py, pColor);
            if (hitType === 'CRIT') {
                spawnSmokePuff(targetUnit.x, targetUnit.y);
            } else {
                spawnDustPuff(targetUnit.x, targetUnit.y, 0.7);
            }
        } else {
            fx.particleBurst(px, py, 6, pColor, 130);
        }
    } catch (error) {
        console.error('❌ applyHitResolution error:', error);
    }
}

export function criticalHit(target: IEffectTarget, intensity: number = 1.5): void {
    try {
        if (import.meta.env.DEV) console.log(`🌟 CRITICAL HIT EFFECT!`);

        const fx = EffectsManager.getInstance();

        // Звук критического удара
        SoundManager.getInstance().playCrit();

        // Тряска
        fx.screenShake(8, 0.95, 400);

        // Вспышка желтого
        const flashSprite = target.bodySprite || target;
        if (flashSprite instanceof PIXI.Sprite) {
            fx.colorFlash(flashSprite, 0xffff00, 0.3);
        }

        // Нахождение центра мишени
        let px = target.x;
        let py = target.y - 100;
        if (typeof target.getVisualCenter === 'function') {
            const center = target.getVisualCenter();
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
        fx.particleBurst(px, py, 20, 0xffdd00, 250 * intensity);

        // Замедление времени
        fx.slowMotion(0.4, 0.3);
    } catch (error) {
        console.error('❌ Critical hit error:', error);
    }
}

export function normalHit(target: IEffectTarget): void {
    try {
        const fx = EffectsManager.getInstance();

        SoundManager.getInstance().playHit();
        fx.screenShake(5, 0.95, 200);

        const flashSprite = target.bodySprite || target;
        if (flashSprite instanceof PIXI.Sprite) {
            fx.colorFlash(flashSprite, 0xff6666, 0.15);
        }

        // Нахождение центра мишени
        let px = target.x;
        let py = target.y - 100;
        if (typeof target.getVisualCenter === 'function') {
            const center = target.getVisualCenter();
            if (center) {
                px = center.x;
                py = center.y;
            }
        } else if (target.parent) {
            const globalPos = target.toGlobal(new PIXI.Point(0, 0));
            px = globalPos.x;
            py = globalPos.y;
        }

        fx.particleBurst(px, py, 8, 0xff8888, 150);
    } catch (error) {
        console.error('❌ Normal hit error:', error);
    }
}

export function dodgeEffect(target: IEffectTarget): void {
    try {
        let px = target.x;
        let py = target.y - 100;
        if (typeof target.getVisualCenter === 'function') {
            const center = target.getVisualCenter();
            if (center) {
                px = center.x;
                py = center.y;
            }
        }
        EffectsManager.getInstance().particleBurst(px, py, 6, 0xaaccff, 120);
    } catch (error) {
        console.error('❌ Dodge effect error:', error);
    }
}

export function blockEffect(target: IEffectTarget, attacker?: IEffectTarget | null): void {
    try {
        let px = target.x;
        let py = target.y - 100;
        if (
            attacker &&
            typeof attacker.getSocketGlobalPosition === 'function' &&
            typeof target.getSocketGlobalPosition === 'function'
        ) {
            const attackPos = attacker.getSocketGlobalPosition('rightHand');
            const defendPos = target.getSocketGlobalPosition('leftHand');
            px = (attackPos.x + defendPos.x) / 2;
            py = (attackPos.y + defendPos.y) / 2;
        } else if (typeof target.getVisualCenter === 'function') {
            const center = target.getVisualCenter();
            if (center) {
                px = center.x;
                py = center.y;
            }
        }
        spawnBlockSparks(px, py);
    } catch (error) {
        console.error('❌ Block effect error:', error);
    }
}

export function deathEffect(target: IEffectTarget): void {
    try {
        const fx = EffectsManager.getInstance();
        fx.screenShake(12, 0.9, 450);

        // Нахождение центра мишени
        let px = target.x;
        let py = target.y - 100;
        if (typeof target.getVisualCenter === 'function') {
            const center = target.getVisualCenter();
            if (center) {
                px = center.x;
                py = center.y;
            }
        } else if (target.parent) {
            const globalPos = target.toGlobal(new PIXI.Point(0, 0));
            px = globalPos.x;
            py = globalPos.y;
        }

        const charColor = (target as any).config?.color ?? 0xff0000;

        // Взрыв частиц цвета героя
        fx.particleBurst(px, py, 25, charColor, 250);
        // Дополнительный кольцевой взрыв светящихся искр
        fx.particleBurst(px, py, 15, 0xffffff, 350);

        // Спавним густой дым рассеивания
        spawnSmokePuff(target.x, target.y);

        // Белая вспышка на спрайте (как при перерождении)
        const flashSprite = target.bodySprite || target;
        if (flashSprite) {
            fx.colorFlash(flashSprite, 0xffffff, 0.4);
        }

        // Растворение персонажа
        fx.fadeOut(target, 1.2);
    } catch (error) {
        console.error('❌ Death effect error:', error);
    }
}

export function slashEffect(
    x: number,
    y: number,
    isPlayer: boolean,
    attackerRole?: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT',
    isCrit: boolean = false,
): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const fx = EffectsManager.getInstance();

        const container = new PIXI.Container();
        pixiApp.effectsLayer.addChild(container);

        const slash = new PIXI.Graphics();

        let colorOuter = 0x00ffff;
        let colorInner = 0xffffff;
        let pColor = 0x00ffff;
        let pCount = 10;
        let pForce = 160;

        if (attackerRole === 'TANK') {
            colorOuter = 0xffa500;
            colorInner = 0xffe4b5;
            pColor = 0xffbb00;
            pCount = 18;
            pForce = 240;

            slash
                .arc(0, 0, 130, -Math.PI / 3, Math.PI / 3)
                .stroke({ color: colorOuter, width: 32, cap: 'round' })
                .stroke({ color: colorInner, width: 10, cap: 'round' });
        } else if (attackerRole === 'ASSASSIN') {
            colorOuter = 0xbd00ff;
            colorInner = 0xffa6ff;
            pColor = 0xda70d6;
            pCount = 12;
            pForce = 180;

            if (isCrit) {
                slash
                    .moveTo(-60, -60)
                    .lineTo(60, 60)
                    .moveTo(60, -60)
                    .lineTo(-60, 60)
                    .stroke({ color: colorOuter, width: 14, cap: 'round' })
                    .stroke({ color: colorInner, width: 4, cap: 'round' });
            } else {
                slash
                    .arc(0, 0, 110, -Math.PI / 4, Math.PI / 4)
                    .stroke({ color: colorOuter, width: 16, cap: 'round' })
                    .stroke({ color: colorInner, width: 4, cap: 'round' });
            }
        } else {
            colorOuter = 0x00bfff;
            colorInner = 0xffffff;
            pColor = 0x00e5ff;
            pCount = 14;
            pForce = 200;

            if (isCrit) {
                slash
                    .moveTo(-65, -45)
                    .lineTo(65, 45)
                    .moveTo(65, -45)
                    .lineTo(-65, 45)
                    .stroke({ color: colorOuter, width: 18, cap: 'round' })
                    .stroke({ color: colorInner, width: 5, cap: 'round' });
            } else {
                slash
                    .arc(0, 0, 120, -Math.PI / 4, Math.PI / 4)
                    .stroke({ color: colorOuter, width: 22, cap: 'round' })
                    .stroke({ color: colorInner, width: 6, cap: 'round' });
            }
        }

        slash.scale.x = isPlayer ? 1 : -1;
        slash.rotation = isPlayer ? -0.3 : 0.3;

        container.addChild(slash);
        container.position.set(x - (isPlayer ? 30 : -30), y - 90);
        container.alpha = 0.95;
        container.scale.set(isPlayer ? 0.65 : -0.65);

        gsap.to(container.scale, {
            x: isPlayer ? 2.2 : -2.2,
            y: 2.2,
            duration: 0.32,
            ease: 'power2.out',
        });
        gsap.to(container, {
            alpha: 0,
            rotation: isPlayer ? 0.7 : -0.7,
            duration: 0.32,
            ease: 'power1.out',
            onComplete: () => {
                gsap.killTweensOf(container);
                gsap.killTweensOf(container.scale);
                container.destroy({ children: true });
            },
        });

        fx.particleBurst(x, y, pCount, pColor, pForce);
        spawnDustPuff(x, y, isCrit ? 1.4 : 0.95);
    } catch (error) {
        console.error('❌ Slash effect error:', error);
    }
}

export function spawnGhostTrail(target: any, durationMs: number = 320, tint: number = 0xffffff): void {
    try {
        if (!target || !target.bodySprite || !target.bodySprite.texture) return;

        const pixiApp = PixiApp.getInstance();
        const anyFx = EffectsManager.getInstance() as any;

        anyFx.activeTrails = anyFx.activeTrails.filter((t: any) => !t.destroyed);

        while (anyFx.activeTrails.length >= 3) {
            const oldest = anyFx.activeTrails.shift();
            if (oldest) oldest.destroy();
        }

        const ghost = new PIXI.Sprite(target.bodySprite.texture);
        ghost.anchor.set(target.config?.anchors?.feet?.x ?? 0.5, target.config?.anchors?.feet?.y ?? 0.95);

        const isPlayerSide = target.x < 960;
        const offsetDir = isPlayerSide ? -1 : 1;
        const trailOffset = (target.trailCount || 0) * 15 * offsetDir;
        target.trailCount = ((target.trailCount || 0) + 1) % 4;

        ghost.x = target.x - trailOffset;
        ghost.y = target.y;
        ghost.scale.set(
            target.scale.x * (target.bodyContainer?.scale?.x ?? 1),
            target.scale.y * (target.bodyContainer?.scale?.y ?? 1),
        );
        ghost.rotation = target.rotation + (target.bodyContainer?.rotation ?? 0);
        ghost.alpha = 0.6;
        ghost.tint = tint;

        pixiApp.effectsLayer.addChild(ghost);
        anyFx.activeTrails.push(ghost);

        gsap.to(ghost, {
            alpha: 0,
            duration: durationMs / 1000,
            ease: 'power2.out',
            onComplete: () => {
                gsap.killTweensOf(ghost);
                ghost.destroy();
                anyFx.activeTrails = anyFx.activeTrails.filter((t: any) => t !== ghost);
            },
        });
    } catch (error) {
        console.error('❌ Ghost trail spawn error:', error);
    }
}

export function spawnDustPuff(x: number, y: number, baseScale: number = 1.0): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const container = new PIXI.Container();
        container.position.set(x, y);
        pixiApp.effectsLayer.addChild(container);

        const puffsCount = Math.round((5 + Math.floor(Math.random() * 4)) * baseScale);
        for (let i = 0; i < puffsCount; i++) {
            const puff = new PIXI.Graphics();
            const radius = (10 + Math.random() * 15) * baseScale;
            puff.beginPath();
            puff.circle(0, 0, radius);
            puff.fill({ color: 0xdddddd, alpha: 0.28 });
            puff.blendMode = 'add';

            puff.x = (Math.random() - 0.5) * 40 * baseScale;
            puff.y = (Math.random() - 0.5) * 20 * baseScale - 10;
            container.addChild(puff);

            const targetX = puff.x + (Math.random() - 0.5) * 80 * baseScale;
            const targetY = puff.y - (40 + Math.random() * 50) * baseScale;
            const targetScale = 1.8 + Math.random() * 1.0;

            gsap.to(puff, {
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.4,
                ease: 'power2.out',
                onUpdate: () => {
                    if (!puff.destroyed) {
                        puff.scale.set(1 + (targetScale - 1) * (1 - puff.alpha));
                    }
                },
                onComplete: () => {
                    if (puff && !puff.destroyed) {
                        gsap.killTweensOf(puff);
                        puff.destroy();
                    }
                },
            });
        }

        setTimeout(() => {
            if (container && !container.destroyed) {
                container.children.forEach((child) => {
                    gsap.killTweensOf(child);
                });
                container.destroy({ children: true });
            }
        }, 1000);
    } catch (e) {
        console.error('Error spawning dust puff:', e);
    }
}

export function spawnBlockSparks(x: number, y: number): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const sparksCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < sparksCount; i++) {
            const spark = new PIXI.Graphics();
            const length = 10 + Math.random() * 15;
            const angle = Math.random() * Math.PI * 2;

            spark.beginPath();
            spark.moveTo(0, 0);
            spark.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            spark.stroke({ color: 0xffee88, width: 2 });

            spark.position.set(x, y);
            pixiApp.effectsLayer.addChild(spark);

            const velocityX = Math.cos(angle) * (20 + Math.random() * 30);
            const velocityY = Math.sin(angle) * (20 + Math.random() * 30);

            gsap.to(spark, {
                x: x + velocityX,
                y: y + velocityY,
                alpha: 0,
                duration: 0.2 + Math.random() * 0.05,
                ease: 'power2.out',
                onUpdate: () => {
                    if (!spark.destroyed) {
                        spark.scale.set(spark.alpha);
                    }
                },
                onComplete: () => {
                    if (spark && !spark.destroyed) {
                        gsap.killTweensOf(spark);
                        spark.destroy();
                    }
                },
            });
        }
    } catch (error) {
        console.error('❌ spawnBlockSparks error:', error);
    }
}

export function spawnSmokePuff(x: number, y: number): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const container = new PIXI.Container();
        container.position.set(x, y);
        pixiApp.effectsLayer.addChild(container);

        const puffCount = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < puffCount; i++) {
            const circle = new PIXI.Graphics();
            const radius = 15 + Math.random() * 15;
            circle.beginPath();
            circle.circle(0, 0, radius);
            circle.fill({ color: 0x999999, alpha: 0.6 });

            circle.x = (Math.random() - 0.5) * 50;
            circle.y = (Math.random() - 0.5) * 50 - 40;
            container.addChild(circle);

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 50;

            gsap.to(circle, {
                x: circle.x + Math.cos(angle) * distance,
                y: circle.y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.4,
                ease: 'power1.out',
                onUpdate: () => {
                    if (!circle.destroyed) {
                        circle.scale.set(0.5 + 1.5 * (1 - circle.alpha));
                    }
                },
                onComplete: () => {
                    if (circle && !circle.destroyed) {
                        gsap.killTweensOf(circle);
                        circle.destroy();
                    }
                },
            });
        }

        setTimeout(() => {
            if (container && !container.destroyed) {
                container.children.forEach((child) => {
                    gsap.killTweensOf(child);
                });
                container.destroy({ children: true });
            }
        }, 500);
    } catch (error) {
        console.error('❌ spawnSmokePuff error:', error);
    }
}

export function spawnImpactParticles(damage: number, x: number, y: number, color: number = 0xff5533): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const fx = EffectsManager.getInstance();

        let particlesCount = 4;
        let spread = 30;
        let shakeIntensity = 0;
        let shakeDuration = 0;
        let hasFlash = false;

        if (damage > 50) {
            particlesCount = 18;
            spread = 100;
            shakeIntensity = 7;
            shakeDuration = 250;
            hasFlash = true;
        } else if (damage > 20) {
            particlesCount = 10;
            spread = 60;
            shakeIntensity = 3;
            shakeDuration = 150;
        }

        if (shakeIntensity > 0) {
            fx.screenShake(shakeIntensity, 0.95, shakeDuration);
        }

        if (hasFlash) {
            const flash = new PIXI.Graphics();
            flash.beginPath();
            flash.rect(0, 0, 1920, 1080);
            flash.fill({ color: 0xffffff, alpha: 0.35 });
            pixiApp.effectsLayer.addChild(flash);

            gsap.to(flash, {
                alpha: 0,
                duration: 0.05,
                onComplete: () => {
                    if (flash && !flash.destroyed) {
                        gsap.killTweensOf(flash);
                        flash.destroy();
                    }
                },
            });
        }

        for (let i = 0; i < particlesCount; i++) {
            const p = new PIXI.Graphics();
            const radius = 3 + Math.random() * 4;

            p.beginPath();
            if (Math.random() < 0.5) {
                p.circle(0, 0, radius);
            } else {
                let rot = (Math.PI / 2) * 3;
                const step = Math.PI / 5;
                p.moveTo(0, -radius);
                for (let j = 0; j < 5; j++) {
                    let sx = Math.cos(rot) * radius;
                    let sy = Math.sin(rot) * radius;
                    p.lineTo(sx, sy);
                    rot += step;
                    sx = Math.cos(rot) * (radius * 0.4);
                    sy = Math.sin(rot) * (radius * 0.4);
                    p.lineTo(sx, sy);
                    rot += step;
                }
                p.closePath();
            }

            p.fill({ color: color });
            p.position.set(x, y);
            pixiApp.effectsLayer.addChild(p);

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spread;

            gsap.to(p, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    if (p && !p.destroyed) {
                        gsap.killTweensOf(p);
                        p.destroy();
                    }
                },
            });
        }
    } catch (error) {
        console.error('❌ spawnImpactParticles error:', error);
    }
}

export function spawnEarthquakeFissures(x: number, y: number, color: number = 0xd4a373): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const container = new PIXI.Container();
        container.position.set(x, y);
        pixiApp.effectsLayer.addChild(container);

        const fissure = new PIXI.Graphics();
        fissure.beginPath();
        fissure.stroke({ color: color, width: 4 });

        const paths = [
            [{ x: 0, y: 0 }, { x: -30, y: 15 }, { x: -70, y: 10 }, { x: -110, y: 25 }],
            [{ x: 0, y: 0 }, { x: 40, y: -10 }, { x: 80, y: -5 }, { x: 120, y: -20 }],
            [{ x: 0, y: 0 }, { x: -10, y: 35 }, { x: 15, y: 70 }, { x: 5, y: 100 }]
        ];

        paths.forEach(path => {
            fissure.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                fissure.lineTo(path[i].x, path[i].y);
            }
        });
        container.addChild(fissure);

        gsap.to(container, {
            alpha: 0,
            duration: 0.6,
            ease: 'power1.in',
            onComplete: () => {
                if (container && !container.destroyed) {
                    gsap.killTweensOf(container);
                    container.destroy({ children: true });
                }
            }
        });
    } catch (e) {
        console.error('❌ spawnEarthquakeFissures error:', e);
    }
}

export function spawnBastionShield(x: number, y: number, color: number = 0x00d4ff, isPlayer: boolean = true): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const container = new PIXI.Container();
        container.position.set(x, y - 80);
        pixiApp.effectsLayer.addChild(container);

        const shield = new PIXI.Graphics();
        shield.beginPath();
        const startAngle = isPlayer ? Math.PI * 0.6 : -Math.PI * 0.4;
        const endAngle = isPlayer ? Math.PI * 1.4 : Math.PI * 0.4;

        shield.arc(0, 0, 75, startAngle, endAngle);
        shield.stroke({ color: color, width: 8, alpha: 0.8 });
        shield.fill({ color: color, alpha: 0.15 });
        container.addChild(shield);

        const dir = isPlayer ? -1 : 1;
        container.x += 15 * dir;

        gsap.to(container, {
            x: x,
            duration: 0.1,
            ease: 'bounce.out'
        });

        gsap.to(container, {
            alpha: 0,
            duration: 0.4,
            delay: 0.15,
            ease: 'power2.in',
            onComplete: () => {
                if (container && !container.destroyed) {
                    gsap.killTweensOf(container);
                    container.destroy({ children: true });
                }
            }
        });
    } catch (e) {
        console.error('❌ spawnBastionShield error:', e);
    }
}
