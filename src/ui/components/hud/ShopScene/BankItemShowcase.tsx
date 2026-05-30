import React from 'react';
import { ShopItem } from '../../../../configs/ShopConfig';

interface BankItemShowcaseProps {
    item: ShopItem;
    rarityColor: string;
    isMobile?: boolean;
}

const makeSunrays = (color: string): string => {
    const c = color + '09';
    const stops: string[] = [];
    [0, 45, 90, 135, 180, 225, 270, 315].forEach((s) => {
        stops.push('transparent ' + s + 'deg');
        stops.push(c + ' ' + (s + 12) + 'deg');
        stops.push('transparent ' + (s + 24) + 'deg');
    });
    return 'conic-gradient(' + stops.join(', ') + ')';
};

const BankCoinParticle: React.FC<{ style: React.CSSProperties; symbol: string }> = ({ style, symbol }) => (
    <div
        style={{
            position: 'absolute',
            fontSize: '18px',
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.8))',
            ...style,
        }}
    >
        {symbol}
    </div>
);

export const BankItemShowcase: React.FC<BankItemShowcaseProps> = ({ item, rarityColor, isMobile = false }) => {
    const particles = isMobile ? [] : [
        { left: '15%', bottom: '30%', delay: '0s', duration: '3.2s', anim: 'coin-float-1', symbol: '🪙' },
        { left: '25%', bottom: '22%', delay: '0.7s', duration: '2.8s', anim: 'coin-float-2', symbol: '💰' },
        { left: '75%', bottom: '32%', delay: '0.3s', duration: '3.5s', anim: 'coin-float-1', symbol: '✨' },
        { left: '80%', bottom: '20%', delay: '1.2s', duration: '2.6s', anim: 'coin-float-3', symbol: '🔷' },
        { left: '48%', bottom: '10%', delay: '0.5s', duration: '3.1s', anim: 'coin-float-2', symbol: '💵' },
        { left: '60%', bottom: '25%', delay: '1.8s', duration: '2.9s', anim: 'coin-float-3', symbol: '🔸' },
    ];

    const outerGlow = 'radial-gradient(circle, ' + rarityColor + '28 0%, ' + rarityColor + '05 50%, transparent 70%)';
    const shimmerBg = 'radial-gradient(ellipse, ' + rarityColor + '33 0%, transparent 70%)';

    const isGem = item.subTab === 'GEMS';
    const isGold = item.subTab === 'GOLD';

    const currencySymbol = isGem ? '💎' : isGold ? '🪙' : '⚡';
    const currencyName = isGem ? 'АЛМАЗЫ' : isGold ? 'ЗОЛОТО' : 'ЭНЕРГИЯ';
    const currencyColor = isGem ? '#00f0ff' : isGold ? '#ffd700' : '#ffea00';

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
            }}
        >
            {/* Background Light Rays */}
            <div
                style={{
                    position: 'absolute',
                    width: isMobile ? '300px' : '600px',
                    height: isMobile ? '300px' : '600px',
                    background: makeSunrays(rarityColor),
                    animation: 'bank-rays 30s linear infinite',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    opacity: 0.7,
                }}
            />

            {/* Giant soft glow behind the card */}
            <div
                style={{
                    position: 'absolute',
                    width: isMobile ? '240px' : '500px',
                    height: isMobile ? '240px' : '500px',
                    borderRadius: '50%',
                    background: outerGlow,
                    animation: 'bank-glow-pulse 4s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            {/* Glassmorphic 3D Card Container */}
            <div
                style={{
                    position: 'relative',
                    width: isMobile ? '160px' : '250px',
                    height: isMobile ? '210px' : '300px',
                    background: 'linear-gradient(135deg, rgba(25, 20, 20, 0.9) 0%, rgba(10, 8, 8, 0.95) 100%)',
                    border: '2px solid ' + rarityColor + 'aa',
                    borderRadius: isMobile ? '14px' : '24px',
                    boxShadow:
                        '0 25px 50px rgba(0,0,0,0.8), 0 0 30px ' +
                        rarityColor +
                        '33, inset 0 1px 3px rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '10px 8px' : '16px 12px',
                    zIndex: 10,
                    animation: 'bank-item-float 5s ease-in-out infinite',
                    overflow: 'hidden',
                }}
            >
                {/* Holographic shimmer effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '200%',
                        background:
                            'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
                        animation: 'bank-rays 8s linear infinite',
                        pointerEvents: 'none',
                    }}
                />

                {/* Card Top Category Badge */}
                <div
                    style={{
                        padding: isMobile ? '3px 6px' : '5px 12px',
                        borderRadius: '30px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span style={{ fontSize: isMobile ? '10px' : '12px' }}>{currencySymbol}</span>
                    <span
                        style={{
                            fontSize: isMobile ? '8px' : '10px',
                            color: currencyColor,
                            fontWeight: 900,
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            letterSpacing: '2px',
                        }}
                    >
                        {currencyName}
                    </span>
                </div>

                {/* Main Item Image with mixBlendMode to remove black backgrounds */}
                <div
                    style={{
                        position: 'relative',
                        width: isMobile ? '70px' : '110px',
                        height: isMobile ? '70px' : '110px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Circle backing glow */}
                    <div
                        style={{
                            position: 'absolute',
                            width: isMobile ? '50px' : '90px',
                            height: isMobile ? '50px' : '90px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, ' + rarityColor + '44 0%, transparent 70%)',
                            filter: 'blur(8px)',
                        }}
                    />
                    <img
                        src={item.image}
                        onError={(e) => {
                            e.currentTarget.src = '/assets/images/ui/icons/daily_chest.webp';
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            zIndex: 2,
                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                            mixBlendMode: 'screen', // Magic screen blending to remove any solid black backgrounds!
                        }}
                        alt=""
                    />
                </div>

                {/* Amount / Value Display */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <span
                        style={{
                            fontSize: isMobile ? '16px' : '22px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            color: '#fff',
                            textShadow: '0 0 10px ' + rarityColor + 'aa',
                        }}
                    >
                        +{item.amount?.toLocaleString()}
                    </span>
                    <span
                        style={{
                            fontSize: isMobile ? '8px' : '9px',
                            color: 'rgba(255,255,255,0.4)',
                            fontWeight: 700,
                            letterSpacing: '1px',
                        }}
                    >
                        ПОЛУЧИТЬ В БАНКЕ
                    </span>
                </div>
            </div>

            {/* Floating particles in background */}
            {particles.map((p, i) => (
                <BankCoinParticle
                    key={i}
                    symbol={p.symbol}
                    style={{
                        left: p.left,
                        bottom: p.bottom,
                        animation: p.anim + ' ' + p.duration + ' ' + p.delay + ' ease-in infinite',
                        opacity: 0.6,
                    }}
                />
            ))}

            {/* Shimmer Ground Ellipse */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '8%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '320px',
                    height: '20px',
                    borderRadius: '50%',
                    background: shimmerBg,
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
};
