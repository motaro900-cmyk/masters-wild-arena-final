import React from 'react';
import { motion } from 'framer-motion';
import { resolveAvatarPath } from '../../../../configs/ProfileCustomization';

interface FoundPlayerCardProps {
    foundPlayer: any;
    colors: any;
    onAdd: () => void;
}

export const FoundPlayerCard: React.FC<FoundPlayerCardProps> = ({ foundPlayer, colors, onAdd }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(240,192,64,0.05)',
                border: `2px solid ${colors.accent}`,
                borderRadius: 12,
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                marginTop: 10,
            }}
        >
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        width: 55,
                        height: 55,
                        background: '#1a1008',
                        borderRadius: 10,
                        border: `2px solid ${colors.accent}`,
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
                            backgroundImage: `url(${resolveAvatarPath(foundPlayer.фото || foundPlayer.avatar)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                </div>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: colors.accent,
                        }}
                    >
                        {foundPlayer.имя || foundPlayer.name
                            ? (foundPlayer.имя || foundPlayer.name).split(' ')[0]
                            : 'Мастер'}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 900,
                            background: 'rgba(240,192,64,0.1)',
                            color: colors.accent,
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        LVL {foundPlayer.уровень || foundPlayer.level || 1}
                    </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 700 }}>ID: {foundPlayer.id}</div>
                <div style={{ fontSize: 9, color: colors.accent, marginTop: 4, fontWeight: 900 }}>РЕЗУЛЬТАТ ПОИСКА</div>
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={onAdd}
                style={{
                    padding: '10px 15px',
                    background: colors.accent,
                    border: 'none',
                    borderRadius: 8,
                    color: '#000',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: "'Cinzel', serif",
                }}
            >
                ДОБАВИТЬ
            </motion.button>
        </motion.div>
    );
};
