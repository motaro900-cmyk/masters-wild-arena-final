import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClanEmblemIcon } from '../../GameIcons';

interface ClanSuccessModalProps {
    showSuccess: boolean;
    setShowSuccess: (show: boolean) => void;
    setView: (view: 'BROWSE' | 'CREATE' | 'DASHBOARD') => void;
    selectedEmblem: string;
    createdClanName: string;
    colors: any;
}

export const ClanSuccessModal: React.FC<ClanSuccessModalProps> = ({
    showSuccess,
    setShowSuccess,
    setView,
    selectedEmblem,
    createdClanName,
    colors,
}) => {
    return (
        <AnimatePresence>
            {showSuccess && (
                <div
                    onClick={() => {
                        setShowSuccess(false);
                        setView('DASHBOARD');
                    }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(15px)',
                        cursor: 'pointer',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '30px',
                            position: 'relative',
                            padding: '40px',
                            cursor: 'default',
                        }}
                    >
                        {/* Кнопка закрытия (крестик) */}
                        <button
                            onClick={() => {
                                setShowSuccess(false);
                                setView('DASHBOARD');
                            }}
                            style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1.5px solid rgba(251, 191, 36, 0.4)',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                color: '#fbbf24',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: '0 0 10px rgba(251, 191, 36, 0.1)',
                            }}
                        >
                            ✖
                        </button>

                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            style={{
                                filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <ClanEmblemIcon emblem={selectedEmblem} size={160} />
                        </motion.div>

                        <div>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    color: colors.accent,
                                    fontSize: '42px',
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '4px',
                                }}
                            >
                                Клан Основан!
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                style={{ color: '#fff', fontSize: '18px', opacity: 0.8, marginTop: '10px' }}
                            >
                                Да начнется великая история клана{' '}
                                <span style={{ color: colors.accent, fontWeight: 900 }}>
                                    {createdClanName}
                                </span>
                            </motion.p>
                        </div>

                        <motion.button
                            promo-code-animation-fix=""
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                setShowSuccess(false);
                                setView('DASHBOARD');
                            }}
                            style={{
                                padding: '20px 60px',
                                background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                border: 'none',
                                borderRadius: '40px',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(240,192,64,0.4)',
                                textTransform: 'uppercase',
                            }}
                        >
                            В Штаб Клана
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
export default ClanSuccessModal;
