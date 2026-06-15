import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { db } from '../../../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useGraphicsConfig } from '../../hooks/useGraphicsConfig';

// Subcomponents
import { ChatMessages } from './Chat/ChatMessages';
import { ChatEmojiMenu } from './Chat/ChatEmojiMenu';
import { ChatInputArea } from './Chat/ChatInputArea';
import { ChatContextMenu } from './Chat/ChatContextMenu';

export const ChatPanel = React.memo(() => {
    const gfx = useGraphicsConfig();
    const [isOpen, setIsOpen] = useState(true);
    const [inputText, setInputText] = useState('');
    const messages = useGameStore((state) => state.messages);
    const privateMessages = useGameStore((state) => state.privateMessages);
    const clanMessages = useGameStore((state) => state.clanMessages);
    const addMessage = useGameStore((state) => state.addMessage);
    const name = useGameStore((state) => state.name);
    const clanId = useGameStore((state) => state.clanId);
    const [showEmoji, setShowEmoji] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [activeChatTab, setActiveChatTab] = useState<'all' | 'system' | 'clan' | 'private'>('all');
    const [privateRecipient, setPrivateRecipient] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        author: string | null;
        messageText?: string;
        messageTimestamp?: number;
        senderId?: string | null;
    }>({
        visible: false,
        x: 0,
        y: 0,
        author: null,
        senderId: null,
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [lastSendTime, setLastSendTime] = useState<number>(0);
    const [cooldownLeft, setCooldownLeft] = useState<number>(0);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldownLeft <= 0) return;
        const timer = setInterval(() => {
            setCooldownLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownLeft]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
        if (isAtBottom) {
            setHasNewMessages(false);
        }
    };

    const filteredMessages = (
        activeChatTab === 'private' ? privateMessages : activeChatTab === 'clan' ? clanMessages : messages
    ).filter((msg: any) => {
        if (
            (msg.author === 'Мастер' || msg.author === 'Motar') &&
            (msg.text.trim() === '👏' || msg.text.trim() === '👋')
        ) {
            return false;
        }

        // Фильтруем приветственные локальные сообщения, если они уже были показаны в этой сессии
        const sessionKey = 'session_welcome_seen';
        const sessionSeen = sessionStorage.getItem(sessionKey);
        if (sessionSeen && (msg.id === 'welcome-1' || msg.id === 'codex-1')) {
            return false;
        }

        if (activeChatTab === 'all') return msg.type !== 'private' && msg.type !== 'personal' && msg.type !== 'clan';
        if (activeChatTab === 'system') return msg.type === 'system';
        if (activeChatTab === 'clan') return msg.type === 'clan' && msg.clanId === clanId;
        if (activeChatTab === 'private') {
            if (privateRecipient) {
                const myName = name || 'Мастер';
                return (
                    (msg.type === 'private' || msg.type === 'personal') &&
                    ((msg.author === privateRecipient && msg.recipientId === useGameStore.getState().playerId) ||
                        (msg.author === myName &&
                            (msg.text.startsWith(`/w ${privateRecipient} `) ||
                                msg.text.startsWith(`/w ${privateRecipient}:`))))
                );
            }
            return false;
        }
        return true;
    });

    useEffect(() => {
        // Устанавливаем флаг сессии после первого отображения сообщений
        const hasWelcome = filteredMessages.some((msg: any) => msg.id === 'welcome-1' || msg.id === 'codex-1');
        if (hasWelcome) {
            sessionStorage.setItem('session_welcome_seen', 'true');
        }
    }, [filteredMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const wasAtBottom = scrollHeight - scrollTop - clientHeight < 120;

            if (wasAtBottom || messages.length <= 2) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                setHasNewMessages(false);
            } else {
                setHasNewMessages(true);
            }
        }
    }, [messages, isOpen]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        // Anti-spam cooldown check (2 seconds)
        const now = Date.now();
        if (now - lastSendTime < 2000) {
            const remaining = Math.ceil((2000 - (now - lastSendTime)) / 1000);
            setCooldownLeft(remaining);
            useGameStore.getState().showAlert(`Подождите еще ${remaining} сек. перед отправкой!`);
            return;
        }

        const userName = name || 'Мастер';
        let finalType = 'common';
        let finalText = inputText;

        if (activeChatTab === 'private' && privateRecipient) {
            finalType = 'private';
            finalText = `/w ${privateRecipient} ${inputText}`;
        } else if (activeChatTab === 'clan') {
            finalType = 'clan';
        } else if (activeChatTab === 'system') {
            finalType = 'system';
        }

        addMessage(finalText, userName, finalType);
        useGameStore.getState().updateQuestProgress('SEND_CHAT', 1);
        setLastSendTime(now);
        setCooldownLeft(2);
        setInputText('');
        setShowEmoji(false);
    };

    const addEmoji = (emoji: string) => {
        setInputText((prev) => prev + emoji);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const openContextMenu = (e: React.MouseEvent, author: string, text?: string, timestamp?: number, senderId?: string) => {
        e.preventDefault();

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            author,
            messageText: text,
            messageTimestamp: timestamp,
            senderId,
        });
    };

    const handleMenuAction = (type: string, author: string | null, senderId?: string | null) => {
        switch (type) {
            case 'profile': {
                const setInspectId = useGameStore.getState().setInspectPlayerId;
                const setInspectName = useGameStore.getState().setInspectPlayerName;
                if (senderId && setInspectId) {
                    setInspectId(senderId);
                } else if (author && setInspectName) {
                    setInspectName(author);
                }
                break;
            }
            case 'pm':
                setActiveChatTab('private');
                setPrivateRecipient(author);
                setInputText('');
                setTimeout(() => inputRef.current?.focus(), 50);
                break;
            case 'copy':
                navigator.clipboard.writeText(author || '');
                break;
            case 'report':
                if (author) {
                    const reportMessage = async () => {
                        try {
                            const reporterId = useGameStore.getState().playerId || 'unknown';
                            const reporterName = useGameStore.getState().name || 'Мастер';
                            await addDoc(collection(db, 'reports'), {
                                reportedUser: author,
                                messageText: contextMenu.messageText || '',
                                messageTimestamp: contextMenu.messageTimestamp || 0,
                                reporterId,
                                reporterName,
                                timestamp: serverTimestamp(),
                                status: 'pending',
                            });
                            useGameStore.getState().showAlert('Жалоба принята. Модерация рассмотрит её в течение 48 часов.');
                        } catch (error) {
                            console.error('Failed to send report:', error);
                            useGameStore.getState().showAlert('Не удалось отправить жалобу. Попробуйте позже.');
                        }
                    };
                    reportMessage();
                }
                break;
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setContextMenu((prev) => ({ ...prev, visible: false }));
        const handleKeyDownGlobal = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setContextMenu((prev) => ({ ...prev, visible: false }));
                setPrivateRecipient(null);
            }
        };
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('keydown', handleKeyDownGlobal);
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDownGlobal);
        };
    }, []);

    return (
        <div
            style={{
                width: 550,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                zIndex: 100,
                position: 'relative',
                pointerEvents: 'auto',
            }}
        >
            <style>{`
                @keyframes fogMove {
                    0% { transform: translate(-10%, -10%) rotate(0deg); opacity: 0.1; }
                    50% { transform: translate(5%, 5%) rotate(5deg); opacity: 0.2; }
                    100% { transform: translate(-10%, -10%) rotate(0deg); opacity: 0.1; }
                }
                @keyframes flamePulse {
                    0% { text-shadow: 0 0 8px rgba(255, 51, 0, 0.6), 0 0 20px rgba(255, 51, 0, 0.4); transform: scale(1); }
                    50% { text-shadow: 0 0 15px rgba(255, 100, 0, 0.8), 0 0 30px rgba(255, 51, 0, 0.6); transform: scale(1.02); }
                    100% { text-shadow: 0 0 8px rgba(255, 51, 0, 0.6), 0 0 20px rgba(255, 51, 0, 0.4); transform: scale(1); }
                }
                .chat-tab-active {
                    color: #f0c040 !important;
                    background: rgba(240, 192, 64, 0.1) !important;
                    border-bottom: 2px solid #f0c040 !important;
                }
                .leader-glow {
                    animation: flamePulse 2s infinite ease-in-out;
                    display: inline-block;
                }
                .input-glow {
                    box-shadow: 0 0 15px rgba(240, 192, 64, 0.3), inset 0 0 10px rgba(240, 192, 64, 0.1) !important;
                    border-color: rgba(240, 192, 64, 0.6) !important;
                }
                .context-menu-item:hover {
                    background: rgba(240, 192, 64, 0.1) !important;
                    color: #f0c040 !important;
                }
            `}</style>

            <ChatEmojiMenu
                showEmoji={showEmoji}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                addEmoji={addEmoji}
            />

            {/* UNIFIED PANEL HEADER BAR */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    background: 'rgba(12, 9, 6, 0.95)', // Solid dark matching the chat panel
                    backdropFilter: gfx.backdropBlur,
                    WebkitBackdropFilter: gfx.backdropBlur,
                    border: gfx.panelBorder,
                    borderBottom: 'none',
                    borderRadius: '16px 16px 0 0',
                    padding: '8px 12px 0 12px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 2,
                    boxShadow: '0 -4px 15px rgba(0,0,0,0.5)',
                }}
            >
                {/* CHAT TABS */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                        { id: 'all', label: 'ОБЩИЙ' },
                        { id: 'clan', label: 'КЛАН' },
                        { id: 'private', label: 'ЛС' },
                        { id: 'system', label: 'СИСТЕМА' },
                    ].map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveChatTab(tab.id as any)}
                            style={{
                                padding: '6px 16px',
                                fontSize: '13px',
                                fontWeight: 750,
                                fontFamily: "'Philosopher', 'Cinzel', serif",
                                color: activeChatTab === tab.id ? '#ffd700' : '#e2c59b',
                                textShadow: activeChatTab === tab.id ? '0 1px 1.5px rgba(0,0,0,0.9)' : '0 1px 1px rgba(0,0,0,0.7)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderRadius: '8px 8px 0 0',
                                letterSpacing: '1px',
                                background: activeChatTab === tab.id ? 'rgba(240, 192, 64, 0.12)' : 'rgba(0,0,0,0.2)',
                                border: activeChatTab === tab.id ? '1.5px solid #ffd700' : '1.5px solid transparent',
                                borderBottom: activeChatTab === tab.id ? '1.5px solid #14100c' : '1.5px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                zIndex: activeChatTab === tab.id ? 10 : 1,
                                transform: activeChatTab === tab.id ? 'translateY(1.5px)' : 'none',
                            }}
                        >
                            {tab.label}
                            {tab.id === 'private' && privateRecipient && (
                                <span
                                    style={{
                                        fontSize: '9px',
                                        background: '#f0c040',
                                        color: '#000',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    1
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Toggle chat state (ЧАТ button) */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: '6px 15px',
                        background: 'rgba(240, 192, 64, 0.12)',
                        border: '1.5px solid rgba(240, 192, 64, 0.4)',
                        borderBottom: '1.5px solid #14100c',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontFamily: "'Cinzel', serif",
                        fontSize: 12,
                        fontWeight: 900,
                        color: '#ffd700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transform: 'translateY(1.5px)',
                    }}
                >
                    <span>ЧАТ</span>
                    <span
                        style={{
                            fontSize: 8,
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                        }}
                    >
                        ▲
                    </span>
                </div>
            </div>

            {/* Chat Body */}
            <div
                style={{
                    background:
                        activeChatTab === 'private' && privateRecipient
                            ? `linear-gradient(180deg, rgba(240, 192, 64, 0.05) 0%, ${gfx.panelBg} 100%)`
                            : gfx.panelBg,
                    backdropFilter: gfx.backdropBlur,
                    WebkitBackdropFilter: gfx.backdropBlur,
                    width: '100%',
                    height: isOpen ? 300 : 160,
                    transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: gfx.panelShadow,
                    border: gfx.panelBorder,
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* ULTRA: vignette overlay for depth */}
                {gfx.isUltra && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: gfx.vignetteOverlay,
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    />
                )}
                {/* Header info in private chats */}
                <AnimatePresence>
                    {activeChatTab === 'private' && privateRecipient && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            style={{
                                width: '100%',
                                background: 'rgba(240, 192, 64, 0.15)',
                                borderBottom: '1px solid rgba(240, 192, 64, 0.3)',
                                padding: '8px 15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                zIndex: 10,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        background: '#f0c040',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 10px #f0c040',
                                    }}
                                />
                                <span
                                    style={{
                                        color: '#f0c040',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '1px',
                                    }}
                                >
                                    ПРИВАТНЫЙ ЧАТ:{' '}
                                    <span style={{ color: '#fff', fontSize: '13px' }}>{privateRecipient}</span>
                                </span>
                            </div>
                            <div
                                onClick={() => setPrivateRecipient(null)}
                                style={{
                                    fontSize: '10px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: '4px 10px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                ВЕРНУТЬСЯ К СПИСКУ
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Background fog animation */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: 'radial-gradient(circle, rgba(240,192,64,0.06) 0%, transparent 70%)',
                        animation: 'fogMove 20s infinite linear',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />

                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
                        opacity: 0.5,
                    }}
                />

                <ChatMessages
                    filteredMessages={filteredMessages}
                    activeChatTab={activeChatTab}
                    scrollRef={scrollRef}
                    handleScroll={handleScroll}
                    hasNewMessages={hasNewMessages}
                    setHasNewMessages={setHasNewMessages}
                    openContextMenu={openContextMenu}
                    privateRecipient={privateRecipient}
                    setPrivateRecipient={setPrivateRecipient}
                />

                <ChatInputArea
                    inputText={inputText}
                    setInputText={setInputText}
                    inputRef={inputRef}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    activeChatTab={activeChatTab}
                    privateRecipient={privateRecipient}
                    setPrivateRecipient={setPrivateRecipient}
                    showEmoji={showEmoji}
                    setShowEmoji={setShowEmoji}
                    handleSendMessage={handleSendMessage}
                    handleKeyDown={handleKeyDown}
                />
            </div>

            <ChatContextMenu
                isOpen={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                author={contextMenu.author}
                senderId={contextMenu.senderId}
                onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
                handleMenuAction={handleMenuAction}
            />
        </div>
    );
});
