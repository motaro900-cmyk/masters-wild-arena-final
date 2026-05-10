import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';

interface FriendsWindowProps {
    onClose: () => void;
}

/**
 * FriendsWindow (v2.1) — Добавлена поддержка ТЕМ.
 */
export const FriendsWindow: React.FC<FriendsWindowProps> = ({ onClose }) => {
    const { uiTheme } = useGameStore();
    const isLight = uiTheme === 'LIGHT';

    const [activeTab, setActiveTab] = useState<'ALL' | 'ONLINE' | 'REQUESTS'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const friends = [
        { id: '1024', name: 'WILD_WOLF', level: 12, online: true, avatar: 'панда.png' },
        { id: '2048', name: 'BEAR_KING', level: 8, online: false, avatar: 'панда.png' },
        { id: '3072', name: 'NIGHT_PANTHER', level: 15, online: true, avatar: 'панда.png' },
        { id: '4096', name: 'FOREST_SHAMAN', level: 22, online: true, avatar: 'панда.png' },
        { id: '5120', name: 'IRON_CLAW', level: 5, online: false, avatar: 'панда.png' },
    ];

    // Цветовая палитра темы
    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        cardBg: isLight ? 'rgba(0,0,0,0.05)' : 'linear-gradient(90deg, rgba(30,20,10,0.8), rgba(15,10,5,0.8))',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        inputBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)'
    };

    const filteredFriends = friends.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.id.includes(searchQuery);
        if (activeTab === 'ONLINE') return matchesSearch && f.online;
        return matchesSearch;
    });

    return (
        <div style={{
            width: '100%', height: '100%', backgroundColor: 'transparent',
            padding: '10px 0', display: 'flex', flexDirection: 'column', color: colors.text, fontFamily: "'Nunito', sans-serif"
        }}>
            
            {/* ПОИСК И ВКЛАДКИ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: 25 }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 15, top: 11, opacity: 0.4 }}>🔍</span>
                    <input 
                        type="text" placeholder="ПОИСК ПО ИМЕНИ ИЛИ ID..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 15px 12px 45px', background: colors.inputBg,
                            border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.text,
                            fontSize: 13, fontWeight: 700, outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    {['ALL', 'ONLINE', 'REQUESTS'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', transition: '0.3s',
                                background: activeTab === tab ? (isLight ? '#8b4513' : '#3a2a15') : 'transparent',
                                border: `1px solid ${activeTab === tab ? colors.accent : colors.border}`,
                                color: activeTab === tab ? '#fff' : (isLight ? '#8b4513' : 'rgba(232, 216, 168, 0.4)'),
                                fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 900
                            }}
                        >
                            {tab === 'ALL' ? 'ВСЕ' : tab === 'ONLINE' ? 'В СЕТИ' : 'ЗАПРОСЫ'}
                        </button>
                    ))}
                </div>
            </div>

            {/* СПИСОК ДРУЗЕЙ */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredFriends.length > 0 ? filteredFriends.map(f => (
                        <div key={f.id}
                            style={{
                                background: colors.cardBg, border: `1px solid ${colors.border}`,
                                borderRadius: 12, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 15, transition: '0.2s'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{ 
                                    width: 55, height: 55, background: isLight ? '#d2b48c' : '#1a1008', borderRadius: 10,
                                    border: `2px solid ${colors.border}`, overflow: 'hidden', padding: 2
                                }}>
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: 6, overflow: 'hidden',
                                        backgroundImage: `url(${resolveAssetPath(`/assets/images/avatars/${f.avatar}`)})`,
                                        backgroundSize: 'cover', backgroundPosition: 'center'
                                    }} />
                                </div>
                                {f.online && (
                                    <div style={{
                                        position: 'absolute', bottom: -2, right: -2, width: 14, height: 14,
                                        background: '#22c55e', borderRadius: '50%', border: `2px solid ${isLight ? '#f5e6c8' : '#0f0a05'}`,
                                        boxShadow: '0 0 10px rgba(34,197,94,0.5)'
                                    }} />
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: isLight ? '#5d4037' : '#fff' }}>{f.name}</span>
                                    <span style={{ 
                                        fontSize: 9, fontWeight: 900, background: isLight ? 'rgba(139,69,19,0.1)' : 'rgba(240,192,64,0.1)', 
                                        color: colors.accent, padding: '2px 6px', borderRadius: 4, border: `1px solid ${colors.border}` 
                                    }}>
                                        LVL {f.level}
                                    </span>
                                </div>
                                <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 700 }}>ID: {f.id} • {f.online ? 'В СЕТИ' : 'БЫЛ НЕДАВНО'}</div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{
                                    width: 40, height: 40, background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(240,192,64,0.1)', 
                                    border: `1px solid ${colors.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 18, color: colors.accent
                                }}>⚔️</button>
                                <button style={{
                                    width: 40, height: 40, background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
                                    border: `1px solid ${colors.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 18, color: colors.text
                                }}>💬</button>
                                <button style={{
                                    width: 40, height: 40, background: isLight ? 'rgba(255,0,0,0.05)' : 'rgba(255,68,68,0.05)', 
                                    border: `1px solid ${isLight ? 'rgba(255,0,0,0.1)' : 'rgba(255,68,68,0.1)'}`, borderRadius: 8, cursor: 'pointer', fontSize: 16, color: '#ff4444'
                                }}>🗑️</button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.2 }}>👥 ПУСТО</div>
                    )}
                </div>
            </div>

            <button 
                onClick={onClose}
                style={{
                    marginTop: 20, width: '100%', padding: '16px 0', background: isLight ? '#8b4513' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: '12px', color: isLight ? '#fff' : 'rgba(232, 216, 168, 0.5)',
                    fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 800, cursor: 'pointer'
                }}
            >
                ЗАКРЫТЬ
            </button>
        </div>
    );
};
