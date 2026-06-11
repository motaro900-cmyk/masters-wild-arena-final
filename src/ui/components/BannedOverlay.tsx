import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

/**
 * Оверлей блокировки аккаунта (ban).
 * Рендерится поверх всего контента, когда isBanned === true.
 */
export const BannedOverlay = React.memo(() => {
    const isBanned = useGameStore((state) => state.isBanned);
    const banReason = useGameStore((state) => state.banReason);
    const banUntil = useGameStore((state) => state.banUntil);

    return (
        <AnimatePresence>
            {isBanned && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 999999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(20px)',
                        backgroundColor: 'rgba(15, 5, 5, 0.95)',
                        color: '#fff',
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        padding: '24px',
                        textAlign: 'center',
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        style={{
                            fontSize: '80px',
                            marginBottom: '20px',
                            filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))',
                        }}
                    >
                        🚫
                    </div>
                    <h2
                        style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: '0 0 12px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                        }}
                    >
                        ВАШ АККАУНТ ЗАБЛОКИРОВАН
                    </h2>
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            maxWidth: '500px',
                            marginBottom: '32px',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                color: '#FCA5A5',
                                margin: '0 0 10px 0',
                                fontWeight: 'bold',
                            }}
                        >
                            Причина: {banReason || 'Нарушение правил игры'}
                        </p>
                        {banUntil && (
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#F87171',
                                    margin: 0,
                                }}
                            >
                                Блокировка действует до: {banUntil === 'perm' ? 'Перманентно (навсегда)' : banUntil}
                            </p>
                        )}
                    </div>
                    <p
                        style={{
                            fontSize: '14px',
                            color: '#71717A',
                            maxWidth: '400px',
                            lineHeight: 1.5,
                        }}
                    >
                        Если вы считаете, что блокировка была выдана по ошибке, обратитесь в поддержку игры или напишите
                        разработчикам.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
