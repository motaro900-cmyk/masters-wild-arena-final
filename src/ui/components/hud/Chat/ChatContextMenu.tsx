import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatContextMenuProps {
    isOpen: boolean;
    x: number;
    y: number;
    author: string | null;
    senderId?: string | null;
    onClose: () => void;
    handleMenuAction: (type: string, author: string | null, senderId?: string | null) => void;
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
    isOpen,
    x,
    y,
    author,
    senderId,
    onClose,
    handleMenuAction,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    style={{
                        position: 'fixed',
                        left: x,
                        top: y - 120,
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
                        {author}
                    </div>
                    {[
                        { label: '👤 Профиль', type: 'profile' },
                        { label: '💬 Написать ЛС', type: 'pm' },
                        { label: '📋 Копировать ник', type: 'copy' },
                        { label: '⚠️ Пожаловаться', type: 'report' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            onClick={() => {
                                handleMenuAction(item.type, author, senderId);
                                onClose();
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
    );
};
