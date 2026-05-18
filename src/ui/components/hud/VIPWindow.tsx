import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { safeGetItem, safeSetItem } from '../../../utils/SafeStorage';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

interface VIPWindowProps {
    onClose: () => void;
}

// Премиальные SVG-иконки для привилегий
const GoldIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="url(#goldGrad)" stroke="#f0c040" strokeWidth="1.5" />
        <path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffe066" />
                <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
        </defs>
    </svg>
);

const XpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z"
            fill="url(#xpGrad)"
            filter="drop-shadow(0 0 4px rgba(192, 132, 252, 0.6))"
        />
        <defs>
            <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e9d5ff" />
                <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
        </defs>
    </svg>
);

const EnergyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="url(#energyGrad)"
            filter="drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))"
        />
        <defs>
            <linearGradient id="energyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
        </defs>
    </svg>
);

const MailIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="url(#mailGrad)" stroke="#f0c040" strokeWidth="1.5" />
        <path d="M22 7l-10 6L2 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="mailGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
        </defs>
    </svg>
);

const RerollIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"
            stroke="url(#rerollGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <defs>
            <linearGradient id="rerollGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
        </defs>
    </svg>
);

const ChatIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="url(#chatGrad)" />
        <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5L12 6z" fill="#fff" />
        <defs>
            <linearGradient id="chatGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
        </defs>
    </svg>
);

export const VIPWindow: React.FC<VIPWindowProps> = () => {
    const { vipLevel } = useGameStore();
    const [daysLeft, setDaysLeft] = useState<number>(() => {
        const endTime = safeGetItem('vipEndTime');
        if (endTime) {
            const diff = parseInt(endTime) - Date.now();
            return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
        }
        return 0;
    });

    const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null);
    const [hoveredPkg, setHoveredPkg] = useState<number | null>(null);

    // Синхронизируем состояние VIP в сторе, если оно расходится с днями
    useEffect(() => {
        if (daysLeft > 0 && vipLevel === 0) {
            setTimeout(() => useGameStore.setState({ vipLevel: 1, maxEnergy: 60 }), 0);
        } else if (daysLeft === 0 && vipLevel > 0) {
            setTimeout(() => useGameStore.setState({ vipLevel: 0, maxEnergy: 50 }), 0);
        }
    }, [daysLeft, vipLevel]);

    const benefits = [
        { icon: <GoldIcon />, text: 'БОНУС ЗОЛОТА В БОЯХ: +15%' },
        { icon: <XpIcon />, text: 'БОНУС ОПЫТА ГЕРОЯ: +10%' },
        { icon: <EnergyIcon />, text: 'МАКС. ЗАПАС ЭНЕРГИИ: +10' },
        { icon: <MailIcon />, text: 'ЕЖЕДНЕВНЫЙ VIP ПОДАРОК НА ПОЧТУ' },
        { icon: <RerollIcon />, text: '1 БЕСПЛАТНЫЙ СБРОС КВЕСТА В ДЕНЬ' },
        { icon: <ChatIcon />, text: 'УНИКАЛЬНЫЙ VIP ЗНАЧОК В ЧАТЕ' },
    ];

    const vipPackages = [
        { days: 1, price: 50 },
        { days: 3, price: 130 },
        { days: 7, price: 250 },
        { days: 30, price: 900 },
    ];

    const buyVip = React.useCallback((days: number, price: number) => {
        const store = useGameStore.getState();
        if (store.crystals < price) {
            alert('Недостаточно алмазов!');
            return;
        }

        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);

        // Списываем алмазы и активируем VIP
        useGameStore.setState({ crystals: store.crystals - price, vipLevel: 1, maxEnergy: 60 });

        // Продлеваем VIP
        const now = Date.now();
        const currentEndTime = safeGetItem('vipEndTime') ? parseInt(safeGetItem('vipEndTime')!) : now;
        const newEndTime = Math.max(currentEndTime, now) + days * 24 * 60 * 60 * 1000;
        safeSetItem('vipEndTime', newEndTime.toString());

        setDaysLeft(Math.ceil((newEndTime - now) / (1000 * 60 * 60 * 24)));
    }, []);

    const isActive = daysLeft > 0;

    return (
        <div className="flex flex-col gap-6 p-2 select-none">
            {/* 1. HEADER STATUS */}
            <div
                style={{
                    background: isActive
                        ? 'linear-gradient(180deg, rgba(240, 192, 64, 0.15) 0%, rgba(26, 18, 15, 0.95) 100%)'
                        : 'linear-gradient(180deg, #2a1f1a 0%, #1a120f 100%)',
                    padding: '24px 20px',
                    borderRadius: '16px',
                    border: isActive ? '1.5px solid #f0c040' : '1px solid #4a3f3a',
                    boxShadow: isActive
                        ? '0 0 30px rgba(240, 192, 64, 0.15), inset 0 0 15px rgba(240, 192, 64, 0.1)'
                        : '0 5px 15px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Мерцающий золотой блеск заднего плана */}
                {isActive && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            background: 'radial-gradient(circle, rgba(240,192,64,0.4) 0%, transparent 70%)',
                            animation: 'pulse 3s infinite alternate',
                        }}
                    />
                )}

                <span
                    style={{
                        color: isActive ? '#f0c040' : '#a0a0a0',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        textShadow: isActive ? '0 0 5px rgba(240,192,64,0.3)' : 'none',
                    }}
                >
                    Текущий статус
                </span>

                {isActive ? (
                    <div className="flex flex-col items-center z-10">
                        <span
                            style={{
                                background: 'linear-gradient(to bottom, #ffe066 0%, #f0c040 50%, #b38b3b 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '38px',
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(240,192,64,0.4))',
                                letterSpacing: '1px',
                                lineHeight: '1.2',
                            }}
                        >
                            VIP АКТИВЕН
                        </span>
                        <div
                            className="mt-1 bg-black/50 border border-amber-500/30 px-4 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>
                                Осталось: <span style={{ color: '#f0c040' }}>{daysLeft} дней</span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span
                            style={{
                                color: '#7a6a5a',
                                fontSize: '38px',
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                lineHeight: '1.2',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                        >
                            VIP НЕ АКТИВЕН
                        </span>
                        <span style={{ color: '#a0a0a0', fontSize: '13px', marginTop: '4px', textAlign: 'center' }}>
                            Приобретите VIP, чтобы мгновенно активировать все бонусы!
                        </span>
                    </div>
                )}
            </div>

            {/* 2. BENEFITS LIST */}
            <div className="flex flex-col gap-3">
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#f0c040',
                        fontSize: '15px',
                        fontWeight: 800,
                        borderBottom: '1px solid rgba(240,192,64,0.2)',
                        paddingBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '2px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                >
                    Привилегии VIP
                </h3>

                <div className="flex flex-col gap-2">
                    {benefits.map((b, i) => (
                        <motion.div
                            key={i}
                            onMouseEnter={() => setHoveredBenefit(i)}
                            onMouseLeave={() => setHoveredBenefit(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '12px 20px',
                                background: isActive
                                    ? 'linear-gradient(90deg, rgba(240, 192, 64, 0.1) 0%, rgba(240, 192, 64, 0.02) 100%)'
                                    : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.15) 100%)',
                                borderRadius: '12px',
                                border: `1px solid ${isActive ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.04)'}`,
                                borderLeft:
                                    hoveredBenefit === i
                                        ? '4px solid #f0c040'
                                        : `4px solid ${isActive ? 'rgba(240,192,64,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                transform: hoveredBenefit === i ? 'translateX(4px)' : 'translateX(0)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: hoveredBenefit === i ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    filter: isActive ? 'none' : 'grayscale(1) opacity(0.35)',
                                }}
                            >
                                {b.icon}
                            </span>
                            <span
                                style={{
                                    color: isActive ? '#fff' : '#8a7a6a',
                                    fontSize: '13px',
                                    fontWeight: isActive ? '900' : '700',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '0.5px',
                                    textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                                }}
                            >
                                {b.text}
                            </span>

                            {/* Элегантные капсульные плашки доступности */}
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    letterSpacing: '1.5px',
                                    padding: '3px 12px',
                                    borderRadius: '20px',
                                    transition: 'all 0.2s',
                                    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                    border: isActive
                                        ? '1px solid rgba(16, 185, 129, 0.3)'
                                        : '1px solid rgba(239, 68, 68, 0.2)',
                                    color: isActive ? '#34d399' : '#f87171',
                                    textShadow: isActive ? '0 0 5px rgba(52, 211, 153, 0.4)' : 'none',
                                }}
                            >
                                {isActive ? 'ДОСТУПНО' : 'НЕДОСТУПНО'}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 3. PURCHASE PACKAGES */}
            <div className="flex flex-col gap-3 mt-2">
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: isActive ? 'rgba(240, 192, 64, 0.4)' : '#f0c040',
                        fontSize: '15px',
                        fontWeight: 800,
                        borderBottom: '1px solid rgba(240,192,64,0.2)',
                        paddingBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '2px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                >
                    Продлить VIP статус
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    {vipPackages.map((pkg, i) => (
                        <button
                            key={i}
                            onClick={() => buyVip(pkg.days, pkg.price)}
                            onMouseEnter={() => setHoveredPkg(i)}
                            onMouseLeave={() => setHoveredPkg(null)}
                            className="flex items-center justify-between gap-3 group relative overflow-hidden"
                            style={{
                                background:
                                    pkg.days === 30 && !isActive
                                        ? 'linear-gradient(180deg, rgba(60, 45, 30, 0.85) 0%, rgba(26,18,15,0.95) 100%)'
                                        : 'linear-gradient(180deg, rgba(42,31,26,0.8) 0%, rgba(26,18,15,0.9) 100%)',
                                border: isActive
                                    ? hoveredPkg === i
                                        ? '1px solid #f0c040'
                                        : '1px solid rgba(255,255,255,0.06)'
                                    : pkg.days === 30
                                      ? '1.5px solid #f0c040'
                                      : hoveredPkg === i
                                        ? '1px solid #f0c040'
                                        : '1px solid rgba(240,192,64,0.3)',
                                borderRadius: '14px',
                                padding: '14px 20px',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: hoveredPkg === i ? 'scale(1.02) translateY(-1px)' : 'scale(1) translateY(0)',
                                boxShadow: isActive
                                    ? hoveredPkg === i
                                        ? '0 4px 12px rgba(240,192,64,0.15)'
                                        : 'none'
                                    : pkg.days === 30
                                      ? hoveredPkg === i
                                          ? '0 6px 20px rgba(240,192,64,0.25)'
                                          : '0 4px 15px rgba(240,192,64,0.15)'
                                      : hoveredPkg === i
                                        ? '0 5px 15px rgba(0,0,0,0.3)'
                                        : 'none',
                            }}
                        >
                            {/* Лента выгодной покупки для 30 дней */}
                            {pkg.days === 30 && !isActive && (
                                <div
                                    className="absolute top-[-8px] right-[16px] bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_2px_5px_rgba(0,0,0,0.3)] animate-pulse"
                                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                                >
                                    Выгодно!
                                </div>
                            )}

                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '18px',
                                    fontWeight: 950,
                                    background:
                                        pkg.days === 30 && !isActive
                                            ? 'linear-gradient(to bottom, #fff 30%, #ffd700 100%)'
                                            : 'none',
                                    WebkitBackgroundClip: pkg.days === 30 && !isActive ? 'text' : 'none',
                                    WebkitTextFillColor: pkg.days === 30 && !isActive ? 'transparent' : 'initial',
                                    color: pkg.days === 30 && !isActive ? undefined : '#fff',
                                    letterSpacing: '1px',
                                }}
                            >
                                {pkg.days} {pkg.days === 1 ? 'ДЕНЬ' : pkg.days > 4 ? 'ДНЕЙ' : 'ДНЯ'}
                            </span>

                            <div
                                className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full border border-white/5 shadow-inner transition-all duration-200"
                                style={{
                                    borderColor:
                                        hoveredPkg === i ? 'rgba(192, 132, 252, 0.4)' : 'rgba(255,255,255,0.05)',
                                }}
                            >
                                <img
                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                    alt="gems"
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        filter: 'drop-shadow(0 0 4px rgba(192, 132, 252, 0.6))',
                                    }}
                                />
                                <span
                                    style={{
                                        color: '#c084fc',
                                        fontWeight: 950,
                                        fontSize: '14px',
                                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {pkg.price}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
