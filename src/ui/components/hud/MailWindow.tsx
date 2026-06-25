import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { syncService } from '../../../services/SyncService';

// Import sub-components
import { MailInboxTab } from './Mail/MailInboxTab';
import { MailWriteTab } from './Mail/MailWriteTab';
import { MailSupportTab } from './Mail/MailSupportTab';
import { MailPromoTab } from './Mail/MailPromoTab';

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
        const left = expiresAt - Date.now();
        if (left <= 0) return 'Истекло';
        const days = Math.ceil(left / (1000 * 60 * 60 * 24));
        return `Удалится через ${days} дн.`;
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                padding: '24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                color: colors.text,
            }}
        >
            {/* ВКЛАДКИ */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    width: '100%',
                    overflow: 'hidden',
                }}
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
                        <div
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: '6px',
                                width: '35px',
                                background: 'linear-gradient(to right, rgba(26,16,8,0) 0%, rgba(26,16,8,0.95) 100%)',
                                pointerEvents: 'none',
                                zIndex: 10,
                            }}
                        />
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
                {view === 'WRITE' ? (
                    <MailWriteTab
                        friends={friends}
                        recipientId={recipientId}
                        setRecipientId={setRecipientId}
                        manualRecipientId={manualRecipientId}
                        setManualRecipientId={setManualRecipientId}
                        writeSubject={writeSubject}
                        setWriteSubject={setWriteSubject}
                        writeBody={writeBody}
                        setWriteBody={setWriteBody}
                        handleSendPersonalMail={handleSendPersonalMail}
                        isDropdownOpen={isDropdownOpen}
                        setIsDropdownOpen={setIsDropdownOpen}
                        dropdownRef={dropdownRef}
                    />
                ) : activeTab === 'SUPPORT' ? (
                    <MailSupportTab
                        isMobile={isMobile}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab as any}
                        feedbackCategory={feedbackCategory}
                        setFeedbackCategory={setFeedbackCategory}
                        feedbackText={feedbackText}
                        setFeedbackText={setFeedbackText}
                        playerId={playerId}
                        handleSendFeedback={handleSendFeedback}
                        TABS={TABS}
                    />
                ) : activeTab === 'PROMO' ? (
                    <MailPromoTab
                        isMobile={isMobile}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab as any}
                        promoInput={promoInput}
                        setPromoInput={setPromoInput}
                        promoStatus={promoStatus}
                        handleRedeem={handleRedeem}
                        TABS={TABS}
                    />
                ) : (
                    <MailInboxTab
                        isMobile={isMobile}
                        activeTab={activeTab as 'INBOX' | 'NEWS' | 'ARCHIVE'}
                        setActiveTab={setActiveTab as any}
                        view={view as 'LIST' | 'READ'}
                        setView={setView}
                        selectedMail={selectedMail}
                        setSelectedMail={setSelectedMail}
                        filteredMails={filteredMails}
                        markMailAsRead={markMailAsRead}
                        deleteMail={deleteMail}
                        archiveMail={archiveMail}
                        toggleMailStar={toggleMailStar}
                        claimMailReward={claimMailReward}
                        formatTimeLeft={formatTimeLeft}
                        TABS={TABS}
                    />
                )}
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
                                    const toDelete = mails.filter(
                                        (m: any) => m.tab === 'INBOX' && !m.rewards && m.id !== 'welcome-mail',
                                    );
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
