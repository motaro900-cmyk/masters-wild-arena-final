import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { sendGameRequest } from '../../../../utils/VKBridge';
import { useGameStore } from '../../../../store/useGameStore';
import { resolveAvatarPath } from '../../../../configs/ProfileCustomization';

interface FriendRowProps {
    friend: any;
    activeTab: 'ALL' | 'ONLINE' | 'REQUESTS' | 'REWARDS' | 'WORLD';
    isLight: boolean;
    colors: any;
    acceptFriendRequest: (id: string) => void;
    declineFriendRequest: (id: string) => void;
    sendGift: (id: string) => void;
    removeFriend: (id: string) => void;
    friendNote?: string;
    setFriendNote?: (friendId: string, note: string) => void;
}

export const FriendRow: React.FC<FriendRowProps> = ({
    friend,
    activeTab,
    isLight,
    colors,
    acceptFriendRequest,
    declineFriendRequest,
    sendGift,
    removeFriend,
    friendNote,
    setFriendNote,
}) => {
    const [isSending, setIsSending] = useState(false);

    // Formatter for timestamp/date to human-readable Russian
    const formatLastSeen = (lastSeenVal: any): string => {
        if (!lastSeenVal) return 'НЕДАВНО';
        let date: Date;
        try {
            if (typeof lastSeenVal === 'number') {
                date = new Date(lastSeenVal);
            } else if (typeof lastSeenVal === 'string') {
                if (/^\d+$/.test(lastSeenVal)) {
                    date = new Date(Number(lastSeenVal));
                } else {
                    date = new Date(lastSeenVal);
                }
            } else if (lastSeenVal && typeof lastSeenVal.toMillis === 'function') {
                date = new Date(lastSeenVal.toMillis());
            } else if (lastSeenVal && typeof lastSeenVal.seconds === 'number') {
                date = new Date(lastSeenVal.seconds * 1000);
            } else {
                date = new Date(lastSeenVal);
            }
            if (isNaN(date.getTime())) {
                return 'НЕДАВНО';
            }
        } catch (e) {
            return 'НЕДАВНО';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'ТОЛЬКО ЧТО';
        if (diffMins < 60) return `${diffMins} МИН. НАЗАД`;

        const pad = (n: number) => n.toString().padStart(2, '0');
        const hh = pad(date.getHours());
        const mm = pad(date.getMinutes());

        const isToday = now.getDate() === date.getDate() &&
                        now.getMonth() === date.getMonth() &&
                        now.getFullYear() === date.getFullYear();

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = yesterday.getDate() === date.getDate() &&
                            yesterday.getMonth() === date.getMonth() &&
                            yesterday.getFullYear() === date.getFullYear();

        if (isToday) {
            return `СЕГОДНЯ В ${hh}:${mm}`;
        }
        if (isYesterday) {
            return `ВЧЕРА В ${hh}:${mm}`;
        }

        const dd = pad(date.getDate());
        const mon = pad(date.getMonth() + 1);
        const yyyy = date.getFullYear();
        return `${dd}.${mon}.${yyyy} В ${hh}:${mm}`;
    };

    const handleSendGift = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (friend.giftSent || isSending) return;

        setIsSending(true);
        try {
            let success = true;
            if (friend.id.toLowerCase().startsWith('vk-') || friend.vkId) {
                // Returns true if sent successfully, false if cancelled
                success = await sendGameRequest(
                    friend.vkId || friend.id.toLowerCase().replace('vk-', ''),
                    'Я отправил тебе подарок в Masters of the Wild! Заходи скорее!',
                );
            }

            if (success) {
                sendGift(friend.id);
                useGameStore.getState().showAlert('Подарок успешно отправлен! 🎁');
            } else {
                useGameStore.getState().showAlert('Отправка подарка отменена.');
            }
        } catch (err) {
            console.error('[FriendRow] Failed to send gift:', err);
            useGameStore.getState().showAlert('Не удалось отправить подарок.');
        } finally {
            setIsSending(false);
        }
    };

    const displayName = friend.name ? friend.name.split(' ')[0] : 'Мастер';
    const displayedNameLabel = friendNote ? `${friendNote} (${displayName})` : displayName;

    return (
        <div
            onClick={() => {
                const setInspect = useGameStore.getState().setInspectPlayerId;
                if (setInspect) setInspect(friend.id);
            }}
            style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                transition: '0.2s',
                cursor: 'pointer',
            }}
        >
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        width: 55,
                        height: 55,
                        background: isLight ? '#d2b48c' : '#1a1008',
                        borderRadius: 10,
                        border: `2px solid ${colors.border}`,
                        overflow: 'hidden',
                        padding: 2,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 6,
                            overflow: 'hidden',
                            backgroundImage: `url(${resolveAvatarPath(friend.avatar)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                </div>
                {friend.online && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 14,
                            height: 14,
                            background: '#22c55e',
                            borderRadius: '50%',
                            border: `2px solid ${isLight ? '#f5e6c8' : '#0f0a05'}`,
                            boxShadow: '0 0 10px rgba(34,197,94,0.5)',
                        }}
                    />
                )}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: isLight ? '#5d4037' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {displayedNameLabel}
                        {setFriendNote && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newNote = prompt(`Введите заметку/прозвище для ${displayName}:`, friendNote || '');
                                    if (newNote !== null) {
                                        setFriendNote(friend.id, newNote.trim());
                                    }
                                }}
                                style={{
                                    cursor: 'pointer',
                                    opacity: 0.5,
                                    fontSize: 11,
                                    marginLeft: 6,
                                    transition: '0.2s',
                                    userSelect: 'none',
                                }}
                                title="Редактировать заметку"
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            >
                                ✏️
                            </span>
                        )}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 900,
                            background: isLight ? 'rgba(139,69,19,0.1)' : 'rgba(240,192,64,0.1)',
                            color: colors.accent,
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        LVL {friend.level}
                    </span>
                </div>
                <div
                    style={{
                        fontSize: 10,
                        opacity: 0.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    {friend.online ? (
                        <span style={{ color: '#22c55e' }}>● В СЕТИ</span>
                    ) : (
                        <span>БЫЛ(А) {formatLastSeen(friend.lastSeen || friend.былВСети)}</span>
                    )}
                    • ID: {friend.id}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                {activeTab === 'REQUESTS' ? (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                acceptFriendRequest(friend.id);
                            }}
                            style={{
                                width: 40,
                                height: 40,
                                background: '#22c55e',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 18,
                                color: '#fff',
                            }}
                        >
                            ✓
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                declineFriendRequest(friend.id);
                            }}
                            style={{
                                width: 40,
                                height: 40,
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${colors.border}`,
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 18,
                                color: '#ff4444',
                            }}
                        >
                            ×
                        </button>
                    </>
                ) : (
                    <>
                        <motion.button
                            whileHover={friend.giftSent || isSending ? {} : { scale: 1.1 }}
                            whileTap={friend.giftSent || isSending ? {} : { scale: 0.92 }}
                            onClick={handleSendGift}
                            disabled={friend.giftSent || isSending}
                            style={{
                                width: 42,
                                height: 42,
                                background: friend.giftSent ? 'rgba(255,255,255,0.05)' : 'rgba(240,192,64,0.1)',
                                border: `1px solid ${friend.giftSent ? colors.border : colors.accent}`,
                                borderRadius: 12,
                                cursor: friend.giftSent || isSending ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: friend.giftSent ? 0.5 : 1,
                            }}
                        >
                            {isSending ? (
                                <div 
                                    style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        border: '2px solid rgba(255,255,255,0.3)', 
                                        borderTopColor: colors.accent, 
                                        borderRadius: '50%', 
                                        animation: 'spin 1s linear infinite' 
                                    }} 
                                />
                            ) : (
                                <img
                                    src="/assets/images/ui/daily_gift_v2.webp"
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        objectFit: 'contain',
                                        filter: friend.giftSent ? 'grayscale(100%) brightness(0.6)' : 'none',
                                    }}
                                    alt="gift"
                                />
                            )}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 42,
                                height: 42,
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${colors.border}`,
                                borderRadius: 12,
                                cursor: 'pointer',
                                fontSize: 20,
                                color: colors.text,
                            }}
                        >
                            ⚔️
                        </motion.button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFriend(friend.id);
                            }}
                            style={{
                                width: 42,
                                height: 42,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 18,
                                color: '#ff4444',
                                opacity: 0.4,
                            }}
                        >
                            🗑️
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
