import * as PIXI from 'pixi.js';

export interface IArenaParticle {
    graphics: PIXI.Graphics;
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    scale: number;
    parallax: number;
    type: string;
    amplitude?: number;
    phaseSpeed?: number;
    phase?: number;
    rotSpeed?: number;
    pulseSpeed?: number;
    baseAlpha?: number;
    baseVy?: number;
}

export function initParticles(
    randomBg: string,
    particleContainer: PIXI.Container,
    W: number,
    H: number,
    maxParticles: number
): IArenaParticle[] {
    const lowerBg = randomBg.toLowerCase();
    let particleType: 'frost' | 'rain' | 'lava' | 'snow' | 'leaves' | 'sandstorm' | 'dust' = 'dust';
    if (lowerBg.includes('bg_1')) {
        particleType = 'frost';
    } else if (lowerBg.includes('bg_2')) {
        particleType = 'rain';
    } else if (lowerBg.includes('bg_3')) {
        particleType = 'lava';
    } else if (lowerBg.includes('bg_4')) {
        particleType = 'snow';
    } else if (lowerBg.includes('bg_5')) {
        particleType = 'leaves';
    } else if (lowerBg.includes('bg_6')) {
        particleType = 'sandstorm';
    }

    const arenaParticles: IArenaParticle[] = [];
    for (let i = 0; i < maxParticles; i++) {
        const g = new PIXI.Graphics();
        let color = 0xffffff;
        let scale = 0.5 + Math.random() * 0.5;
        let parallax = 0.3 + Math.random() * 0.7;
        let alpha = 0.3 + Math.random() * 0.7;
        let vx = 0;
        let vy = 0;
        
        let amplitude = 0;
        let phaseSpeed = 0;
        let phase = Math.random() * Math.PI * 2;
        let rotSpeed = 0;
        let pulseSpeed = 0;
        let baseAlpha = alpha;
        let baseVy = 0;

        const px = Math.random() * W;
        const py = Math.random() * H;

        if (particleType === 'frost') {
            color = Math.random() > 0.6 ? 0xafeeee : (Math.random() > 0.3 ? 0x00ffff : 0xffffff);
            const size = 3 + Math.random() * 4;
            g.poly([
                0, -size,
                size / 2, 0,
                0, size,
                -size / 2, 0
            ]);
            g.fill({ color, alpha: 0.8 });
            
            vx = (Math.random() - 0.5) * 0.8;
            vy = -Math.random() * 0.8 - 0.2;
            pulseSpeed = 0.02 + Math.random() * 0.03;
            baseAlpha = 0.4 + Math.random() * 0.6;
            alpha = baseAlpha;
        } 
        else if (particleType === 'rain') {
            color = 0xd2e5ff;
            const rWidth = 1 + Math.random() * 1.5;
            const rHeight = 12 + Math.random() * 12;
            g.rect(-rWidth/2, -rHeight/2, rWidth, rHeight);
            g.rotation = 0.15;
            g.fill({ color, alpha: 0.3 + Math.random() * 0.4 });
            
            vx = 2 + Math.random() * 1.5; 
            vy = 18 + Math.random() * 10;
            alpha = 0.3 + Math.random() * 0.45;
        }
        else if (particleType === 'lava') {
            color = Math.random() > 0.6 ? 0xff4500 : (Math.random() > 0.3 ? 0xff8c00 : 0xffd700);
            const radius = 2 + Math.random() * 3.5;
            g.circle(0, 0, radius);
            g.fill({ color, alpha: 0.75 + Math.random() * 0.25 });
            
            vx = (Math.random() - 0.5) * 1.2;
            vy = -Math.random() * 2.2 - 0.8;
            amplitude = 0.5 + Math.random() * 1.5;
            phaseSpeed = 0.02 + Math.random() * 0.04;
            baseVy = vy;
            alpha = 0.6 + Math.random() * 0.4;
        }
        else if (particleType === 'snow') {
            color = 0xffffff;
            const radius = 1.5 + Math.random() * 3.5;
            g.circle(0, 0, radius);
            g.fill({ color: 0xffffff, alpha: 0.7 + Math.random() * 0.3 });
            
            vx = (Math.random() - 0.3) * 0.8 + 0.4;
            vy = Math.random() * 1.5 + 1.0;
            amplitude = 0.8 + Math.random() * 1.5;
            phaseSpeed = 0.01 + Math.random() * 0.02;
            baseVy = vy;
            alpha = 0.4 + Math.random() * 0.6;
        }
        else if (particleType === 'leaves') {
            const leafColors = [0x556b2f, 0x8b4513, 0xcd853f, 0x228b22, 0xd2b48c];
            color = leafColors[Math.floor(Math.random() * leafColors.length)];
            const lw = 5 + Math.random() * 5;
            const lh = 3 + Math.random() * 3;
            g.ellipse(0, 0, lw, lh);
            g.fill({ color, alpha: 0.6 + Math.random() * 0.3 });
            
            vx = (Math.random() - 0.5) * 1.5 - 0.5;
            vy = Math.random() * 1.2 + 0.8;
            rotSpeed = (Math.random() - 0.5) * 0.06;
            amplitude = 1.0 + Math.random() * 2.0;
            phaseSpeed = 0.015 + Math.random() * 0.025;
            baseVy = vy;
            alpha = 0.5 + Math.random() * 0.5;
        }
        else if (particleType === 'sandstorm') {
            color = Math.random() > 0.5 ? 0xdfb175 : 0xc29d66;
            const sw = 6 + Math.random() * 14;
            const sh = 1 + Math.random() * 1.5;
            g.rect(-sw/2, -sh/2, sw, sh);
            g.fill({ color, alpha: 0.25 + Math.random() * 0.35 });
            
            vx = -12 - Math.random() * 10;
            vy = 0.5 + Math.random() * 1.2;
            alpha = 0.3 + Math.random() * 0.4;
        }
        else {
            color = Math.random() > 0.5 ? 0xa0c080 : 0xe0d8c0;
            const radius = 2 + Math.random() * 3;
            g.ellipse(0, 0, radius + 1.5, radius);
            g.fill({ color, alpha: 0.5 });
            
            vx = (Math.random() - 0.5) * 1.0;
            vy = Math.random() * 1.2 + 0.5;
            alpha = 0.3 + Math.random() * 0.5;
        }

        g.position.set(px, py);
        particleContainer.addChild(g);

        arenaParticles.push({
            graphics: g,
            x: px,
            y: py,
            vx,
            vy,
            alpha,
            scale,
            parallax,
            type: particleType,
            amplitude,
            phaseSpeed,
            phase,
            rotSpeed,
            pulseSpeed,
            baseAlpha,
            baseVy
        });
    }

    return arenaParticles;
}

export function updateParticles(
    arenaParticles: IArenaParticle[],
    delta: number,
    W: number,
    H: number
) {
    const d = Math.min(delta, 3.0);
    for (const p of arenaParticles) {
        p.phase = (p.phase || 0) + (p.phaseSpeed || 0) * d;
        
        if (p.type === 'frost') {
            p.x += p.vx * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            if (p.pulseSpeed && p.baseAlpha) {
                p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.35;
                p.graphics.alpha = Math.max(0.1, Math.min(1.0, p.alpha));
            }
            
            if (p.y < -20) {
                p.y = H + 20;
                p.x = Math.random() * W;
                p.phase = Math.random() * Math.PI * 2;
            }
        }
        else if (p.type === 'rain') {
            p.x += p.vx * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            if (p.y > H + 20) {
                p.y = -40;
                p.x = Math.random() * (W * 0.8);
            }
        }
        else if (p.type === 'lava') {
            const horizontalDrift = Math.sin(p.phase) * (p.amplitude || 0);
            p.x += (p.vx + horizontalDrift) * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            const verticalProgress = Math.max(0, Math.min(1, p.y / H));
            p.graphics.alpha = p.alpha * (0.3 + 0.7 * verticalProgress);
            
            if (p.y < -20) {
                p.y = H + 20;
                p.x = Math.random() * W;
                p.phase = Math.random() * Math.PI * 2;
            }
        }
        else if (p.type === 'snow') {
            const drift = Math.sin(p.phase) * (p.amplitude || 0);
            p.x += (p.vx + drift) * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            if (p.y > H + 20) {
                p.y = -20;
                p.x = Math.random() * W;
                p.phase = Math.random() * Math.PI * 2;
            }
        }
        else if (p.type === 'leaves') {
            const flutter = Math.sin(p.phase) * (p.amplitude || 0);
            p.x += (p.vx + flutter) * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            if (p.rotSpeed) {
                p.graphics.rotation += p.rotSpeed * d;
            }
            
            if (p.y > H + 20) {
                p.y = -20;
                p.x = Math.random() * W;
                p.phase = Math.random() * Math.PI * 2;
            }
        }
        else if (p.type === 'sandstorm') {
            p.x += p.vx * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            if (p.x < -40) {
                p.x = W + 40;
                p.y = Math.random() * H;
            }
        }
        else {
            p.x += p.vx * d * p.parallax;
            p.y += p.vy * d * p.parallax;
            
            if (p.y > H + 20) {
                p.y = -20;
                p.x = Math.random() * W;
            }
        }
        
        if (p.type !== 'sandstorm' && p.type !== 'rain') {
            if (p.x > W + 20) {
                p.x = -20;
            } else if (p.x < -20) {
                p.x = W + 20;
            }
        }

        p.graphics.position.set(p.x, p.y);
    }
}
