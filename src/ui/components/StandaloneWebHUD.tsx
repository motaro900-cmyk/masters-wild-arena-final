import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { audioService } from '../../services/AudioService';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { DuelChallengeService, IDuelChallenge } from '../../utils/DuelChallengeService';
import { RestingEnergyService, IRestingReward } from '../../utils/RestingEnergyService';
import { DuelChallengeModal } from './DuelChallengeModal';
import { RestingEnergyModal } from './RestingEnergyModal';
import { BeastCodexModal } from './BeastCodexModal';

export const StandaloneWebHUD: React.FC = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Modals
    const [inboundChallenge, setInboundChallenge] = useState<IDuelChallenge | null>(null);
    const [restingReward, setRestingReward] = useState<IRestingReward | null>(null);
    const [isCodexOpen, setIsCodexOpen] = useState(false);

    const isMuted = useGameStore((state: any) => state.isMuted);
    const showFps = useGameStore((state: any) => state.showFps);
    const isMobile = useGameStore((state: any) => state.isMobile);

    // Track fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

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
        // Inbound challenge
        const challenge = DuelChallengeService.parseInboundChallenge();
        if (challenge) {
            setInboundChallenge(challenge);
            proceduralAudio.playDuelHorn();
        } else {
            // Check offline resting rewards only if no direct duel is active
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

    const toggleFullscreen = async () => {
        proceduralAudio.playClick(1.0);
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.warn('Fullscreen toggle failed:', err);
        }
    };

    const toggleSound = () => {
        const newMuted = !isMuted;
        try {
            audioService.setMuted(newMuted);
        } catch {}
        useGameStore.setState({ isMuted: newMuted });
        if (!newMuted) {
            proceduralAudio.playClick(1.2);
        }
        triggerToast(newMuted ? '🔇 Звук выключен' : '🔊 Звук включен');
    };

    const toggleFps = () => {
        proceduralAudio.playClick(0.9);
        const next = !showFps;
        const store = useGameStore.getState() as any;
        if (typeof store.setShowFps === 'function') {
            store.setShowFps(next);
        } else {
            useGameStore.setState({ showFps: next });
        }
        triggerToast(next ? '⚡ FPS включен' : '⚡ FPS скрыт');
    };

    const handleCopyDuelLink = async () => {
        proceduralAudio.playClick(1.1);
        const { url } = DuelChallengeService.createDuelLink();
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                triggerToast('⚔️ Ссылка на дуэль скопирована! Отправь другу');
            } else {
                triggerToast('⚔️ ' + url);
            }
        } catch {
            triggerToast('⚔️ Ссылка на дуэль готова');
        }
    };

    const handleOpenCodex = () => {
        proceduralAudio.playShimmer();
        setIsCodexOpen(true);
    };

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
            {/* Top-Left Branding Badge */}
            <div
                style={{
                    position: 'fixed',
                    top: isMobile ? '8px' : '16px',
                    left: isMobile ? '10px' : '20px',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    pointerEvents: 'auto',
                }}
            >
                <div
                    style={{
                        padding: isMobile ? '4px 10px' : '6px 14px',
                        background: 'rgba(10, 7, 5, 0.75)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                    }}
                >
                    <span style={{ fontSize: isMobile ? '12px' : '14px' }}>🐺</span>
                    <span
                        style={{
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            color: '#FFE07D',
                            fontSize: isMobile ? '10px' : '11px',
                            fontWeight: 800,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Masters of the Wild
                    </span>
                    {!isMobile && (
                        <span
                            style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                background: 'rgba(34, 197, 94, 0.2)',
                                color: '#4ade80',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                            }}
                        >
                            LIVE 60 FPS
                        </span>
                    )}
                </div>

                {installPrompt && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={handleInstallPwa}
                        style={{
                            padding: isMobile ? '4px 10px' : '6px 12px',
                            borderRadius: '16px',
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
                )}
            </div>

            {/* Top-Right Standalone Quick-Bar */}
            <div
                style={{
                    position: 'fixed',
                    top: isMobile ? '8px' : '16px',
                    right: isMobile ? '10px' : '20px',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '5px' : '8px',
                    pointerEvents: 'auto',
                }}
            >
                {/* Beast Codex Button */}
                <button
                    onClick={handleOpenCodex}
                    title="Кодекс Зверей (3D Зал Славы)"
                    style={{
                        padding: isMobile ? '6px 8px' : '8px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        background: 'rgba(15, 10, 5, 0.85)',
                        backdropFilter: 'blur(12px)',
                        color: '#FFE07D',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        fontFamily: "'Philosopher', serif",
                    }}
                >
                    🐾 <span>{!isMobile && 'Кодекс'}</span>
                </button>

                {/* Share Duel Button */}
                <button
                    onClick={handleCopyDuelLink}
                    title="Вызвать на дуэль (скопировать ссылку)"
                    style={{
                        padding: isMobile ? '6px 8px' : '8px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        background: 'rgba(15, 10, 5, 0.85)',
                        backdropFilter: 'blur(12px)',
                        color: '#FFE07D',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        fontFamily: "'Philosopher', serif",
                    }}
                >
                    ⚔️ <span>{!isMobile && 'Вызов на дуэль'}</span>
                </button>

                {/* Sound Button */}
                <button
                    onClick={toggleSound}
                    title={isMuted ? 'Включить звук' : 'Выключить звук'}
                    style={{
                        width: isMobile ? '30px' : '36px',
                        height: isMobile ? '30px' : '36px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(15, 10, 5, 0.85)',
                        backdropFilter: 'blur(12px)',
                        color: isMuted ? '#ef4444' : '#FFE07D',
                        fontSize: isMobile ? '13px' : '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>

                {/* FPS Toggle Button */}
                {!isMobile && (
                    <button
                        onClick={toggleFps}
                        title="Включить / Выключить счетчик FPS (F8)"
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(15, 10, 5, 0.85)',
                            backdropFilter: 'blur(12px)',
                            color: showFps ? '#22c55e' : '#a1a1aa',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                        }}
                    >
                        FPS
                    </button>
                )}

                {/* Fullscreen Button */}
                <button
                    onClick={toggleFullscreen}
                    title="Полноэкранный режим (F11)"
                    style={{
                        width: isMobile ? '30px' : '36px',
                        height: isMobile ? '30px' : '36px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(15, 10, 5, 0.85)',
                        backdropFilter: 'blur(12px)',
                        color: '#FFE07D',
                        fontSize: isMobile ? '12px' : '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {isFullscreen ? '✕' : '⛶'}
                </button>
            </div>

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

            {/* Modals */}
            <DuelChallengeModal
                challenge={inboundChallenge}
                onClose={() => setInboundChallenge(null)}
            />
            <RestingEnergyModal
                reward={restingReward}
                onClose={() => setRestingReward(null)}
            />
            <BeastCodexModal
                isOpen={isCodexOpen}
                onClose={() => setIsCodexOpen(false)}
            />
        </>
    );
};
