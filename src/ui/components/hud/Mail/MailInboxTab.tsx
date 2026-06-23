import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';

const colors = {
    text: '#e8d8a8',
    accent: '#f0c040',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(240,192,64,0.15)',
    danger: '#ef4444',
    success: '#22c55e',
    input: 'rgba(0,0,0,0.3)',
};

interface MailInboxTabProps {
    isMobile: boolean;
    activeTab: 'INBOX' | 'NEWS' | 'ARCHIVE';
    setActiveTab: (tab: 'INBOX' | 'NEWS' | 'ARCHIVE' | 'SUPPORT' | 'PROMO') => void;
    view: 'LIST' | 'READ';
    setView: (view: 'LIST' | 'READ' | 'WRITE') => void;
    selectedMail: any;
    setSelectedMail: (mail: any) => void;
    filteredMails: any[];
    markMailAsRead: (id: string) => void;
    deleteMail: (id: string) => void;
    archiveMail: (id: string) => void;
    toggleMailStar: (id: string) => void;
    claimMailReward: (id: string) => void;
    formatTimeLeft: (expiresAt: number) => string;
    TABS: readonly string[];
}

export const MailInboxTab: React.FC<MailInboxTabProps> = ({
    isMobile,
    activeTab,
    setActiveTab,
    view,
    setView,
    selectedMail,
    setSelectedMail,
    filteredMails,
    markMailAsRead,
    deleteMail,
    archiveMail,
    toggleMailStar,
    claimMailReward,
    formatTimeLeft,
    TABS,
}) => {
    return (
        <AnimatePresence mode="wait">
            {view === 'LIST' ? (
                <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
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
            ) : view === 'READ' && selectedMail ? (
                <motion.div
                    key="read"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
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
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
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
    );
};
export default MailInboxTab;
