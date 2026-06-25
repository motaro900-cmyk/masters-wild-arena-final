import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, EMBLEMS } from './ClanShared';

interface ClanSettingsModalProps {
    isEditingClan: boolean;
    setIsEditingClan: (editing: boolean) => void;
    editedMotto: string;
    setEditedMotto: (motto: string) => void;
    selectedEmblem: string;
    setSelectedEmblem: (emblem: string) => void;
    handleSaveChanges: () => void;
    colors: any;
    isLight: boolean;
}

export const ClanSettingsModal: React.FC<ClanSettingsModalProps> = ({
    isEditingClan,
    setIsEditingClan,
    editedMotto,
    setEditedMotto,
    selectedEmblem,
    setSelectedEmblem,
    handleSaveChanges,
    colors,
    isLight,
}) => {
    return (
        <AnimatePresence>
            {isEditingClan && (
                <div
                    onClick={() => setIsEditingClan(false)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.88)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.93, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.93, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '460px',
                            background: isLight ? '#f5f0e1' : 'linear-gradient(135deg, #221810 0%, #0f0a06 100%)',
                            border: `2px solid ${colors.accent}`,
                            borderRadius: '24px',
                            padding: '36px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                        }}
                    >
                        <h3
                            style={{
                                color: colors.accent,
                                fontSize: '26px',
                                marginBottom: '28px',
                                fontFamily: "'Cinzel', serif",
                                textAlign: 'center',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            Управление Кланом
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Motto input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        color: colors.accent,
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        opacity: 0.8,
                                    }}
                                >
                                    Девиз клана
                                </label>
                                <input
                                    type="text"
                                    value={editedMotto}
                                    onChange={(e) => setEditedMotto(e.target.value)}
                                    placeholder="Введите девиз или описание клана..."
                                    maxLength={80}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: `1.5px solid ${colors.border}`,
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            </div>

                            {/* Emblem Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        color: colors.accent,
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        opacity: 0.8,
                                    }}
                                >
                                    Эмблема клана
                                </label>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '12px',
                                        marginTop: '4px',
                                    }}
                                >
                                    {EMBLEMS.map((e) => {
                                        const emojiMap: Record<string, string> = {
                                            lion: '🦁',
                                            bear: '🐻',
                                            eagle: '🦅',
                                            wolf: '🐺',
                                            fox: '🦊',
                                            tiger: '🐯',
                                            dragon: '🐉',
                                            owl: '🦉',
                                        };
                                        const isSelected = selectedEmblem === e;
                                        return (
                                            <motion.button
                                                key={e}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedEmblem(e)}
                                                style={{
                                                    aspectRatio: '1',
                                                    background: isSelected
                                                        ? 'radial-gradient(circle, rgba(240,192,64,0.3) 0%, rgba(200,149,42,0.1) 100%)'
                                                        : 'rgba(0,0,0,0.3)',
                                                    border: isSelected
                                                        ? `2px solid ${colors.accent}`
                                                        : `1.5px solid rgba(255,255,255,0.1)`,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    fontSize: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: isSelected ? '0 0 15px rgba(240,192,64,0.4)' : 'none',
                                                    transition: 'border-color 0.2s, background-color 0.2s',
                                                }}
                                            >
                                                {emojiMap[e] || '🛡️'}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                <ActionButton
                                    label="СОХРАНИТЬ ИЗМЕНЕНИЯ"
                                    color={colors.accent}
                                    onClick={handleSaveChanges}
                                />
                                <ActionButton
                                    label="ОТМЕНА"
                                    color="rgba(255,255,255,0.3)"
                                    onClick={() => setIsEditingClan(false)}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
export default ClanSettingsModal;
