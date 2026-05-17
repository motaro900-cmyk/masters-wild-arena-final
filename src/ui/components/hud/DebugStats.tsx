import React, { useEffect, useState } from 'react';
import { PixiApp } from '../../../engine/core/PixiApp';

export const DebugStats: React.FC = () => {
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let lastTime = performance.now();
        let frames = 0;
        let rafId: number;

        const update = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                // Пытаемся получить FPS из Pixi, если он готов, иначе считаем сами
                try {
                    const pixiFPS = PixiApp.getInstance().getApp().ticker.FPS;
                    setFps(Math.round(pixiFPS || frames));
                } catch {
                    setFps(frames);
                }
                frames = 0;
                lastTime = currentTime;
            }
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                top: '5px',
                right: '10px',
                color: fps > 50 ? '#4ade80' : '#f87171',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px black',
                zIndex: 1000,
                pointerEvents: 'none',
            }}
        >
            FPS: {fps}
        </div>
    );
};
