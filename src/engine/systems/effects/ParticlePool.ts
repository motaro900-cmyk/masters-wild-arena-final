import * as PIXI from 'pixi.js';
import { PixiApp } from '../../core/PixiApp';
import { useGameStore } from '../../../store/useGameStore';

export class ParticlePool {
    private static instance: ParticlePool | null = null;
    private pixiApp: PixiApp;

    private freePool: Set<PIXI.Graphics> = new Set();
    private activePool: Set<PIXI.Graphics> = new Set();

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

    public get pool(): PIXI.Graphics[] {
        return [...this.freePool, ...this.activePool];
    }

    public init(size: number = 100): void {
        try {
            for (let i = 0; i < size; i++) {
                const particle = new PIXI.Graphics();
                particle.visible = false;
                this.pixiApp.effectsLayer.addChild(particle);
                this.freePool.add(particle);
            }
            console.log(`🎨 Particle pool initialized with ${size} particles`);
        } catch (error) {
            console.error('❌ Particle pool initialization error:', error);
        }
    }

    public acquire(): PIXI.Graphics | null {
        // Clean up any destroyed particles
        for (const p of this.freePool) {
            if (p.destroyed) this.freePool.delete(p);
        }
        for (const p of this.activePool) {
            if (p.destroyed) this.activePool.delete(p);
        }

        // Find a free particle
        if (this.freePool.size > 0) {
            const particle = this.freePool.values().next().value;
            if (!particle) return null;
            this.freePool.delete(particle);
            this.activePool.add(particle);
            particle.visible = true;
            return particle;
        }

        // Pool exhausted - check dynamic limit
        const quality = useGameStore.getState().particlesQuality;
        const maxPoolSize = quality === 'LOW' ? 50 : 200;

        if (this.freePool.size + this.activePool.size < maxPoolSize) {
            const newParticle = new PIXI.Graphics();
            newParticle.visible = true;
            this.pixiApp.effectsLayer.addChild(newParticle);
            this.activePool.add(newParticle);
            return newParticle;
        }

        // Hard limit reached - reuse the oldest active particle
        if (this.activePool.size > 0) {
            const oldest = this.activePool.values().next().value;
            if (!oldest) return null;
            this.activePool.delete(oldest);
            oldest.visible = true;
            oldest.clear();
            // Move to end of activePool (makes it the newest)
            this.activePool.add(oldest);
            return oldest;
        }

        return null;
    }

    public release(particle: PIXI.Graphics): void {
        if (particle.destroyed) {
            this.activePool.delete(particle);
            this.freePool.delete(particle);
            return;
        }
        this.activePool.delete(particle);
        this.freePool.add(particle);
        particle.visible = false;
        particle.clear();
        if (particle.parent) {
            particle.parent.removeChild(particle);
        }
    }

    public getParticle(typeOrDecorative: boolean | string = false): PIXI.Graphics | null {
        const quality = useGameStore.getState().particlesQuality;
        const isDecorative = typeOrDecorative === true || typeOrDecorative === 'AMBIENT';
        if (quality === 'LOW' && isDecorative) {
            return null;
        }
        return this.acquire();
    }

    public releaseParticle(particle: PIXI.Graphics): void {
        this.release(particle);
    }

    public destroy(): void {
        for (const particle of this.freePool) {
            if (!particle.destroyed) {
                particle.destroy();
            }
        }
        for (const particle of this.activePool) {
            if (!particle.destroyed) {
                particle.destroy();
            }
        }
        this.freePool.clear();
        this.activePool.clear();
    }

    public clear(): void {
        this.destroy();
        ParticlePool.instance = null;
    }
}
