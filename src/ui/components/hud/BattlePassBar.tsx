import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

/**
 * BattlePassBar (v5.1) — Растянутая по высоте версия.
 */
export const BattlePassBar: React.FC = () => {
    const bpLevel = useGameStore(state => state.bpLevel);
const bpExp = useGameStore(state => state.bpExp);
const setScreen = useGameStore(state => state.setScreen);
const graphicsQuality = useGameStore(state => state.graphicsQuality);
    const maxExp = 1000;
    const progress = Math.min(100, Math.max(0, (bpExp / maxExp) * 100));

    const isLow = graphicsQuality === 'LOW';

    const [timeLeft, setTimeLeft] = React.useState('');

    React.useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            const diff = endOfMonth.getTime() - now.getTime();

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}д ${hours}ч ${mins}м`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, []);

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
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                onClick={() => setScreen('BATTLE_PASS')}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                {/* Background image with filter */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${AssetsMap.UI.ICON_BEAST_PASS})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        filter: isLow ? 'none' : 'contrast(1.2) saturate(1.2) brightness(1.02)',
                        zIndex: 0,
                    }}
                />

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
                        zIndex: 1,
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

                {/* ДИНАМИЧЕСКИЙ ПРОГРЕСС-БАР ОПЫТА (С МАСКОЙ ДЛЯ СТАТИЧЕСКОЙ ПОЛОСКИ) */}
                <div
                    style={{
                        position: 'absolute',
                        left: '25.9%',
                        top: 'calc(49% + 10px)',
                        width: '48.2%',
                        height: '18px',
                        transform: 'translateY(-50%)',
                        borderRadius: '9px',
                        pointerEvents: 'none',
                        background: '#0c0d10', // Перекрывает встроенную статическую полоску
                        border: '1px solid rgba(240, 192, 64, 0.45)', // Золотая окантовка
                        boxShadow: '0 1px 3px rgba(0,0,0,0.8), inset 0 1px 5px rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        zIndex: 1,
                    }}
                >
                    {/* Заполняющаяся часть */}
                    <div
                        style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #f0c040 0%, #ffea80 50%, #f0c040 100%)',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            borderRadius: '9px',
                            boxShadow: '0 0 10px rgba(240, 192, 64, 0.8)',
                            transition: 'width 0.3s ease-out',
                        }}
                        className="bp-gold-sweep"
                    />

                    {/* Текст с количеством опыта */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: "'Nunito', sans-serif",
                            fontSize: '11px',
                            fontWeight: 900,
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.8)',
                            pointerEvents: 'none',
                        }}
                    >
                        {bpExp} / {maxExp} XP
                    </div>
                </div>

                {/* ЗАГОЛОВОК */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
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
                        zIndex: 1,
                    }}
                >
                    БОЕВОЙ ПРОПУСК
                </div>

                {/* ТАЙМЕР */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
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
                        zIndex: 1,
                    }}
                >
                    <span style={{ fontSize: 11 }}>⏳</span>
                    <span>ДО КОНЦА: {timeLeft}</span>
                </div>
            </div>
        </div>
    );
};
