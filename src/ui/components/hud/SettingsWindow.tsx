import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { requestNotifications, addToFavorites, joinGroup } from '../../../utils/VKBridge';

interface SettingsWindowProps {
    onClose: () => void;
    onOpenAdmin?: () => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose, onOpenAdmin }) => {
    const {
        showFps,
        setShowFps,
        musicVolume,
        setMusicVolume,
        soundVolume,
        setSoundVolume,
        graphicsQuality,
        setGraphicsQuality,
        notificationsEnabled,
        setNotificationsEnabled,
        isPowerSaving,
        setIsPowerSaving,
        isMuted,
        setIsMuted,
        playerId,
    } = useGameStore();

    const [confirmWipeChat, setConfirmWipeChat] = React.useState(false);
    const [confirmWipeProgress, setConfirmWipeProgress] = React.useState(false);

    const userVkId = useGameStore.getState().vkUser?.id || useGameStore.getState().vkUser?.uid;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isAdmin = Number(userVkId) === 212359386 || isLocal;

    const colors = {
        text: '#e8d8a8',
        accent: '#f0c040',
        card: 'rgba(255,255,255,0.03)',
        border: 'rgba(240,192,64,0.15)',
        danger: '#ef4444',
    };

    const copyPlayerId = () => {
        navigator.clipboard.writeText(playerId);
        // Можно добавить тост "Скопировано", но пока просто лог
        console.log('ID Copied:', playerId);
    };

    const handleClearCache = async () => {
        try {
            const store = useGameStore.getState() as any;
            const { syncService } = await import('../../../services/SyncService');
            const { db } = await import('../../../utils/firebase');
            const { doc, deleteDoc } = await import('firebase/firestore');

            // 1. Удаляем документы пользователя из Firebase (чтобы сбросить аватар и имя)
            const userId = store.vkUser ? String(store.vkUser.id) : store.playerId;
            if (userId) {
                const playerRef = doc(db, 'пользователи', userId);
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
            alert('Произошла ошибка при сбросе. Попробуйте еще раз.');
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
                height: '620px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '10px 30px',
                color: colors.text,
                overflowY: 'auto',
            }}
            className="leaderboard-scroll"
        >
            {/* БЛОК: ЗВУК */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: '10px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>🔊</span>
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '16px',
                                    fontWeight: 800,
                                    color: colors.accent,
                                    letterSpacing: '1px',
                                }}
                            >
                                АУДИО
                            </span>
                        </div>

                        {/* MUSIC PLAYER WIDGET */}
                        {!isMuted && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'rgba(0,0,0,0.4)',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(240,192,64,0.2)',
                                    marginLeft: '55px',
                                }}
                            >
                                <motion.span
                                    whileHover={{ scale: 1.2, color: '#fff' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        const { audioService } = window as any;
                                        audioService.prevTrack();
                                        setMusicVolume(musicVolume);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: colors.accent,
                                        opacity: 0.8,
                                        padding: '5px',
                                        textShadow: `0 0 10px ${colors.accent}`,
                                    }}
                                >
                                    ⏮
                                </motion.span>

                                <div
                                    onClick={() => {
                                        const { audioService } = window as any;
                                        audioService.toggleMusic();
                                        setMusicVolume(musicVolume);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        minWidth: '180px',
                                        justifyContent: 'center',
                                        padding: '0 10px',
                                    }}
                                >
                                    {/* VISUALIZER BARS */}
                                    {(window as any).audioService?.isPlaying() && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '2px',
                                                alignItems: 'flex-end',
                                                height: '12px',
                                            }}
                                        >
                                            {[1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [4, 12, 6, 10, 4] }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 0.5 + i * 0.1,
                                                        ease: 'easeInOut',
                                                    }}
                                                    style={{
                                                        width: '2px',
                                                        background: colors.accent,
                                                        borderRadius: '1px',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <motion.span
                                        animate={
                                            (window as any).audioService?.isPlaying() ? { scale: [1, 1.1, 1] } : {}
                                        }
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{
                                            fontSize: '16px',
                                            color: colors.accent,
                                            textShadow: (window as any).audioService?.isPlaying()
                                                ? `0 0 15px ${colors.accent}`
                                                : 'none',
                                        }}
                                    >
                                        {(window as any).audioService?.isPlaying() ? '⏸' : '▶️'}
                                    </motion.span>

                                    <div
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: (window as any).audioService?.isPlaying()
                                                ? '#fff'
                                                : 'rgba(255,255,255,0.4)',
                                            fontFamily: "'Cinzel', serif",
                                            maxWidth: '120px',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            transition: 'all 0.3s',
                                        }}
                                    >
                                        {(window as any).audioService?.getCurrentTrackName() === 'Тишина'
                                            ? 'ЗАПУСТИТЬ'
                                            : (window as any).audioService?.getCurrentTrackName()}
                                    </div>
                                </div>

                                <motion.span
                                    whileHover={{ scale: 1.2, color: '#fff' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        const { audioService } = window as any;
                                        audioService.nextTrack();
                                        setMusicVolume(musicVolume);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: colors.accent,
                                        opacity: 0.8,
                                        padding: '5px',
                                        textShadow: `0 0 10px ${colors.accent}`,
                                    }}
                                >
                                    ⏭
                                </motion.span>
                            </div>
                        )}
                    </div>

                    <div
                        onClick={() => {
                            setIsMuted(!isMuted);
                            if (!isMuted) {
                                (window as any).audioService?.stopAllMusic();
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            background: isMuted ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            border: `1px solid ${isMuted ? colors.danger : 'transparent'}`,
                            transition: 'all 0.2s',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>{isMuted ? '🔇 ВЫКЛ' : '🔊 ВКЛ'}</span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '30px',
                        opacity: isMuted ? 0.3 : 1,
                        pointerEvents: isMuted ? 'none' : 'auto',
                    }}
                >
                    {[
                        { label: 'МУЗЫКА', val: musicVolume, set: setMusicVolume, icon: '🎵' },
                        { label: 'ЭФФЕКТЫ', val: soundVolume, set: setSoundVolume, icon: '⚔️' },
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
                                        top: '-10px',
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
            </div>

            {/* БЛОК: ГРАФИКА И ДИСПЛЕЙ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: '10px',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>👁️</span>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                            fontWeight: 800,
                            color: colors.accent,
                            letterSpacing: '1px',
                        }}
                    >
                        ГРАФИКА И ДИСПЛЕЙ
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {/* Качество */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                        {['LOW', 'MEDIUM', 'ULTRA'].map((g) => (
                            <button
                                key={g}
                                onClick={() => setGraphicsQuality(g)}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background:
                                        graphicsQuality === g ? 'rgba(240,192,64,0.15)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${graphicsQuality === g ? colors.accent : 'rgba(255,255,255,0.05)'}`,
                                    color: graphicsQuality === g ? '#fff' : 'rgba(255,255,255,0.4)',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '11px',
                                    fontWeight: 900,
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Тумблеры */}
                    {!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                        <ToggleItem
                            label="ПОЛНОЭКРАННЫЙ РЕЖИМ"
                            icon="📺"
                            active={!!document.fullscreenElement}
                            onToggle={handleFullscreenToggle}
                            colors={colors}
                        />
                    )}
                    <ToggleItem
                        label="ОТОБРАЖАТЬ FPS"
                        icon="📈"
                        active={showFps}
                        onToggle={() => setShowFps(!showFps)}
                        colors={colors}
                    />
                    <ToggleItem
                        label="ЭНЕРГОСБЕРЕЖЕНИЕ (30 FPS)"
                        icon="🔋"
                        active={isPowerSaving}
                        onToggle={() => setIsPowerSaving(!isPowerSaving)}
                        colors={colors}
                    />
                    <ToggleItem
                        label="PUSH-УВЕДОМЛЕНИЯ"
                        icon="🔔"
                        active={notificationsEnabled}
                        onToggle={async () => {
                            if (!notificationsEnabled) {
                                const success = await requestNotifications();
                                if (success) setNotificationsEnabled(true);
                            } else {
                                setNotificationsEnabled(false);
                            }
                        }}
                        colors={colors}
                    />
                </div>
            </div>

            {/* БЛОК: АККАУНТ И ПОДДЕРЖКА */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: '10px',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>👤</span>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                            fontWeight: 800,
                            color: colors.accent,
                            letterSpacing: '1px',
                        }}
                    >
                        АККАУНТ
                    </span>
                </div>

                <div
                    style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '15px',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 800 }}>ID ИГРОКА</div>
                        <div
                            style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '1px' }}
                        >
                            {playerId}
                        </div>
                        {useGameStore.getState().vkUser && (
                            <div style={{ fontSize: '10px', color: '#0077FF', fontWeight: 900, marginTop: '5px' }}>
                                🔗 ПРИВЯЗАНО К ВКОНТАКТЕ
                            </div>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={copyPlayerId}
                        style={{
                            padding: '8px 15px',
                            borderRadius: '8px',
                            background: 'rgba(240,192,64,0.1)',
                            border: `2px solid ${colors.accent}`,
                            color: colors.accent,
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: 'inset 0 1px 1px rgba(240,192,64,0.2)',
                        }}
                    >
                        КОПИРОВАТЬ
                    </motion.button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {!useGameStore.getState().claimedSocialRewards?.includes('group') && (
                        <button
                            onClick={async () => {
                                const success = await joinGroup();
                                if (success) {
                                    setTimeout(() => (useGameStore.getState() as any).checkSocialRewards(), 3000);
                                }
                            }}
                            style={{
                                padding: '12px',
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
                            🌐 МЫ ВКОНТАКТЕ (+50{' '}
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            )
                        </button>
                    )}

                    {!useGameStore.getState().claimedSocialRewards?.includes('favorites') && (
                        <button
                            onClick={async () => {
                                const success = await addToFavorites();
                                if (success) {
                                    (useGameStore.getState() as any).claimFavoriteReward();
                                }
                            }}
                            style={{
                                padding: '12px',
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
                            ⭐ В ИЗБРАННОЕ (+50{' '}
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                            )
                        </button>
                    )}

                    <>
                        <button
                            onClick={() => {
                                useGameStore.setState({ activeScreen: 'INTRO', showIntro: true });
                                onClose();
                            }}
                            style={{
                                padding: '12px',
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
                            🎬 ПОВТОРИТЬ ИНТРО
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
                                        padding: '12px',
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
                                    {confirmWipeProgress ? '⚠️ ТОЧНО СБРОСИТЬ ВСЁ?' : '🗑️ ПОЛНЫЙ ВАЙП ПРОГРЕССА'}
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
                                        alert('Глобальный чат очищен!');
                                        window.location.reload();
                                    }}
                                    style={{
                                        gridColumn: 'span 2',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: confirmWipeChat ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid #f0c04088`,
                                        color: '#f0c040',
                                        fontSize: '12px',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                                        marginTop: '10px',
                                        pointerEvents: 'auto',
                                        transition: 'all 0.3s',
                                    }}
                                >
                                    {confirmWipeChat ? '⚠️ ТОЧНО УДАЛИТЬ ЧАТ?' : '🧹 АДМИН: ОЧИСТИТЬ ВЕСЬ ЧАТ'}
                                </button>
                            </>
                        )}
                    </>
                </div>
            </div>

            {/* ВЕРСИЯ КЛИЕНТА */}
            <div
                onClick={() => {
                    const userVkId = useGameStore.getState().vkUser?.id || useGameStore.getState().vkUser?.uid;
                    const isLocal =
                        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                    if (Number(userVkId) === 212359386 || isLocal) {
                        onOpenAdmin?.();
                    } else {
                        console.log('Current User ID:', userVkId); // Поможет отладить, если ID не совпадает
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
                VERSION v1.1.0 • MASTERS OF THE WILD • 2026
                <div
                    style={{
                        marginTop: '5px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '15px',
                        textDecoration: 'underline',
                    }}
                >
                    <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                    <span style={{ cursor: 'pointer' }}>Terms of Service</span>
                </div>
            </div>
        </div>
    );
};

const ToggleItem: React.FC<{ label: string; icon: string; active: boolean; onToggle: () => void; colors: any }> = ({
    label,
    icon,
    active,
    onToggle,
    colors,
}) => (
    <div
        onClick={onToggle}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 15px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.7, maxWidth: '100px', lineHeight: '1.2' }}>
                {label}
            </span>
        </div>
        <div
            style={{
                width: '40px',
                height: '20px',
                borderRadius: '10px',
                background: active ? colors.accent : 'rgba(0,0,0,0.3)',
                position: 'relative',
                transition: '0.3s',
            }}
        >
            <div
                style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: active ? '#1a1008' : '#555',
                    position: 'absolute',
                    top: '3px',
                    left: active ? '23px' : '3px',
                    transition: '0.3s',
                }}
            />
        </div>
    </div>
);
