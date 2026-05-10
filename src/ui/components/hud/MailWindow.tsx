import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';

interface MailWindowProps {
    onClose: () => void;
}

/**
 * MailWindow (v2.3) — Довлена поддержка ТЕМ.
 */
export const MailWindow: React.FC<MailWindowProps> = ({ onClose }) => {
    const { uiTheme } = useGameStore();
    const isLight = uiTheme === 'LIGHT';

    const [view, setView] = useState<'LIST' | 'READ' | 'WRITE'>('LIST');
    const [activeTab, setActiveTab] = useState<'INBOX' | 'NEWS' | 'ARCHIVE'>('INBOX');
    const [selectedMail, setSelectedMail] = useState<any>(null);

    const [mails, setMails] = useState([
        { id: 1, tab: 'INBOX', type: 'REWARD', from: 'SYSTEM', subject: 'НАГРАДА СЕЗОНА: S1', body: 'Поздравляем! Ваша награда ждет вас!', date: 'СЕГОДНЯ', reward: '500 ЗОЛОТА', expires: '3д', isRead: false, isStarred: false },
        { id: 2, tab: 'INBOX', type: 'MESSAGE', from: 'WILD_WOLF', subject: 'ВЫЗОВ НА ДУЭЛЬ', body: 'Жду тебя на Арене в 20:00!', date: 'ВЧЕРА', isRead: true, isStarred: true },
        { id: 3, tab: 'NEWS', type: 'SYSTEM', from: 'ADMIN', subject: 'ОБНОВЛЕНИЕ 1.0.5', body: 'Мы улучшили баланс способностей.', date: '2 ДНЯ НАЗАД', isRead: false, isStarred: false },
    ]);

    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        card: isLight ? 'rgba(0,0,0,0.05)' : 'linear-gradient(90deg, rgba(30,20,10,0.8), rgba(15,10,5,0.8))',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        input: isLight ? '#fff' : '#1a1008'
    };

    const deleteMail = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setMails(prev => prev.filter(m => m.id !== id));
    };

    const toggleStar = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setMails(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
    };

    const markAsRead = (id: number) => {
        setMails(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    };

    const getUnreadCount = (tab: string) => mails.filter(m => m.tab === tab && !m.isRead).length;

    const filteredMails = activeTab === 'ARCHIVE' 
        ? mails.filter(m => m.isStarred)
        : mails.filter(m => m.tab === activeTab);

    return (
        <div style={{
            width: '100%', height: '100%', backgroundColor: 'transparent', padding: '10px 30px',
            display: 'flex', flexDirection: 'column', color: colors.text, fontFamily: "'Nunito', sans-serif"
        }}>
            
            {/* ВКЛАДКИ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {view === 'LIST' ? (
                    <div style={{ display: 'flex', gap: 10 }}>
                        {['INBOX', 'NEWS', 'ARCHIVE'].map(tab => {
                            const unread = getUnreadCount(tab);
                            return (
                                <button key={tab} onClick={() => setActiveTab(tab as any)}
                                    style={{
                                        background: activeTab === tab ? (isLight ? '#8b4513' : '#3a2a15') : 'transparent',
                                        border: `1px solid ${activeTab === tab ? colors.accent : colors.border}`,
                                        color: activeTab === tab ? '#fff' : (isLight ? '#8b4513' : 'rgba(232, 216, 168, 0.4)'),
                                        padding: '8px 18px', borderRadius: 8, fontSize: 11, fontWeight: 800, 
                                        fontFamily: "'Cinzel', serif", cursor: 'pointer', position: 'relative'
                                    }}
                                >
                                    {tab === 'INBOX' ? 'ВХОДЯЩИЕ' : tab === 'NEWS' ? 'НОВОСТИ' : 'АРХИВ'}
                                    {unread > 0 && tab !== 'ARCHIVE' && (
                                        <div style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, background: '#ff4444', color: '#fff', fontSize: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                            {unread}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <button onClick={() => setView('LIST')} style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.accent, padding: '6px 15px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Cinzel', serif" }}>
                        ← НАЗАД
                    </button>
                )}
            </div>

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {view === 'LIST' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredMails.length > 0 ? filteredMails.map(m => (
                            <div key={m.id} onClick={() => { setSelectedMail(m); setView('READ'); markAsRead(m.id); }}
                                style={{
                                    background: colors.card, border: `1px solid ${m.isRead ? colors.border : colors.accent}`,
                                    borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 15, cursor: 'pointer', opacity: m.isRead ? 0.7 : 1
                                }}
                            >
                                <div style={{ fontSize: 20 }}>{m.type === 'REWARD' ? '🎁' : m.type === 'MESSAGE' ? '⚔️' : '⚙️'}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 900, color: colors.accent, marginBottom: 2 }}>
                                        <span>{m.from}</span>
                                        <span>{m.date}</span>
                                    </div>
                                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700 }}>{m.subject}</div>
                                </div>
                                <button onClick={(e) => toggleStar(m.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: m.isStarred ? colors.accent : 'rgba(0,0,0,0.1)' }}>
                                    {m.isStarred ? '★' : '☆'}
                                </button>
                                <button onClick={(e) => deleteMail(m.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.2 }}>🗑️</button>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.1 }}>📭 ПУСТО</div>
                        )}
                    </div>
                ) : view === 'READ' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div style={{ padding: '15px', background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                            <div style={{ fontSize: 10, color: colors.accent, fontWeight: 900 }}>ОТ: {selectedMail.from}</div>
                            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, margin: '5px 0' }}>{selectedMail.subject}</h2>
                        </div>
                        <div style={{ padding: '20px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)', borderRadius: 12, lineHeight: 1.6 }}>
                            {selectedMail.body}
                        </div>
                        {selectedMail.reward && (
                            <div style={{ padding: '15px', background: isLight ? 'rgba(139,69,19,0.1)' : 'rgba(240,192,64,0.1)', borderRadius: 12, border: `1px solid ${colors.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, color: colors.accent }}>🎁 {selectedMail.reward}</span>
                                <button style={{ padding: '8px 20px', background: colors.accent, border: 'none', borderRadius: 6, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>ЗАБРАТЬ</button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* НАПИСАНИЕ ПИСЬМА */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input type="text" placeholder="КОМУ..." style={{ padding: '10px 15px', background: colors.input, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, outline: 'none' }} />
                        <textarea placeholder="ВАШЕ СООБЩЕНИЕ..." style={{ height: 100, padding: '15px', background: colors.input, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, outline: 'none', resize: 'none' }} />
                        <button onClick={() => setView('LIST')} style={{ padding: '15px', background: isLight ? '#8b4513' : 'linear-gradient(180deg, #f0c040, #c87820)', border: 'none', borderRadius: 10, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>ОТПРАВИТЬ ПИСЬМО</button>
                    </div>
                )}
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ */}
            {view === 'LIST' && (
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                    <button onClick={() => setView('WRITE')} style={{ flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${colors.accent}`, borderRadius: 10, color: colors.accent, fontWeight: 800, cursor: 'pointer' }}>НАПИСАТЬ</button>
                    <button style={{ flex: 2, padding: '14px', background: isLight ? '#8b4513' : 'linear-gradient(180deg, #f0c040, #c87820)', border: 'none', borderRadius: 10, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>ЗАБРАТЬ ВСЁ</button>
                </div>
            )}
        </div>
    );
};
