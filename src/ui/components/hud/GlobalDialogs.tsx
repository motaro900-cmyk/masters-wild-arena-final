import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';

export const AlertDialog: React.FC = () => {
    const activeAlert = useGameStore((state) => state.activeAlert);

    if (!activeAlert) return null;

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    pointerEvents: 'auto',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(28, 18, 12, 0.95) 0%, rgba(12, 6, 4, 0.99) 100%)',
                        border: '1px solid rgba(240, 192, 64, 0.3)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(240, 192, 64, 0.1)',
                        borderRadius: '16px',
                        padding: '28px',
                        width: 'min(380px, 92vw)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        textAlign: 'center',
                        fontFamily: "'Philosopher', 'Nunito', sans-serif",
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
                    <div
                        style={{
                            color: '#eedfa0',
                            fontSize: '15.5px',
                            fontWeight: 700,
                            lineHeight: '1.5',
                            marginBottom: '24px',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {activeAlert.message}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={activeAlert.onOk}
                            style={{
                                width: '140px',
                                padding: '10px 0',
                                background: 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#1a0f00',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(240, 192, 64, 0.2)',
                                transition: 'all 0.2s',
                            }}
                        >
                            ОК
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const ConfirmDialog: React.FC = () => {
    const activeConfirm = useGameStore((state) => state.activeConfirm);

    if (!activeConfirm) return null;

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(28, 18, 12, 0.95) 0%, rgba(12, 6, 4, 0.99) 100%)',
                        border: '1px solid rgba(240, 192, 64, 0.3)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(240, 192, 64, 0.1)',
                        borderRadius: '16px',
                        padding: '28px',
                        width: 'min(380px, 92vw)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        textAlign: 'center',
                        fontFamily: "'Philosopher', 'Nunito', sans-serif",
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
                    <div
                        style={{
                            color: '#eedfa0',
                            fontSize: '15.5px',
                            fontWeight: 700,
                            lineHeight: '1.5',
                            marginBottom: '24px',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {activeConfirm.message}
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <button
                            onClick={activeConfirm.onCancel}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            ОТМЕНА
                        </button>
                        <button
                            onClick={activeConfirm.onConfirm}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                background: 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#1a0f00',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(240, 192, 64, 0.2)',
                                transition: 'all 0.2s',
                            }}
                        >
                            ПОДТВЕРДИТЬ
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
