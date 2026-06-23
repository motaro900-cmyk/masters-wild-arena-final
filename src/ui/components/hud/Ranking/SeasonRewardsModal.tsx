import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { resolveAssetPath } from '../../../../utils/assetPath';

interface SeasonRewardsModalProps {
    showRewards: boolean;
    setShowRewards: (show: boolean) => void;
    getRemainingTime: () => string;
}

export const SeasonRewardsModal: React.FC<SeasonRewardsModalProps> = ({
    showRewards,
    setShowRewards,
    getRemainingTime,
}) => {
    return (
        <AnimatePresence>
            {showRewards && (
                <div
                    onClick={() => setShowRewards(false)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                    }}
                >
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '520px',
                            background: 'radial-gradient(circle at center, #231c15 0%, #120e0a 100%)',
                            border: '2px solid #f0c040',
                            borderRadius: '24px',
                            padding: '30px',
                            boxShadow: '0 15px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(240,192,64,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <h3
                            style={{
                                color: '#f0c040',
                                fontSize: '28px',
                                textAlign: 'center',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 900,
                                letterSpacing: '2px',
                                textShadow: '0 0 15px rgba(240,192,64,0.6)',
                                marginBottom: '10px',
                            }}
                        >
                            🏆 НАГРАДЫ СЕЗОНА
                        </h3>

                        {/* SEASON TIMER */}
                        <div
                            style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(240,192,64,0.2)',
                                borderRadius: '14px',
                                padding: '12px 18px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ flexShrink: 0 }}
                            >
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
                                    fill="#f0c040"
                                />
                            </svg>
                            <span
                                style={{
                                    color: '#d1d5db',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '0.5px',
                                }}
                            >
                                КОНЕЦ СЕЗОНА: <span style={{ color: '#4ade80' }}>{getRemainingTime()}</span>
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {[
                                {
                                    rank: 'Топ 1-3',
                                    medal: '🥇',
                                    borderColor: '#fbbf24',
                                    glowColor: 'rgba(251, 191, 36, 0.12)',
                                    textColor: '#fbbf24',
                                    items: [
                                        { amount: '500', icon: AssetsMap.UI.ICON_ALMAZ_FULL, alt: 'Алмазы' },
                                        { amount: '1', icon: AssetsMap.UI.ICON_SEASON_CHEST, alt: 'Сундук Сезона' },
                                        { amount: '25 000', icon: AssetsMap.UI.ICON_GOLD_FULL, alt: 'Золото' },
                                    ],
                                },
                                {
                                    rank: 'Топ 4-10',
                                    medal: '🥈',
                                    borderColor: '#9ca3af',
                                    glowColor: 'rgba(156, 163, 175, 0.1)',
                                    textColor: '#d1d5db',
                                    items: [
                                        { amount: '250', icon: AssetsMap.UI.ICON_ALMAZ_FULL, alt: 'Алмазы' },
                                        { amount: '10 000', icon: AssetsMap.UI.ICON_GOLD_FULL, alt: 'Золото' },
                                    ],
                                },
                                {
                                    rank: 'Топ 11-100',
                                    medal: '🥉',
                                    borderColor: '#b45309',
                                    glowColor: 'rgba(180, 83, 9, 0.08)',
                                    textColor: '#e28743',
                                    items: [
                                        { amount: '100', icon: AssetsMap.UI.ICON_ALMAZ_FULL, alt: 'Алмазы' },
                                        { amount: '3 000', icon: AssetsMap.UI.ICON_GOLD_FULL, alt: 'Золото' },
                                    ],
                                },
                            ].map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        background: `linear-gradient(90deg, ${r.glowColor}, rgba(0,0,0,0.5))`,
                                        borderRadius: '16px',
                                        border: `1px solid ${r.borderColor}44`,
                                        boxShadow: `0 4px 15px rgba(0,0,0,0.3), inset 0 0 10px ${r.glowColor}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span
                                            style={{
                                                fontSize: '28px',
                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                            }}
                                        >
                                            {r.medal}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: 800,
                                                color: r.textColor,
                                                fontFamily: "'Cinzel', serif",
                                            }}
                                        >
                                            {r.rank}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {r.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <span
                                                    style={{ fontSize: '15px', fontWeight: 900, color: '#4ade80' }}
                                                >
                                                    {item.amount}
                                                </span>
                                                <img
                                                    src={resolveAssetPath(item.icon)}
                                                    style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        objectFit: 'contain',
                                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                                    }}
                                                    alt={item.alt}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '20px',
                                color: '#9ca3af',
                                fontSize: '12px',
                                textAlign: 'center',
                            }}
                        >
                            <span>ℹ️</span>
                            <span>Награды будут отправлены на почту по окончании сезона</span>
                        </div>

                        <button
                            onClick={() => setShowRewards(false)}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '16px',
                                background: 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)',
                                border: '1px solid #fde68a',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(251,191,36,0.3)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                transition: 'transform 0.1s',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            ПОНЯТНО
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
export default SeasonRewardsModal;
