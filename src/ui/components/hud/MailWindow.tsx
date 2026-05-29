import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

interface MailWindowProps {
    onClose: () => void;
}

export const MailWindow: React.FC<MailWindowProps> = () => {
    const {
        mail: mails,
        markMailAsRead,
        deleteMail,
        toggleMailStar,
        claimMailReward,
        collectAllMailRewards,
        sendFeedback,
        archiveMail,
        playerId,
    } = useGameStore();

    const [view, setView] = useState<'LIST' | 'READ' | 'WRITE'>('LIST');
    const [activeTab, setActiveTab] = useState<'INBOX' | 'NEWS' | 'ARCHIVE' | 'SUPPORT' | 'PROMO'>('INBOX');
    const [selectedMail, setSelectedMail] = useState<any>(null);
    const [feedbackCategory, setFeedbackCategory] = useState<'BUG' | 'IDEA' | 'QUESTION'>('BUG');
    const [feedbackText, setFeedbackText] = useState('');
    const [promoInput, setPromoInput] = useState('');
    const [promoStatus, setPromoStatus] = useState<{ msg: string; type: 'SUCCESS' | 'ERROR' | 'IDLE' }>({
        msg: '',
        type: 'IDLE',
    });

    const { redeemPromoCode } = useGameStore();

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

    const filteredMails =
        activeTab === 'ARCHIVE'
            ? mails.filter((m: any) => m.tab === 'ARCHIVE')
            : mails.filter((m: any) => m.tab === activeTab);

    const handleSendFeedback = () => {
        if (!feedbackText.trim()) return;
        sendFeedback(feedbackCategory, feedbackText);
        setFeedbackText('');
        alert('Спасибо! Ваш отзыв отправлен Королевской Почтой.');
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
                height: '620px',
                backgroundColor: 'transparent',
                padding: '10px 30px',
                display: 'flex',
                flexDirection: 'column',
                color: colors.text,
            }}
        >
            {/* ВКЛАДКИ */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
            >
                <div style={{ display: 'flex', gap: '10px' }}>
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
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: '0.3s',
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
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                    padding: '20px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '15px',
                                    border: `1px solid ${colors.border}`,
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
                                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
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
                                                              : AssetsMap.UI.ICON_ALMAZ_FULL
                                                    }
                                                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                                                    alt="reward"
                                                />
                                                <span style={{ fontWeight: 900, color: colors.accent }}>
                                                    {r.amount.toLocaleString()}
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
            {view === 'LIST' && activeTab !== 'SUPPORT' && activeTab !== 'PROMO' && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ marginTop: '20px', display: 'flex', gap: '10px' }}
                >
                    <button
                        onClick={() => alert('Написание личных писем будет доступно в v1.2')}
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
                        onClick={() => collectAllMailRewards()}
                        style={{
                            flex: 2,
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
                </motion.div>
            )}
        </div>
    );
};
