import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
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

const InstantPassIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            fill="url(#passGrad)"
            filter="drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))"
        />
        <defs>
            <linearGradient id="passGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffe066" />
                <stop offset="100%" stopColor="#f59e0b" />
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
    const vipLevel = useGameStore(state => state.vipLevel);
const isPremium = useGameStore(state => state.isPremium);
const vipEndTime = useGameStore(state => state.vipEndTime);
const isMobile = useGameStore(state => state.isMobile);

    // Вычисляем оставшиеся дни на основе vipEndTime из стора
    const getDaysLeft = React.useCallback((endTime: number) => {
        if (!endTime) return 0;
        const diff = endTime - Date.now();
        return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    }, []);

    const daysLeft = getDaysLeft(vipEndTime || 0);

    const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null);
    const [hoveredPkg, setHoveredPkg] = useState<number | null>(null);

    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    const scheduleTimeout = (fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            timeoutRefs.current = timeoutRefs.current.filter((t) => t !== id);
            fn();
        }, ms);
        timeoutRefs.current.push(id);
        return id;
    };

    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach((id) => clearTimeout(id));
            timeoutRefs.current = [];
        };
    }, []);

    useEffect(() => {
        const calculateMaxEnergy = (premium: boolean, hasVip: boolean): number => {
            const base = 50;
            const premiumBonus = premium ? 15 : 0;
            const vipBonus = hasVip ? 15 : 0;
            return base + Math.max(premiumBonus, vipBonus);
        };

        if (daysLeft > 0 && vipLevel === 0) {
            scheduleTimeout(
                () =>
                    useGameStore.setState({
                        vipLevel: 1,
                        maxEnergy: calculateMaxEnergy(isPremium, true),
                    }),
                0,
            );
        } else if (daysLeft === 0 && vipLevel > 0) {
            scheduleTimeout(
                () =>
                    useGameStore.setState({
                        vipLevel: 0,
                        maxEnergy: calculateMaxEnergy(isPremium, false),
                    }),
                0,
            );
        }
    }, [daysLeft, vipLevel, isPremium]);

    const benefits = [
        { icon: <GoldIcon />, text: 'БОНУС ЗОЛОТА В БОЯХ: +15%' },
        { icon: <XpIcon />, text: 'БОНУС ОПЫТА ГЕРОЯ: +10%' },
        { icon: <EnergyIcon />, text: 'МАКС. ЗАПАС ЭНЕРГИИ: +15' },
        { icon: <MailIcon />, text: 'ЕЖЕДНЕВНЫЙ VIP ПОДАРОК НА ПОЧТУ' },
        { icon: <InstantPassIcon />, text: '1 АВТО-ПРОХОЖДЕНИЕ КВЕСТА В ДЕНЬ' },
        { icon: <ChatIcon />, text: 'УНИКАЛЬНЫЙ VIP ЗНАЧОК В ЧАТЕ' },
    ];

    const vipPackages = [
        { days: 1, price: 50, label: '1 ДЕНЬ', discount: null },
        { days: 3, price: 130, label: '3 ДНЯ', discount: null },
        { days: 7, price: 250, label: '7 ДНЕЙ', discount: '-11%' },
        { days: 30, price: 900, label: '30 ДНЕЙ', discount: '-40%' },
    ];

    const buyVip = React.useCallback((days: number, price: number) => {
        const store = useGameStore.getState();
        if (store.crystals < price) {
            useGameStore.getState().showAlert('Недостаточно алмазов!');
            return;
        }

        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);

        const success = store.buyVip(days, price);
        if (!success) {
            useGameStore.getState().showAlert('Не удалось активировать VIP-статус!');
        }
    }, []);

    const isActive = daysLeft > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '16px', padding: '4px', userSelect: 'none' }}>
            {/* ────────── 1. STATUS HEADER ────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: isActive
                        ? 'linear-gradient(180deg, rgba(240,192,64,0.18) 0%, rgba(22,14,8,0.97) 100%)'
                        : 'linear-gradient(180deg, rgba(35,24,16,0.98) 0%, rgba(14,8,4,0.98) 100%)',
                    padding: isMobile ? '12px 14px 10px' : '22px 20px 18px',
                    borderRadius: '16px',
                    border: isActive ? '1.5px solid rgba(240,192,64,0.65)' : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isActive
                        ? '0 0 40px rgba(240,192,64,0.16), inset 0 0 24px rgba(240,192,64,0.06)'
                        : '0 6px 22px rgba(0,0,0,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '10px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Радиальный свет сверху */}
                {isActive && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '60%',
                            background: 'radial-gradient(ellipse at 50% 0%, rgba(240,192,64,0.22) 0%, transparent 70%)',
                            pointerEvents: 'none',
                            animation: 'pulse 3s ease-in-out infinite alternate',
                        }}
                    />
                )}

                {/* Crown sprite */}
                <img
                    src={AssetsMap.UI.ICON_CROWN}
                    alt="crown"
                    style={{
                        width: isMobile ? '32px' : '42px',
                        height: isMobile ? '32px' : '42px',
                        objectFit: 'contain',
                        filter: isActive
                            ? 'drop-shadow(0 0 10px rgba(240,192,64,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                            : 'grayscale(1) brightness(0.3) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                        zIndex: 1,
                        transition: 'filter 0.3s ease',
                    }}
                />

                <span
                    style={{
                        color: isActive ? 'rgba(240,192,64,0.6)' : 'rgba(255,255,255,0.18)',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        zIndex: 1,
                    }}
                >
                    Текущий статус
                </span>

                {isActive ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            zIndex: 1,
                        }}
                    >
                        <span
                            style={{
                                background: 'linear-gradient(to bottom, #fff8cc 0%, #f0c040 45%, #9a6200 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: isMobile ? '26px' : '34px',
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(240,192,64,0.45))',
                                letterSpacing: '2px',
                                lineHeight: 1.1,
                            }}
                        >
                            VIP АКТИВЕН
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                padding: '5px 18px',
                                borderRadius: '20px',
                            }}
                        >
                            <span
                                style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    display: 'inline-block',
                                    boxShadow: '0 0 6px #10b981',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                }}
                            />
                            <span style={{ color: '#d1d5db', fontSize: '13px', fontWeight: 700 }}>
                                Осталось:{' '}
                                <span
                                    style={{
                                        color: '#f0c040',
                                        textShadow: '0 0 8px rgba(240,192,64,0.4)',
                                        fontWeight: 900,
                                    }}
                                >
                                    {daysLeft} дней
                                </span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            zIndex: 1,
                        }}
                    >
                        <span
                            style={{
                                color: '#a68f7b',
                                fontSize: isMobile ? '24px' : '32px',
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1.5px',
                                lineHeight: 1.1,
                                textShadow: '0 2px 10px rgba(0,0,0,0.98)',
                            }}
                        >
                            VIP НЕ АКТИВЕН
                        </span>
                        <span
                            style={{
                                color: '#bca895',
                                fontSize: '12px',
                                textAlign: 'center',
                                lineHeight: 1.5,
                                maxWidth: '300px',
                            }}
                        >
                            Приобретите VIP, чтобы мгновенно активировать все бонусы!
                        </span>
                    </div>
                )}
            </motion.div>

            {/* ────────── 2. BENEFITS LIST ────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#f0c040',
                        fontSize: '12px',
                        fontWeight: 800,
                        borderBottom: '1px solid rgba(240,192,64,0.15)',
                        paddingBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '3px',
                        margin: 0,
                        textTransform: 'uppercase',
                    }}
                >
                    Привилегии VIP
                </h3>

                {benefits.map((b, i) => (
                    <motion.div
                        key={i}
                        onMouseEnter={() => setHoveredBenefit(i)}
                        onMouseLeave={() => setHoveredBenefit(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: isMobile ? '6px 10px' : '10px 14px',
                            background:
                                hoveredBenefit === i
                                    ? 'linear-gradient(90deg, rgba(240,192,64,0.15) 0%, rgba(0,0,0,0.15) 100%)'
                                    : isActive
                                      ? 'linear-gradient(90deg, rgba(240,192,64,0.08) 0%, rgba(0,0,0,0.2) 100%)'
                                      : 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                            borderRadius: '10px',
                            border: `1px solid ${hoveredBenefit === i ? 'rgba(240,192,64,0.32)' : 'rgba(255,255,255,0.09)'}`,
                            borderLeft: `3px solid ${
                                isActive
                                    ? hoveredBenefit === i
                                        ? '#f0c040'
                                        : 'rgba(240,192,64,0.45)'
                                    : hoveredBenefit === i
                                      ? 'rgba(220,180,100,0.65)'
                                      : 'rgba(180,140,60,0.45)'
                            }`,
                            transform: hoveredBenefit === i ? 'translateX(3px)' : 'translateX(0)',
                            transition: 'all 0.2s ease',
                            opacity: isActive ? 1 : 0.95,
                        }}
                    >
                        {/* Icon */}
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                filter: isActive ? 'none' : 'grayscale(0.2) brightness(0.85)',
                                transition: 'filter 0.2s',
                            }}
                        >
                            {b.icon}
                        </span>

                        {/* Text */}
                        <span
                            style={{
                                color: isActive ? '#e0cfa0' : '#e5d7bc',
                                fontSize: isMobile ? '10px' : '11.5px',
                                fontWeight: 700,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.3px',
                                flex: 1,
                            }}
                        >
                            {b.text}
                        </span>

                        {/* Availability badge */}
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                                fontSize: '9px',
                                fontWeight: 900,
                                letterSpacing: '0.8px',
                                padding: '3px 9px 3px 7px',
                                borderRadius: '20px',
                                background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(90,60,20,0.65)',
                                border: isActive
                                    ? '1px solid rgba(16,185,129,0.28)'
                                    : '1px solid rgba(160,110,40,0.55)',
                                color: isActive ? '#34d399' : '#b8843a',
                                textShadow: isActive ? '0 0 6px rgba(52,211,153,0.35)' : 'none',
                            }}
                        >
                            {!isActive && <Lock size={8} color="#b8843a" style={{ flexShrink: 0 }} />}
                            {isActive ? 'ДОСТУПНО' : 'ЗАПЕРТО'}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* ────────── 3. PURCHASE PACKAGES ────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: isActive ? 'rgba(240,192,64,0.35)' : '#f0c040',
                        fontSize: '12px',
                        fontWeight: 800,
                        borderBottom: '1px solid rgba(240,192,64,0.15)',
                        paddingBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '3px',
                        margin: 0,
                        textTransform: 'uppercase',
                    }}
                >
                    {isActive ? 'Продлить VIP статус' : 'Активировать VIP'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '8px' : '10px' }}>
                    {vipPackages.map((pkg, i) => {
                        const isBest = pkg.days === 30;
                        const isHov = hoveredPkg === i;

                        return (
                            <button
                                key={i}
                                onClick={() => buyVip(pkg.days, pkg.price)}
                                onMouseEnter={() => setHoveredPkg(i)}
                                onMouseLeave={() => setHoveredPkg(null)}
                                style={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isBest
                                        ? isHov
                                            ? 'linear-gradient(135deg, rgba(76,52,16,0.97) 0%, rgba(36,22,6,0.99) 100%)'
                                            : 'linear-gradient(135deg, rgba(58,40,12,0.94) 0%, rgba(26,15,4,0.97) 100%)'
                                        : isHov
                                          ? 'linear-gradient(135deg, rgba(46,34,24,0.93) 0%, rgba(26,16,8,0.97) 100%)'
                                          : 'linear-gradient(135deg, rgba(34,24,16,0.87) 0%, rgba(18,10,4,0.94) 100%)',
                                    border: isBest
                                        ? `1.5px solid ${isHov ? '#f0c040' : 'rgba(240,192,64,0.52)'}`
                                        : `1px solid ${isHov ? 'rgba(240,192,64,0.35)' : 'rgba(255,255,255,0.055)'}`,
                                    borderRadius: '12px',
                                    padding: isMobile ? '10px 12px' : '14px 16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.22s ease',
                                    transform: isHov ? 'scale(1.03) translateY(-2px)' : 'scale(1)',
                                    boxShadow: isBest
                                        ? isHov
                                            ? '0 8px 26px rgba(240,192,64,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
                                            : '0 4px 18px rgba(240,192,64,0.14), inset 0 1px 0 rgba(255,255,255,0.03)'
                                        : isHov
                                          ? '0 4px 16px rgba(0,0,0,0.45)'
                                          : '0 2px 8px rgba(0,0,0,0.32)',
                                }}
                            >
                                {/* Gold line shimmer on top of best package */}
                                {isBest && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '1px',
                                            background:
                                                'linear-gradient(90deg, transparent 0%, rgba(240,192,64,0.6) 50%, transparent 100%)',
                                        }}
                                    />
                                )}

                                {/* Discount badge (top ribbon) */}
                                {pkg.discount && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-1px',
                                            right: '12px',
                                            background: isBest
                                                ? 'linear-gradient(135deg, #f0c040 0%, #b87800 100%)'
                                                : 'linear-gradient(135deg, #555 0%, #333 100%)',
                                            color: isBest ? '#1a0d00' : '#aaa',
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            padding: '2px 9px',
                                            borderRadius: '0 0 8px 8px',
                                            letterSpacing: '0.5px',
                                            boxShadow: isBest ? '0 2px 8px rgba(240,192,64,0.35)' : 'none',
                                        }}
                                    >
                                        {pkg.discount}
                                    </div>
                                )}

                                {/* Label */}
                                <span
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: isMobile ? '13px' : '15px',
                                        fontWeight: 900,
                                        letterSpacing: '0.5px',
                                        background: isBest
                                            ? 'linear-gradient(to bottom, #fff8d8 0%, #f0c040 55%, #9a6200 100%)'
                                            : 'none',
                                        WebkitBackgroundClip: isBest ? 'text' : 'initial',
                                        WebkitTextFillColor: isBest ? 'transparent' : 'initial',
                                        color: isBest ? undefined : isHov ? '#e0d0b0' : '#9a8868',
                                        filter: isBest ? 'drop-shadow(0 1px 5px rgba(0,0,0,0.85))' : 'none',
                                    }}
                                >
                                    {pkg.label}
                                </span>

                                {/* Price chip */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: 'rgba(0,0,0,0.52)',
                                        padding: isMobile ? '3px 8px' : '5px 12px',
                                        borderRadius: '20px',
                                        border: isBest
                                            ? '1px solid rgba(192,132,252,0.38)'
                                            : '1px solid rgba(255,255,255,0.055)',
                                        boxShadow: isBest ? '0 0 10px rgba(192,132,252,0.18)' : 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                        alt="gems"
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.65))',
                                        }}
                                    />
                                    <span
                                        style={{
                                            color: '#c084fc',
                                            fontWeight: 900,
                                            fontSize: isMobile ? '12.5px' : '14px',
                                            textShadow: '0 0 8px rgba(192,132,252,0.38)',
                                        }}
                                    >
                                        {pkg.price}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VIPWindow;
