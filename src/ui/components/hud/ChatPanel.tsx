import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';

/**
 * ChatPanel (v2.1) — Интерактивный чат с поддержкой стора.
 */
export const ChatPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [inputText, setInputText] = useState('');
    const { messages, addMessage, name } = useGameStore();
    const [showEmoji, setShowEmoji] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [activeChatTab, setActiveChatTab] = useState<'all' | 'system' | 'clan' | 'private'>('all');
    const [privateRecipient, setPrivateRecipient] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; author: string | null }>({
        visible: false,
        x: 0,
        y: 0,
        author: null,
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Отслеживание прокрутки для скрытия плашки "Новые сообщения"
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Если мы почти в самом низу (погрешность 30px)
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
        if (isAtBottom) {
            setHasNewMessages(false);
        }
    };

    // Фильтрация сообщений по табам
    const filteredMessages = messages.filter((msg: any) => {
        // Удаляем старое сообщение мастера с эмодзи (по запросу)
        if (
            (msg.author === 'Мастер' || msg.author === 'Motar') &&
            (msg.text.trim() === '👏' || msg.text.trim() === '👋')
        ) {
            return false;
        }

        // ОБЩИЙ ЧАТ — показываем всё, кроме личных сообщений (ЛС)
        if (activeChatTab === 'all') return msg.type !== 'private' && msg.type !== 'personal';

        // СИСТЕМА
        if (activeChatTab === 'system') return msg.type === 'system';

        // КЛАН
        if (activeChatTab === 'clan') return msg.type === 'clan';

        // ЛС (ПРИВАТ)
        if (activeChatTab === 'private') {
            // Если выбран конкретный собеседник — показываем только диалог с ним
            if (privateRecipient) {
                return (
                    (msg.type === 'private' || msg.type === 'personal') &&
                    (msg.author === privateRecipient || msg.text.includes(`/w ${privateRecipient}`))
                );
            }
            // Если никто не выбран — вкладка пуста (как просил пользователь)
            return false;
        }

        return true;
    });

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const formatMessageText = (text: string) => {
        if (text.startsWith('/w ')) {
            // Удаляем "/w Nick " из отображения, оставляя только суть сообщения
            return text.replace(/^\/w\s+\S+\s+/, '');
        }
        return text;
    };

    const EMOJI_TABS = [
        { id: 'general', label: '😊', list: ['👋', '😂', '😎', '😡', '🤔', '🙌', '👀', '✨', '🔥', '❤️'] },
        { id: 'combat', label: '⚔️', list: ['🐉', '⚔️', '🛡️', '👊', '💥', '💀', '🩸', '🏹', '🐎', '🏆'] },
        { id: 'magic', label: '🔮', list: ['⚡', '💎', '💰', '👑', '🍀', '🌟', '☄️', '🌀', '🗝️', '📜'] },
    ];

    const currentEmojis = EMOJI_TABS.find((t) => t.id === activeTab)?.list || [];

    // Авто-скролл при новых сообщениях
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Проверяем, был ли пользователь внизу до прихода сообщения
            const wasAtBottom = scrollHeight - scrollTop - clientHeight < 100;

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
        setInputText('');
        setShowEmoji(false);
    };

    const addEmoji = (emoji: string) => {
        setInputText((prev) => prev + emoji);
        // setShowEmoji(false); // Можно не закрывать, чтобы выбрать несколько
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const openContextMenu = (e: React.MouseEvent, author: string) => {
        e.preventDefault();
        // Прямое действие при клике на ник — переход в ЛС
        setActiveChatTab('private');
        setPrivateRecipient(author);
        setInputText(''); // Очищаем ввод, теперь используем badge
        setTimeout(() => inputRef.current?.focus(), 50);

        // Также открываем меню для других действий
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            author,
        });
    };

    const handleMenuAction = (type: string, author: string | null) => {
        switch (type) {
            case 'profile':
                console.log('Profile', author);
                break;
            case 'pm':
                setActiveChatTab('private');
                setPrivateRecipient(author);
                setInputText('');
                setTimeout(() => inputRef.current?.focus(), 50);
                break;
            case 'friend':
                console.log('Friend', author);
                break;
            case 'copy':
                navigator.clipboard.writeText(author || '');
                break;
        }
    };

    // Закрытие меню и сброс ЛС при клике вне или ESC
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isOpen ? 'translateY(0)' : 'translateY(210px)',
                opacity: isOpen ? 1 : 0.8,
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

            {/* МЕНЮ СМАЙЛИКОВ (PREMIUM v2.0) */}
            <AnimatePresence>
                {showEmoji && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        style={{
                            position: 'absolute',
                            bottom: 75,
                            right: 20,
                            width: 220, // Уменьшено до 220
                            background: 'linear-gradient(180deg, rgba(25, 20, 15, 0.98), rgba(15, 10, 5, 0.98))',
                            border: '1px solid #f0c04066',
                            borderRadius: '16px',
                            padding: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 15px rgba(240, 192, 64, 0.1)',
                            zIndex: 110,
                            backdropFilter: 'blur(15px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {/* Хедер с категориями */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(240, 192, 64, 0.15)',
                                paddingBottom: '8px',
                            }}
                        >
                            {EMOJI_TABS.map((tab) => (
                                <div
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        fontSize: 18,
                                        cursor: 'pointer',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        background: activeTab === tab.id ? 'rgba(240, 192, 64, 0.15)' : 'transparent',
                                        border:
                                            activeTab === tab.id
                                                ? '1px solid rgba(240, 192, 64, 0.3)'
                                                : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        filter: activeTab === tab.id ? 'none' : 'grayscale(0.6)',
                                        opacity: activeTab === tab.id ? 1 : 0.6,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                        e.currentTarget.style.filter = 'none';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== tab.id) {
                                            e.currentTarget.style.opacity = '0.6';
                                            e.currentTarget.style.filter = 'grayscale(0.6)';
                                        }
                                    }}
                                >
                                    {tab.label}
                                </div>
                            ))}
                        </div>

                        {/* Сетка смайликов */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)', // Изменено на 4 колонки
                                gap: '10px',
                            }}
                        >
                            {currentEmojis.map((emoji) => (
                                <div
                                    key={emoji}
                                    onClick={() => addEmoji(emoji)}
                                    style={{
                                        fontSize: 22,
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        padding: '6px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(240, 192, 64, 0.1)';
                                        e.currentTarget.style.transform = 'scale(1.2)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(240, 192, 64, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'none';
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {emoji}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопка-переключатель */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'absolute',
                    top: 18, // Опустил на 3px ниже
                    right: 10,
                    padding: '4px 15px',
                    background: 'rgba(15, 10, 5, 0.9)',
                    border: '1px solid rgba(240, 192, 64, 0.4)',
                    borderBottom: 'none',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#f0c040',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.5)',
                    zIndex: 110, // Чтобы быть поверх всего
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

            {/* ТАБЫ ЧАТА */}
            <div
                style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '0 5px',
                    transform: 'translateY(12px)', // Опустил еще на 2px (всего 12px)
                }}
            >
                {[
                    { id: 'all', label: 'ОБЩИЙ' },
                    { id: 'clan', label: 'КЛАН' },
                    { id: 'private', label: 'ЛС' },
                    { id: 'system', label: 'СИСТЕМА' },
                ].map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => {
                            setActiveChatTab(tab.id as any);
                            // Больше не сбрасываем собеседника при переключении табов,
                            // чтобы диалог не терялся при выходе в Общий чат
                        }}
                        style={{
                            padding: '6px 16px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: activeChatTab === tab.id ? '#f0c040' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            borderRadius: '8px 8px 0 0',
                            letterSpacing: '1px',
                            background: activeChatTab === tab.id ? 'rgba(240, 192, 64, 0.1)' : 'rgba(0,0,0,0.2)',
                            borderBottom: activeChatTab === tab.id ? '2px solid #f0c040' : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
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

            {/* Основное окно чата (ТЕПЕРЬ ПОЛНОСТЬЮ НА CSS) */}
            <div
                style={{
                    background:
                        activeChatTab === 'private' && privateRecipient
                            ? 'linear-gradient(180deg, rgba(240, 192, 64, 0.05) 0%, rgba(10, 15, 20, 0.85) 100%)'
                            : 'rgba(10, 15, 20, 0.75)',
                    backdropFilter: 'blur(12px)',
                    width: '100%',
                    height: 300,
                    padding: '0px', // Убрал паддинг чтобы хедер прилегал к краям
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 15px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(240, 192, 64, 0.2)',
                    borderRadius: '0 16px 16px 16px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* ХЕДЕР ДИАЛОГА (ВНУТРИ ОКНА) */}
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

                {/* МАГИЧЕСКИЙ ТУМАН (АНИМАЦИЯ) */}
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
                {/* Тонкий декоративный элемент сверху */}
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

                {/* Список сообщений */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="custom-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px 15px', // Увеличил паддинг для удобства
                        scrollBehavior: 'smooth',
                        maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                        zIndex: 2,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8, // Уменьшил отступ между сообщениями
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
                                fontSize: 13,
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
                                    {/* ВРЕМЯ */}
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

                                    {/* 0. АВАТАР ИГРОКА */}
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

                                    {/* 1. ИКОНКА РАНГА */}
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
                                                marginRight: 0,
                                                filter: 'drop-shadow(0 0 5px rgba(0, 242, 255, 0.4))',
                                            }}
                                        />
                                    )}

                                    {/* 2. ИКОНКА VIP (если есть) */}
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
                                                src="/assets/images/ui/vip.png"
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

                                    {/* 3. УРОВЕНЬ (LVL) */}
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

                                    {/* 4. НИК ПЕРСОНАЖА */}
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

                {/* --- НИЖНЯЯ ПАНЕЛЬ: ПОЛЕ ВВОДА И КНОПКИ (ПРОГРАММНЫЕ) --- */}
                <div
                    style={{
                        marginTop: 15,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Контейнер ввода */}
                        <div
                            className={isFocused ? 'input-glow' : ''}
                            style={{
                                flex: 1,
                                height: 42,
                                background: 'rgba(0,0,0,0.6)',
                                border: '1px solid rgba(240, 192, 64, 0.3)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 12px',
                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                transition: 'all 0.3s',
                            }}
                        >
                            {activeChatTab === 'private' && privateRecipient && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background:
                                            'linear-gradient(135deg, rgba(240, 192, 64, 0.25), rgba(138, 90, 16, 0.15))',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(240, 192, 64, 0.5)',
                                        marginRight: '12px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 0 15px rgba(240, 192, 64, 0.1)',
                                        animation: 'pulse-glow 2s infinite',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: '#f0c040',
                                            fontWeight: 900,
                                            fontFamily: "'Cinzel', serif",
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {privateRecipient}
                                    </span>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPrivateRecipient(null);
                                        }}
                                        style={{
                                            cursor: 'pointer',
                                            color: '#fff',
                                            fontSize: '14px',
                                            opacity: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'opacity 0.2s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                                    >
                                        ✕
                                    </span>
                                </div>
                            )}

                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder={
                                    privateRecipient ? `Написать ${privateRecipient}...` : 'Введите сообщение...'
                                }
                                style={{
                                    flex: 1,
                                    height: '100%',
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontFamily: "'Cinzel', serif",
                                }}
                            />

                            {/* Иконка смайлика */}
                            <div
                                onClick={() => setShowEmoji(!showEmoji)}
                                style={{
                                    fontSize: 20,
                                    cursor: 'pointer',
                                    filter: showEmoji ? 'drop-shadow(0 0 5px #f0c040)' : 'grayscale(0.5)',
                                    opacity: showEmoji ? 1 : 0.6,
                                    transition: 'all 0.2s',
                                    marginLeft: 8,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => {
                                    if (!showEmoji) e.currentTarget.style.opacity = '0.6';
                                }}
                            >
                                😊
                            </div>
                        </div>

                        {/* Кнопка ОТПРАВИТЬ */}
                        <button
                            onClick={handleSendMessage}
                            style={{
                                width: 50,
                                height: 42,
                                background: inputText.trim()
                                    ? 'linear-gradient(180deg, #f0c040, #8a5a10)'
                                    : 'rgba(240, 192, 64, 0.1)',
                                border: '1px solid rgba(240, 192, 64, 0.4)',
                                borderRadius: '10px',
                                cursor: inputText.trim() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: inputText.trim() ? '0 4px 15px rgba(0,0,0,0.4)' : 'none',
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={inputText.trim() ? '#000' : 'rgba(240, 192, 64, 0.4)'}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* КОНТЕКСТНОЕ МЕНЮ (SOCIAL) */}
            <AnimatePresence>
                {contextMenu.visible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        style={{
                            position: 'fixed',
                            left: contextMenu.x,
                            top: contextMenu.y - 120, // Немного выше места клика
                            width: 180,
                            background: 'rgba(20, 15, 10, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(240, 192, 64, 0.4)',
                            borderRadius: '12px',
                            padding: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(240, 192, 64, 0.1)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        <div
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                color: '#f0c040',
                                borderBottom: '1px solid rgba(240, 192, 64, 0.2)',
                                marginBottom: '4px',
                                fontWeight: 800,
                            }}
                        >
                            {contextMenu.author}
                        </div>
                        {[
                            { label: '👤 Профиль', type: 'profile' },
                            { label: '💬 Написать ЛС', type: 'pm' },
                            { label: '🤝 В друзья', type: 'friend' },
                            { label: '📋 Копировать ник', type: 'copy' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                onClick={() => {
                                    handleMenuAction(item.type, contextMenu.author);
                                    setContextMenu((prev) => ({ ...prev, visible: false }));
                                }}
                                className="context-menu-item"
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: 'rgba(255,255,255,0.8)',
                                }}
                            >
                                {item.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
