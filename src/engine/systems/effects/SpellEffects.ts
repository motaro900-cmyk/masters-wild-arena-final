import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { GlowFilter } from 'pixi-filters';
import { PixiApp } from '../../core/PixiApp';
import { EffectsManager } from '../EffectsManager';
import { useGameStore } from '../../../store/useGameStore';

/**
 * Эффект удара молнии с неба
 */
export function spawnLightningStrike(targetX: number, targetY: number): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const lightning = new PIXI.Graphics();

        const pointsCount = 8 + Math.floor(Math.random() * 5);
        const points: PIXI.Point[] = [];
        points.push(new PIXI.Point(targetX, 0));

        for (let i = 1; i < pointsCount; i++) {
            const fraction = i / pointsCount;
            const py = targetY * fraction;
            const px = targetX + (Math.random() - 0.5) * 60;
            points.push(new PIXI.Point(px, py));
        }
        points.push(new PIXI.Point(targetX, targetY));

        lightning.beginPath();
        lightning.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            lightning.lineTo(points[i].x, points[i].y);
        }
        lightning.stroke({ color: 0xcceeff, width: 3 });

        if (useGameStore.getState().glowEnabled) {
            try {
                const glow = new GlowFilter({ distance: 15, outerStrength: 3, color: 0xcceeff });
                lightning.filters = [glow];
            } catch (e) {
                console.warn('GlowFilter failed, playing lightning without glow:', e);
            }
        }

        pixiApp.effectsLayer.addChild(lightning);

        const flash = new PIXI.Graphics();
        flash.beginPath();
        flash.rect(0, 0, 1920, 1080);
        flash.fill({ color: 0xffffff, alpha: 0.4 });
        pixiApp.effectsLayer.addChild(flash);

        gsap.to(flash, {
            alpha: 0,
            duration: 0.08,
            ease: 'power2.out',
            onComplete: () => {
                if (flash && !flash.destroyed) {
                    gsap.killTweensOf(flash);
                    flash.destroy();
                }
            },
        });

        gsap.to(lightning, {
            alpha: 0,
            duration: 0.15,
            ease: 'power2.inOut',
            onComplete: () => {
                if (lightning && !lightning.destroyed) {
                    gsap.killTweensOf(lightning);
                    lightning.destroy();
                }
            },
        });

        EffectsManager.getInstance().screenShake(8, 0.9, 300);
    } catch (error) {
        console.error('❌ spawnLightningStrike error:', error);
    }
}

/**
 * Создает огненный шар, летящий от стартовой позиции к цели
 */
export function spawnFireballProjectile(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    victim: any,
): void {
    try {
        const pixiApp = PixiApp.getInstance();
        const fireball = new PIXI.Graphics();
        fireball.beginPath();
        fireball.circle(0, 0, 16);
        fireball.fill({ color: 0xff5500 });
        fireball.position.set(startX, startY);
        pixiApp.effectsLayer.addChild(fireball);

        // GSAP tween for the fireball movement
        gsap.to(fireball, {
            x: targetX,
            y: targetY,
            duration: 0.45,
            ease: 'power1.out',
            onUpdate: () => {
                if (fireball.destroyed) return;

                const particle = new PIXI.Graphics();
                const radius = 4 + Math.random() * 4;
                particle.beginPath();
                particle.circle(0, 0, radius);
                particle.fill({ color: 0xff4400 });
                particle.position.set(fireball.x + (Math.random() - 0.5) * 8, fireball.y + (Math.random() - 0.5) * 8);
                pixiApp.effectsLayer.addChild(particle);

                gsap.to(particle, {
                    alpha: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        if (particle && !particle.destroyed) {
                            gsap.killTweensOf(particle);
                            particle.destroy();
                        }
                    },
                });
            },
            onComplete: () => {
                if (fireball && !fireball.destroyed) {
                    gsap.killTweensOf(fireball);
                    fireball.destroy();
                }
                spawnExplosion(targetX, targetY);

                if (victim && !victim.destroyed && typeof victim.applyBurnStatus === 'function') {
                    victim.applyBurnStatus(2000);
                }
            },
        });
    } catch (error) {
        console.error('❌ spawnFireballProjectile error:', error);
    }
}

/**
 * Взрыв от попадания огненного шара
 */
export function spawnExplosion(x: number, y: number): void {
    try {
        const pixiApp = PixiApp.getInstance();
        EffectsManager.getInstance().screenShake(4, 0.95, 200);

        for (let i = 0; i < 12; i++) {
            const particle = new PIXI.Graphics();
            const radius = 6 + Math.random() * 6;
            particle.beginPath();
            particle.circle(0, 0, radius);
            particle.fill({ color: 0xff5500 });
            particle.position.set(x, y);
            pixiApp.effectsLayer.addChild(particle);

            const angle = (i * Math.PI * 2) / 12 + (Math.random() - 0.5) * 0.2;
            const distance = 50 + Math.random() * 60;

            gsap.to(particle, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.35,
                ease: 'power2.out',
                onComplete: () => {
                    if (particle && !particle.destroyed) {
                        gsap.killTweensOf(particle);
                        particle.destroy();
                    }
                },
            });
        }
    } catch (error) {
        console.error('❌ spawnExplosion error:', error);
    }
}
