import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { IStatusEffectTarget } from './IStatusEffectTarget';

/**
 * StatusEffectController manages all combat status effects (Stun, Burn, Freeze, Poison)
 * for a HeroUnit. It handles visual containers, graphics, tweens, and update-loop particle generation.
 */
export class StatusEffectController {
    private unit: IStatusEffectTarget;

    public isStunned: boolean = false;
    public isBurning: boolean = false;
    public isFrozen: boolean = false;
    public isPoisoned: boolean = false;

    public stunEffectContainer: PIXI.Container | null = null;
    public burnEffectContainer: PIXI.Container | null = null;
    public freezeEffectContainer: PIXI.Container | null = null;
    public poisonEffectContainer: PIXI.Container | null = null;

    private stunTween: gsap.core.Tween | null = null;
    private burnCleanupTimer?: any;

    constructor(unit: any) {
        this.unit = unit;
    }

    public update(_delta: number) {
        void _delta;
        if (this.unit.destroyed) return;

        const animTime = this.unit.animTime || 0;

        // 1. Stun wobble oscillation
        if (this.isStunned && this.unit.bodyContainer && !this.unit.bodyContainer.destroyed) {
            // rotation is managed by GSAP stunTween, do not override here to avoid flickering conflict
            this.unit.bodyContainer.y = Math.sin(animTime * 3) * 6;
        }

        // 2. Burning flames generator
        if (this.isBurning && this.burnEffectContainer) {
            if (this.burnEffectContainer.children.length < 12 && Math.random() < 0.45) {
                const flame = new PIXI.Graphics();
                const height = 65 + Math.random() * 95;
                const width = 18 + Math.random() * 25;

                flame.beginPath();
                flame.moveTo(0, 0);
                flame.quadraticCurveTo(-width, -height * 0.3, -width * 0.3, -height * 0.75);
                flame.quadraticCurveTo(0, -height, width * 0.3, -height * 0.75);
                flame.quadraticCurveTo(width, -height * 0.3, 0, 0);
                flame.closePath();

                const colors = [0xff3300, 0xff6600, 0xffaa00, 0xffdd00];
                flame.fill({ color: colors[Math.floor(Math.random() * colors.length)] });
                flame.alpha = 0.85;
                flame.blendMode = 'add';

                flame.x = (Math.random() - 0.5) * 160;
                flame.y = -Math.random() * 320;
                flame.scale.set(0.15);
                this.burnEffectContainer.addChild(flame);

                gsap.to(flame.scale, {
                    x: 1.1 + Math.random() * 0.4,
                    y: 1.1 + Math.random() * 0.4,
                    duration: 0.6,
                });

                gsap.to(flame, {
                    y: flame.y - 100 - Math.random() * 60,
                    x: flame.x + (Math.random() - 0.5) * 50,
                    alpha: 0,
                    duration: 0.5 + Math.random() * 0.4,
                    ease: 'power1.out',
                    onComplete: () => {
                        if (flame && !flame.destroyed) {
                            gsap.killTweensOf(flame);
                            gsap.killTweensOf(flame.scale);
                            flame.destroy();
                        }
                    },
                });
            }
        }

        // 3. Poison vapors and bubble generator
        if (this.isPoisoned && this.poisonEffectContainer) {
            // Clouds
            if (this.poisonEffectContainer.children.length < 16 && Math.random() < 0.22) {
                const puff = new PIXI.Graphics();
                const radius = 18 + Math.random() * 22;
                puff.beginPath();
                puff.circle(0, 0, radius);
                puff.fill({ color: 0x228b22, alpha: 0.18 });
                puff.blendMode = 'add';
                puff.x = (Math.random() - 0.5) * 160;
                puff.y = -Math.random() * 320;
                this.poisonEffectContainer.addChild(puff);

                gsap.to(puff, {
                    y: puff.y - 120,
                    x: puff.x + (Math.random() - 0.5) * 35,
                    alpha: 0,
                    duration: 1.4,
                    ease: 'sine.out',
                    onComplete: () => {
                        if (puff && !puff.destroyed) {
                            gsap.killTweensOf(puff);
                            puff.destroy();
                        }
                    },
                });
            }

            // Bubbles
            if (this.poisonEffectContainer.children.length < 16 && Math.random() < 0.25) {
                const p = new PIXI.Graphics();
                const radius = 2.5 + Math.random() * 4.5;
                p.beginPath();
                p.circle(0, 0, radius);
                p.fill({ color: 0xadff2f, alpha: 0.75 });
                p.stroke({ color: 0x32cd32, width: 1.5 });

                p.x = (Math.random() - 0.5) * 160;
                p.y = -Math.random() * 300;
                p.alpha = 0.8;
                this.poisonEffectContainer.addChild(p);

                gsap.to(p, {
                    y: p.y - 160,
                    x: p.x + Math.sin(Math.random() * Math.PI) * 25,
                    alpha: 0,
                    duration: 1.0 + Math.random() * 0.5,
                    ease: 'power1.out',
                    onComplete: () => {
                        if (p && !p.destroyed) {
                            gsap.killTweensOf(p);
                            p.destroy();
                        }
                    },
                });
            }
        }

        // 4. Freeze snowflake generator
        if (this.isFrozen && this.freezeEffectContainer) {
            if (this.freezeEffectContainer.children.length < 20 && Math.random() < 0.25) {
                const p = new PIXI.Graphics();
                const size = 3 + Math.random() * 4.5;
                p.beginPath();
                p.moveTo(0, -size);
                p.lineTo(size * 0.6, 0);
                p.lineTo(0, size);
                p.lineTo(-size * 0.6, 0);
                p.closePath();
                p.fill({ color: 0xe0f7fa });
                p.stroke({ color: 0x80deea, width: 1 });

                p.x = (Math.random() - 0.5) * 160;
                p.y = -Math.random() * 320;
                p.alpha = 0.8;
                this.freezeEffectContainer.addChild(p);

                gsap.to(p, {
                    y: p.y + 40,
                    x: p.x + (Math.random() - 0.5) * 20,
                    alpha: 0,
                    duration: 0.9 + Math.random() * 0.9,
                    ease: 'sine.inOut',
                    onComplete: () => {
                        if (p && !p.destroyed) {
                            gsap.killTweensOf(p);
                            p.destroy();
                        }
                    },
                });
            }
        }
    }

    public updateTints() {
        if (!this.unit.bodySprite || this.unit.bodySprite.destroyed) return;
        if (this.isFrozen) {
            this.unit.bodySprite.tint = 0x88ccff;
        } else if (this.isBurning) {
            this.unit.bodySprite.tint = 0xff8844;
        } else if (this.isPoisoned) {
            this.unit.bodySprite.tint = 0x8dffa9;
        } else {
            this.unit.bodySprite.tint = 0xffffff;
        }
    }

    public showStunEffect() {
        if (this.stunEffectContainer) return;
        this.isStunned = true;
        this.stunEffectContainer = new PIXI.Container();
        this.stunEffectContainer.zIndex = 35;
        this.unit.addChild(this.stunEffectContainer);

        const headSocket = this.unit.config?.anchors?.head || { x: 0.5, y: 0.2 };
        const feetSocket = this.unit.config?.anchors?.feet || { x: 0.5, y: 0.95 };
        const texWidth = this.unit.bodySprite?.texture?.width || 512;
        const texHeight = this.unit.bodySprite?.texture?.height || 512;

        const hx = (headSocket.x - feetSocket.x) * texWidth * (this.unit.bodyContainer?.scale?.x || 1);
        const hy = (headSocket.y - feetSocket.y) * texHeight * (this.unit.bodyContainer?.scale?.y || 1) - 75;
        this.stunEffectContainer.position.set(hx, hy);

        const stars: PIXI.Graphics[] = [];
        const drawStar = (g: PIXI.Graphics, outerRadius: number, innerRadius: number) => {
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / 5;
            g.moveTo(0, -outerRadius);
            for (let i = 0; i < 5; i++) {
                let x = Math.cos(rot) * outerRadius;
                let y = Math.sin(rot) * outerRadius;
                g.lineTo(x, y);
                rot += step;

                x = Math.cos(rot) * innerRadius;
                y = Math.sin(rot) * innerRadius;
                g.lineTo(x, y);
                rot += step;
            }
            g.lineTo(0, -outerRadius);
            g.closePath();
        };

        for (let i = 0; i < 3; i++) {
            const star = new PIXI.Graphics();
            star.beginPath();
            drawStar(star, 14, 6);
            star.fill({ color: 0xffea00 });
            star.stroke({ color: 0xffaa00, width: 2.0 });
            this.stunEffectContainer.addChild(star);
            stars.push(star);
        }

        const animObj = { angle: 0 };
        const tween = gsap.to(animObj, {
            angle: Math.PI * 2,
            duration: 1.8,
            repeat: -1,
            ease: 'none',
            onUpdate: () => {
                if (!this.stunEffectContainer || this.stunEffectContainer.destroyed) return;
                stars.forEach((star, index) => {
                    if (star.destroyed) return;
                    const offset = (index * Math.PI * 2) / 3;
                    const a = animObj.angle + offset;
                    star.x = Math.cos(a) * 45;
                    star.y = Math.sin(a) * 15;
                    star.scale.set(0.85 + Math.sin(a) * 0.4);
                    star.rotation = animObj.angle * 2.5;
                });
            },
        });
        (this.stunEffectContainer as any).gsapTween = tween;

        this.stunTween = gsap.to(this.unit.bodyContainer, {
            rotation: 0.08,
            yoyo: true,
            repeat: -1,
            duration: 0.15,
            ease: 'sine.inOut',
        });
    }

    public removeStunEffect() {
        this.isStunned = false;
        if (this.stunTween) {
            this.stunTween.kill();
            this.stunTween = null;
        }
        if (this.unit.bodyContainer && !this.unit.bodyContainer.destroyed) {
            this.unit.bodyContainer.rotation = 0;
            this.unit.bodyContainer.y = 0;
        }
        if (this.stunEffectContainer) {
            const tween = (this.stunEffectContainer as any).gsapTween;
            if (tween) {
                tween.kill();
            }
            gsap.killTweensOf(this.stunEffectContainer);
            if (!this.unit.destroyed) {
                this.unit.removeChild(this.stunEffectContainer);
            }
            this.stunEffectContainer.destroy({ children: true });
            this.stunEffectContainer = null;
        }
    }

    public showBurnEffect() {
        if (this.burnEffectContainer) return;
        this.isBurning = true;
        this.burnEffectContainer = new PIXI.Container();
        this.burnEffectContainer.zIndex = 35;
        this.unit.addChild(this.burnEffectContainer);
        this.updateTints();
    }

    public applyBurnStatus(durationMs: number = 2000): void {
        if (this.unit.destroyed) return;
        if (this.burnCleanupTimer !== undefined) {
            clearTimeout(this.burnCleanupTimer);
        }
        this.isBurning = true;
        if (!this.burnEffectContainer) this.showBurnEffect();
        this.updateTints();
        this.burnCleanupTimer = setTimeout(() => {
            try {
                if (!this.unit.destroyed) this.removeBurnEffect();
            } catch (e) {
                console.warn('[StatusEffectController] Burn cleanup error:', e);
            }
            this.burnCleanupTimer = undefined;
        }, durationMs);
    }

    public removeBurnEffect() {
        this.isBurning = false;
        if (this.burnCleanupTimer !== undefined) {
            clearTimeout(this.burnCleanupTimer);
            this.burnCleanupTimer = undefined;
        }
        if (this.burnEffectContainer) {
            gsap.killTweensOf(this.burnEffectContainer);
            this.burnEffectContainer.children.forEach((child) => {
                gsap.killTweensOf(child);
                gsap.killTweensOf(child.scale);
            });
            if (!this.unit.destroyed) {
                this.unit.removeChild(this.burnEffectContainer);
            }
            this.burnEffectContainer.destroy({ children: true });
            this.burnEffectContainer = null;
        }
        this.updateTints();
    }

    public showFreezeEffect() {
        if (this.freezeEffectContainer) return;
        this.isFrozen = true;
        this.freezeEffectContainer = new PIXI.Container();
        this.freezeEffectContainer.zIndex = 35;
        this.unit.addChild(this.freezeEffectContainer);
        
        // Переводим персонажа в позу Idle при заморозке
        if (typeof (this.unit as any).setFrame === 'function') {
            const idleIdx = (this.unit as any).idleFrameIdx !== undefined ? (this.unit as any).idleFrameIdx : 0;
            (this.unit as any).setFrame(idleIdx);
        }
        
        this.updateTints();

        const crystalCount = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < crystalCount; i++) {
            const crystal = new PIXI.Graphics();
            const size = 8 + Math.random() * 8;

            crystal.beginPath();
            crystal.moveTo(0, -size);
            crystal.lineTo(size * 0.6, 0);
            crystal.lineTo(0, size);
            crystal.lineTo(-size * 0.6, 0);
            crystal.closePath();
            crystal.fill({ color: 0x88ccff });
            crystal.stroke({ color: 0xffffff, width: 1.5 });

            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 50;
            crystal.x = Math.cos(angle) * distance;
            crystal.y = Math.sin(angle) * distance * 0.6 - 120;

            crystal.scale.set(0);
            gsap.to(crystal.scale, {
                x: 1,
                y: 1,
                duration: 0.3,
                ease: 'back.out(1.5)',
            });

            this.freezeEffectContainer.addChild(crystal);
        }

        gsap.killTweensOf(this.freezeEffectContainer.scale);
        this.freezeEffectContainer.scale.set(1.0);
        gsap.to(this.freezeEffectContainer.scale, {
            x: 1.05,
            y: 1.05,
            duration: 2.0,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
    }

    public removeFreezeEffect() {
        this.isFrozen = false;
        if (this.freezeEffectContainer) {
            gsap.killTweensOf(this.freezeEffectContainer);
            gsap.killTweensOf(this.freezeEffectContainer.scale);
            this.freezeEffectContainer.children.forEach((child) => {
                gsap.killTweensOf(child);
                gsap.killTweensOf(child.scale);
            });
            if (!this.unit.destroyed) {
                this.unit.removeChild(this.freezeEffectContainer);
            }
            this.freezeEffectContainer.destroy({ children: true });
            this.freezeEffectContainer = null;
        }
        this.updateTints();
    }

    public showPoisonEffect() {
        if (this.poisonEffectContainer) return;
        this.isPoisoned = true;
        this.poisonEffectContainer = new PIXI.Container();
        this.poisonEffectContainer.zIndex = 35;
        this.unit.addChild(this.poisonEffectContainer);
        this.updateTints();
    }

    public removePoisonEffect() {
        this.isPoisoned = false;
        if (this.poisonEffectContainer) {
            gsap.killTweensOf(this.poisonEffectContainer);
            this.poisonEffectContainer.children.forEach((child) => {
                gsap.killTweensOf(child);
                gsap.killTweensOf(child.scale);
            });
            if (!this.unit.destroyed) {
                this.unit.removeChild(this.poisonEffectContainer);
            }
            this.poisonEffectContainer.destroy({ children: true });
            this.poisonEffectContainer = null;
        }
        this.updateTints();
    }

    public destroy() {
        if (this.burnCleanupTimer !== undefined) {
            clearTimeout(this.burnCleanupTimer);
            this.burnCleanupTimer = undefined;
        }
        this.removeStunEffect();
        this.removeBurnEffect();
        this.removeFreezeEffect();
        this.removePoisonEffect();
    }
}
