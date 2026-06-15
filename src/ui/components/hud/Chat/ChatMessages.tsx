import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';

interface ChatMessagesProps {
    filteredMessages: any[];
    activeChatTab: 'all' | 'system' | 'clan' | 'private';
    scrollRef: any;
    handleScroll: () => void;
    hasNewMessages: boolean;
    setHasNewMessages: (val: boolean) => void;
    openContextMenu: (e: React.MouseEvent, author: string, text?: string, timestamp?: number, senderId?: string) => void;
    privateRecipient: string | null;
    setPrivateRecipient: (recipient: string | null) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    filteredMessages,
    activeChatTab,
    scrollRef,
    handleScroll,
    hasNewMessages,
    setHasNewMessages,
    openContextMenu,
    privateRecipient,
    setPrivateRecipient,
}) => {
    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const formatMessageText = (text: string) => {
        if (text.startsWith('/w ')) {
            if (text.includes(':')) {
                return text.substring(text.indexOf(':') + 1).trim();
            }
            return text.replace(/^\/w\s+\S+\s+/, '');
        }
        return text;
    };

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="custom-scrollbar"
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 15px',
                scrollBehavior: 'smooth',
                maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                zIndex: 2,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            {/* ПЛАШКА "НОВЫЕ СООБЩЕНИЯ" */}
            <AnimatePresence>
                {hasNewMessages && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={() => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                                setHasNewMessages(false);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(240, 192, 64, 0.9)',
                            color: '#000',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        НОВЫЕ СООБЩЕНИЯ ↓
                    </motion.div>
                )}
            </AnimatePresence>

            {activeChatTab === 'private' &&
                !privateRecipient &&
                (() => {
                    const { privateMessages, name: myName } = useGameStore.getState();
                    const getPartnerName = (msg: any, nameOfMe: string) => {
                        if (msg.author && msg.author !== nameOfMe && msg.author !== 'СИСТЕМА') {
                            return msg.author;
                        }
                        if (msg.recipientName) {
                            return msg.recipientName;
                        }
                        // Fallback parser for '/w Name text'
                        if (msg.text && msg.text.startsWith('/w ')) {
                            const colonMatch = msg.text.match(/^\/w\s+([^:]+?)\s*:/i);
                            if (colonMatch) return colonMatch[1].trim();
                            const spaceMatch = msg.text.match(/^\/w\s+(\S+)/i);
                            if (spaceMatch) return spaceMatch[1].trim();
                        }
                        return null;
                    };

                    const partnersMap = new Map<string, { lastText: string; timestamp: number; avatar: string }>();
                    privateMessages.forEach((msg: any) => {
                        const partner = getPartnerName(msg, myName || 'Мастер');
                        if (partner && partner !== (myName || 'Мастер')) {
                            const existing = partnersMap.get(partner);
                            if (!existing || existing.timestamp < msg.timestamp) {
                                partnersMap.set(partner, {
                                    lastText: msg.text,
                                    timestamp: msg.timestamp,
                                    avatar: msg.avatar || '/assets/images/avatars/panda.webp',
                                });
                            }
                        }
                    });

                    const partners = Array.from(partnersMap.entries())
                        .map(([name, data]) => ({
                            name,
                            ...data,
                        }))
                        .sort((a, b) => b.timestamp - a.timestamp);

                    if (partners.length === 0) {
                        return (
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.3,
                                    gap: '15px',
                                    marginTop: '40px',
                                }}
                            >
                                <span style={{ fontSize: '40px' }}>💬</span>
                                <span
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        fontFamily: "'Cinzel', serif",
                                        textAlign: 'center',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    НЕТ АКТИВНЫХ ДИАЛОГОВ
                                    <br />
                                    ОТПРАВЬТЕ СООБЩЕНИЕ /w ИМЯ
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {partners.map((partner) => (
                                <motion.div
                                    key={partner.name}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPrivateRecipient(partner.name)}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(240, 192, 64, 0.15)',
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.15)';
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            border: '1px solid rgba(240, 192, 64, 0.4)',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <img
                                            src={partner.avatar}
                                            alt="avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                color: '#f0c040',
                                                fontWeight: 800,
                                                fontSize: '13px',
                                                fontFamily: "'Cinzel', serif",
                                                marginBottom: '2px',
                                            }}
                                        >
                                            {partner.name}
                                        </div>
                                        <div
                                            style={{
                                                color: '#a8a8a8',
                                                fontSize: '11px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {formatMessageText(partner.lastText)}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '9px',
                                            color: 'rgba(255,255,255,0.3)',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {formatTime(partner.timestamp)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    );
                })()}

            {filteredMessages.length === 0 && activeChatTab === 'private' && privateRecipient && (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.3,
                        gap: '15px',
                        marginTop: '40px',
                    }}
                >
                    <span style={{ fontSize: '40px' }}>💬</span>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            fontFamily: "'Cinzel', serif",
                            textAlign: 'center',
                            letterSpacing: '1px',
                        }}
                    >
                        ИСТОРИЯ ДИАЛОГА ПУСТА
                        <br />
                        НАПИШИТЕ СООБЩЕНИЕ НИЖЕ
                    </span>
                </div>
            )}

            {filteredMessages.map((msg: any) => (
                <div
                    key={msg.id}
                    style={{
                        margin: '0 0 12px 0',
                        fontSize: 15,
                        lineHeight: '1.4',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                >
                    {msg.type === 'system' ? (
                        <div
                            style={{
                                color: '#f0c040',
                                fontWeight: 700,
                                fontStyle: 'italic',
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                opacity: 0.9,
                                padding: '6px 12px',
                                background: 'rgba(240, 192, 64, 0.05)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #f0c040',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>
                                {msg.author === 'ГЕРОЛЬД' ? '🎺' : msg.author === 'КОДЕКС ЧЕСТИ' ? '📜' : '🛡️'}
                            </span>
                            <span
                                style={{
                                    color: msg.author === 'ГЕРОЛЬД' ? '#fff9e6' : 'inherit',
                                    textShadow: msg.author === 'ГЕРОЛЬД' ? '0 0 8px rgba(240, 192, 64, 0.6)' : 'none',
                                    fontSize: msg.author === 'ГЕРОЛЬД' ? '15px' : '14px',
                                    fontWeight: 900,
                                }}
                            >
                                [{msg.author}]: {msg.text}
                            </span>
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: '9px',
                                    opacity: 0.5,
                                    fontFamily: 'monospace',
                                }}
                            >
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                                background:
                                    msg.author === 'ГЕРОЛЬД'
                                        ? 'linear-gradient(90deg, rgba(240, 192, 64, 0.2), transparent)'
                                        : 'transparent',
                                padding: msg.author === 'ГЕРОЛЬД' ? '8px' : '0',
                                borderRadius: '4px',
                                border: msg.author === 'ГЕРОЛЬД' ? '1px solid rgba(240, 192, 64, 0.3)' : 'none',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '9px',
                                    color: 'rgba(255,255,255,0.3)',
                                    fontFamily: 'monospace',
                                    minWidth: '35px',
                                }}
                            >
                                {formatTime(msg.timestamp)}
                            </span>

                            {msg.avatar && (
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: '1px solid rgba(240, 192, 64, 0.4)',
                                        overflow: 'hidden',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                        background: '#333',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={msg.avatar}
                                        alt="avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}

                            {msg.rankIcon && (
                                <img
                                    src={
                                        msg.rankIcon.includes('rank_') ? msg.rankIcon : `/assets/images/ui/rank_01.png`
                                    }
                                    alt="rank"
                                    style={{
                                        width: 32,
                                        height: 32,
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 0 5px rgba(0, 242, 255, 0.4))',
                                    }}
                                />
                            )}

                            {msg.vipLevel > 0 && (
                                <div
                                    style={{
                                        backgroundImage: 'url(/assets/images/ui/vip.webp)',
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'center',
                                        width: '45px',
                                        height: '18px',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', 'Philosopher', serif",
                                        fontSize: '9px',
                                        letterSpacing: '0.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '2px',
                                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    VIP
                                </div>
                            )}

                            <span
                                style={{
                                    color: '#f0c040',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(240, 192, 64, 0.3)',
                                    fontFamily: "'Cinzel', serif",
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {msg.level || 1} LVL
                            </span>

                            <span
                                className={msg.isTop1 ? 'leader-glow' : ''}
                                onClick={(e) => msg.type !== 'system' && openContextMenu(e, msg.author, msg.text, msg.timestamp, msg.senderId)}
                                style={{
                                    color: msg.isTop1 ? '#ff3300' : msg.vipLevel > 0 ? '#f0c040' : '#d1d1d1',
                                    fontWeight: 900,
                                    whiteSpace: 'nowrap',
                                    textShadow: msg.isTop1
                                        ? '0 0 12px rgba(255, 51, 0, 0.6)'
                                        : msg.vipLevel > 0
                                          ? '0 0 8px rgba(240, 192, 64, 0.4)'
                                          : '0 1px 2px rgba(0,0,0,0.5)',
                                    letterSpacing: '0.5px',
                                    fontFamily: "'Philosopher', 'Inter', sans-serif",
                                    cursor: msg.type !== 'system' ? 'pointer' : 'default',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (msg.type !== 'system')
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                {(msg.author || 'Мастер').split(' ')[0]}:
                            </span>

                            <span
                                style={{
                                    color: msg.author === 'Motaro' ? '#fff' : '#e8d8a8',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                    wordBreak: 'break-word',
                                    fontWeight: msg.author === 'Motaro' ? 700 : 500,
                                    fontFamily: "'Philosopher', 'Inter', sans-serif",
                                }}
                            >
                                {formatMessageText(msg.text)}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
