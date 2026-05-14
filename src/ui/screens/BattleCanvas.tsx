import { useEffect, useRef } from 'react';
import { PixiApp } from '../../engine/core/PixiApp';
import { BattleEngine } from '../../engine/core/BattleEngine';

export function BattleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;
        const app = PixiApp.getInstance();
        const engine = new BattleEngine();
        engineRef.current = engine;

        // Инициализация PixiJS
        app.init({ width: 1920, height: 1080 }, canvasRef.current).then(() => {
            if (!isMounted) return;

            // Инициализация Боя (Approach E)
            const testStats = { hp: 1000, attack: 50, speed: 10, critChance: 0.1, defense: 20, dodge: 0.05 };
            engine.init(canvasRef.current!, 'panda', testStats, testStats);
        });

        return () => {
            isMounted = false;
            engine.destroy();
            app.destroy();
        };
    }, []);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000'
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    cursor: 'default',
                }}
            />
        </div>
    );
}

export default BattleCanvas;
