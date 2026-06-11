import React from 'react';
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
}) => {
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
                        }}
                    >
                        {friend.name ? friend.name.split(' ')[0] : 'Мастер'}
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
                        <span>БЫЛ(А) {friend.lastSeen || 'НЕДАВНО'}</span>
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
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                sendGift(friend.id);
                                // Если это пользователь ВК, отправляем ему еще и сообщение в ЛС
                                if (friend.id.toLowerCase().startsWith('vk-') || friend.vkId) {
                                    sendGameRequest(
                                        friend.vkId || friend.id.toLowerCase().replace('vk-', ''),
                                        'Я отправил тебе подарок в Masters of the Wild! Заходи скорее!',
                                    );
                                }
                            }}
                            style={{
                                width: 42,
                                height: 42,
                                background: friend.giftSent ? 'rgba(255,255,255,0.05)' : 'rgba(240,192,64,0.1)',
                                border: `1px solid ${friend.giftSent ? colors.border : colors.accent}`,
                                borderRadius: 12,
                                cursor: friend.giftSent ? 'default' : 'pointer',
                                fontSize: 20,
                                color: friend.giftSent ? 'rgba(255,255,255,0.2)' : colors.accent,
                                opacity: friend.giftSent ? 0.5 : 1,
                            }}
                        >
                            🎁
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
