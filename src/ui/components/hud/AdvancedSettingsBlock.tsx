import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { requestNotifications } from '../../../utils/VKBridge';
import { settingsTranslations } from './SettingsLocalization';
import { PixiApp } from '../../../engine/core/PixiApp';

interface AdvancedSettingsBlockProps {
    isFullscreen: boolean;
    handleFullscreenToggle: () => void;
}

export const AdvancedSettingsBlock: React.FC<AdvancedSettingsBlockProps> = ({
    isFullscreen,
    handleFullscreenToggle,
}) => {
    const {
        graphicsQuality,
        setGraphicsQuality,
        showFps,
        setShowFps,
        isPowerSaving,
        setIsPowerSaving,
        notificationsEnabled,
        setNotificationsEnabled,
        uiAnimations,
        setUiAnimations,
        particlesQuality,
        setParticlesQuality,
        glowEnabled,
        setGlowEnabled,
        language,
        arenaBgQuality,
        setArenaBgQuality,
        showPing,
        setShowPing,
        autoTuneSettings,
    } = useGameStore();

    const t = settingsTranslations[(language || 'RU') as 'RU' | 'EN'] || settingsTranslations.RU;

    const colors = {
        accent: '#f0c040',
        border: 'rgba(240,192,64,0.15)',
        bgCard: 'rgba(255,255,255,0.02)',
    };

    const [perfStats, setPerfStats] = React.useState<{
        ramUsed: number | null;
        ramLimit: number | null;
        fps: number;
        ping: number | null;
    }>({
        ramUsed: null,
        ramLimit: null,
        fps: 0,
        ping: null,
    });

    React.useEffect(() => {
        const updateStats = async () => {
            // 1. FPS
            let currentFps = 0;
            try {
                const app = PixiApp.getInstance().getApp();
                if (app && app.ticker) {
                    currentFps = Math.round(app.ticker.FPS);
                }
            } catch (e) {
                // ignore
            }

            // 2. RAM (if supported)
            let usedMem = null;
            let limitMem = null;
            const perfMem = (window.performance as any)?.memory;
            if (perfMem) {
                usedMem = perfMem.usedJSHeapSize;
                limitMem = perfMem.jsHeapSizeLimit;
            }

            // 3. Ping
            let currentPing = null;
            const start = performance.now();
            try {
                await fetch(`/?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
                currentPing = Math.round(performance.now() - start);
            } catch (e) {
                // ignore
            }

            setPerfStats({
                ramUsed: usedMem,
                ramLimit: limitMem,
                fps: currentFps,
                ping: currentPing,
            });
        };

        updateStats();
        const interval = setInterval(updateStats, 2000);
        return () => clearInterval(interval);
    }, []);

    // GPU / CPU Cores / Memory detection
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
    const memoryGb = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined;

    let gpuTier = 'Tier 2';
    if (cores && memoryGb) {
        if (memoryGb >= 8 && cores >= 8) gpuTier = 'Tier 3 (High)';
        else if (memoryGb >= 4 && cores >= 4) gpuTier = 'Tier 2 (Mid)';
        else gpuTier = 'Tier 1 (Low)';
    } else if (cores) {
        if (cores >= 8) gpuTier = 'Tier 3 (High)';
        else if (cores >= 4) gpuTier = 'Tier 2 (Mid)';
        else gpuTier = 'Tier 1 (Low)';
    }

    const gpuDetail = [
        cores ? `${cores} CPU` : null,
        memoryGb ? `${memoryGb}GB RAM` : null
    ].filter(Boolean).join(', ');

    const perfTranslations = {
        RU: {
            title: '📊 ХАРАКТЕРИСТИКИ СИСТЕМЫ',
            fps: 'Кадров/сек (FPS):',
            ping: 'Пинг (Ping):',
            ram: 'Использование ОЗУ:',
            hardware: 'Железо / Уровень:',
        },
        EN: {
            title: '📊 SYSTEM PERFORMANCE',
            fps: 'FPS:',
            ping: 'Ping:',
            ram: 'RAM Usage:',
            hardware: 'Hardware / Tier:',
        }
    };
    const pt = perfTranslations[(language || 'RU') as 'RU' | 'EN'] || perfTranslations.RU;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return (
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
            {/* ХЕДЕР РАЗДЕЛА */}
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
                        fontSize: '15px',
                        fontWeight: 800,
                        color: colors.accent,
                        letterSpacing: '1px',
                    }}
                >
                    {t.graphicsHeader}
                </span>
            </div>

            {/* ПРЕСЕТЫ КАЧЕСТВА */}
            <div style={{ display: 'flex', gap: '10px' }}>
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
                            background: graphicsQuality === g ? 'rgba(240,192,64,0.15)' : 'rgba(255,255,255,0.02)',
                            border: `1.5px solid ${graphicsQuality === g ? colors.accent : 'rgba(255,255,255,0.05)'}`,
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

            {/* СЕТКА ТУМБЛЕРОВ И ОПЦИЙ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Полноэкранный режим */}
                {!isMobile && (
                    <ToggleItem
                        label={t.fullscreen}
                        icon="📺"
                        active={isFullscreen}
                        onToggle={handleFullscreenToggle}
                        colors={colors}
                    />
                )}

                {/* Отображать FPS */}
                <ToggleItem
                    label={t.showFps}
                    icon="📈"
                    active={showFps}
                    onToggle={() => setShowFps(!showFps)}
                    colors={colors}
                />

                {/* Энергосбережение */}
                <ToggleItem
                    label={t.powerSaving}
                    icon="🔋"
                    active={isPowerSaving}
                    onToggle={() => setIsPowerSaving(!isPowerSaving)}
                    colors={colors}
                />

                {/* Push-уведомления */}
                <ToggleItem
                    label={t.pushNotifications}
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

                {/* Анимации интерфейса */}
                <ToggleItem
                    label={t.uiAnimations}
                    icon="✨"
                    active={uiAnimations}
                    onToggle={() => setUiAnimations(!uiAnimations)}
                    colors={colors}
                />

                {/* Свечение ауры (Glow) */}
                <ToggleItem
                    label={t.glowAura}
                    icon="🌟"
                    active={glowEnabled}
                    onToggle={() => setGlowEnabled(!glowEnabled)}
                    colors={colors}
                />

                {/* Показывать пинг */}
                <ToggleItem
                    label={t.showPing}
                    icon="📡"
                    active={showPing}
                    onToggle={() => setShowPing(!showPing)}
                    colors={colors}
                />

                {/* Качество фона арены (Высокое / Низкое) */}
                <div
                    style={{
                        gridColumn: 'span 2',
                        background: colors.bgCard,
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '16px' }}>🏟️</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.7 }}>
                            {t.arenaBgQuality}
                        </span>
                    </div>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => setArenaBgQuality('LOW')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                background: arenaBgQuality === 'LOW' ? colors.accent : 'transparent',
                                border: 'none',
                                color: arenaBgQuality === 'LOW' ? '#000' : 'rgba(255,255,255,0.4)',
                                fontSize: '10px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t.low}
                        </button>
                        <button
                            onClick={() => setArenaBgQuality('HIGH')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                background: arenaBgQuality === 'HIGH' ? colors.accent : 'transparent',
                                border: 'none',
                                color: arenaBgQuality === 'HIGH' ? '#000' : 'rgba(255,255,255,0.4)',
                                fontSize: '10px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t.high}
                        </button>
                    </div>
                </div>

                {/* Эффекты частиц (Высокое / Низкое) */}
                <div
                    style={{
                        gridColumn: 'span 2',
                        background: colors.bgCard,
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '16px' }}>💥</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.7 }}>
                            {t.particleEffects}
                        </span>
                    </div>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => setParticlesQuality('LOW')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                background: particlesQuality === 'LOW' ? colors.accent : 'transparent',
                                border: 'none',
                                color: particlesQuality === 'LOW' ? '#000' : 'rgba(255,255,255,0.4)',
                                fontSize: '10px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t.low}
                        </button>
                        <button
                            onClick={() => setParticlesQuality('HIGH')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                background: particlesQuality === 'HIGH' ? colors.accent : 'transparent',
                                border: 'none',
                                color: particlesQuality === 'HIGH' ? '#000' : 'rgba(255,255,255,0.4)',
                                fontSize: '10px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t.high}
                        </button>
                    </div>
                </div>

                {/* Автонастройка */}
                <button
                    onClick={() => {
                        autoTuneSettings();
                        useGameStore.getState().showAlert(language === 'RU' ? 'Оптимальные настройки успешно применены!' : 'Optimal settings applied successfully!');
                    }}
                    style={{
                        gridColumn: 'span 2',
                        padding: '14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: 'linear-gradient(90deg, rgba(240,192,64,0.1) 0%, rgba(240,192,64,0.2) 50%, rgba(240,192,64,0.1) 100%)',
                        border: `1.5px dashed ${colors.accent}`,
                        color: colors.accent,
                        fontFamily: "'Cinzel', serif",
                        fontSize: '12px',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                    }}
                >
                    ⚙️ {t.autoTune}
                </button>
            </div>

            {/* Панель производительности системы */}
            <div
                style={{
                    marginTop: '5px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                <div
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '11px',
                        fontWeight: 800,
                        color: colors.accent,
                        opacity: 0.9,
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingBottom: '6px',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <span>📊</span>
                    <span>{pt.title}</span>
                </div>

                {/* FPS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                        <span>📈</span>
                        <span>{pt.fps}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: perfStats.fps >= 50 ? '#4caf50' : perfStats.fps >= 30 ? '#ffeb3b' : '#f44336' }}>
                        {perfStats.fps} FPS
                    </span>
                </div>

                {/* Ping */}
                {perfStats.ping !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                            <span>📡</span>
                            <span>{pt.ping}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: perfStats.ping < 100 ? '#4caf50' : perfStats.ping < 250 ? '#ffeb3b' : '#f44336' }}>
                            {perfStats.ping} ms
                        </span>
                    </div>
                )}

                {/* RAM (Guarded, hide if unsupported) */}
                {perfStats.ramUsed !== null && perfStats.ramLimit !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                                <span>💾</span>
                                <span>{pt.ram}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                                {Math.round(perfStats.ramUsed / 1024 / 1024)} MB / {Math.round(perfStats.ramLimit / 1024 / 1024)} MB
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div
                                style={{
                                    width: `${Math.min(100, Math.round((perfStats.ramUsed / perfStats.ramLimit) * 100))}%`,
                                    height: '100%',
                                    background: (perfStats.ramUsed / perfStats.ramLimit) > 0.8 ? '#f44336' : (perfStats.ramUsed / perfStats.ramLimit) > 0.5 ? '#ffeb3b' : colors.accent,
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Hardware / GPU Tier */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                        <span>⚡</span>
                        <span>{pt.hardware}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                        <span style={{ fontWeight: 800, color: gpuTier.includes('High') ? '#4caf50' : gpuTier.includes('Mid') ? '#ffeb3b' : '#f44336' }}>
                            {gpuTier}
                        </span>
                        {gpuDetail && (
                            <span style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>
                                ({gpuDetail})
                            </span>
                        )}
                    </div>
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
            padding: '14px 18px',
            background: colors.bgCard,
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.7, maxWidth: '140px', lineHeight: '1.2' }}>
                {label}
            </span>
        </div>
        <div
            style={{
                width: '50px',
                height: '26px',
                borderRadius: '13px',
                background: active ? colors.accent : 'rgba(0,0,0,0.3)',
                position: 'relative',
                transition: '0.3s',
            }}
        >
            <div
                style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: active ? '#1a1008' : '#555',
                    position: 'absolute',
                    top: '3px',
                    left: active ? '27px' : '3px',
                    transition: '0.3s',
                }}
            />
        </div>
    </div>
);
