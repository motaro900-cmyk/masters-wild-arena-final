import React from 'react';
import { motion } from 'framer-motion';

const colors = {
    text: '#e8d8a8',
    accent: '#f0c040',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(240,192,64,0.15)',
    danger: '#ef4444',
    success: '#22c55e',
    input: 'rgba(0,0,0,0.3)',
};

interface MailSupportTabProps {
    isMobile: boolean;
    activeTab: 'SUPPORT';
    setActiveTab: (tab: 'INBOX' | 'NEWS' | 'ARCHIVE' | 'SUPPORT' | 'PROMO') => void;
    feedbackCategory: 'BUG' | 'IDEA' | 'QUESTION';
    setFeedbackCategory: (cat: 'BUG' | 'IDEA' | 'QUESTION') => void;
    feedbackText: string;
    setFeedbackText: (text: string) => void;
    playerId: string;
    handleSendFeedback: () => void;
    TABS: readonly string[];
}

export const MailSupportTab: React.FC<MailSupportTabProps> = ({
    isMobile,
    activeTab,
    setActiveTab,
    feedbackCategory,
    setFeedbackCategory,
    feedbackText,
    setFeedbackText,
    playerId,
    handleSendFeedback,
    TABS,
}) => {
    return (
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
    );
};
export default MailSupportTab;
