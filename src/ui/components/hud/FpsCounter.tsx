import React, { useState, useEffect } from 'react';

export const FpsCounter: React.FC = () => {
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationId: number;

        const update = () => {
            frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime;

            if (elapsed >= 1000) {
                setFps(Math.round((frameCount * 1000) / elapsed));
                frameCount = 0;
                lastTime = currentTime;
            }

            animationId = requestAnimationFrame(update);
        };

        animationId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.6)',
            color: fps < 30 ? '#ff4444' : fps < 55 ? '#ffcc00' : '#44ff44',
            padding: '5px 12px',
            borderRadius: '8px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '16px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
            <span style={{ fontSize: '10px', opacity: 0.7, color: '#fff' }}>FPS:</span>
            {fps}
        </div>
    );
};
