import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { requestNotifications } from '../../../utils/VKBridge';
import { settingsTranslations } from './SettingsLocalization';

interface AdvancedSettingsBlockProps {
    isFullscreen: boolean;
    handleFullscreenToggle: () => void;
}

// Utility to get GPU renderer name
const getGPUInfo = (): string | null => {
    if (typeof document === 'undefined') return null;
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (renderer) {
                    let clean = renderer;
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
                    return clean;
                }
            }
        }
    } catch (e) {
        // ignore
    }
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
                        gap: '8px',
                    }}
                >
                    <span>📊</span>
                    <span>{pt.title}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    {/* FPS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>📈 {pt.fps}</span>
                        <span style={{ fontWeight: 800, color: perfStats.fps >= 50 ? '#4caf50' : perfStats.fps >= 30 ? '#ffeb3b' : perfStats.fps > 0 ? '#f44336' : '#9e9e9e' }}>
                            {perfStats.fps > 0 ? `${perfStats.fps} FPS` : '...'}
                        </span>
                    </div>

                    {/* Power saving / FPS cap indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>🔋 {language === 'RU' ? 'Лимит FPS:' : 'FPS Cap:'}</span>
                        <span style={{ fontWeight: 800, color: isPowerSaving ? '#ffeb3b' : '#4caf50' }}>
                            {isPowerSaving ? '30 FPS' : '60 FPS'}
                        </span>
                    </div>

                    {/* Ping */}
                    {perfStats.ping !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>📡 {pt.ping}</span>
                            <span style={{ fontWeight: 800, color: perfStats.ping < 100 ? '#4caf50' : perfStats.ping < 250 ? '#ffeb3b' : '#f44336' }}>
                                {perfStats.ping} ms
                            </span>
                        </div>
                    )}

                    {/* CPU Cores */}
                    {cores && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>⚙️ {pt.cpu}</span>
                            <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                                {cores} {language === 'RU' ? 'ядер' : 'Cores'}
                            </span>
                        </div>
                    )}

                    {/* System RAM */}
                    {memoryGb && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>💾 {pt.ramSys}</span>
                            <span style={{ fontWeight: 800, color: '#e0e0e0' }}>
                                ~{memoryGb} GB
                            </span>
                        </div>
                    )}

                    {/* OS / Browser */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>💻 {pt.os}</span>
                        <span style={{ fontWeight: 800, color: '#b0b0b0', textAlign: 'right' }}>
                            {getOSAndBrowser()}
                        </span>
                    </div>

                    {/* Graphics Quality */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>🎨 {language === 'RU' ? 'Качество графики:' : 'Graphics Quality:'}</span>
                        <span style={{ fontWeight: 800, color: graphicsQuality === 'ULTRA' ? '#4caf50' : graphicsQuality === 'MEDIUM' ? '#ffeb3b' : '#f44336' }}>
                            {graphicsQuality === 'ULTRA' ? (language === 'RU' ? 'УЛЬТРА' : 'ULTRA') : graphicsQuality === 'MEDIUM' ? (language === 'RU' ? 'СРЕДНЕЕ' : 'MEDIUM') : (language === 'RU' ? 'НИЗКОЕ' : 'LOW')}
                        </span>
                    </div>

                    {/* GPU Details */}
                    {getGPUInfo() && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                            <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>🎮 {pt.gpu}</span>
                            <span style={{ fontWeight: 800, color: '#b0b0b0', textAlign: 'right', fontSize: '10px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={getGPUInfo() || ''}>
                                {getGPUInfo()}
                            </span>
                        </div>
                    )}

                    {/* Device Tier */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gridColumn: 'span 2' }}>
                        <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ {pt.hardware}</span>
                        <span style={{ fontWeight: 800, color: gpuTier.includes('High') ? '#4caf50' : gpuTier.includes('Mid') ? '#ffeb3b' : '#f44336' }}>
                            {gpuTier}
                        </span>
                    </div>
                </div>

                {/* JS Heap Memory Bar */}
                {perfStats.ramUsed !== null && perfStats.ramLimit !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>🔲 {pt.ramHeap}</span>
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
