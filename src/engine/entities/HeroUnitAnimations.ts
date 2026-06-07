import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import { audioService } from '../../services/AudioService';
import { EffectsManager } from '../systems/EffectsManager';
import type { HeroUnit } from './HeroUnit';

/**
 * Телепортация персонажа с эффектом тумана
 */
export function teleportTo(unit: HeroUnit, newX: number, newY: number): Promise<void> {
    return new Promise((resolve) => {
        EffectsManager.getInstance().spawnSmokePuff(unit.x, unit.y);

        gsap.to(unit, {
            alpha: 0,
            duration: 0.2,
            onComplete: () => {
                unit.x = newX;
                unit.y = newY;
                EffectsManager.getInstance().spawnSmokePuff(newX, newY);

                gsap.to(unit, {
                    alpha: 1,
                    duration: 0.2,
                    onComplete: () => {
                        resolve();
                    },
                });
            },
        });
    });
}

/**
 * Прыжок + приземление с ударом (Landing Slam)
 */
export function jumpSlam(unit: HeroUnit, targetX: number): Promise<void> {
    return new Promise((resolve) => {
        const originalY = unit.y;

        // 1. Прыжок вверх
        gsap.to(unit, {
            y: unit.y - 120,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                // 2. Падение на цель
                gsap.to(unit, {
                    y: originalY,
                    x: targetX,
                    duration: 0.2,
                    ease: 'power2.in',
                    onComplete: () => {
                        (unit as any).spawnLandingEffect();
                        resolve();
                    },
                });
            },
        });
    });
}

/**
 * Визуальный эффект приземления после прыжка
 */
export function spawnLandingEffect(unit: HeroUnit): void {
    try {
        if (!unit.parent) return;

        const ring = new PIXI.Graphics();
        ring.beginPath();
        ring.circle(0, 0, 30);
        ring.stroke({ color: 0xdddddd, width: 4 });
        ring.position.set(unit.x, unit.y);
        unit.parent.addChild(ring);

        ring.scale.set(0);
        gsap.to(ring.scale, {
            x: 3,
            y: 3,
            duration: 0.3,
            ease: 'power1.out',
            onComplete: () => {
                if (ring && !ring.destroyed) {
                    gsap.killTweensOf(ring);
                    gsap.killTweensOf(ring.scale);
                    ring.destroy();
                }
            },
        });
        gsap.to(ring, {
            alpha: 0,
            duration: 0.3,
            ease: 'power1.out',
        });

        const dustCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < dustCount; i++) {
            const dust = new PIXI.Graphics();
            const radius = 6 + Math.random() * 8;
            dust.beginPath();
            dust.circle(0, 0, radius);
            dust.fill({ color: 0xcccccc, alpha: 0.5 });

            dust.position.set(unit.x, unit.y);
            unit.parent.addChild(dust);

            const angle = Math.PI + Math.random() * Math.PI;
            const distance = 30 + Math.random() * 50;

            gsap.to(dust, {
                x: unit.x + Math.cos(angle) * distance,
                y: unit.y + Math.sin(angle) * distance * 0.4,
                alpha: 0,
                duration: 0.35,
                ease: 'power1.out',
                onComplete: () => {
                    if (dust && !dust.destroyed) {
                        gsap.killTweensOf(dust);
                        dust.destroy();
                    }
                },
            });
        }

        EffectsManager.getInstance().screenShake(5, 0.95, 200);
    } catch (e) {
        console.error('❌ spawnLandingEffect error:', e);
    }
}

/**
 * GSAP-рывок вперед для атаки
 */
export function animateLungeForward(
    unit: HeroUnit,
    isPlayer: boolean,
    poseOverride?: number,
    victimX?: number,
): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    unit.isLunging = true;
    // Спавним облако пыли под ногами при разгоне
    EffectsManager.getInstance().spawnDustPuff(unit.x, unit.y);
    return new Promise((resolve) => {
        // Safety timeout: resolve after 2s max to prevent freeze
        const safetyTimer = setTimeout(() => {
            if (unit.isLunging) {
                unit.isLunging = false;
                resolve();
            }
        }, 2000);
        const wrappedResolve = () => {
            clearTimeout(safetyTimer);
            unit.isLunging = false;
            resolve();
        };
        anyUnit.currentResolve = wrappedResolve;
        const timeScale = useGameStore.getState().timeScale || 1;
        const startX = unit.x;
        const startY = unit.y;
        // Дамажим вплотную: останавливаемся в 135px перед целью
        const targetX =
            victimX !== undefined ? (isPlayer ? victimX - 135 : victimX + 135) : startX + 540 * (isPlayer ? 1 : -1);

        gsap.killTweensOf(unit);

        const hasPoses = unit.posesTextures && unit.posesTextures.length > 0;

        if (poseOverride !== undefined) {
            unit.nextAttackPose = poseOverride;
            unit.setFrame(2);
        } else if (hasPoses) {
            // Randomly select next attack pose index: Swing (3), Thrust (4), Sweep (5), Jump Strike (6)
            unit.nextAttackPose = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
            unit.setFrame(2); // Set run/lunge pose frame initially
        }

        // Start spawning ghost trails (for ASSASSIN and WARRIOR roles)
        const isAssassin = unit.config?.role === 'ASSASSIN';
        const isWarrior = unit.config?.role === 'WARRIOR';
        const shouldSpawnTrail = isAssassin || isWarrior;
        const animSpeed = isAssassin ? 0.75 : 1.0;

        if (anyUnit.trailInterval) clearInterval(anyUnit.trailInterval);
        if (shouldSpawnTrail) {
            let fxColor = 0x222222; // Default shadow
            if (unit.config?.id === 'tiger_warrior') {
                fxColor = 0xff4500; // Crimson flame for tiger
            } else if (unit.config?.id === 'lion_knight') {
                fxColor = 0xffd700; // Golden light for lion
            } else if (unit.config?.id === 'panda') {
                fxColor = 0x3ecf4f; // Emerald/nature green for panda
            }
            anyUnit.trailInterval = setInterval(() => {
                EffectsManager.getInstance().spawnGhostTrail(unit, 300, fxColor);
            }, 40);
        }

        const tl = gsap.timeline({
            onComplete: () => {
                if (anyUnit.trailInterval) {
                    clearInterval(anyUnit.trailInterval);
                    anyUnit.trailInterval = null;
                }
                if (anyUnit.currentResolve === wrappedResolve) {
                    anyUnit.currentResolve = null;
                }
                wrappedResolve();
            },
        });
        tl.timeScale(timeScale);

        if (unit.nextAttackPose === 6) {
            // 1. Jump strike lunge: high arc (Y: -360px) to targets
            tl.to(unit, {
                x: targetX,
                y: startY - 360,
                duration: 0.35 * animSpeed,
                ease: 'power1.out',
            });
            // 2. Slam down
            tl.to(unit, {
                y: startY,
                duration: 0.2 * animSpeed,
                ease: 'power2.in',
            });
        } else if (unit.nextAttackPose === 4) {
            // 2. Thrust: ultra fast straight line dash
            tl.to(unit, {
                x: targetX,
                duration: 0.18 * animSpeed,
                ease: 'power3.out',
            });
            tl.to(unit, {
                x: targetX + 15 * (isPlayer ? 1 : -1),
                duration: 0.12 * animSpeed,
                ease: 'sine.inOut',
            });
        } else {
            // 3. Swing (normal lunge): small hop curve
            tl.to(unit, {
                x: targetX,
                y: startY - 40,
                duration: 0.25 * animSpeed,
                ease: 'sine.out',
            });
            tl.to(unit, {
                y: startY,
                duration: 0.15 * animSpeed,
                ease: 'sine.in',
            });
        }
    });
}

export function animateLungeReturn(unit: HeroUnit, startX: number, startY: number): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    unit.isLunging = true;
    // Спавним облако пыли при резком отскоке
    EffectsManager.getInstance().spawnDustPuff(unit.x, unit.y);
    return new Promise((resolve) => {
        // Safety timeout: resolve after 2s max to prevent freeze
        const safetyTimer = setTimeout(() => {
            if (unit.isLunging) {
                unit.isLunging = false;
                unit.x = startX;
                unit.y = startY;
                unit.setFrame(0);
                resolve();
            }
        }, 2000);
        const wrappedResolve = () => {
            clearTimeout(safetyTimer);
            unit.isLunging = false;
            resolve();
        };
        anyUnit.currentResolve = wrappedResolve;
        const timeScale = useGameStore.getState().timeScale || 1;

        const isAssassin = unit.config?.role === 'ASSASSIN';
        const isWarrior = unit.config?.role === 'WARRIOR';
        const shouldSpawnTrail = isAssassin || isWarrior;
        const animSpeed = isAssassin ? 0.75 : 1.0;

        if (anyUnit.trailInterval) clearInterval(anyUnit.trailInterval);
        if (shouldSpawnTrail) {
            let fxColor = 0x222222; // Default shadow
            if (unit.config?.id === 'tiger_warrior') {
                fxColor = 0xff4500; // Crimson flame for tiger
            } else if (unit.config?.id === 'lion_knight') {
                fxColor = 0xffd700; // Golden light for lion
            } else if (unit.config?.id === 'panda') {
                fxColor = 0x3ecf4f; // Emerald/nature green for panda
            }
            anyUnit.trailInterval = setInterval(() => {
                EffectsManager.getInstance().spawnGhostTrail(unit, 300, fxColor);
            }, 40);
        }

        const tl = gsap.timeline({
            onComplete: () => {
                if (anyUnit.trailInterval) {
                    clearInterval(anyUnit.trailInterval);
                    anyUnit.trailInterval = null;
                }
                unit.x = startX;
                unit.y = startY;
                unit.setFrame(0); // return to Idle
                if (anyUnit.currentResolve === wrappedResolve) {
                    anyUnit.currentResolve = null;
                }
                wrappedResolve();
            },
        });
        tl.timeScale(timeScale);

        tl.to(unit, {
            x: startX,
            y: startY,
            duration: 0.45 * animSpeed,
            ease: 'power2.inOut',
        });
    });
}

/**
 * Телепортация: Исчезновение (Shadow step out)
 * Сжимает и растягивает персонажа по вертикали (эффект искажения), убирает альфу
 */
export function animateTeleportOut(unit: HeroUnit): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    return new Promise((resolve) => {
        anyUnit.currentResolve = resolve;
        const timeScale = useGameStore.getState().timeScale || 1;

        gsap.killTweensOf(unit);
        if (unit.bodyContainer) {
            gsap.killTweensOf(unit.bodyContainer.scale);
            gsap.killTweensOf(unit.bodyContainer);
        }

        // Звук исчезновения
        audioService.playSFX('/assets/audio/sfx/miss.mp3');

        // Небольшой взрыв частиц в месте исчезновения
        EffectsManager.getInstance().particleBurst(unit.x, unit.y - 80, 8, 0x5a189a, 120);

        const tl = gsap.timeline({
            onComplete: () => {
                unit.alpha = 0;
                if (anyUnit.currentResolve === resolve) {
                    anyUnit.currentResolve = null;
                }
                resolve();
            },
        });
        tl.timeScale(timeScale);

        // Эффект растягивания по вертикали (Distortion)
        if (unit.bodyContainer) {
            tl.to(unit.bodyContainer.scale, {
                x: unit.defaultScaleX * 0.4,
                y: unit.defaultScaleY * 1.8,
                duration: 0.08,
                ease: 'power2.in',
            });
        }

        tl.to(
            unit,
            {
                alpha: 0,
                duration: 0.08,
                ease: 'power2.in',
            },
            0,
        );
    });
}

/**
 * Телепортация: Появление (Shadow step in)
 * Помещает в новые координаты, восстанавливает сжатие и альфу с кольцевым эффектом
 */
export function animateTeleportIn(unit: HeroUnit, targetX: number, faceScaleX: number): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    return new Promise((resolve) => {
        anyUnit.currentResolve = resolve;
        const timeScale = useGameStore.getState().timeScale || 1;

        unit.x = targetX;
        unit.scale.x = faceScaleX;
        unit.alpha = 0;

        if (unit.bodyContainer) {
            unit.bodyContainer.scale.set(unit.defaultScaleX * 0.4, unit.defaultScaleY * 1.8);
        }

        // Кольцо теневой энергии (Arrival Burst) в точке появления
        EffectsManager.getInstance().particleBurst(unit.x, unit.y - 80, 6, 0xbd00ff, 100);

        const tl = gsap.timeline({
            onComplete: () => {
                unit.alpha = 1;
                if (unit.bodyContainer) {
                    unit.bodyContainer.scale.set(unit.defaultScaleX, unit.defaultScaleY);
                }
                if (anyUnit.currentResolve === resolve) {
                    anyUnit.currentResolve = null;
                }
                resolve();
            },
        });
        tl.timeScale(timeScale);

        // Восстановление нормального масштаба
        if (unit.bodyContainer) {
            tl.to(unit.bodyContainer.scale, {
                x: unit.defaultScaleX,
                y: unit.defaultScaleY,
                duration: 0.1,
                ease: 'back.out(2)',
            });
        }

        tl.to(
            unit,
            {
                alpha: 1,
                duration: 0.1,
                ease: 'power2.out',
            },
            0,
        );
    });
}

/**
 * GSAP-анимация смерти (плавный наклон + растворение + улетание оружия)
 */
export function animateDeath(unit: HeroUnit, isPlayer: boolean): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    return new Promise((resolve) => {
        anyUnit.currentResolve = resolve;
        const timeScale = useGameStore.getState().timeScale || 1;

        // Bug fix: safety timer prevents BattleEngine from hanging if GSAP timeline
        // is killed externally (e.g. scene reset during death animation)
        const safetyTimer = setTimeout(() => {
            if (anyUnit.currentResolve === resolve) {
                anyUnit.currentResolve = null;
                resolve();
            }
        }, 3000);

        gsap.killTweensOf(unit);
        if (unit.bodyContainer) gsap.killTweensOf(unit.bodyContainer);
        if (unit.bodySprite) gsap.killTweensOf(unit.bodySprite);
        if (unit.weaponSocketContainer) gsap.killTweensOf(unit.weaponSocketContainer);

        const tl = gsap.timeline({
            onComplete: () => {
                clearTimeout(safetyTimer);
                if (anyUnit.currentResolve === resolve) {
                    anyUnit.currentResolve = null;
                }
                resolve();
            },
        });
        tl.timeScale(timeScale);

        const hasPoses = unit.posesTextures && unit.posesTextures.length > 0;

        if (hasPoses) {
            unit.setFrame(unit.deathFrameIdx); // Death / fall frame
        }

        const isFallbackDeath =
            !hasPoses || unit.deathFrameIdx === unit.hitFrameIdx || unit.deathFrameIdx === unit.idleFrameIdx;
        const targetRotation = isFallbackDeath ? unit.rotation + (isPlayer ? -Math.PI / 2.5 : Math.PI / 2.5) : 0; // Already flat or fall pose, no extra rotation needed

        // Падение тела и растворение (Slower)
        tl.to(unit, {
            rotation: targetRotation,
            alpha: 0,
            duration: 1.6, // Slowed down from 0.8
            ease: 'power3.out',
        });

        // Оружие выпадает и вращается отдельно (Slower)
        if (unit.weaponSocketContainer) {
            tl.to(
                unit.weaponSocketContainer,
                {
                    y: unit.weaponSocketContainer.y + 160,
                    rotation: unit.weaponSocketContainer.rotation + 1.8,
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
export function animateHitReaction(unit: HeroUnit, isCrit: boolean): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    return new Promise((resolve) => {
        anyUnit.currentResolve = resolve;
        const timeScale = useGameStore.getState().timeScale || 1;
        const startX = unit.x;
        const knockbackDist = isCrit ? 60 : 30;
        const dir = unit.x < 960 ? -1 : 1;

        gsap.killTweensOf(unit);

        const hasPoses = unit.posesTextures && unit.posesTextures.length > 0;

        if (hasPoses) {
            const bracingPose =
                isCrit && unit.deathFrameIdx !== unit.hitFrameIdx && unit.deathFrameIdx !== unit.idleFrameIdx
                    ? unit.deathFrameIdx
                    : unit.hitFrameIdx;
            unit.setFrame(bracingPose); // Bracing (hit) or laydown (death frame if custom)
        }

        const tl = gsap.timeline({
            onComplete: () => {
                unit.x = startX;
                if (hasPoses) {
                    unit.setFrame(unit.idleFrameIdx); // return to Idle
                }
                if (anyUnit.currentResolve === resolve) {
                    anyUnit.currentResolve = null;
                }
                resolve();
            },
        });
        tl.timeScale(timeScale);

        // Быстрый отскок назад (Slower)
        tl.to(unit, {
            x: startX + knockbackDist * dir,
            duration: 0.2, // Slowed down from 0.08
            ease: 'power1.out',
        });

        // Возвращение на место (Slower)
        tl.to(unit, {
            x: startX,
            duration: 0.4, // Slowed down from 0.16
            ease: 'power2.inOut',
        });

        if (isCrit && unit.bodyContainer) {
            const baseScaleY = unit.bodyContainer.scale.y;
            const baseScaleX = unit.bodyContainer.scale.x;

            gsap.killTweensOf(unit.bodyContainer.scale);

            const scaleTl = gsap.timeline();
            scaleTl.timeScale(timeScale);

            // Деформация сжатия по вертикали и растяжения по горизонтали (Slower, subtle)
            scaleTl.to(unit.bodyContainer.scale, {
                x: baseScaleX * 1.05,
                y: baseScaleY * 0.95,
                duration: 0.2, // Slowed down from 0.08
                ease: 'power1.out',
            });

            // Возврат к нормальному размеру (Slower)
            scaleTl.to(unit.bodyContainer.scale, {
                x: baseScaleX,
                y: baseScaleY,
                duration: 0.4, // Slowed down from 0.16
                ease: 'power2.out',
            });
        }
    });
}

export function animateDodge(unit: HeroUnit, isPlayer: boolean): Promise<void> {
    const anyUnit = unit as any;
    anyUnit.clearCurrentResolve();
    return new Promise((resolve) => {
        anyUnit.currentResolve = resolve;
        const timeScale = useGameStore.getState().timeScale || 1;
        const startAngle = unit.angle;
        const targetAngle = startAngle + (isPlayer ? -15 : 15);
        const startX = unit.x;
        const dodgeDist = 140;
        const targetX = startX + dodgeDist * (isPlayer ? -1 : 1);

        gsap.killTweensOf(unit);

        const hasPoses = unit.posesTextures && unit.posesTextures.length > 0;

        if (hasPoses) {
            unit.setFrame(1); // Defend stance (1)
        }

        const tl = gsap.timeline({
            onComplete: () => {
                unit.angle = startAngle;
                unit.x = startX;
                if (hasPoses) {
                    unit.setFrame(0); // return to Idle
                }
                if (anyUnit.currentResolve === resolve) {
                    anyUnit.currentResolve = null;
                }
                resolve();
            },
        });
        tl.timeScale(timeScale);

        // Уклон назад
        tl.to(unit, {
            angle: targetAngle,
            x: targetX,
            duration: 0.22,
            ease: 'power2.out',
        });

        // Плавное возвращение
        tl.to(unit, {
            angle: startAngle,
            x: startX,
            duration: 0.38,
            ease: 'power1.inOut',
        });
    });
}
