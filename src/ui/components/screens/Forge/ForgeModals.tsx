import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styles } from './ForgeStyles';

interface DismantleConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

export const DismantleConfirmModal: React.FC<DismantleConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={styles.modalOverlay} onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 10px 0', color: '#ff4444', fontFamily: "'Cinzel', serif" }}>
                            РАЗОБРАТЬ ПРЕДМЕТ?
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
                            Вы навсегда уничтожите <strong>{itemName}</strong> и получите ценные ресурсы для кузницы:
                        </p>

                        <div style={{ display: 'flex', gap: 15, justifyContent: 'center', margin: '20px 0' }}>
                            <div style={styles.resourceReqItem}>
                                <span>🪙 Золото</span>
                            </div>
                            <div style={styles.resourceReqItem}>
                                <span>🪵 Уголь</span>
                            </div>
                            <div style={styles.resourceReqItem}>
                                <span>🔩 Сталь</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 15, marginTop: 20, width: '100%' }}>
                            <button
                                onClick={onConfirm}
                                style={{ ...styles.modalActionBtn, background: '#ff4444', color: '#fff' }}
                            >
                                ПОДТВЕРДИТЬ
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    ...styles.modalActionBtn,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                }}
                            >
                                ОТМЕНА
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

interface ReforgeConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemReforgeMultiplier: number;
    reforgeNewMultiplier: number | null;
}

export const ReforgeConfirmModal: React.FC<ReforgeConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemReforgeMultiplier,
    reforgeNewMultiplier,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={styles.modalOverlay} onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 10px 0', color: '#f0c040', fontFamily: "'Cinzel', serif" }}>
                            ПЕРЕКОВАТЬ ПРЕДМЕТ?
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
                            Перековка изменяет случайный множитель статов предмета (от 0.95 до 1.30).
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                alignItems: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <span style={{ fontSize: 14 }}>
                                Текущий множитель: <strong>x{itemReforgeMultiplier}</strong>
                            </span>
                            {reforgeNewMultiplier && (
                                <motion.span
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1.2 }}
                                    style={{ fontSize: 16, color: '#10b981', fontWeight: 900 }}
                                >
                                    Новый множитель: x{reforgeNewMultiplier}!
                                </motion.span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span>🪙 500</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span>🔩 4</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 15, marginTop: 20, width: '100%' }}>
                            <button
                                onClick={onConfirm}
                                style={{ ...styles.modalActionBtn, background: '#f0c040', color: '#000' }}
                            >
                                ПЕРЕКОВАТЬ
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    ...styles.modalActionBtn,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                }}
                            >
                                ОТМЕНА
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
