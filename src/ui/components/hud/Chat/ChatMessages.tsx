import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessagesProps {
    filteredMessages: any[];
    activeChatTab: 'all' | 'system' | 'clan' | 'private';
    scrollRef: any;
    handleScroll: () => void;
    hasNewMessages: boolean;
    setHasNewMessages: (val: boolean) => void;
    openContextMenu: (e: React.MouseEvent, author: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    filteredMessages,
    activeChatTab,
    scrollRef,
    handleScroll,
    hasNewMessages,
    setHasNewMessages,
    openContextMenu,
}) => {
    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const formatMessageText = (text: string) => {
        if (text.startsWith('/w ')) {
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

            {filteredMessages.length === 0 && activeChatTab === 'private' && (
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
                        ВЫБЕРИТЕ ИГРОКА
                        <br />
                        ЧТОБЫ НАЧАТЬ ДИАЛОГ
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
                                    textShadow:
                                        msg.author === 'ГЕРОЛЬД' ? '0 0 8px rgba(240, 192, 64, 0.6)' : 'none',
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
                                        msg.rankIcon.includes('rank_')
                                            ? msg.rankIcon
                                            : `/assets/images/ui/rank_01.png`
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
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '2px',
                                    }}
                                >
                                    <img
                                        src="/assets/images/ui/vip.webp"
                                        alt="VIP"
                                        style={{
                                            width: 38,
                                            height: 'auto',
                                            filter: 'drop-shadow(0 0 10px rgba(255, 51, 0, 0.9))',
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            fontFamily: "'Cinzel', serif",
                                            textShadow: '0 0 3px #000',
                                            marginTop: '-1px',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        VIP
                                    </span>
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
                                onClick={(e) => msg.type !== 'system' && openContextMenu(e, msg.author)}
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
                                    fontFamily: "'Cinzel', serif",
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
                                    fontWeight: msg.author === 'Motaro' ? 500 : 400,
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
