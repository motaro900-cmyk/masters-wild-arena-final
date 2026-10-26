import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { DuelChallengeService, IDuelChallenge } from '../../utils/DuelChallengeService';
import { RestingEnergyService, IRestingReward } from '../../utils/RestingEnergyService';
import { DuelChallengeModal } from './DuelChallengeModal';
import { RestingEnergyModal } from './RestingEnergyModal';

interface StandaloneWebHUDProps {
    onBackToPortal?: () => void;
}

export const StandaloneWebHUD: React.FC<StandaloneWebHUDProps> = ({ onBackToPortal }) => {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Modals
    const [inboundChallenge, setInboundChallenge] = useState<IDuelChallenge | null>(null);
    const [restingReward, setRestingReward] = useState<IRestingReward | null>(null);

    const isMobile = useGameStore((state: any) => state.isMobile);

    // Listen for PWA beforeinstallprompt
    useEffect(() => {
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    // Check inbound duel challenge & offline resting energy
    useEffect(() => {
        const challenge = DuelChallengeService.parseInboundChallenge();
        if (challenge) {
            setInboundChallenge(challenge);
            proceduralAudio.playDuelHorn();
        } else {
            const timer = setTimeout(() => {
                const reward = RestingEnergyService.checkRestingReward();
                if (reward) {
                    setRestingReward(reward);
                    proceduralAudio.playFanfare();
                }
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, []);

    // Heartbeat for resting energy
    useEffect(() => {
        RestingEnergyService.recordHeartbeat();
        const interval = setInterval(() => {
            RestingEnergyService.recordHeartbeat();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleInstallPwa = async () => {
        if (!installPrompt) return;
        proceduralAudio.playClick(1.0);
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
            triggerToast('🎉 Игра успешно установлена!');
        }
    };

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2400);
    };

    return (
        <>
            {/* 1. Discreet Back to Portal Button (Positioned safely in the open sky gap between Avatar and Battle Pass) */}
            {onBackToPortal && (
                <div
                    style={{
                        position: 'fixed',
                        top: isMobile ? '8px' : '16px',
                        left: isMobile ? '8px' : 'calc(50% - 340px)',
                        zIndex: 9999,
                        pointerEvents: 'auto',
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 18px rgba(212, 175, 55, 0.45)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            proceduralAudio.playClick(1.0);
                            onBackToPortal();
                        }}
                        title="Вернуться на Главный Портал"
                        style={{
                            padding: isMobile ? '5px 10px' : '7px 14px',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(212, 175, 55, 0.55)',
                            background: 'rgba(12, 9, 18, 0.88)',
                            backdropFilter: 'blur(12px)',
                            color: '#FFE07D',
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                            fontFamily: "'Philosopher', serif",
                            letterSpacing: '0.5px',
                        }}
                    >
                        🏛️ <span>В Портал</span>
                    </motion.button>
                </div>
            )}

            {/* PWA Install Button (if browser prompt available) */}
            {installPrompt && (
                <div
                    style={{
                        position: 'fixed',
                        top: isMobile ? '8px' : '16px',
                        left: isMobile ? '100px' : 'calc(50% - 210px)',
                        zIndex: 9999,
                        pointerEvents: 'auto',
                    }}
                >
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleInstallPwa}
                        style={{
                            padding: isMobile ? '5px 10px' : '7px 14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(245, 158, 11, 0.6)',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.35) 100%)',
                            color: '#FFE07D',
                            fontSize: isMobile ? '10px' : '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backdropFilter: 'blur(10px)',
                            fontFamily: "'Montserrat', sans-serif",
                            boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
                        }}
                    >
                        📲 {isMobile ? 'Установить' : 'Установить на экран'}
                    </motion.button>
                </div>
            )}

            {/* Notification Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.95 }}
                        style={{
                            position: 'fixed',
                            top: '72px',
                            right: '20px',
                            zIndex: 100000,
                            padding: '12px 20px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(25, 18, 10, 0.96) 0%, rgba(10, 7, 5, 0.98) 100%)',
                            border: '1.5px solid #f59e0b',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.3)',
                            color: '#FFE07D',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '13px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            pointerEvents: 'none',
                        }}
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inbound duel challenge modal */}
            <DuelChallengeModal
                challenge={inboundChallenge}
                onClose={() => setInboundChallenge(null)}
            />

            {/* Resting energy modal */}
            <RestingEnergyModal
                reward={restingReward}
                onClose={() => setRestingReward(null)}
            />
        </>
    );
};
