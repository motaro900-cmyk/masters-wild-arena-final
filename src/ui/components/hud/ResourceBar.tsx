import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

const RESOURCES = [
    { key: 'energy', label: 'Энергия', sprite: AssetsMap.UI.BAR_ENERGY, color: '#f0c040' },
    { key: 'gold', label: 'Золото', sprite: AssetsMap.UI.BAR_GOLD, color: '#fff' },
    { key: 'gems', label: 'Кристаллы', sprite: AssetsMap.UI.BAR_GEM, color: '#fff' },
];

export const ResourceBar: React.FC<{ onOpenShop?: (tab: string) => void }> = ({ onOpenShop }) => {
    const { gold, crystals, energy, maxEnergy, lastEnergyUpdate, regenerateEnergy } = useGameStore();
    const [hoveredRes, setHoveredRes] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ next: string; full: string } | null>(null);

    // Обновляем таймер каждую секунду
    useEffect(() => {
        const timer = setInterval(() => {
            if (typeof regenerateEnergy === 'function') {
                regenerateEnergy(); // Проверяем регенерацию в сторе
            }

            if (energy < maxEnergy) {
                const now = Date.now();
                const FIVE_MIN = 5 * 60 * 1000;
                const diff = now - lastEnergyUpdate;
                const nextMs = FIVE_MIN - diff;

                const formatTime = (ms: number) => {
                    const totalSec = Math.max(0, Math.floor(ms / 1000));
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    return h > 0 ? `${h}ч ${m}м ${s}с` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                };

                const energyNeeded = maxEnergy - energy;
                const fullMs = (energyNeeded - 1) * FIVE_MIN + nextMs;

                setTimeLeft({
                    next: formatTime(nextMs),
                    full: formatTime(fullMs),
                });
            } else {
                setTimeLeft(null);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [energy, maxEnergy, lastEnergyUpdate, regenerateEnergy]);

    const values = { energy: `${energy}/${maxEnergy}`, gold, gems: crystals };

    return (
        <div className="flex items-center gap-3 pointer-events-auto">
            {RESOURCES.map((res) => (
                <div
                    key={res.key}
                    onMouseEnter={() => setHoveredRes(res.key)}
                    onMouseLeave={() => setHoveredRes(null)}
                    style={{
                        position: 'relative',
                        width: 145,
                        height: 34,
                        backgroundImage: `url(${res.sprite})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 6px',
                        cursor: 'default',
                        filter: 'url(#css-sharpen) contrast(1.3) saturate(1.2) brightness(1.0) hue-rotate(5deg)',
                    }}
                >
                    {/* Tooltip для энергии */}
                    {res.key === 'energy' && hoveredRes === 'energy' && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '120%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '220px',
                                background: 'rgba(20, 15, 10, 0.95)',
                                border: '1px solid #f0c040',
                                borderRadius: '8px',
                                padding: '12px',
                                zIndex: 1000,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                                pointerEvents: 'none',
                            }}
                        >
                            <div
                                style={{
                                    color: '#f0c040',
                                    fontWeight: 900,
                                    fontSize: '13px',
                                    marginBottom: '8px',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                Восстановление Энергии
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span style={{ color: '#a0a0a0' }}>До следующей:</span>
                                    <span style={{ color: '#fff', fontWeight: 700 }}>
                                        {energy >= maxEnergy ? 'MAX' : timeLeft?.next}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span style={{ color: '#a0a0a0' }}>До полной:</span>
                                    <span style={{ color: '#fff', fontWeight: 700 }}>
                                        {energy >= maxEnergy ? '00:00' : timeLeft?.full}
                                    </span>
                                </div>
                                <div style={{ marginTop: '5px', height: '1px', background: 'rgba(240,192,64,0.2)' }} />
                                <div
                                    style={{
                                        color: '#8a7a6a',
                                        fontSize: '9px',
                                        textAlign: 'center',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {energy >= maxEnergy ? 'Энергия полностью восстановлена' : '1 ед. каждые 5 минут'}
                                </div>
                            </div>
                            {/* Треугольничек */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderBottom: '6px solid #f0c040',
                                }}
                            />
                        </div>
                    )}

                    {/* Tooltip для золота */}
                    {res.key === 'gold' && hoveredRes === 'gold' && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '120%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '220px',
                                background: 'rgba(20, 15, 10, 0.95)',
                                border: '1px solid #f0c040',
                                borderRadius: '8px',
                                padding: '12px',
                                zIndex: 1000,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                                pointerEvents: 'none',
                            }}
                        >
                            <div
                                style={{
                                    color: '#f0c040',
                                    fontWeight: 900,
                                    fontSize: '13px',
                                    marginBottom: '8px',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                Золото
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span style={{ color: '#a0a0a0' }}>Основная валюта</span>
                                </div>
                                <div style={{ marginTop: '5px', height: '1px', background: 'rgba(240,192,64,0.2)' }} />
                                <div className="flex flex-col gap-1 text-[10px]" style={{ color: '#fff' }}>
                                    <div>⚔️ Добывается в боях на Арене</div>
                                    <div>📜 Дается за выполнение квестов</div>
                                    <div>🛡️ Тратится на экипировку</div>
                                </div>
                            </div>
                            {/* Треугольничек */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderBottom: '6px solid #f0c040',
                                }}
                            />
                        </div>
                    )}

                    {/* Tooltip для кристаллов */}
                    {res.key === 'gems' && hoveredRes === 'gems' && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '120%',
                                right: '0px', // Выравниваем по правому краю, чтобы не уходило за экран
                                width: '220px',
                                background: 'rgba(20, 15, 10, 0.95)',
                                border: '1px solid #a855f7',
                                borderRadius: '8px',
                                padding: '12px',
                                zIndex: 1000,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                                pointerEvents: 'none',
                            }}
                        >
                            <div
                                style={{
                                    color: '#a855f7',
                                    fontWeight: 900,
                                    fontSize: '13px',
                                    marginBottom: '8px',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                Кристаллы
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span style={{ color: '#a0a0a0' }}>Премиум валюта</span>
                                </div>
                                <div style={{ marginTop: '5px', height: '1px', background: 'rgba(168,85,247,0.2)' }} />
                                <div className="flex flex-col gap-1 text-[10px]" style={{ color: '#fff' }}>
                                    <div>💎 Покупка в Банке</div>
                                    <div>🎁 Награда за достижения</div>
                                    <div>⚡ Покупка энергии и редких вещей</div>
                                </div>
                            </div>
                            {/* Треугольничек */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '60px', // Смещаем стрелочку к центру иконки кристаллов
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderBottom: '6px solid #a855f7',
                                }}
                            />
                        </div>
                    )}

                    {/* Значение ресурса */}
                    <div
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            paddingRight: 28,
                            paddingLeft: 34,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 16,
                                fontWeight: 900,
                                color: res.color,
                                textShadow: '0 2px 4px rgba(0,0,0,1)',
                                letterSpacing: '0.2px',
                            }}
                        >
                            {/* @ts-expect-error - indexing values with string key */}
                            {typeof values[res.key] === 'number' ? values[res.key].toLocaleString() : values[res.key]}
                        </span>
                    </div>

                    <button
                        onClick={() => onOpenShop?.(res.key === 'gems' ? 'GEMS' : res.key.toUpperCase())}
                        style={{
                            position: 'absolute',
                            right: 4,
                            width: 24,
                            height: 24,
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            zIndex: 5,
                        }}
                    />
                </div>
            ))}
        </div>
    );
};
