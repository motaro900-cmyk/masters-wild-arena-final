import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';

interface SettingsWindowProps {
    onClose: () => void;
}

/**
 * SettingsWindow (v2.3) — Добавлены красивые ЭМОДЗИ для навигации.
 */
export const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose }) => {
    const { 
        uiTheme, setUiTheme, 
        showFps, setShowFps,
        musicVolume: globalMusic, setMusicVolume,
        soundVolume: globalSound, setSoundVolume,
        graphicsQuality: globalGraphics, setGraphicsQuality,
        notificationsEnabled: globalNotifications, setNotificationsEnabled
    } = useGameStore();
    
    // ЛОКАЛЬНОЕ СОСТОЯНИЕ (изменяется внутри окна, применяется при Apply)
    const [localTheme, setLocalTheme] = useState(uiTheme);
    const [localShowFps, setLocalShowFps] = useState(showFps);
    const [localMusic, setLocalMusic] = useState(globalMusic);
    const [localSound, setLocalSound] = useState(globalSound);
    const [localGraphics, setLocalGraphics] = useState(globalGraphics);
    const [localNotifications, setLocalNotifications] = useState(globalNotifications);

    const isLight = localTheme === 'LIGHT';

    const handleApply = () => {
        setUiTheme(localTheme);
        setShowFps(localShowFps);
        setMusicVolume(localMusic);
        setSoundVolume(localSound);
        setGraphicsQuality(localGraphics);
        setNotificationsEnabled(localNotifications);
        onClose();
    };

    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        card: isLight ? 'rgba(0,0,0,0.05)' : '#1a1008',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.2)'
    };

    return (
        <div style={{
            width: '100%', height: '100%', backgroundColor: 'transparent',
            padding: '10px 40px', display: 'flex', flexDirection: 'column', gap: '25px',
            color: colors.text, fontFamily: "'Nunito', sans-serif"
        }}>
            
            {/* ТЕМА ИНТЕРФЕЙСА */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🌓</span>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: colors.accent, letterSpacing: '2px', margin: 0 }}>
                        ТЕМА ИНТЕРФЕЙСА
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {[
                        { id: 'DARK', label: 'ТЁМНАЯ', icon: '🌑' },
                        { id: 'LIGHT', label: 'СВЕТЛАЯ', icon: '☀️' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setLocalTheme(t.id as any)}
                            style={{
                                flex: 1, padding: '12px 0', borderRadius: 8, cursor: 'pointer', transition: '0.3s',
                                background: localTheme === t.id ? (isLight ? '#8b4513' : '#3a2a15') : 'transparent',
                                border: `1px solid ${localTheme === t.id ? colors.accent : colors.border}`,
                                color: localTheme === t.id ? '#fff' : (isLight ? '#8b4513' : 'rgba(232, 216, 168, 0.4)'),
                                fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ЗВУК */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🔊</span>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: colors.accent, letterSpacing: '2px', margin: 0 }}>
                        АУДИО-ПАРАМЕТРЫ
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'МУЗЫКАЛЬНЫЙ ФОН', val: localMusic, set: setLocalMusic },
                        { label: 'ЗВУКОВЫЕ ЭФФЕКТЫ', val: localSound, set: setLocalSound }
                    ].map(s => (
                        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 12 }}>
                                <span style={{ opacity: 0.7 }}>{s.label}</span>
                                <span style={{ color: colors.accent }}>{s.val}%</span>
                            </div>
                            <div style={{ position: 'relative', height: 8, background: colors.card, borderRadius: 4, border: `1px solid ${colors.border}` }}>
                                <div style={{ width: `${s.val}%`, height: '100%', background: isLight ? '#8b4513' : 'linear-gradient(90deg, #8a5a10, #f0c040)', borderRadius: 3 }} />
                                <input type="range" min="0" max="100" value={s.val} onChange={(e) => s.set(parseInt(e.target.value))}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* УВЕДОМЛЕНИЯ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🔔</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: colors.accent, fontWeight: 700 }}>PUSH-ОПОВЕЩЕНИЯ</span>
                </div>
                <div 
                    onClick={() => setLocalNotifications(!localNotifications)}
                    style={{
                        width: 50, height: 24, borderRadius: 12, background: localNotifications ? colors.accent : colors.card,
                        position: 'relative', cursor: 'pointer', transition: '0.3s', border: `1px solid ${colors.border}`
                    }}
                >
                    <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: localNotifications ? (isLight ? '#fff' : '#1a0f00') : (isLight ? '#8b4513' : '#3a2a15'),
                        position: 'absolute', top: 2, left: localNotifications ? 28 : 3, transition: '0.3s'
                    }} />
                </div>
            </div>

            {/* СЧЕТЧИК FPS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📈</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: colors.accent, fontWeight: 700 }}>ОТОБРАЖАТЬ FPS</span>
                </div>
                <div 
                    onClick={() => setLocalShowFps(!localShowFps)}
                    style={{
                        width: 50, height: 24, borderRadius: 12, background: localShowFps ? colors.accent : colors.card,
                        position: 'relative', cursor: 'pointer', transition: '0.3s', border: `1px solid ${colors.border}`
                    }}
                >
                    <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: localShowFps ? (isLight ? '#fff' : '#1a0f00') : (isLight ? '#8b4513' : '#3a2a15'),
                        position: 'absolute', top: 2, left: localShowFps ? 28 : 3, transition: '0.3s'
                    }} />
                </div>
            </div>

            {/* ГРАФИКА */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>👁️</span>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: colors.accent, letterSpacing: '2px', margin: 0 }}>
                        КАЧЕСТВО ГРАФИКИ
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {['LOW', 'MEDIUM', 'ULTRA'].map(g => (
                        <button key={g} onClick={() => setLocalGraphics(g)}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', transition: '0.3s',
                                background: localGraphics === g ? (isLight ? '#8b4513' : '#3a2a15') : 'transparent',
                                border: `1px solid ${localGraphics === g ? colors.accent : colors.border}`,
                                color: localGraphics === g ? '#fff' : (isLight ? '#8b4513' : 'rgba(232, 216, 168, 0.4)'),
                                fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 900
                            }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* КНОПКА ПРИМЕНИТЬ И ВК */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 15 }}>
                <button 
                    onClick={() => window.open('https://vk.com/beasts_arena', '_blank')}
                    style={{
                        width: '100%', padding: '12px 0', borderRadius: '10px', color: '#fff',
                        background: '#0077FF', border: 'none', fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 900,
                        letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 4px 15px rgba(0,119,255,0.3)'
                    }}
                >
                    <span style={{ fontSize: 20 }}>🌐</span> МЫ ВКОНТАКТЕ
                </button>

                <button 
                    onClick={handleApply}
                    style={{
                        width: '100%', padding: '18px 0', borderRadius: '12px', color: isLight ? '#fff' : '#1a0f00',
                        background: isLight ? '#8b4513' : 'linear-gradient(180deg, #f0c040 0%, #c87820 100%)',
                        border: 'none', fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 900,
                        letterSpacing: '3px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    ПРИМЕНИТЬ
                </button>
            </div>
        </div>
    );
};
