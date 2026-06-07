import React, { useEffect, useRef } from 'react';
import { PixiApp } from '../../../engine/core/PixiApp';

export const FpsCounter: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fpsValRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let animationId: number;
        const pixiApp = PixiApp.getInstance();
        let lastUpdate = 0;

        const update = (timestamp: number) => {
            // Ограничиваем обновление DOM до 2 раз в секунду (каждые 500мс) для производительности
            if (timestamp - lastUpdate >= 500) {
                try {
                    const app = pixiApp.getApp();
                    if (app && app.ticker) {
                        const fps = Math.round(app.ticker.FPS);
                        if (fpsValRef.current) {
                            fpsValRef.current.innerText = fps.toString();
                        }
                        if (containerRef.current) {
                            const color = fps < 25 ? '#ff4444' : fps < 50 ? '#ffcc00' : '#44ff44';
                            containerRef.current.style.color = color;
                        }
                    }
                } catch {
                    // Engine not ready yet
                }
                lastUpdate = timestamp;
            }
            animationId = requestAnimationFrame(update);
        };

        animationId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#44ff44',
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: "'monospace'",
                fontSize: '14px',
                fontWeight: 800,
                pointerEvents: 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                transition: 'color 0.3s ease',
            }}
        >
            <span
                style={{
                    fontSize: '9px',
                    opacity: 0.5,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                }}
            >
                FPS
            </span>
            <span ref={fpsValRef} style={{ minWidth: '25px', textAlign: 'center' }}>
                0
            </span>
        </div>
    );
};
