/**
 * RESTING ENERGY MODAL (БЛАГОСЛОВЕНИЕ ЛЕСА)
 * Welcome-back rewards modal for standalone web players returning from offline rest.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IRestingReward, RestingEnergyService } from '../../utils/RestingEnergyService';
import { proceduralAudio } from '../../utils/ProceduralAudio';

interface RestingEnergyModalProps {
    reward: IRestingReward | null;
    onClose: () => void;
}

export const RestingEnergyModal: React.FC<RestingEnergyModalProps> = ({ reward, onClose }) => {
    if (!reward) return null;

    const handleClaim = () => {
        RestingEnergyService.claimReward(reward);
        onClose();
    };

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 20000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(5, 5, 10, 0.85)',
                    backdropFilter: 'blur(10px)',
                    padding: '16px',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: 30 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '520px',
                        background: 'linear-gradient(145deg, #18221c 0%, #0d1410 100%)',
                        border: '2px solid rgba(82, 183, 136, 0.4)',
                        borderRadius: '16px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(82, 183, 136, 0.2)',
                        padding: '28px 24px',
                        color: '#e8f5e9',
                        textAlign: 'center',
                        overflow: 'hidden',
                    }}
                >
                    {/* Emerald top edge */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '15%',
                            right: '15%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #52b788, transparent)',
                        }}
                    />

                    {/* Nature Emblem */}
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            borderRadius: '50%',
                            background: 'rgba(82, 183, 136, 0.15)',
                            border: '2px solid #52b788',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '30px',
                            boxShadow: '0 0 25px rgba(82, 183, 136, 0.4)',
                        }}
                    >
                        🌿
                    </motion.div>

                    <h2
                        style={{
                            margin: '0 0 8px',
                            fontSize: '24px',
                            fontFamily: "'Philosopher', serif",
                            fontWeight: 700,
                            color: '#a7f3d0',
                        }}
                    >
                        Благословение Леса
                    </h2>

                    <p
                        style={{
                            margin: '0 0 24px',
                            fontSize: '13px',
                            color: '#9ca3af',
                            fontFamily: "'Montserrat', sans-serif",
                            lineHeight: 1.5,
                        }}
                    >
                        Пока вы отдыхали ({reward.hoursFormatted}), древние духи чащи наполнили ваш лагерь ценными дарами:
                    </p>

                    {/* Rewards Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: reward.energy > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                            gap: '12px',
                            marginBottom: '26px',
                        }}
                    >
                        {/* Gold */}
                        <div
                            style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                borderRadius: '12px',
                                padding: '14px 10px',
                            }}
                        >
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🪙</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fef08a', fontFamily: "'Philosopher', serif" }}>
                                +{reward.gold}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>
                                Золото
                            </div>
                        </div>

                        {/* Exp */}
                        <div
                            style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(96, 165, 250, 0.3)',
                                borderRadius: '12px',
                                padding: '14px 10px',
                            }}
                        >
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔷</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#bfdbfe', fontFamily: "'Philosopher', serif" }}>
                                +{reward.exp}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>
                                Опыт
                            </div>
                        </div>

                        {/* Energy */}
                        {reward.energy > 0 && (
                            <div
                                style={{
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                    borderRadius: '12px',
                                    padding: '14px 10px',
                                }}
                            >
                                <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚡</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#6ee7b7', fontFamily: "'Philosopher', serif" }}>
                                    +{reward.energy}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>
                                    Энергия
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Claim Button */}
                    <button
                        onClick={handleClaim}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            borderRadius: '10px',
                            border: '1px solid #52b788',
                            background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                            color: '#d8f3dc',
                            fontSize: '16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 6px 20px rgba(45, 106, 79, 0.45)',
                            transition: 'all 0.15s ease',
                            fontFamily: "'Philosopher', serif",
                            letterSpacing: '0.5px',
                        }}
                    >
                        🌿 Забрать дары Леса
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
