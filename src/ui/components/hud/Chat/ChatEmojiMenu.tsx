import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_TABS = [
    { id: 'general', label: '😊', list: ['👋', '😂', '😎', '😡', '🤔', '🙌', '👀', '✨', '🔥', '❤️'] },
    { id: 'combat', label: '⚔️', list: ['🐉', '⚔️', '🛡️', '👊', '💥', '💀', '🩸', '🏹', '🐎', '🏆'] },
    { id: 'magic', label: '🔮', list: ['⚡', '💎', '💰', '👑', '🍀', '🌟', '☄️', '🌀', '🗝️', '📜'] },
];

interface ChatEmojiMenuProps {
    showEmoji: boolean;
    activeTab: string;
    setActiveTab: (val: string) => void;
    addEmoji: (emoji: string) => void;
}

export const ChatEmojiMenu: React.FC<ChatEmojiMenuProps> = ({ showEmoji, activeTab, setActiveTab, addEmoji }) => {
    const currentEmojis = EMOJI_TABS.find((t) => t.id === activeTab)?.list || [];

    return (
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
                        width: 220,
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

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
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
    );
};
