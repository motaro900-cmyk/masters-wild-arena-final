import React, { useState, useEffect } from 'react';
import { GameHUD } from './GameHUD';

const MainHUD: React.FC = () => {
    const [scale, setScale] = useState(1);
    const [virtualWidth, setVirtualWidth] = useState(1920);

    useEffect(() => {
        const updateScale = () => {
            const widthScale = window.innerWidth / 1920;
            const heightScale = window.innerHeight / 1080;

            // Если экран шире чем 16:9 (как на современных телефонах)
            if (widthScale > heightScale) {
                setScale(heightScale);
                setVirtualWidth(window.innerWidth / heightScale);
            } else {
                // Для узких экранов оставляем классический 16:9 с полосами сверху/снизу
                setScale(widthScale);
                setVirtualWidth(1920);
            }
        };
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <>
            {/* ГЛОБАЛЬНАЯ ВИНЬЕТКА (Поверх всего) */}
            <div className="game-vignette" />

            <div className="absolute inset-0 z-[100] overflow-hidden pointer-events-none select-none flex items-center justify-center">
                {/* АДАПТИВНЫЙ ХОЛСТ */}
                <div
                    className="relative shrink-0 pointer-events-none"
                    style={{
                        width: `${virtualWidth}px`,
                        height: '1080px',
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* HUD СЛОЙ */}
                    <div className="absolute inset-0 z-50 pointer-events-none">
                        <GameHUD />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MainHUD;
