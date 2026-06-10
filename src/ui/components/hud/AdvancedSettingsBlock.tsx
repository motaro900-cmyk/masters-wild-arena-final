import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { requestNotifications } from '../../../utils/VKBridge';
import { settingsTranslations } from './SettingsLocalization';

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
    } = useGameStore();

    const t = settingsTranslations[(language || 'RU') as 'RU' | 'EN'] || settingsTranslations.RU;

    const colors = {
        accent: '#f0c040',
        border: 'rgba(240,192,64,0.15)',
        bgCard: 'rgba(255,255,255,0.02)',
    };

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
