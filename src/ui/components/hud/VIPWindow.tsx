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
    const vipLevel = useGameStore((state) => state.vipLevel);
    const isPremium = useGameStore((state) => state.isPremium);
    const vipEndTime = useGameStore((state) => state.vipEndTime);
    const isMobile = useGameStore((state) => state.isMobile);

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
        { days: 1, price: 100, label: '1 ДЕНЬ', discount: null },
        { days: 3, price: 270, label: '3 ДНЯ', discount: 'ВЫГОДА 10%' },
        { days: 7, price: 550, label: '7 ДНЕЙ', discount: 'ВЫГОДА 21%' },
        { days: 30, price: 1800, label: '30 ДНЕЙ', discount: 'ВЫГОДА 40%' },
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
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '12px' : '18px',
                padding: isMobile ? '16px 20px' : '24px 32px',
                boxSizing: 'border-box',
                userSelect: 'none',
                overflowY: 'auto',
                fontFamily: "'Outfit', 'Nunito', sans-serif",
            }}
            className="custom-scrollbar"
        >
            <style>{`
                @keyframes floatCrown {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-5px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes activePulse {
                    0% { opacity: 0.85; filter: drop-shadow(0 0 4px rgba(240, 192, 64, 0.45)); }
                    50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(240, 192, 64, 0.85)); }
                    100% { opacity: 0.85; filter: drop-shadow(0 0 4px rgba(240, 192, 64, 0.45)); }
                }
            `}</style>

            {/* ────────── 1. STATUS HEADER ────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: isActive
                        ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(26, 12, 45, 0.98) 60%, rgba(12, 5, 20, 1) 100%)'
                        : 'linear-gradient(135deg, rgba(60, 35, 5, 0.98) 0%, rgba(40, 22, 3, 0.99) 50%, rgba(20, 10, 0, 1) 100%)',
                    padding: isMobile ? '14px 18px 12px' : '24px 28px 20px',
                    borderRadius: '16px',
                    border: isActive ? '2px solid #ffd700' : '1.5px solid rgba(240,192,64,0.35)',
                    boxShadow: isActive
                        ? '0 0 35px rgba(240, 192, 64, 0.3), inset 0 0 20px rgba(240, 192, 64, 0.15)'
                        : '0 0 28px rgba(180, 120, 20, 0.25), inset 0 0 30px rgba(200, 140, 30, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '6px' : '10px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Radial shimmer — both active and inactive get a top-center glow */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: isActive
                            ? 'radial-gradient(circle at 50% 0%, rgba(240, 192, 64, 0.35) 0%, transparent 75%)'
                            : 'radial-gradient(circle at 50% 0%, rgba(200, 130, 20, 0.22) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Floating crown — golden on both states */}
                <motion.img
                    src={AssetsMap.UI.ICON_CROWN}
                    alt="crown"
                    style={{
                        width: isMobile ? '36px' : '52px',
                        height: isMobile ? '36px' : '52px',
                        objectFit: 'contain',
                        filter: isActive
                            ? 'drop-shadow(0 0 14px rgba(240,192,64,0.75)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))'
                            : 'drop-shadow(0 0 10px rgba(200,140,30,0.55)) brightness(0.75) sepia(0.4) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                        zIndex: 1,
                        animation: isActive
                            ? 'floatCrown 3s ease-in-out infinite'
                            : 'floatCrown 5s ease-in-out infinite',
                    }}
                />

                <span
                    style={{
                        color: isActive ? '#ffd700' : 'rgba(200, 150, 60, 0.75)',
                        fontSize: '10.5px',
                        fontWeight: 950,
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        zIndex: 1,
                        textShadow: '0 1.5px 3px rgba(0,0,0,0.95)',
                    }}
                >
                    {isActive ? 'Текущий статус' : 'Эксклюзивный статус'}
                </span>

                {isActive ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            zIndex: 1,
                        }}
                    >
                        <span
                            style={{
                                color: '#ffd700',
                                fontSize: isMobile ? '24px' : '32px',
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '2.5px',
                                lineHeight: 1.1,
                                textShadow:
                                    '0 0 18px rgba(240,192,64,0.75), 0 0 6px rgba(240,192,64,0.5), 0 2px 6px rgba(0,0,0,0.95)',
                            }}
                        >
                            VIP АКТИВЕН
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(0,0,0,0.65)',
                                border: '1.5px solid rgba(16,185,129,0.45)',
                                padding: '4px 16px',
                                borderRadius: '20px',
                                boxShadow: '0 0 12px rgba(16,185,129,0.25)',
                                animation: 'activePulse 2.5s infinite ease-in-out',
                            }}
                        >
                            <span
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    display: 'inline-block',
                                    boxShadow: '0 0 6px #10b981',
                                }}
                            />
                            <span
                                style={{
                                    color: '#ffffff',
                                    fontSize: '13.5px',
                                    fontWeight: 900,
                                    textShadow: '0 1.5px 3px #000',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Осталось:{' '}
                                <span
                                    style={{
                                        color: '#ffd700',
                                        textShadow: '0 0 8px rgba(240,192,64,0.45)',
                                        fontWeight: 955,
                                    }}
                                >
                                    {daysLeft} дней
                                </span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <span
                        style={{
                            color: 'rgba(200, 160, 60, 0.8)',
                            fontSize: isMobile ? '18px' : '22px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '2px',
                            lineHeight: 1.2,
                            textShadow: '0 2px 8px rgba(0,0,0,0.98)',
                            zIndex: 1,
                        }}
                    >
                        VIP НЕ АКТИВЕН
                    </span>
                )}
            </motion.div>

            {/* ────────── 2. BENEFITS LIST ────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#ffd700',
                        fontSize: '12.5px',
                        fontWeight: 955,
                        borderBottom: '1px solid rgba(240,192,64,0.18)',
                        paddingBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '3px',
                        margin: '6px 0 0 0',
                        textTransform: 'uppercase',
                        textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)',
                    }}
                >
                    Привилегии VIP
                </h3>

                <div
                    style={{
                        display: 'grid',
                        // Always 2 columns: VIP window is 980-1100px wide on all platforms,
                        // so there is always room for two columns regardless of isMobile flag.
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                    }}
                >
                    {benefits.map((b, i) => (
                        <motion.div
                            key={i}
                            onMouseEnter={() => setHoveredBenefit(i)}
                            onMouseLeave={() => setHoveredBenefit(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                background:
                                    hoveredBenefit === i
                                        ? 'linear-gradient(90deg, rgba(255,215,0,0.14) 0%, rgba(20,10,0,0.85) 100%)'
                                        : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(10,5,2,0.65) 100%)',
                                borderRadius: '12px',
                                border: `1.5px solid ${hoveredBenefit === i ? 'rgba(240,192,64,0.45)' : 'rgba(255,255,255,0.06)'}`,
                                borderLeft: `3.5px solid ${
                                    isActive
                                        ? '#ffd700'
                                        : hoveredBenefit === i
                                          ? 'rgba(220,180,100,0.5)'
                                          : 'rgba(180,140,60,0.35)'
                                }`,
                                transform: hoveredBenefit === i ? 'translateX(3px)' : 'translateX(0)',
                                transition: 'all 0.2s ease',
                                opacity: isActive ? 1 : 0.85,
                                boxSizing: 'border-box',
                            }}
                        >
                            {/* Icon */}
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    filter: isActive ? 'none' : 'grayscale(0.4) brightness(0.8)',
                                    transition: 'filter 0.2s',
                                }}
                            >
                                {b.icon}
                            </span>

                            {/* Text */}
                            <span
                                style={{
                                    color: isActive ? '#ffffff' : '#dfc08a',
                                    fontSize: '11.5px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '0.5px',
                                    flex: 1,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)',
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
                                    fontWeight: 955,
                                    letterSpacing: '0.8px',
                                    padding: '3px 9px',
                                    borderRadius: '20px',
                                    background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.45)',
                                    border: isActive
                                        ? '1px solid rgba(16,185,129,0.4)'
                                        : '1px solid rgba(255,255,255,0.06)',
                                    color: isActive ? '#34d399' : '#8c8276',
                                    textShadow: isActive ? '0 0 6px rgba(52,211,153,0.45)' : 'none',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                {!isActive && <Lock size={9} color="#8c8276" style={{ flexShrink: 0 }} />}
                                {isActive ? 'ДОСТУПНО' : 'ЗАПЕРТО'}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ────────── 3. PURCHASE PACKAGES ────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#ffd700',
                        fontSize: '12.5px',
                        fontWeight: 955,
                        borderBottom: '1px solid rgba(240,192,64,0.18)',
                        paddingBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '3px',
                        margin: '6px 0 0 0',
                        textTransform: 'uppercase',
                        textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)',
                    }}
                >
                    {isActive ? 'Продлить VIP статус' : 'Активировать VIP'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px' : '14px' }}>
                    {vipPackages.map((pkg, i) => {
                        const isBest = pkg.days === 30;
                        const isHov = hoveredPkg === i;

                        // Theme physical collectible card gradients & borders
                        let cardBg = '';
                        let cardBorder = '';
                        let cardGlow = '';

                        if (pkg.days === 1) {
                            // Bronze card
                            cardBg = isHov
                                ? 'linear-gradient(135deg, rgba(92, 53, 33, 0.98) 0%, rgba(35, 20, 10, 1) 100%)'
                                : 'linear-gradient(135deg, rgba(66, 36, 20, 0.95) 0%, rgba(22, 12, 6, 0.98) 100%)';
                            cardBorder = isHov ? '2px solid #cd7f32' : '1.5px solid rgba(205, 127, 50, 0.35)';
                            cardGlow = isHov ? '0 8px 20px rgba(205, 127, 50, 0.22)' : '0 3px 8px rgba(0,0,0,0.45)';
                        } else if (pkg.days === 3) {
                            // Silver card
                            cardBg = isHov
                                ? 'linear-gradient(135deg, rgba(62, 64, 70, 0.98) 0%, rgba(27, 28, 30, 1) 100%)'
                                : 'linear-gradient(135deg, rgba(46, 48, 54, 0.95) 0%, rgba(18, 19, 21, 0.98) 100%)';
                            cardBorder = isHov ? '2px solid #e2e2e2' : '1.5px solid rgba(192, 192, 192, 0.3)';
                            cardGlow = isHov ? '0 8px 20px rgba(192, 192, 192, 0.16)' : '0 3px 8px rgba(0,0,0,0.45)';
                        } else if (pkg.days === 7) {
                            // Gold card
                            cardBg = isHov
                                ? 'linear-gradient(135deg, rgba(90, 72, 28, 0.98) 0%, rgba(30, 24, 6, 1) 100%)'
                                : 'linear-gradient(135deg, rgba(68, 54, 18, 0.95) 0%, rgba(22, 17, 4, 0.98) 100%)';
                            cardBorder = isHov ? '2px solid #ffd700' : '1.5px solid rgba(255, 215, 0, 0.35)';
                            cardGlow = isHov ? '0 10px 22px rgba(255, 215, 0, 0.22)' : '0 3px 8px rgba(0,0,0,0.45)';
                        } else {
                            // 30 days - Amethyst Royal choice
                            cardBg = isHov
                                ? 'linear-gradient(135deg, rgba(90, 50, 148, 0.98) 0%, rgba(30, 12, 58, 1) 100%)'
                                : 'linear-gradient(135deg, rgba(62, 32, 108, 0.95) 0%, rgba(20, 8, 40, 0.98) 100%)';
                            cardBorder = isHov ? '2.5px solid #d8b4fe' : '2.5px solid rgba(168, 85, 247, 0.65)';
                            cardGlow = isHov
                                ? '0 12px 30px rgba(168, 85, 247, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)'
                                : '0 6px 20px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)';
                        }

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
                                    background: cardBg,
                                    border: cardBorder,
                                    borderRadius: '14px',
                                    padding: isMobile ? '10px 14px' : '16px 20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.22s ease',
                                    transform: isHov ? 'scale(1.04) translateY(-3px) rotate(1deg)' : 'scale(1)',
                                    boxShadow: cardGlow,
                                    boxSizing: 'border-box',
                                }}
                            >
                                {/* Gold line shimmer on top of Best/Amethyst package */}
                                {isBest && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '1.5px',
                                            background:
                                                'linear-gradient(90deg, transparent 0%, rgba(216,180,254,0.8) 50%, transparent 100%)',
                                        }}
                                    />
                                )}

                                {/* Discount badge (top ribbon) */}
                                {pkg.discount && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-1px',
                                            right: isBest ? '155px' : '135px',
                                            background: isBest
                                                ? 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)'
                                                : 'linear-gradient(135deg, #ffd700 0%, #b87800 100%)',
                                            color: isBest ? '#ffffff' : '#1c1002',
                                            fontSize: '10px',
                                            fontWeight: 955,
                                            padding: '3px 12px',
                                            borderRadius: '0 0 8px 8px',
                                            letterSpacing: '0.8px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                            border: isBest ? '1px solid rgba(168,85,247,0.5)' : '1px solid #ffd700',
                                            borderTop: 'none',
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        {isBest ? `${pkg.discount} • ВЫБОР` : pkg.discount}
                                    </div>
                                )}

                                {/* Label */}
                                <span
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: isMobile ? '14px' : '17px',
                                        fontWeight: 955,
                                        letterSpacing: '1.2px',
                                        background: isBest
                                            ? 'linear-gradient(to bottom, #ffffff 0%, #d8b4fe 50%, #8b5cf6 100%)'
                                            : pkg.days === 7
                                              ? 'linear-gradient(to bottom, #fffdf0 0%, #ffd700 55%, #c87800 100%)'
                                              : 'none',
                                        WebkitBackgroundClip: isBest || pkg.days === 7 ? 'text' : 'initial',
                                        WebkitTextFillColor: isBest || pkg.days === 7 ? 'transparent' : 'initial',
                                        color: isBest || pkg.days === 7 ? undefined : isHov ? '#ffe259' : '#dfc08a',
                                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.85))',
                                    }}
                                >
                                    {pkg.label}
                                </span>

                                {/* Price chip */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        background: 'rgba(0,0,0,0.68)',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: isBest
                                            ? '1.5px solid rgba(168,85,247,0.45)'
                                            : '1px solid rgba(255,255,255,0.06)',
                                        boxShadow: isBest ? '0 0 12px rgba(168,85,247,0.25)' : 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                        alt="gems"
                                        style={{
                                            width: '17px',
                                            height: '17px',
                                            filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.65))',
                                        }}
                                    />
                                    <span
                                        style={{
                                            color: '#c084fc',
                                            fontWeight: 955,
                                            fontSize: '16.5px',
                                            textShadow: '0 0 8px rgba(192,132,252,0.38)',
                                            fontFamily: "'Cinzel', serif",
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

            {/* ────────── 4. VIP FOOTER FEATURE STRIP ────────── */}
            {/* ────────── 4. ATMOSPHERIC FOOTER QUOTE ────────── */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 20px',
                    borderTop: '1px solid rgba(240,192,64,0.1)',
                }}
            >
                <span
                    style={{
                        color: 'rgba(240, 200, 80, 0.55)',
                        fontSize: '11px',
                        fontStyle: 'italic',
                        fontFamily: "'Cinzel', serif",
                        textAlign: 'center',
                        letterSpacing: '0.5px',
                        lineHeight: 1.6,
                        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    }}
                >
                    {isActive
                        ? '✦ Дикая природа встречает своих лучших охотников с почестями ✦'
                        : '✦ Величайшие охотники начинали с одного шага вперёд ✦'}
                </span>
            </div>
        </div>
    );
};

export default VIPWindow;
