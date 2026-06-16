import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { AssetsMap } from '../../../configs/AssetsMap';
import { addToFavorites, joinGroup } from '../../../utils/VKBridge';
import { audioService } from '../../../services/AudioService';
import { AppConfig } from '../../../configs/AppConfig';
import { AdvancedSettingsBlock } from './AdvancedSettingsBlock';
import { settingsTranslations } from './SettingsLocalization';
import { LegalModal } from '../LegalDocuments';

interface SettingsWindowProps {
    onClose: () => void;
    onOpenAdmin?: () => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose, onOpenAdmin }) => {
    const {
        musicVolume,
        setMusicVolume,
        soundVolume,
        setSoundVolume,
        isMuted,
        setIsMuted,
        playerId,
        claimedSocialRewards,
        claimGroupReward,
        claimFavoriteReward,
        language,
        setLanguage,
        isAdmin,
        isMobile,
    } = useGameStore(
        useShallow((state) => ({
            musicVolume: state.musicVolume,
            setMusicVolume: state.setMusicVolume,
            soundVolume: state.soundVolume,
            setSoundVolume: state.setSoundVolume,
            isMuted: state.isMuted,
            setIsMuted: state.setIsMuted,
            playerId: state.playerId,
            claimedSocialRewards: state.claimedSocialRewards,
            claimGroupReward: state.claimGroupReward,
            claimFavoriteReward: state.claimFavoriteReward,
            language: state.language,
            setLanguage: state.setLanguage,
            isAdmin: state.isAdmin,
            isMobile: state.isMobile,
        }))
    );

    const [confirmWipeChat, setConfirmWipeChat] = React.useState(false);
    const [confirmWipeProgress, setConfirmWipeProgress] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(!!document.fullscreenElement);
    const [copied, setCopied] = React.useState(false);
    const [openDoc, setOpenDoc] = React.useState<'privacy' | 'terms' | null>(null);
    const [trackProgress, setTrackProgress] = React.useState(25);

    const t = settingsTranslations[(language || 'RU') as 'RU' | 'EN'] || settingsTranslations.RU;

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Simulated Track progress updates
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (audioService?.isPlaying() && !isMuted) {
                setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
            }
        }, 1200);
        return () => clearInterval(interval);
    }, [isMuted]);

    // Track reset when track name changes
    const trackName = audioService?.getCurrentTrackName();
    React.useEffect(() => {
        setTrackProgress(Math.floor(Math.random() * 30));
    }, [trackName]);



    const colors = {
        text: '#e8d8a8',
        accent: '#f0c040',
        card: 'rgba(255,255,255,0.03)',
        border: 'rgba(240,192,64,0.15)',
        danger: '#ef4444',
    };

    const copyPlayerId = () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(playerId)
                    .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    })
                    .catch((err) => {
                        console.error('Clipboard copy error:', err);
                        fallbackCopy();
                    });
            } else {
                fallbackCopy();
            }
        } catch (e) {
            fallbackCopy();
        }
    };

    const fallbackCopy = () => {
        const el = document.createElement('textarea');
        el.value = playerId;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClearCache = async () => {
        try {
            const store = useGameStore.getState() as any;
            const { syncService, SyncService } = await import('../../../services/SyncService');
            const { db, USERS_COLLECTION } = await import('../../../utils/firebase');
            const { doc, deleteDoc } = await import('firebase/firestore');

            // Disable all synchronization before deleting document and reloading page
            syncService.disableSync();
            syncService.stopAutoSync();

            // 1. Удаляем документы пользователя из Firebase (чтобы сбросить аватар и имя)
            const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
            if (userId) {
                const playerRef = doc(db, USERS_COLLECTION, userId);
                await deleteDoc(playerRef);
                console.log('Player doc deleted:', userId);
            }

            // 2. Удаляем сообщения этого игрока и дефолтного "Мастер" из чата
            await syncService.deletePlayerMessages('Мастер');
            if (store.name && store.name !== 'Мастер') {
                await syncService.deletePlayerMessages(store.name);
            }

            // 3. Сбрасываем прогресс в памяти
            if (store.resetAllProgress) store.resetAllProgress();
            if (store.resetChat) store.resetChat();

            // 4. Очищаем локальный кэш и перезагружаем страницу
            localStorage.clear();
            window.location.reload();
        } catch (error) {
            console.error('Ошибка при полном сбросе прогресса:', error);
            useGameStore.getState().showAlert('Произошла ошибка при сбросе. Попробуйте еще раз.');
        }
    };

    const handleFullscreenToggle = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => console.warn('Fullscreen error:', e));
        } else {
            document.exitFullscreen().catch((e) => console.warn('Exit Fullscreen error:', e));
        }
    };

    return (
        <div
            style={{
                width: '100%',
                height: '680px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '12px' : '20px',
                padding: isMobile ? '5px 15px' : '10px 30px',
                color: colors.text,
                overflowY: 'auto',
            }}
            className="leaderboard-scroll"
        >
            <style>{`
                @keyframes spinDisk {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulseStatus {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }
            `}</style>

            {/* БЛОК: ЗВУК */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    background: 'rgba(0,0,0,0.15)',
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(240,192,64,0.15)',
                        paddingBottom: '10px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🔊</span>
                        <span
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '15px',
                                fontWeight: 800,
                                color: colors.accent,
                                letterSpacing: '1px',
                            }}
                        >
                            {t.audioSettings}
                        </span>
                    </div>

                    {/* ВКЛ / ВЫКЛ тумблер */}
                    <div
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(240,192,64,0.1)',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: `1.5px solid ${isMuted ? colors.danger : colors.accent}`,
                            transition: 'all 0.2s',
                        }}
                    >
                        <span style={{ fontSize: '11px', fontWeight: 900, color: isMuted ? colors.danger : '#fff' }}>
                            {isMuted ? `🔇 ${t.off}` : `🔊 ${t.on}`}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: isMobile ? '12px' : '24px',
                        opacity: isMuted ? 0.3 : 1,
                        pointerEvents: isMuted ? 'none' : 'auto',
                        marginTop: '5px',
                    }}
                >
                    {[
                        { label: t.musicVolume, val: musicVolume, set: setMusicVolume, icon: '🎵' },
                        { label: t.sfxVolume, val: soundVolume, set: setSoundVolume, icon: '⚔️' },
                    ].map((s) => (
                        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    opacity: 0.7,
                                }}
                            >
                                <span>
                                    {s.icon} {s.label}
                                </span>
                                <span style={{ color: colors.accent }}>{s.val}%</span>
                            </div>
                            <div
                                style={{
                                    position: 'relative',
                                    height: '6px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '3px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${s.val}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, #8a5a10, ${colors.accent})`,
                                        borderRadius: '3px',
                                    }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={s.val}
                                    onChange={(e) => s.set(parseInt(e.target.value))}
                                    style={{
                                        position: 'absolute',
                                        top: '-12px',
                                        left: 0,
                                        width: '100%',
                                        height: '30px',
                                        opacity: 0,
                                        cursor: 'pointer',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* МЕДИАПЛЕЕР - Растянутый, с крупной пластинкой */}
                {!isMuted && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '10px' : '18px',
                            background: 'rgba(0,0,0,0.25)',
                            padding: isMobile ? '10px 14px' : '14px 20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(240,192,64,0.1)',
                            marginTop: '8px',
                        }}
                    >
                        {/* Крупная виниловая пластинка */}
                        <div
                            style={{
                                width: isMobile ? '46px' : '56px',
                                height: isMobile ? '46px' : '56px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #2a2a2a 24%, #151515 55%, #050505 100%)',
                                border: '2px solid rgba(240,192,64,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 15px rgba(240,192,64,0.12)',
                                animation: audioService?.isPlaying() ? 'spinDisk 4s linear infinite' : 'none',
                                flexShrink: 0,
                                position: 'relative',
                            }}
                        >
                            <span style={{ fontSize: '28px', pointerEvents: 'none' }}>💿</span>
                            {/* Центр пластинки */}
                            <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#f0c040', borderRadius: '50%', border: '1.5px solid #000' }} />
                        </div>

                        {/* Название трека и прогресс-бар */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                        {t.nowPlaying}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 900,
                                            color: audioService?.isPlaying() ? '#fff' : 'rgba(255,255,255,0.4)',
                                            fontFamily: "'Montserrat', sans-serif",
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {trackName === 'Тишина' ? t.off : trackName}
                                    </span>
                                </div>

                                {/* Кнопки управления - Крупные круглые кнопки для мобильных */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(240,192,64,0.15)', borderColor: 'rgba(240,192,64,0.4)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => audioService.prevTrack()}
                                        style={{
                                            width: isMobile ? '36px' : '44px',
                                            height: isMobile ? '36px' : '44px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(240,192,64,0.15)',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '14px' : '18px',
                                            color: colors.accent,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        ⏮
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(240,192,64,0.15)', borderColor: 'rgba(240,192,64,0.4)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => audioService.toggleMusic()}
                                        style={{
                                            width: isMobile ? '40px' : '48px',
                                            height: isMobile ? '40px' : '48px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1.5px solid rgba(240,192,64,0.25)',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '16px' : '20px',
                                            color: colors.accent,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {audioService?.isPlaying() ? '⏸' : '▶️'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(240,192,64,0.15)', borderColor: 'rgba(240,192,64,0.4)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => audioService.nextTrack()}
                                        style={{
                                            width: isMobile ? '36px' : '44px',
                                            height: isMobile ? '36px' : '44px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(240,192,64,0.15)',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '14px' : '18px',
                                            color: colors.accent,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        ⏭
                                    </motion.button>
                                </div>
                            </div>

                            {/* Заполняющаяся дорожка прогресса */}
                            <div
                                style={{
                                    height: '5px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '3px',
                                    width: '100%',
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${trackProgress}%`,
                                        background: `linear-gradient(90deg, #8a5a10, ${colors.accent})`,
                                        borderRadius: '3px',
                                        transition: 'width 1.2s linear',
                                        boxShadow: '0 0 6px #f0c040',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* БЛОК: ГРАФИКА И ОПТИМИЗАЦИЯ */}
            <AdvancedSettingsBlock
                isFullscreen={isFullscreen}
                handleFullscreenToggle={handleFullscreenToggle}
            />

            {/* БЛОК: АККАУНТ И ЯЗЫК */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '12px' : '20px', alignItems: 'start' }}>
                {/* АККАУНТ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>👤</span>
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    color: colors.accent,
                                    letterSpacing: '1px',
                                }}
                            >
                                {t.account}
                            </span>
                        </div>
                    </div>
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.05)',
                            height: '58px',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '9px', opacity: 0.5, fontWeight: 800, letterSpacing: '0.5px' }}>{t.playerId}</div>
                            <div
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    fontFamily: 'monospace',
                                    color: '#fff',
                                }}
                            >
                                {playerId}
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={copyPlayerId}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: copied ? 'rgba(46, 204, 113, 0.15)' : 'rgba(240,192,64,0.1)',
                                border: `1.5px solid ${copied ? '#2ecc71' : colors.accent}`,
                                color: copied ? '#2ecc71' : colors.accent,
                                fontSize: '11px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {copied ? t.copied : t.copy}
                        </motion.button>
                    </div>
                </div>

                {/* ЯЗЫК */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🌐</span>
                        <span
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '15px',
                                fontWeight: 800,
                                color: colors.accent,
                                letterSpacing: '1px',
                            }}
                        >
                            {t.language}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '58px' }}>
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setLanguage('RU')}
                            style={{
                                height: '100%',
                                borderRadius: '12px',
                                background: language === 'RU' ? 'rgba(240,192,64,0.15)' : 'rgba(0,0,0,0.3)',
                                border: `1.5px solid ${language === 'RU' ? colors.accent : 'rgba(255,255,255,0.05)'}`,
                                color: language === 'RU' ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '11px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            РУССКИЙ
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setLanguage('EN')}
                            style={{
                                height: '100%',
                                borderRadius: '12px',
                                background: language === 'EN' ? 'rgba(240,192,64,0.15)' : 'rgba(0,0,0,0.3)',
                                border: `1.5px solid ${language === 'EN' ? colors.accent : 'rgba(255,255,255,0.05)'}`,
                                color: language === 'EN' ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '11px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            ENGLISH
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* БЛОК: КНОПКИ ДЕЙСТВИЙ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
                    {!claimedSocialRewards?.includes('group') && (
                        <button
                            onClick={async () => {
                                const success = await joinGroup();
                                if (success) {
                                    claimGroupReward(true);
                                    useGameStore
                                        .getState()
                                        .showAlert(language === 'EN' ? 'Group join reward: 50 crystals! 💎' : 'Награда за вступление в группу: 50 кристаллов! 💎');
                                }
                            }}
                            style={{
                                padding: '14px',
                                borderRadius: '10px',
                                background: '#0077FF',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 4px 6px rgba(0,0,0,0.3)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            }}
                        >
                            {t.vkCommunity} (+50{' '}
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            )
                        </button>
                    )}

                    {!claimedSocialRewards?.includes('favorites') && (
                        <button
                            onClick={async () => {
                                const success = await addToFavorites();
                                if (success) {
                                    claimFavoriteReward(true);
                                }
                            }}
                            style={{
                                padding: '14px',
                                borderRadius: '10px',
                                background: 'linear-gradient(180deg, #f0c040, #c87820)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                color: '#000',
                                fontSize: '12px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 4px 6px rgba(0,0,0,0.3)',
                            }}
                        >
                            {t.toFavorites} (+50{' '}
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            )
                        </button>
                    )}

                    <button
                        onClick={() => {
                            useGameStore.setState({ activeScreen: 'INTRO', showIntro: true });
                            onClose();
                        }}
                        style={{
                            gridColumn: claimedSocialRewards?.includes('group') && claimedSocialRewards?.includes('favorites') ? 'span 2' : 'auto',
                            padding: '14px',
                            borderRadius: '10px',
                            background: 'rgba(240,192,64,0.1)',
                            border: `1px solid ${colors.accent}`,
                            color: colors.accent,
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: 'inset 0 1px 1px rgba(240,192,64,0.2)',
                        }}
                    >
                        {t.replayIntro}
                    </button>

                    {isAdmin && (
                        <>
                            <button
                                onClick={() => {
                                    if (!confirmWipeProgress) {
                                        setConfirmWipeProgress(true);
                                        setTimeout(() => setConfirmWipeProgress(false), 3000);
                                        return;
                                    }
                                    handleClearCache();
                                }}
                                style={{
                                    gridColumn: 'span 2',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: confirmWipeProgress
                                        ? 'rgba(239,68,68,0.2)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${colors.danger}88`,
                                    color: colors.danger,
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                                    pointerEvents: 'auto',
                                    transition: 'all 0.3s',
                                }}
                            >
                                {confirmWipeProgress ? t.confirmWipe : t.wipeProgress}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirmWipeChat) {
                                        setConfirmWipeChat(true);
                                        setTimeout(() => setConfirmWipeChat(false), 3000);
                                        return;
                                    }
                                    const { syncService } = await import('../../../services/SyncService');
                                    await syncService.wipeGlobalChat();
                                    useGameStore.getState().showAlert(language === 'EN' ? 'Global chat cleared!' : 'Глобальный чат очищен!', () => {
                                        window.location.reload();
                                    });
                                }}
                                style={{
                                    gridColumn: 'span 2',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: confirmWipeChat ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid #f0c04088`,
                                    color: '#f0c040',
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                                    pointerEvents: 'auto',
                                    transition: 'all 0.3s',
                                }}
                            >
                                {confirmWipeChat ? t.confirmClear : t.clearChat}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* УДАЛЕНИЕ АККАУНТА — для всех пользователей (требование VK) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                <button
                    onClick={async () => {
                        if (!confirmWipeProgress) {
                            setConfirmWipeProgress(true);
                            setTimeout(() => setConfirmWipeProgress(false), 4000);
                            return;
                        }
                        handleClearCache();
                    }}
                    style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        background: confirmWipeProgress ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${confirmWipeProgress ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)'}`,
                        color: confirmWipeProgress ? '#ef4444' : 'rgba(239,68,68,0.5)',
                        fontSize: '11px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s',
                    }}
                >
                    {confirmWipeProgress ? '⚠️ ПОДТВЕРДИТЬ УДАЛЕНИЕ АККАУНТА?' : '🗑️ Удалить аккаунт и все данные'}
                </button>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '5px' }}>
                    Это действие удалит все ваши данные без возможности восстановления
                </div>
            </div>

            {/* ВЕРСИЯ КЛИЕНТА */}
            <div
                onClick={() => {
                    if (isAdmin) {
                        onOpenAdmin?.();
                    } else {
                        console.log('Current User ID:', useGameStore.getState().vkUser?.id || useGameStore.getState().vkUser?.uid);
                    }
                }}
                style={{
                    marginTop: 'auto',
                    textAlign: 'center',
                    padding: '20px 0',
                    opacity: 0.3,
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                }}
            >
                VERSION v{AppConfig.VERSION} • MASTERS OF THE WILD • 2026
                <div
                    style={{
                        marginTop: '5px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '15px',
                        textDecoration: 'underline',
                    }}
                >
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDoc('privacy');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        Политика конфиденциальности
                    </span>
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDoc('terms');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        Пользовательское соглашение
                    </span>
                </div>
            </div>
            <LegalModal open={openDoc} onClose={() => setOpenDoc(null)} />
        </div>
    );
};

export default SettingsWindow;
