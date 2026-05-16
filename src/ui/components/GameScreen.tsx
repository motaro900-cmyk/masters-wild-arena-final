import React, { useEffect, useRef, useState } from 'react';
import styles from './GameScreen.module.css';
import MainHUD from './MainHUD';

export const GameScreen: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Calculate scale to fit 1920x1080 proportionally on mount and resize
    useEffect(() => {
        const handleResize = () => {
            const parent = wrapperRef.current?.parentElement || document.body;
            const width = parent.clientWidth;
            const height = parent.clientHeight;
            const scaleX = width / 1920;
            const scaleY = height / 1080;
            setScale(Math.min(scaleX, scaleY));
        };

        window.addEventListener('resize', handleResize);

        const observer = new ResizeObserver(handleResize);
        if (wrapperRef.current?.parentElement) {
            observer.observe(wrapperRef.current.parentElement);
        }

        handleResize(); // Initial setup

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={wrapperRef}
            className={styles.gameScreen}
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        >
            <div className={styles.scaler} style={{ transform: `scale(${scale})` }}>
                {/* PixiLayer: 100% of screen. Render background and characters here */}
                <div className={styles.pixiLayer} ref={containerRef} id="game-container">
                    {/* PixiJS Engine gets injected into this div */}
                </div>
            </div>

            {/* Отрисовываем наш новый интерфейс поверх игры */}
            <MainHUD />
        </div>
    );
};
