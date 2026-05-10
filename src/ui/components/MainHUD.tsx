import React, { useState, useEffect, useRef } from 'react';
import { GameHUD } from './GameHUD';

const MainHUD: React.FC = () => {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateScale = () => {
            const widthScale  = window.innerWidth  / 1920;
            const heightScale = window.innerHeight / 1080;
            setScale(Math.min(widthScale, heightScale));
        };
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <>
            {/* ГЛОБАЛЬНАЯ ВИНЬЕТКА (Поверх всего) */}
            <div className="game-vignette" />

            <div
                ref={containerRef}
                className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none select-none"
            >
                {/* ФИКСИРОВАННЫЙ ХОЛСТ 1920x1080 */}
                <div
                    className="relative w-[1920px] h-[1080px] shrink-0 pointer-events-none origin-center"
                    style={{ transform: `scale(${scale})` }}
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
