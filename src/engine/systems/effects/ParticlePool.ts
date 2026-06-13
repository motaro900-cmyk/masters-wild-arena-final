import * as PIXI from 'pixi.js';
import { PixiApp } from '../../core/PixiApp';
import { useGameStore } from '../../../store/useGameStore';

export class ParticlePool {
    private static instance: ParticlePool | null = null;
    private pixiApp: PixiApp;
    public pool: PIXI.Graphics[] = [];

    private constructor() {
        this.pixiApp = PixiApp.getInstance();
        const quality = useGameStore.getState().particlesQuality;
        this.init(quality === 'LOW' ? 50 : 100);
    }

    public static getInstance(): ParticlePool {
        if (!ParticlePool.instance) {
            ParticlePool.instance = new ParticlePool();
        }
        return ParticlePool.instance;
    }

    public init(size: number = 100): void {
        try {
            for (let i = 0; i < size; i++) {
                const particle = new PIXI.Graphics();
                particle.visible = false;
                this.pixiApp.effectsLayer.addChild(particle);
                this.pool.push(particle);
            }
            console.log(`🎨 Particle pool initialized with ${size} particles`);
        } catch (error) {
            console.error('❌ Particle pool initialization error:', error);
        }
    }

    public getParticle(typeOrDecorative: boolean | string = false): PIXI.Graphics | null {
        const quality = useGameStore.getState().particlesQuality;
        const isDecorative = typeOrDecorative === true || typeOrDecorative === 'AMBIENT';
        if (quality === 'LOW' && isDecorative) {
            return null;
        }

        // Filter out destroyed particles
        this.pool = this.pool.filter((p) => !p.destroyed);

        // Find a free particle
        const free = this.pool.find((p) => !p.visible);
        if (free) {
            free.visible = true;
            return free;
        }

        const maxPoolSize = quality === 'LOW' ? 50 : 200;
        // Pool exhausted - expand dynamically
        if (this.pool.length < maxPoolSize) {
            const newParticle = new PIXI.Graphics();
            newParticle.visible = true;
            this.pixiApp.effectsLayer.addChild(newParticle);
            this.pool.push(newParticle);
            return newParticle;
        }

        // Hard limit reached - reuse the oldest particle
        const oldest = this.pool[0];
        if (oldest) {
            oldest.visible = true;
            oldest.clear();
            // Move to end of pool
            this.pool.push(this.pool.shift()!);
            return oldest;
        }

        return null;
    }

    public releaseParticle(particle: PIXI.Graphics): void {
        if (particle.destroyed) return;
        particle.visible = false;
        particle.clear();
    }

    public destroy(): void {
        for (const particle of this.pool) {
            if (!particle.destroyed) {
                particle.destroy();
            }
        }
        this.pool = [];
    }

    public clear(): void {
        this.destroy();
        ParticlePool.instance = null;
    }
}
