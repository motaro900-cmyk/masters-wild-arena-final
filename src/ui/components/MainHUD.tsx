import React, { useState, useEffect } from 'react';
import { GameHUD } from './GameHUD';

const MainHUD: React.FC = () => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            const container = document.getElementById('game-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                // Так как контейнер залочен на 16:9, мы просто берем его реальную ширину и делим на 1920
                setScale(rect.width / 1920);
            } else {
                // Фолбэк на случай если контейнер не найден
                const widthScale = window.innerWidth / 1920;
                const heightScale = window.innerHeight / 1080;
                setScale(Math.min(widthScale, heightScale));
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();

        // На мобилках размеры могут определиться не сразу из-за панелей браузера
        const timer = setTimeout(updateScale, 500);

        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, []);

    return (
        <>
            {/* ГЛОБАЛЬНАЯ ВИНЬЕТКА (Поверх всего) */}
            <div className="game-vignette" />

            <div className="absolute inset-0 z-[100] overflow-hidden pointer-events-none select-none flex items-center justify-center">
                {/* АДАПТИВНЫЙ ХОЛСТ (Всегда 1920x1080, просто масштабируется) */}
                <div
                    className="relative shrink-0 pointer-events-none"
                    style={{
                        width: '1920px',
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
