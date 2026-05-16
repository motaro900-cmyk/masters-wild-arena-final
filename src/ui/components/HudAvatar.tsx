import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Characters } from '../screens';

interface HudAvatarProps {
    heroId: string;
}

export const HudAvatar: React.FC<HudAvatarProps> = ({ heroId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initPixi = async () => {
            const app = new PIXI.Application();
            await app.init({ width: 64, height: 64, backgroundAlpha: 0, antialias: true });
            if (!isMounted) {
                app.destroy(true);
                return;
            }
            appRef.current = app;
            if (containerRef.current) {
                containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
            }

            const texture = PIXI.Assets.get((Characters as any)[heroId] || Characters.panda);
            const sprite = new PIXI.Sprite(texture);

            // Фолбэк-эмодзи, если текстура персонажа еще грузится или не найдена
            if (sprite.texture === PIXI.Texture.WHITE || sprite.texture.width <= 1) {
                const emojis: Record<string, string> = { panda: '🐼', moose: '🫎', goose: '🦢', cat: '🐱', boar: '🐗' };
                const fallback = new PIXI.Text({
                    text: emojis[heroId] || '🐼',
                    style: { fontSize: 40, dropShadow: { color: '#000000', alpha: 0.8, blur: 2, distance: 2 } },
                });
                fallback.anchor.set(0.5, 0.5);
                fallback.position.set(32, 32);
                sprite.addChild(fallback);
            } else {
                sprite.anchor.set(0.5, 1);
                sprite.position.set(32, 60);
                sprite.scale.set(0.4);
            }

            // Идеальное дыхание (GSAP Breathing Animation как в игровом движке)
            gsap.to(sprite.scale, {
                y: sprite.scale.y * 1.05,
                x: sprite.scale.x * 0.95,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            app.stage.addChild(sprite);
        };

        initPixi();

        return () => {
            isMounted = false;
            if (appRef.current) appRef.current.destroy(true, { children: true });
        };
    }, [heroId]);

    return (
        <div
            ref={containerRef}
            className="w-16 h-16 bg-gradient-to-b from-[#1a365d] to-[#0a192f] rounded-full border-2 border-[#4a90e2] shadow-inner flex-shrink-0 overflow-hidden flex items-center justify-center"
        />
    );
};
