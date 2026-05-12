import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { showInviteBox } from '../../../utils/VKBridge';
import { motion } from 'framer-motion';

interface FriendsWindowProps {
    onClose: () => void;
}

/**
 * FriendsWindow (v2.2) — Интеграция с VK и Стором.
 */
export const FriendsWindow: React.FC<FriendsWindowProps> = () => {
    const { uiTheme, friends, friendRequests, removeFriend, acceptFriendRequest, declineFriendRequest, sendGift, collectAllGifts } = useGameStore();
    const isLight = uiTheme === 'LIGHT';

    const [activeTab, setActiveTab] = useState<'ALL' | 'ONLINE' | 'REQUESTS'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Цветовая палитра темы
    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        cardBg: isLight ? 'rgba(0,0,0,0.05)' : 'linear-gradient(90deg, rgba(30,20,10,0.8), rgba(15,10,5,0.8))',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        inputBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)'
    };

    const filteredFriends = (activeTab === 'REQUESTS' ? friendRequests : friends).filter((f: any) => {
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: 15, top: 11, opacity: 0.4 }}>🔍</span>
                        <input 
                            type="text" placeholder="ПОИСК ПО ИМЕНИ ИЛИ ID..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 15px 12px 45px', background: colors.inputBg,
                                border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.text,
                                fontSize: 13, fontWeight: 700, outline: 'none'
                            }}
                        />
                    </div>
                    <button style={{ width: '48px', height: '48px', background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, cursor: 'pointer', fontSize: '20px' }}>➕</button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { id: 'ALL', label: 'ВСЕ', count: friends.length },
                        { id: 'ONLINE', label: 'В СЕТИ', count: friends.filter((f: any) => f.online).length },
                        { id: 'REQUESTS', label: 'ЗАПРОСЫ', count: friendRequests.length, badge: true }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                flex: 1, padding: '12px 0', borderRadius: 10, cursor: 'pointer', transition: '0.3s',
                                background: activeTab === tab.id ? colors.accent : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${activeTab === tab.id ? colors.accent : colors.border}`,
                                color: activeTab === tab.id ? '#000' : colors.text,
                                fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 900,
                                position: 'relative'
                            }}
                        >
                            {tab.label}
                            {tab.badge && tab.count > 0 && (
                                <motion.div 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{ position: 'absolute', top: -5, right: -5, background: '#ff4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '2px solid #1a1510' }}
                                >
                                    {tab.count}
                                </motion.div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* QUICK ACTIONS */}
            {activeTab !== 'REQUESTS' && friends.length > 0 && (
                <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={collectAllGifts}
                    style={{
                        marginBottom: 15, width: '100%', padding: '12px', background: 'linear-gradient(180deg, #f0c040, #c87820)',
                        border: 'none', borderRadius: 10, color: '#000', fontWeight: 900, cursor: 'pointer',
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 4px 15px rgba(240,192,64,0.2)'
                    }}
                >
                    🎁 Собрать и отправить всё
                </motion.button>
            )}

            {/* СПИСОК ДРУЗЕЙ */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredFriends.length > 0 ? filteredFriends.map((f: any) => (
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
                                <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {f.online ? (
                                        <span style={{ color: '#22c55e' }}>● В СЕТИ</span>
                                    ) : (
                                        <span>БЫЛ(А) {f.lastSeen || 'НЕДАВНО'}</span>
                                    )}
                                    • ID: {f.id}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {activeTab === 'REQUESTS' ? (
                                    <>
                                        <button 
                                            onClick={() => acceptFriendRequest(f.id)}
                                            style={{ width: 40, height: 40, background: '#22c55e', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#fff' }}
                                        >✓</button>
                                        <button 
                                            onClick={() => declineFriendRequest(f.id)}
                                            style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#ff4444' }}
                                        >×</button>
                                    </>
                                ) : (
                                    <>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            onClick={() => sendGift(f.id)}
                                            style={{
                                                width: 42, height: 42, background: f.giftSent ? 'rgba(255,255,255,0.05)' : 'rgba(240,192,64,0.1)', 
                                                border: `1px solid ${f.giftSent ? colors.border : colors.accent}`, borderRadius: 12, cursor: f.giftSent ? 'default' : 'pointer', fontSize: 20, color: f.giftSent ? 'rgba(255,255,255,0.2)' : colors.accent, opacity: f.giftSent ? 0.5 : 1
                                            }}
                                        >🎁</motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            style={{
                                                width: 42, height: 42, background: 'rgba(255,255,255,0.05)', 
                                                border: `1px solid ${colors.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 20, color: colors.text
                                            }}
                                        >⚔️</motion.button>
                                        <button 
                                            onClick={() => removeFriend(f.id)}
                                            style={{
                                                width: 42, height: 42, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ff4444', opacity: 0.4
                                            }}
                                        >🗑️</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(240,192,64,0.3))' }}
                            >
                                🤝
                            </motion.div>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: colors.accent, marginBottom: 10, letterSpacing: '1px' }}>ВАШИ СОЮЗНИКИ ЖДУТ</div>
                            <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 30, lineHeight: '1.6' }}>
                                Вместе выживать в дикой природе легче! <br/> Пригласите друзей и получайте бонусы.
                            </p>
                            <motion.button 
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => showInviteBox()}
                                style={{
                                    padding: '16px 40px', background: 'linear-gradient(180deg, #f0c040, #a88020)',
                                    border: 'none', borderRadius: 12, color: '#000', fontWeight: 900, cursor: 'pointer', 
                                    fontFamily: "'Cinzel', serif", fontSize: 14, boxShadow: '0 10px 20px rgba(240,192,64,0.3)'
                                }}
                            >
                                ПРИГЛАСИТЬ ДРУЗЕЙ
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
