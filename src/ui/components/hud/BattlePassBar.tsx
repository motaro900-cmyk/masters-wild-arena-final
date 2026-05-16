import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

/**
 * BattlePassBar (v5.1) — Растянутая по высоте версия.
 */
export const BattlePassBar: React.FC = () => {
    const { bpLevel, setActiveScreen } = useGameStore();

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                pointerEvents: 'auto',
            }}
        >
            {/* Главный спрайт Battle Pass */}
            <div
                style={{
                    width: 550,
                    height: 120, // Увеличили с 95
                    backgroundImage: `url(${AssetsMap.UI.ICON_BEAST_PASS})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                onClick={() => setActiveScreen('BATTLE_PASS')}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                {/* УРОВЕНЬ НА ГЕРБЕ */}
                <div
                    style={{
                        position: 'absolute',
                        left: '12.1%', // Сдвинули на 2px влево (12.5% -> 12.1%)
                        top: '46%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: 38, // Увеличили с 34
                            fontWeight: 900,
                            color: '#ffffff',
                            textShadow: '0 0 10px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)',
                            lineHeight: '1',
                        }}
                    >
                        {bpLevel}
                    </span>
                </div>

                {/* ЗАГОЛОВОК */}
                <div
                    style={{
                        position: 'absolute',
                        left: '48%',
                        top: '18%',
                        transform: 'translateX(-50%)',
                        fontFamily: "'Cinzel', serif",
                        fontSize: 18, // Увеличили с 16
                        fontWeight: 900,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,1)',
                        letterSpacing: '2.8px',
                        textTransform: 'uppercase',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    БОЕВОЙ ПРОПУСК
                </div>

                {/* ТАЙМЕР */}
                <div
                    style={{
                        position: 'absolute',
                        left: '48%',
                        bottom: '12%', // Чуть подняли от края
                        transform: 'translateX(-50%)',
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'rgba(255, 255, 255, 0.6)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontSize: 11 }}>⏳</span>
                    <span>ДО КОНЦА: 14д 06ч 24м</span>
                </div>
            </div>
        </div>
    );
};
