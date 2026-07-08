import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface PurchaseSuccessModalProps {
    isOpen: boolean;
    itemName: string;
    crystalsAmount: number;
    onClose: () => void;
}

const PARTICLES = [
    { id: 0, emoji: '✨', x: -120, y: -80, rotate: -300, scale: 1.2, duration: 1.3, delay: 0.0 },
    { id: 1, emoji: '✨', x: 110, y: -90, rotate: 280, scale: 0.9, duration: 1.1, delay: 0.05 },
    { id: 2, emoji: '⭐', x: -70, y: -130, rotate: -200, scale: 0.8, duration: 1.4, delay: 0.1 },
    { id: 3, emoji: '💫', x: 80, y: -120, rotate: 330, scale: 1.0, duration: 1.2, delay: 0.08 },
    { id: 4, emoji: '🔮', x: -140, y: -40, rotate: -250, scale: 0.7, duration: 1.0, delay: 0.15 },
    { id: 5, emoji: '✦', x: 130, y: -50, rotate: 200, scale: 1.1, duration: 1.3, delay: 0.12 },
    { id: 6, emoji: '✨', x: -30, y: -150, rotate: -180, scale: 0.8, duration: 1.1, delay: 0.2 },
    { id: 7, emoji: '⭐', x: 40, y: -140, rotate: 240, scale: 0.9, duration: 1.5, delay: 0.07 },
    { id: 8, emoji: '✦', x: -100, y: -100, rotate: 310, scale: 0.7, duration: 1.0, delay: 0.18 },
    { id: 9, emoji: '💫', x: 100, y: -70, rotate: -270, scale: 1.2, duration: 1.2, delay: 0.03 },
    { id: 10, emoji: '✨', x: -60, y: -70, rotate: 190, scale: 0.6, duration: 0.9, delay: 0.25 },
    { id: 11, emoji: '🔮', x: 60, y: -110, rotate: -310, scale: 0.8, duration: 1.4, delay: 0.22 },
];

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
    isOpen,
    itemName,
    crystalsAmount,
    onClose,
}) => {
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onCloseRef.current();
            }, 5500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="ps-backdrop"
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
                        background: 'rgba(0,0,0,0.78)',
                        backdropFilter: 'blur(6px)',
                    }}
                >
                    {/* Particle burst */}
                    <div style={{ position: 'absolute', pointerEvents: 'none', top: '50%', left: '50%' }}>
                        {PARTICLES.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
                                animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, opacity: 0 }}
                                transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    fontSize: '20px',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                {p.emoji}
                            </motion.div>
                        ))}
                    </div>

                    {/* Modal card */}
                    <motion.div
                        key="ps-card"
                        initial={{ scale: 0.55, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.85, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 310, damping: 22 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(400px, 92vw)',
                            padding: '36px 28px 26px',
                            background: 'linear-gradient(160deg, rgba(18,12,5,0.98) 0%, rgba(8,5,2,0.99) 100%)',
                            border: '2px solid #d4af37',
                            borderRadius: '20px',
                            boxShadow:
                                '0 0 60px rgba(212,175,55,0.28), 0 0 120px rgba(212,175,55,0.1), inset 0 0 30px rgba(0,0,0,0.6)',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Shimmer sweep */}
                        <motion.div
                            animate={{ x: ['-110%', '210%'] }}
                            transition={{ duration: 1.1, delay: 0.3, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(105deg, transparent 35%, rgba(212,175,55,0.1) 50%, transparent 65%)',
                                pointerEvents: 'none',
                            }}
                        />

                        <motion.div
                            animate={{ scale: [1, 1.18, 1], rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 1.1, delay: 0.15 }}
                            style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                                alt="crystal"
                            />
                        </motion.div>

                        {/* Success badge */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.3 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(34,197,94,0.14)',
                                border: '1px solid rgba(34,197,94,0.38)',
                                borderRadius: '20px',
                                padding: '4px 14px',
                                marginBottom: '16px',
                                color: '#4ade80',
                                fontSize: '12px',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            <span>✓</span>
                            <span>ОПЛАТА ПРИНЯТА</span>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                margin: '0 0 6px',
                                fontSize: '22px',
                                fontWeight: 900,
                                color: '#FFE07D',
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 2px 8px rgba(212,175,55,0.35)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Спасибо за поддержку!
                        </motion.h2>

                        {/* Item name */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                margin: '0 0 18px',
                                fontSize: '13px',
                                color: '#9ca3af',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            {itemName}
                        </motion.p>

                        {/* Crystals pill */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', delay: 0.4 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                background:
                                    'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(79,70,229,0.18) 100%)',
                                border: '1.5px solid rgba(139,92,246,0.45)',
                                borderRadius: '14px',
                                padding: '12px 28px',
                                marginBottom: '22px',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                alt="crystal"
                            />
                            <div style={{ textAlign: 'left' }}>
                                <div
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: 900,
                                        color: '#c4b5fd',
                                        fontFamily: "'Cinzel', serif",
                                        lineHeight: 1,
                                    }}
                                >
                                    +{crystalsAmount.toLocaleString('ru-RU')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: '#9ca3af',
                                        fontFamily: "'Outfit', sans-serif",
                                        letterSpacing: '0.1em',
                                        marginTop: '2px',
                                    }}
                                >
                                    АЛМАЗОВ ДОБАВЛЕНО
                                </div>
                            </div>
                        </motion.div>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                margin: '0 0 22px',
                                fontSize: '13px',
                                color: '#6b7280',
                                fontFamily: "'Outfit', sans-serif",
                                lineHeight: 1.55,
                            }}
                        >
                            Алмазы уже на вашем счёте.
                            <br />
                            Удачи в битвах, Мастер! ⚔️
                        </motion.p>

                        {/* CTA button */}
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 6px 28px rgba(212,175,55,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onClose}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #d4af37 0%, #a07828 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#1a0e05',
                                fontSize: '16px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.12em',
                                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                                transition: 'box-shadow 0.2s',
                            }}
                        >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span>ОТЛИЧНО!</span>
                                <img
                                    src={AssetsMap.UI.TROPHY_PREMIUM}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="trophy"
                                />
                            </span>
                        </motion.button>

                        <p
                            style={{
                                margin: '10px 0 0',
                                fontSize: '11px',
                                color: '#374151',
                                fontFamily: "'Outfit', sans-serif",
                            }}
                        >
                            Окно закроется автоматически
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
