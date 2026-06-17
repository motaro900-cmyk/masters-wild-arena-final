import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { requestNotifications } from '../../../utils/VKBridge';
import { settingsTranslations } from './SettingsLocalization';
import { getDeviceProfile, DeviceProfile } from '../../../services/TelemetryService';
import { AppConfig } from '../../../configs/AppConfig';

interface AdvancedSettingsBlockProps {
    isFullscreen: boolean;
    handleFullscreenToggle: () => void;
}

// Utility to get GPU renderer name
let cachedGPUInfo: string | null | undefined = undefined;

const getGPUInfo = (): string | null => {
    if (cachedGPUInfo !== undefined) return cachedGPUInfo;
    if (typeof document === 'undefined') return null;
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            let clean: string | null = null;
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (renderer) {
                    clean = renderer;
                    const match = renderer.match(/ANGLE \(([^,]+), ([^,]+) Direct3D/);
                    if (match && match[2]) {
                        clean = match[2];
                    } else {
                        clean = renderer
                            .replace(/^ANGLE \(([^,]+), /, '')
                            .replace(/\s*Direct3D.*/, '')
                            .replace(/\s*\([^)]*\)/g, '')
                            .trim();
                    }
                }
            }
            // Manually lose the WebGL context to free memory immediately
            gl.getExtension('WEBGL_lose_context')?.loseContext();
            cachedGPUInfo = clean;
            return clean;
        }
    } catch (e) {
        // ignore
    }
    cachedGPUInfo = null;
    return null;
};

// Utility to detect OS and Browser
const getOSAndBrowser = (): string => {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) {
        if (navigator.maxTouchPoints > 0) os = 'iPadOS';
        else os = 'macOS';
    }
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1 || ua.indexOf('iPod') !== -1) os = 'iOS';

    let browser = 'Unknown Browser';
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Safari') !== -1) {
        if (ua.indexOf('Edg') !== -1) browser = 'Edge';
        else if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) browser = 'Opera';
        else browser = 'Chrome';
    }
    else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('MSIE') !== -1 || !!(document as any).documentMode) browser = 'Internet Explorer';

    return `${os} / ${browser}`;
};

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
        rendererPreference,
        setRendererPreference,
        fpsCap,
        setFpsCap,
        hasCustomSettings,
        currentFps,
        activeScreen,
    } = useGameStore(
        useShallow((state) => ({
            graphicsQuality: state.graphicsQuality,
            setGraphicsQuality: state.setGraphicsQuality,
            showFps: state.showFps,
            setShowFps: state.setShowFps,
            isPowerSaving: state.isPowerSaving,
            setIsPowerSaving: state.setIsPowerSaving,
            notificationsEnabled: state.notificationsEnabled,
            setNotificationsEnabled: state.setNotificationsEnabled,
            uiAnimations: state.uiAnimations,
            setUiAnimations: state.setUiAnimations,
            particlesQuality: state.particlesQuality,
            setParticlesQuality: state.setParticlesQuality,
            glowEnabled: state.glowEnabled,
            setGlowEnabled: state.setGlowEnabled,
            language: state.language,
            arenaBgQuality: state.arenaBgQuality,
            setArenaBgQuality: state.setArenaBgQuality,
            showPing: state.showPing,
            setShowPing: state.setShowPing,
            autoTuneSettings: state.autoTuneSettings,
            rendererPreference: state.rendererPreference || 'auto',
            setRendererPreference: state.setRendererPreference,
            fpsCap: state.fpsCap || 60,
            setFpsCap: state.setFpsCap,
            hasCustomSettings: state.hasCustomSettings,
            currentFps: state.currentFps,
            activeScreen: state.activeScreen,
        }))
    );

    const [profile, setProfile] = React.useState<DeviceProfile | null>(null);

    React.useEffect(() => {
        getDeviceProfile().then(setProfile);
    }, []);

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

    const [showDetailed, setShowDetailed] = React.useState(false);

    // RAF-based FPS measurement that always reflects real browser render rate
    React.useEffect(() => {
        let animFrameId: number;
        let frameCount = 0;
        let lastTime = performance.now();
        let lastUpdate = performance.now();

        const tick = (timestamp: number) => {
            frameCount++;
            if (timestamp - lastUpdate >= 1000) {
                const elapsed = timestamp - lastTime;
                const fps = elapsed > 0 ? Math.round((frameCount * 1000) / elapsed) : 0;
                frameCount = 0;
                lastTime = timestamp;
                lastUpdate = timestamp;
                setPerfStats((prev) => ({ ...prev, fps }));
            }
            animFrameId = requestAnimationFrame(tick);
        };
        animFrameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animFrameId);
    }, []);

    // RAM and ping updates (slower)
    React.useEffect(() => {
        const updateStats = async () => {
            // RAM (if supported)
            let usedMem = null;
            let limitMem = null;
            const perfMem = (window.performance as any)?.memory;
            if (perfMem) {
                usedMem = perfMem.usedJSHeapSize;
                limitMem = perfMem.jsHeapSizeLimit;
            }

            // Ping
            let currentPing = null;
            const start = performance.now();
            try {
                await fetch(`/?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
                currentPing = Math.round(performance.now() - start);
            } catch (e) {
                // ignore
            }

            setPerfStats((prev) => ({
                ...prev,
                ramUsed: usedMem,
                ramLimit: limitMem,
                ping: currentPing,
            }));
        };

        updateStats();
        const interval = setInterval(updateStats, 3000);
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

    const perfTranslations = {
        RU: {
            title: 'ХАРАКТЕРИСТИКИ СИСТЕМЫ',
            fps: 'Кадров/сек (FPS):',
            ping: 'Пинг (Сеть):',
            ramHeap: 'Память игры (JS Heap):',
            ramSys: 'ОЗУ системы (RAM):',
            cpu: 'Процессор (CPU):',
            gpu: 'Видеокарта (GPU):',
            os: 'ОС / Браузер:',
            hardware: 'Класс устройства:',
            showDetails: '🔽 ПОКАЗАТЕЛЬНЫЕ НАСТРОЙКИ',
            hideDetails: '🔼 СКРЫТЬ ДЕТАЛЬНЫЕ НАСТРОЙКИ',
        },
        EN: {
            title: 'SYSTEM PERFORMANCE',
            fps: 'FPS:',
            ping: 'Ping (Network):',
            ramHeap: 'Game Memory (JS Heap):',
            ramSys: 'System RAM:',
            cpu: 'Processor (CPU):',
            gpu: 'Graphics Card (GPU):',
            os: 'OS / Browser:',
            hardware: 'Device Tier:',
            showDetails: '🔽 SHOW DETAILED SETTINGS',
            hideDetails: '🔼 HIDE DETAILED SETTINGS',
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
            <div style={{ display: 'flex', gap: '8px' }}>
                {([
                    {
                        id: 'LOW',
                        label: language === 'RU' ? 'НИЗКОЕ' : 'LOW',
                        icon: '🔋',
                        color: '#f44336',
                        desc: language === 'RU'
                            ? ['Без размытия', 'Без теней', 'Без частиц', 'Макс. производительность']
                            : ['No blur', 'No shadows', 'No particles', 'Max performance'],
                    },
                    {
                        id: 'MEDIUM',
                        label: language === 'RU' ? 'СРЕДНЕЕ' : 'MEDIUM',
                        icon: '⚖️',
                        color: '#ffeb3b',
                        desc: language === 'RU'
                            ? ['Лёгкое размытие', 'Умеренные тени', 'Частицы вкл.', 'Баланс']
                            : ['Light blur', 'Moderate shadows', 'Particles on', 'Balance'],
                    },
                    {
                        id: 'ULTRA',
                        label: language === 'RU' ? 'УЛЬТРА' : 'ULTRA',
                        icon: '✨',
                        color: '#4caf50',
                        desc: language === 'RU'
                            ? ['Стекло-эффект', 'Глубокие тени', 'Свечение иконок', 'Виньетирование']
                            : ['Glassmorphism', 'Deep shadows', 'Icon glow', 'Vignette'],
                    },
                ] as const).map((g) => (
                    <button
                        key={g.id}
                        onClick={() => setGraphicsQuality(g.id)}
                        style={{
                            flex: 1,
                            padding: '10px 6px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: graphicsQuality === g.id
                                ? `rgba(${g.color === '#f44336' ? '244,67,54' : g.color === '#ffeb3b' ? '255,235,59' : '76,175,80'},0.12)`
                                : 'rgba(255,255,255,0.02)',
                            border: `1.5px solid ${graphicsQuality === g.id ? g.color : 'rgba(255,255,255,0.05)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: graphicsQuality === g.id ? `0 0 12px ${g.color}33` : 'none',
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>{g.icon}</span>
                        <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '10px',
                            fontWeight: 900,
                            color: graphicsQuality === g.id ? g.color : 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.5px',
                        }}>
                            {g.label}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                            {g.desc.map((line, i) => (
                                <div key={i} style={{
                                    fontSize: '9px',
                                    color: graphicsQuality === g.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)',
                                    textAlign: 'center',
                                    lineHeight: '1.3',
                                }}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </button>
                ))}
            </div>

            {/* КНОПКА ПОКАЗАТЬ/СКРЫТЬ ДЕТАЛЬНЫЕ НАСТРОЙКИ */}
            <button
                onClick={() => setShowDetailed(!showDetailed)}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1.5px solid rgba(240,192,64,0.15)',
                    borderRadius: '10px',
                    color: colors.accent,
                    fontFamily: "'Cinzel', serif",
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '5px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(240,192,64,0.08)';
                    e.currentTarget.style.borderColor = colors.accent;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(240,192,64,0.15)';
                }}
            >
                {showDetailed ? pt.hideDetails : pt.showDetails}
            </button>

            <AnimatePresence initial={false}>
                {showDetailed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '15px' }}
                    >
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

                            {/* Автоподстройка качества */}
                            <ToggleItem
                                label={language === 'RU' ? 'Автоподстройка графики' : 'Auto-adjust graphics'}
                                icon="🤖"
                                active={!hasCustomSettings}
                                onToggle={() => useGameStore.setState({ hasCustomSettings: !hasCustomSettings })}
                                colors={colors}
                            />
                        </div>

                        {/* Качество фона арены (Высокое / Низкое) */}
                        <div
                            style={{
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

                        {/* Выбор рендерера */}
                        <div
                            style={{
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
                                <span style={{ fontSize: '16px' }}>⚙️</span>
                                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.7 }}>
                                    {language === 'RU' ? 'Графический рендерер' : 'Graphics Renderer'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {([
                                    { id: 'auto', label: language === 'RU' ? 'Авто' : 'Auto' },
                                    { id: 'webgl', label: 'WebGL' },
                                    { id: 'webgpu', label: 'WebGPU' }
                                ] as const).map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => {
                                            setRendererPreference(r.id);
                                            const msg = language === 'RU'
                                                ? 'Настройки рендера применятся после перезапуска игры.'
                                                : 'Renderer settings will apply after restarting the game.';
                                            useGameStore.getState().showAlert(msg);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            background: rendererPreference === r.id ? colors.accent : 'transparent',
                                            border: 'none',
                                            color: rendererPreference === r.id ? '#000' : 'rgba(255,255,255,0.4)',
                                            fontSize: '9px',
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Лимит FPS */}
                        <div
                            style={{
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
                                <span style={{ fontSize: '16px' }}>⚡</span>
                                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.7 }}>
                                    {language === 'RU' ? 'Лимит частоты кадров (FPS)' : 'Frame Rate Limit (FPS)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {([30, 60, 120, 180, 240] as const).map((cap) => (
                                    <button
                                        key={cap}
                                        onClick={() => setFpsCap(cap)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '6px',
                                            background: fpsCap === cap ? colors.accent : 'transparent',
                                            border: 'none',
                                            color: fpsCap === cap ? '#000' : 'rgba(255,255,255,0.4)',
                                            fontSize: '10px',
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {cap}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Автонастройка */}
                        <button
                            onClick={() => {
                                autoTuneSettings();
                                useGameStore.getState().showAlert(language === 'RU' ? 'Оптимальные настройки успешно применены!' : 'Optimal settings applied successfully!');
                            }}
                            style={{
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Панель производительности системы */}
            <div
                style={{
                    marginTop: '5px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '12px',
                        fontWeight: 800,
                        color: colors.accent,
                        opacity: 0.9,
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingBottom: '8px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📋</span>
                        <span>{language === 'RU' ? 'ДИАГНОСТИКА УСТРОЙСТВА' : 'DEVICE DIAGNOSTICS'}</span>
                    </div>
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>v{AppConfig.VERSION}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    {/* Device model */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6 }}>📱 {language === 'RU' ? 'Устройство:' : 'Device:'}</span>
                        <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                            {profile?.device || 'Unknown'}
                        </span>
                    </div>

                    {/* OS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6 }}>💻 {language === 'RU' ? 'Операционная система:' : 'OS:'}</span>
                        <span style={{ fontWeight: 800, color: '#b0b0b0' }}>
                            {profile?.os || 'Unknown'}
                        </span>
                    </div>

                    {/* Browser */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6 }}>🌐 {language === 'RU' ? 'Браузер:' : 'Browser:'}</span>
                        <span style={{ fontWeight: 800, color: '#b0b0b0' }}>
                            {profile?.browser || 'Unknown'}
                        </span>
                    </div>

                    {/* GPU */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6 }}>🎮 {language === 'RU' ? 'Видеочип (GPU):' : 'GPU:'}</span>
                        <span style={{ fontWeight: 800, color: '#b0b0b0', textAlign: 'right', fontSize: '10px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={profile?.gpuRenderer || ''}>
                            {profile?.gpuRenderer || 'Unknown'}
                        </span>
                    </div>

                    {/* Renderer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6 }}>⚙️ {language === 'RU' ? 'Рендерер:' : 'Renderer:'}</span>
                        <span style={{ fontWeight: 800, color: colors.accent }}>
                            {profile?.renderer && profile.renderer !== 'unknown' ? profile.renderer.toUpperCase() : 'WebGL2'}
                        </span>
                    </div>

                    {/* Refresh Rate */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6 }}>🔄 {language === 'RU' ? 'Экран:' : 'Screen:'}</span>
                        <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                            {profile?.refreshRate || 60}Hz
                        </span>
                    </div>

                    {/* FPS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6 }}>📈 {pt.fps}</span>
                        {(() => {
                            const displayFps = (activeScreen === 'BATTLE' && currentFps !== null)
                                ? currentFps
                                : (perfStats.fps > 0 ? Math.min(perfStats.fps, fpsCap) : 0);
                            return (
                                <span style={{ fontWeight: 800, color: displayFps >= 50 ? '#4caf50' : displayFps >= 30 ? '#ffeb3b' : displayFps > 0 ? '#f44336' : '#9e9e9e' }}>
                                    {displayFps > 0 ? `${displayFps} FPS` : '...'}
                                </span>
                            );
                        })()}
                    </div>

                    {/* Ping */}
                    {perfStats.ping !== null ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ opacity: 0.6 }}>📡 {pt.ping}</span>
                            <span style={{ fontWeight: 800, color: perfStats.ping < 100 ? '#4caf50' : perfStats.ping < 250 ? '#ffeb3b' : '#f44336' }}>
                                {perfStats.ping} ms
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ opacity: 0.6 }}>🔋 {language === 'RU' ? 'Качество:' : 'Quality:'}</span>
                            <span style={{ fontWeight: 800, color: graphicsQuality === 'ULTRA' ? '#4caf50' : graphicsQuality === 'MEDIUM' ? '#ffeb3b' : '#f44336' }}>
                                {graphicsQuality}
                            </span>
                        </div>
                    )}

                    {/* CPU Cores */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6 }}>🔲 {language === 'RU' ? 'Ядра CPU:' : 'CPU Cores:'}</span>
                        <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                            {profile?.cpuCores || 'Unknown'}
                        </span>
                    </div>

                    {/* System RAM */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6 }}>💾 {language === 'RU' ? 'Память ОЗУ:' : 'System RAM:'}</span>
                        <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                            {profile?.memory || 'Unknown'}
                        </span>
                    </div>
                </div>

                {/* JS Heap Memory Bar */}
                {perfStats.ramUsed !== null && perfStats.ramLimit !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ opacity: 0.6 }}>📦 {language === 'RU' ? 'Куча JS:' : 'JS Heap:'}</span>
                            <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                                {Math.round(perfStats.ramUsed / 1024 / 1024)} MB / {Math.round(perfStats.ramLimit / 1024 / 1024)} MB
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
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

                {/* Copy Report Button */}
                <button
                    onClick={async () => {
                        try {
                            const ramHeap = perfStats.ramUsed !== null ? `${Math.round(perfStats.ramUsed / 1024 / 1024)} MB` : 'Unknown';
                            const ramLimit = perfStats.ramLimit !== null ? `${Math.round(perfStats.ramLimit / 1024 / 1024)} MB` : 'Unknown';
                            const prof = profile || await getDeviceProfile();
                            const reportText = [
                                `=== Masters of the Wild Diagnostics ===`,
                                `Version: ${prof.gameVersion} (Build: ${prof.buildHash})`,
                                `Platform: ${prof.platform}`,
                                `Device: ${prof.device}`,
                                `OS: ${prof.os}`,
                                `Browser: ${prof.browser}`,
                                `GPU Vendor: ${prof.gpuVendor}`,
                                `GPU Renderer: ${prof.gpuRenderer}`,
                                `Renderer API: ${prof.renderer || 'unknown'} (WebGL: ${prof.webglVersion})`,
                                `Max Texture Size: ${prof.maxTextureSize}`,
                                `Shader Precision: ${prof.shaderPrecision}`,
                                `Refresh Rate: ${prof.refreshRate}Hz`,
                                `Screen: ${prof.screen}`,
                                `Average FPS: ${perfStats.fps > 0 ? perfStats.fps : 'Unknown'}`,
                                `Graphics Quality: ${graphicsQuality} (Auto-tune: ${!hasCustomSettings ? 'ON' : 'OFF'})`,
                                `UI Animations: ${useGameStore.getState().uiAnimations ? 'ON' : 'OFF'}`,
                                `Particles Quality: ${useGameStore.getState().particlesQuality}`,
                                `Glow Aura: ${useGameStore.getState().glowEnabled ? 'ON' : 'OFF'}`,
                                `Arena Background: ${useGameStore.getState().arenaBgQuality}`,
                                `Memory (JS Heap): ${ramHeap} / ${ramLimit}`,
                                `System RAM Estimate: ${prof.memory}`,
                                `CPU Cores: ${prof.cpuCores}`,
                                `VK WebView: ${prof.vkWebView ? 'Yes' : 'No'}`,
                                `Touch Device: ${prof.touchDevice ? 'Yes' : 'No'}`,
                                `Date: ${new Date().toISOString()}`,
                                `======================================`
                            ].join('\n');

                            await navigator.clipboard.writeText(reportText);
                            const alertMsg = language === 'RU'
                                ? 'Диагностический отчёт скопирован в буфер обмена!'
                                : 'Diagnostic report copied to clipboard!';
                            useGameStore.getState().showAlert(alertMsg);
                        } catch (err) {
                            console.error('Failed to copy report:', err);
                        }
                    }}
                    style={{
                        marginTop: '4px',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1.5px solid rgba(240,192,64,0.3)',
                        color: colors.accent,
                        fontFamily: "'Cinzel', serif",
                        fontSize: '10px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(240,192,64,0.08)';
                        e.currentTarget.style.borderColor = colors.accent;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'rgba(240,192,64,0.3)';
                    }}
                >
                    📋 {language === 'RU' ? 'СКОПИРОВАТЬ ОТЧЁТ' : 'COPY REPORT'}
                </button>
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
