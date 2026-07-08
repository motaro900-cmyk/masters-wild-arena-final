import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../configs/AssetsMap';

interface VipDailyRewardModalProps {
    isOpen: boolean;
    rewards: { gold: number; crystals: number; energy: number };
    daysLeft: number;
    onClose: () => void;
}

export const VipDailyRewardModal: React.FC<VipDailyRewardModalProps> = ({ isOpen, rewards, daysLeft, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="vip-reward-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.82)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <motion.div
                        key="vip-reward-card"
                        initial={{ scale: 0.6, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.85, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(420px, 92vw)',
                            padding: '32px 28px 24px',
                            background: 'linear-gradient(160deg, #1f1406 0%, #0d0903 100%)',
                            border: '2.5px solid #d4af37',
                            borderRadius: '24px',
                            boxShadow: '0 0 50px rgba(212, 175, 55, 0.35), inset 0 0 30px rgba(0,0,0,0.8)',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Golden shimmer shine effect */}
                        <motion.div
                            animate={{ x: ['-110%', '210%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.15) 50%, transparent 65%)',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* VIP Crown Icon with Pulsing Effect */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}
                        >
                            <img
                                src={AssetsMap.UI.TROPHY_PREMIUM}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.6))',
                                }}
                                alt="VIP Crown"
                            />
                        </motion.div>

                        {/* Title */}
                        <h2
                            style={{
                                margin: '0 0 8px',
                                fontSize: '22px',
                                fontWeight: 900,
                                color: '#FFE07D',
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 2px 8px rgba(212,175,55,0.4)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            ЕЖЕДНЕВНЫЙ VIP-ПОДАРОК!
                        </h2>

                        {/* Subtitle */}
                        <p
                            style={{
                                margin: '0 0 20px',
                                fontSize: '13px',
                                color: '#dfc08a',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                lineHeight: 1.5,
                            }}
                        >
                            Спасибо за вашу поддержку! Королевская служба начислила вам ежедневные дары покровителя:
                        </p>

                        {/* Rewards container */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1.2px solid rgba(212, 175, 55, 0.25)',
                                borderRadius: '16px',
                                padding: '14px 18px',
                                marginBottom: '20px',
                            }}
                        >
                            {/* Gold Reward */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img
                                        src={AssetsMap.UI.ICON_GOLD_FULL}
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                        alt="gold"
                                    />
                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>Золото</span>
                                </div>
                                <span style={{ color: '#f0c040', fontSize: '16px', fontWeight: 900 }}>
                                    +{rewards.gold}
                                </span>
                            </div>

                            {/* Crystals Reward */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img
                                        src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                        alt="crystals"
                                    />
                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>Алмазы</span>
                                </div>
                                <span style={{ color: '#a78bfa', fontSize: '16px', fontWeight: 900 }}>
                                    +{rewards.crystals}
                                </span>
                            </div>

                            {/* Energy Reward */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img
                                        src={AssetsMap.UI.ICON_ENERGY_FULL}
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                        alt="energy"
                                    />
                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>Энергия</span>
                                </div>
                                <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 900 }}>
                                    +{rewards.energy}
                                </span>
                            </div>
                        </div>

                        {/* CTA button */}
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 6px 20px rgba(212,175,55,0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onClose}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #a07828 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#1a0e05',
                                fontSize: '15px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.1em',
                                boxShadow: '0 4px 15px rgba(212,175,55,0.25)',
                                transition: 'all 0.2s',
                            }}
                        >
                            ОТЛИЧНО! 👑
                        </motion.button>

                        {/* Remaining VIP days */}
                        <p
                            style={{
                                margin: '12px 0 0',
                                fontSize: '11.5px',
                                color: '#a1a1aa',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 600,
                            }}
                        >
                            Дней VIP-статуса осталось:{' '}
                            <span style={{ color: '#ffe07d', fontWeight: 800 }}>{daysLeft}</span>
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
