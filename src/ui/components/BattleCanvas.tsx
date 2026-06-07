/**
 * @module BattleCanvas
 * Упрощенный хост для боевого движка (v2.0)
 */

import { useEffect, useRef, useState } from 'react';
import { useBattleStore } from '../../store/useBattleStore';
import { BattleEngine } from '../../engine/core/BattleEngine';
import { useGameStore } from '../../store/useGameStore';

export function BattleCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);

    const battlePhase = useBattleStore((s) => s.battlePhase);
    const selectedHeroId = useGameStore((s) => s.selectedHeroId);

    // 1. Инициализация PIXI и Двигателя
    useEffect(() => {
        if (!containerRef.current) return;

        let isMounted = true;
        const engine = BattleEngine.getInstance();

        // Запуск инициализации сцены через движок
        // Движок сам инициализирует PixiApp внутри своего init()
        engine
            .init(
                containerRef.current,
                selectedHeroId || 'panda',
                'enemy_dummy',
                { hp: 1000, attack: 50, speed: 1.2, critChance: 0.1, defense: 20, dodge: 0.05 },
                { hp: 800, attack: 45, speed: 1.0, critChance: 0.05, defense: 15, dodge: 0.03 },
            )
            .then(() => {
                if (!isMounted) return;

                // Подписка на лог боя
                engine.onStateChange = (state) => {
                    if (state.log && isMounted) {
                        setBattleLog((prev) => [state.log, ...prev].slice(0, 50));
                    }
                };
            })
            .catch((error) => {
                console.error('[BattleCanvas] Ошибка инициализации движка боя:', error);
            });

        return () => {
            isMounted = false;
            engine.destroy();
        };
    }, [selectedHeroId]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                overflow: 'hidden',
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 0,
                }}
            />

            {/* Overlay UI */}
            <div
                style={{
                    position: 'absolute',
                    top: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#f0c040',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 2px 10px #000',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            >
                {battlePhase === 'combat' ? 'БИТВА В РАЗГАРЕ' : 'ПОДГОТОВКА К БОЮ'}
            </div>

            {/* Боевой Лог */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '40px',
                    width: '400px',
                    height: '150px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    border: '1px solid rgba(240,192,64,0.2)',
                    padding: '15px',
                    overflowY: 'auto',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: '5px',
                    zIndex: 10,
                }}
            >
                {battleLog.map((log, i) => (
                    <div key={i} style={{ opacity: 1 - i * 0.15 }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BattleCanvas;
