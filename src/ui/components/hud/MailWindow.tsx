import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { syncService } from '../../../services/SyncService';

interface MailWindowProps {
    onClose: () => void;
}

export const MailWindow: React.FC<MailWindowProps> = () => {
    const mails = useGameStore((state) => state.mail);
    const markMailAsRead = useGameStore((state) => state.markMailAsRead);
    const deleteMail = useGameStore((state) => state.deleteMail);
    const toggleMailStar = useGameStore((state) => state.toggleMailStar);
    const claimMailReward = useGameStore((state) => state.claimMailReward);
    const collectAllMailRewards = useGameStore((state) => state.collectAllMailRewards);
    const sendFeedback = useGameStore((state) => state.sendFeedback);
    const archiveMail = useGameStore((state) => state.archiveMail);
    const playerId = useGameStore((state) => state.playerId);
    const friends = useGameStore((state) => state.friends);
    const playerName = useGameStore((state) => state.name);
    const redeemPromoCode = useGameStore((state) => state.redeemPromoCode);

    const [view, setView] = useState<'LIST' | 'READ' | 'WRITE'>('LIST');
    const [activeTab, setActiveTab] = useState<'INBOX' | 'NEWS' | 'ARCHIVE' | 'SUPPORT' | 'PROMO'>('INBOX');
    const [selectedMail, setSelectedMail] = useState<any>(null);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkLayout = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const TABS = ['INBOX', 'NEWS', 'ARCHIVE', 'SUPPORT', 'PROMO'] as const;
    const [feedbackCategory, setFeedbackCategory] = useState<'BUG' | 'IDEA' | 'QUESTION'>('BUG');
    const [feedbackText, setFeedbackText] = useState('');
    const [promoInput, setPromoInput] = useState('');
    const [promoStatus, setPromoStatus] = useState<{ msg: string; type: 'SUCCESS' | 'ERROR' | 'IDLE' }>({
        msg: '',
        type: 'IDLE',
    });

    const [recipientId, setRecipientId] = useState('');
    const [manualRecipientId, setManualRecipientId] = useState('');
    const [writeSubject, setWriteSubject] = useState('');
    const [writeBody, setWriteBody] = useState('');

    const activeMailRecipientId = useGameStore((state: any) => state.activeMailRecipientId);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Auto-populate recipient from inspect modal
    useEffect(() => {
        if (activeMailRecipientId) {
            setView('WRITE');
            const isFriend = (friends || []).some((f: any) => f.id === activeMailRecipientId);
            if (isFriend) {
                setRecipientId(activeMailRecipientId);
                setManualRecipientId('');
            } else {
                setRecipientId('custom');
                setManualRecipientId(activeMailRecipientId);
            }
            useGameStore.setState({ activeMailRecipientId: null });
        }
    }, [activeMailRecipientId, friends]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendPersonalMail = async () => {
        const target = recipientId === 'custom' || !recipientId ? manualRecipientId.trim() : recipientId;
        if (!target) {
            useGameStore.getState().showAlert('Пожалуйста, укажите получателя.');
            return;
        }
        if (!writeSubject.trim() || !writeBody.trim()) {
            useGameStore.getState().showAlert('Пожалуйста, введите тему и сообщение.');
            return;
        }

        try {
            const mailData = {
                id: `personal_${Date.now()}`,
                from: playerName || playerId || 'Друг',
                subject: writeSubject.trim(),
                body: writeBody.trim(),
                date: new Date().toLocaleDateString(),
                isRead: false,
                tab: 'INBOX',
                timestamp: Date.now(),
            };

            await syncService.sendMail(target, mailData);
            useGameStore.getState().updateQuestProgress('SEND_GIFT', 1);
            useGameStore.getState().showAlert('Письмо успешно отправлено!');
            
            setRecipientId('');
            setManualRecipientId('');
            setWriteSubject('');
            setWriteBody('');
            setView('LIST');
        } catch (e) {
            console.error('Failed to send personal mail:', e);
            useGameStore.getState().showAlert('Ошибка при отправке письма.');
        }
    };



    const handleRedeem = () => {
        if (!promoInput.trim()) return;
        const result = redeemPromoCode(promoInput);
        if (result.success) {
            setPromoStatus({ msg: result.message, type: 'SUCCESS' });
            setPromoInput('');
        } else {
            setPromoStatus({ msg: result.message, type: 'ERROR' });
        }
        setTimeout(() => setPromoStatus({ msg: '', type: 'IDLE' }), 3000);
    };

    const colors = {
        text: '#e8d8a8',
        accent: '#f0c040',
        card: 'rgba(255,255,255,0.03)',
        border: 'rgba(240,192,64,0.15)',
        danger: '#ef4444',
        success: '#22c55e',
        input: 'rgba(0,0,0,0.3)',
    };

    const getUnreadCount = (tab: string) => mails.filter((m: any) => m.tab === tab && !m.isRead).length;

    const filteredMails = useMemo(() => {
        return activeTab === 'ARCHIVE'
            ? mails.filter((m: any) => m.tab === 'ARCHIVE')
            : mails.filter((m: any) => m.tab === activeTab);
    }, [activeTab, mails]);

    const handleSendFeedback = () => {
        if (!feedbackText.trim()) return;
        sendFeedback(feedbackCategory, feedbackText);
        setFeedbackText('');
        useGameStore.getState().showAlert('Спасибо! Ваш отзыв отправлен Королевской Почтой.');
        setActiveTab('INBOX');
    };

    const formatTimeLeft = (expiresAt: number) => {
        // eslint-disable-next-line react-hooks/purity
        const left = expiresAt - Date.now();
        if (left <= 0) return 'Истекло';
        const days = Math.ceil(left / (1000 * 60 * 60 * 24));
        return `Удалится через ${days} дн.`;
    };

    return (
        <div
            style={{
                width: '100%',
                height: '700px',
                backgroundColor: 'transparent',
                padding: '10px 30px',
                display: 'flex',
                flexDirection: 'column',
                color: colors.text,
            }}
        >
            {/* ВКЛАДКИ */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%', overflow: 'hidden' }}
            >
                <div style={{ position: 'relative', flex: 1, overflow: 'hidden', marginRight: '10px' }}>
                    <div
                        className="no-scrollbar"
                        style={{
                            display: 'flex',
                            gap: '10px',
                            overflowX: isMobile ? 'auto' : 'visible',
                            whiteSpace: 'nowrap',
                            paddingBottom: isMobile ? '6px' : 0,
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'none',
                        }}
                    >
                        <style>{`
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {['INBOX', 'NEWS', 'ARCHIVE', 'SUPPORT', 'PROMO'].map((tab) => {
                            const unread = getUnreadCount(tab);
                            const labels = {
                                INBOX: 'ВХОДЯЩИЕ',
                                NEWS: 'НОВОСТИ',
                                ARCHIVE: 'АРХИВ',
                                SUPPORT: 'СВЯЗЬ',
                                PROMO: 'ПРОМОКОД',
                            };
                            return (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab as any);
                                        setView('LIST');
                                    }}
                                    style={{
                                        background: activeTab === tab ? 'rgba(240,192,64,0.1)' : 'transparent',
                                        border: `1px solid ${activeTab === tab ? colors.accent : colors.border}`,
                                        color: activeTab === tab ? '#fff' : 'rgba(232, 216, 168, 0.4)',
                                        padding: isMobile ? '10px 18px' : '12px 24px',
                                        borderRadius: '10px',
                                        fontSize: isMobile ? '11.5px' : '13px',
                                        fontWeight: 800,
                                        fontFamily: "'Cinzel', serif",
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: '0.3s',
                                        flexShrink: 0,
                                    }}
                                >
                                    {(labels as any)[tab]}
                                    {unread > 0 && tab !== 'ARCHIVE' && tab !== 'PROMO' && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: -5,
                                                right: -5,
                                                width: '18px',
                                                height: '18px',
                                                background: colors.danger,
                                                color: '#fff',
                                                fontSize: '10px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 900,
                                                border: '2px solid #1a1008',
                                            }}
                                        >
                                            {unread}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* Right fade indicator on mobile to suggest swipeability */}
                    {isMobile && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: '6px',
                            width: '35px',
                            background: 'linear-gradient(to right, rgba(26,16,8,0) 0%, rgba(26,16,8,0.95) 100%)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }} />
                    )}
                </div>

                {view !== 'LIST' && (
                    <button
                        onClick={() => setView('LIST')}
                        style={{
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            color: colors.accent,
                            padding: '6px 15px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        ← НАЗАД
                    </button>
                )}
            </div>

            {/* КОНТЕНТ */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="leaderboard-scroll">
                <AnimatePresence mode="wait">
                    {view === 'LIST' ? (
                        activeTab === 'SUPPORT' ? (
                            <motion.div
                                key="support"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                drag={isMobile ? "x" : undefined}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_, info) => {
                                    if (!isMobile) return;
                                    const swipeThreshold = 50;
                                    const currentIndex = TABS.indexOf(activeTab);
                                    if (info.offset.x < -swipeThreshold) {
                                        if (currentIndex < TABS.length - 1) {
                                            setActiveTab(TABS[currentIndex + 1] as any);
                                        }
                                    } else if (info.offset.x > swipeThreshold) {
                                        if (currentIndex > 0) {
                                            setActiveTab(TABS[currentIndex - 1] as any);
                                        }
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                    padding: '20px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '15px',
                                    border: `1px solid ${colors.border}`,
                                    touchAction: isMobile ? 'pan-y' : 'auto',
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>🦉</div>
                                    <h3
                                        style={{
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: '18px',
                                            color: colors.accent,
                                            marginBottom: '8px',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        КОРОЛЕВСКАЯ ПОЧТА
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            opacity: 0.6,
                                            lineHeight: 1.6,
                                            maxWidth: '400px',
                                            margin: '0 auto',
                                        }}
                                    >
                                        Мудрый Филин доставит твое послание прямо к столу разработчиков. Нашли ошибку
                                        или есть идея? Мы ждем твоих вестей!
                                    </p>
                                </div>

                                {/* КАТЕГОРИИ ФИДБЕКА */}
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    {[
                                        { id: 'BUG', label: '🐞 БАГ', color: '#ef4444' },
                                        { id: 'IDEA', label: '💡 ИДЕЯ', color: '#3b82f6' },
                                        { id: 'QUESTION', label: '💬 ВОПРОС', color: colors.accent },
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFeedbackCategory(cat.id as any)}
                                            style={{
                                                padding: '8px 15px',
                                                borderRadius: '8px',
                                                border: `1px solid ${feedbackCategory === cat.id ? cat.color : colors.border}`,
                                                background:
                                                    feedbackCategory === cat.id ? `${cat.color}22` : 'transparent',
                                                color: feedbackCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.4)',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: '0.2s',
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Опишите вашу проблему или идею как можно подробнее..."
                                        style={{
                                            height: '140px',
                                            padding: '15px',
                                            background: colors.input,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '12px',
                                            color: '#fff',
                                            outline: 'none',
                                            resize: 'none',
                                            fontSize: '14px',
                                            lineHeight: 1.5,
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0 5px',
                                        }}
                                    >
                                        <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>
                                            ВАШ ID: <span style={{ color: colors.accent }}>{playerId}</span>
                                        </div>
                                        <div style={{ fontSize: '10px', opacity: 0.5 }}>Прикрепится автоматически</div>
                                    </div>

                                    <button
                                        onClick={handleSendFeedback}
                                        style={{
                                            padding: '16px',
                                            background: 'linear-gradient(180deg, #f0c040, #c87820)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontWeight: 900,
                                            color: '#1a1008',
                                            cursor: 'pointer',
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: '14px',
                                            boxShadow: '0 4px 15px rgba(200, 120, 32, 0.3)',
                                        }}
                                    >
                                        ОТПРАВИТЬ ПОСЛАНИЕ
                                    </button>
                                </div>
                            </motion.div>
                        ) : activeTab === 'PROMO' ? (
                            <motion.div
                                key="promo"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                drag={isMobile ? "x" : undefined}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_, info) => {
                                    if (!isMobile) return;
                                    const swipeThreshold = 50;
                                    const currentIndex = TABS.indexOf(activeTab);
                                    if (info.offset.x < -swipeThreshold) {
                                        if (currentIndex < TABS.length - 1) {
                                            setActiveTab(TABS[currentIndex + 1] as any);
                                        }
                                    } else if (info.offset.x > swipeThreshold) {
                                        if (currentIndex > 0) {
                                            setActiveTab(TABS[currentIndex - 1] as any);
                                        }
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '30px',
                                    padding: '60px 20px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '20px',
                                    border: `1px solid ${colors.border}`,
                                    touchAction: isMobile ? 'pan-y' : 'auto',
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 70, height: 70, margin: '0 auto 10px auto' }}>
                                        <img
                                            src={AssetsMap.UI.ICON_PROMO}
                                            alt="promo"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                filter: 'contrast(1.15) brightness(1.1) drop-shadow(0 0 15px rgba(240,192,64,0.3))',
                                            }}
                                        />
                                    </div>
                                    <h3
                                        style={{
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: '24px',
                                            color: colors.accent,
                                            marginBottom: '10px',
                                            letterSpacing: '2px',
                                        }}
                                    >
                                        АКТИВАЦИЯ КОДА
                                    </h3>
                                    <p style={{ fontSize: '13px', opacity: 0.6, maxWidth: '350px' }}>
                                        Введите секретный шифр, чтобы получить ценные дары от Духов Леса.
                                    </p>
                                </div>

                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '15px',
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={promoInput}
                                            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                                            placeholder="ПРОМОКОД"
                                            style={{
                                                width: '100%',
                                                padding: '18px 25px',
                                                background: 'rgba(0,0,0,0.4)',
                                                border: `2px solid ${promoStatus.type === 'ERROR' ? colors.danger : promoStatus.type === 'SUCCESS' ? colors.success : colors.border}`,
                                                borderRadius: '12px',
                                                color: '#fff',
                                                fontSize: '18px',
                                                fontWeight: 900,
                                                textAlign: 'center',
                                                letterSpacing: '4px',
                                                outline: 'none',
                                                transition: '0.3s',
                                            }}
                                        />
                                        <AnimatePresence>
                                            {promoStatus.msg && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '-25px',
                                                        left: 0,
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        fontSize: '11px',
                                                        fontWeight: 900,
                                                        color:
                                                            promoStatus.type === 'SUCCESS'
                                                                ? colors.success
                                                                : colors.danger,
                                                    }}
                                                >
                                                    {promoStatus.msg}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={handleRedeem}
                                        style={{
                                            padding: '18px',
                                            background: 'linear-gradient(180deg, #f0c040, #c87820)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontWeight: 900,
                                            color: '#1a1008',
                                            cursor: 'pointer',
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: '16px',
                                            boxShadow: '0 6px 20px rgba(200, 120, 32, 0.4)',
                                            marginTop: '10px',
                                        }}
                                    >
                                        АКТИВИРОВАТЬ
                                    </button>
                                </div>

                                <div style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic' }}>
                                    Следите за новостями в группе, чтобы не пропустить новые коды!
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                drag={isMobile ? "x" : undefined}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.15}
                                onDragEnd={(_, info) => {
                                    if (!isMobile) return;
                                    const swipeThreshold = 50;
                                    const currentIndex = TABS.indexOf(activeTab);
                                    if (info.offset.x < -swipeThreshold) {
                                        if (currentIndex < TABS.length - 1) {
                                            setActiveTab(TABS[currentIndex + 1] as any);
                                        }
                                    } else if (info.offset.x > swipeThreshold) {
                                        if (currentIndex > 0) {
                                            setActiveTab(TABS[currentIndex - 1] as any);
                                        }
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    touchAction: isMobile ? 'pan-y' : 'auto',
                                }}
                            >
                                {filteredMails.length > 0 ? (
                                    filteredMails.map((m: any) => (
                                        <div
                                            key={m.id}
                                            onClick={() => {
                                                setSelectedMail(m);
                                                setView('READ');
                                                markMailAsRead(m.id);
                                            }}
                                            style={{
                                                background: colors.card,
                                                border: `1px solid ${m.isRead ? colors.border : colors.accent}`,
                                                borderRadius: '12px',
                                                padding: '12px 18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                opacity: m.isRead ? 0.6 : 1,
                                            }}
                                        >
                                            <div style={{ fontSize: '24px' }}>
                                                {m.rewards ? '🎁' : m.isRead ? '📖' : '✉️'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '9px',
                                                        fontWeight: 900,
                                                        color: colors.accent,
                                                        marginBottom: '2px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    <span>{m.from}</span>
                                                    <span>{m.expiresAt ? formatTimeLeft(m.expiresAt) : m.date}</span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontFamily: "'Cinzel', serif",
                                                        fontSize: '14px',
                                                        fontWeight: 700,
                                                        color: m.isRead ? '#aaa' : '#fff',
                                                    }}
                                                >
                                                    {m.subject}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMailStar(m.id);
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '20px',
                                                    color: m.isStarred ? colors.accent : 'rgba(255,255,255,0.05)',
                                                }}
                                            >
                                                {m.isStarred ? '★' : '☆'}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '100px 0',
                                            opacity: 0.1,
                                            fontSize: '40px',
                                        }}
                                    >
                                        📭
                                    </div>
                                )}
                            </motion.div>
                        )
                    ) : view === 'WRITE' ? (
                        <motion.div
                            key="write"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                padding: '20px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '15px',
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <h3
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '18px',
                                    color: colors.accent,
                                    letterSpacing: '1px',
                                    margin: 0,
                                }}
                            >
                                ОТПРАВИТЬ ПИСЬМО
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                                    КОМУ:
                                </label>
                                {friends && friends.length > 0 ? (
                                    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                                        <div
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            style={{
                                                padding: '12px 16px',
                                                background: colors.input,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                userSelect: 'none',
                                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                                            }}
                                        >
                                            <span>
                                                {recipientId === 'custom'
                                                    ? 'Указать ID вручную...'
                                                    : recipientId
                                                    ? ((friends || []).find((f: any) => f.id === recipientId)?.name ||
                                                       (friends || []).find((f: any) => f.id === recipientId)?.username ||
                                                       recipientId) + ` (${recipientId})`
                                                    : '-- Выберите друга --'}
                                            </span>
                                            <span style={{
                                                fontSize: '10px',
                                                color: colors.accent,
                                                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s',
                                            }}>
                                                ▼
                                            </span>
                                        </div>

                                        {isDropdownOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 4px)',
                                                left: 0,
                                                width: '100%',
                                                maxHeight: '220px',
                                                overflowY: 'auto',
                                                background: 'rgba(25, 20, 15, 0.98)',
                                                border: `1.5px solid ${colors.border}`,
                                                borderRadius: '8px',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.85), 0 0 15px rgba(240,192,64,0.1)',
                                                zIndex: 9999,
                                            }}>
                                                {friends.map((f: any) => (
                                                    <div
                                                        key={f.id}
                                                        onClick={() => {
                                                            setRecipientId(f.id);
                                                            setManualRecipientId('');
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(240,192,64,0.15)';
                                                            e.currentTarget.style.color = colors.accent;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#fff';
                                                        }}
                                                        style={{
                                                            padding: '10px 16px',
                                                            color: '#fff',
                                                            fontSize: '13px',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                            transition: 'all 0.15s',
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        {f.name || f.username || f.id} ({f.id})
                                                    </div>
                                                ))}

                                                <div
                                                    onClick={() => {
                                                        setRecipientId('custom');
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(240,192,64,0.15)';
                                                        e.currentTarget.style.color = colors.accent;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.color = '#ffd700';
                                                    }}
                                                    style={{
                                                        padding: '10px 16px',
                                                        color: '#ffd700',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    Указать ID вручную...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                                        Список друзей пуст. Вы можете ввести ID игрока вручную ниже.
                                    </div>
                                )}

                                {(friends.length === 0 || recipientId === 'custom') && (
                                    <input
                                        type="text"
                                        value={manualRecipientId}
                                        onChange={(e) => setManualRecipientId(e.target.value)}
                                        placeholder="Введите ID игрока (например: VK-12345)"
                                        style={{
                                            padding: '12px',
                                            background: colors.input,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            marginTop: '5px',
                                        }}
                                    />
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                                    ТЕМА:
                                </label>
                                <input
                                    type="text"
                                    value={writeSubject}
                                    onChange={(e) => setWriteSubject(e.target.value)}
                                    placeholder="Тема письма..."
                                    style={{
                                        padding: '12px',
                                        background: colors.input,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                                    СООБЩЕНИЕ:
                                </label>
                                <textarea
                                    value={writeBody}
                                    onChange={(e) => setWriteBody(e.target.value)}
                                    placeholder="Напишите послание..."
                                    style={{
                                        height: '110px',
                                        padding: '12px',
                                        background: colors.input,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none',
                                        resize: 'none',
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleSendPersonalMail}
                                style={{
                                    padding: '16px',
                                    background: 'linear-gradient(180deg, #f0c040, #c87820)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 900,
                                    color: '#1a1008',
                                    cursor: 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '14px',
                                    boxShadow: '0 4px 15px rgba(200, 120, 32, 0.3)',
                                    marginTop: '5px',
                                }}
                            >
                                ОТПРАВИТЬ ПИСЬМО
                            </button>
                        </motion.div>
                    ) : view === 'READ' ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div
                                style={{
                                    padding: '20px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '15px',
                                    border: `1px solid ${colors.border}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                color: colors.accent,
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            ОТ: {selectedMail.from}
                                        </div>
                                        <h2
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: '22px',
                                                margin: '5px 0',
                                                color: '#fff',
                                            }}
                                        >
                                            {selectedMail.subject}
                                        </h2>
                                    </div>
                                    <div style={{ fontSize: '11px', opacity: 0.5 }}>{selectedMail.date}</div>
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: '25px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '15px',
                                    lineHeight: 1.8,
                                    fontSize: '15px',
                                    color: 'rgba(232, 216, 168, 0.8)',
                                }}
                            >
                                {selectedMail.body}
                            </div>

                            {/* НАГРАДЫ */}
                            {selectedMail.rewards && selectedMail.rewards.length > 0 && (
                                <div
                                    style={{
                                        padding: '20px',
                                        background: 'rgba(240,192,64,0.05)',
                                        borderRadius: '15px',
                                        border: `1px dotted ${colors.accent}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {selectedMail.rewards.map((r: any, idx: number) => (
                                            <div
                                                key={idx}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <img
                                                    src={
                                                        r.type === 'GOLD'
                                                            ? AssetsMap.UI.ICON_GOLD_FULL
                                                            : r.type === 'ENERGY'
                                                              ? AssetsMap.UI.ICON_ENERGY_FULL
                                                              : r.type === 'ITEM'
                                                                ? (ITEMS_DATABASE[r.itemId]?.image || AssetsMap.UI.ICON_DAILY_CHEST)
                                                                : AssetsMap.UI.ICON_ALMAZ_FULL
                                                    }
                                                    style={{ width: 28, height: 28, objectFit: 'contain' }}
                                                    alt="reward"
                                                />
                                                <span style={{ fontWeight: 900, color: colors.accent }}>
                                                    {r.type === 'ITEM'
                                                        ? `${ITEMS_DATABASE[r.itemId]?.name || 'Предмет'}${r.amount > 1 ? ` x${r.amount}` : ''}`
                                                        : r.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => {
                                            claimMailReward(selectedMail.id);
                                            setView('LIST');
                                        }}
                                        style={{
                                            padding: '10px 25px',
                                            background: colors.accent,
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 900,
                                            color: '#1a1008',
                                            cursor: 'pointer',
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        ЗАБРАТЬ
                                    </motion.button>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                {selectedMail.tab !== 'NEWS' && (
                                    <button
                                        onClick={() => {
                                            deleteMail(selectedMail.id);
                                            setView('LIST');
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: colors.danger,
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            opacity: 0.7,
                                        }}
                                    >
                                        🗑️ УДАЛИТЬ ПИСЬМО
                                    </button>
                                )}
                                {selectedMail.tab !== 'ARCHIVE' && (
                                    <button
                                        onClick={() => {
                                            archiveMail(selectedMail.id);
                                            setView('LIST');
                                        }}
                                        style={{
                                            padding: '8px 20px',
                                            background: 'transparent',
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            color: colors.text,
                                            cursor: 'pointer',
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        В АРХИВ
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* ДИНАМИЧЕСКИЙ ФУТЕР */}
            {view === 'LIST' && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ marginTop: '20px', display: 'flex', gap: '10px' }}
                >
                    {activeTab === 'INBOX' && (
                        <>
                            <button
                                onClick={() => {
                                    setRecipientId('');
                                    setManualRecipientId('');
                                    setWriteSubject('');
                                    setWriteBody('');
                                    setView('WRITE');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: 'transparent',
                                    border: `1px solid ${colors.accent}`,
                                    borderRadius: '10px',
                                    color: colors.accent,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                НАПИСАТЬ
                            </button>
                            <button
                                onClick={() => {
                                    const toDelete = mails.filter((m: any) => m.tab === 'INBOX' && !m.rewards && m.id !== 'welcome-mail');
                                    toDelete.forEach((m: any) => deleteMail(m.id));
                                    useGameStore.getState().showAlert(`Удалено писем без наград: ${toDelete.length}`);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: 'transparent',
                                    border: `1px solid ${colors.danger}`,
                                    borderRadius: '10px',
                                    color: colors.danger,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                УДАЛИТЬ БЕЗ НАГРАД
                            </button>
                            <button
                                onClick={() => collectAllMailRewards()}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: 'linear-gradient(180deg, #f0c040, #c87820)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 900,
                                    color: '#1a1008',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                ЗАБРАТЬ ВСЁ
                            </button>
                        </>
                    )}

                    {activeTab === 'ARCHIVE' && (
                        <button
                            onClick={() => {
                                const toDelete = mails.filter((m: any) => m.tab === 'ARCHIVE');
                                toDelete.forEach((m: any) => deleteMail(m.id));
                                useGameStore.getState().showAlert(`Архив очищен. Удалено писем: ${toDelete.length}`);
                            }}
                            style={{
                                flex: 1,
                                padding: '14px',
                                background: 'transparent',
                                border: `1px solid ${colors.danger}`,
                                borderRadius: '10px',
                                color: colors.danger,
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontFamily: "'Cinzel', serif",
                                transition: '0.2s',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'transparent';
                            }}
                        >
                            ОЧИСТИТЬ АРХИВ
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default MailWindow;
