import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface RefreshConfirmOverlayProps {
    dailyAdWatchesCount: number;
    onCancel: () => void;
    onConfirm: (currency: 'gold' | 'gem' | 'ad') => void;
}

export const RefreshConfirmOverlay: React.FC<RefreshConfirmOverlayProps> = ({
    dailyAdWatchesCount,
    onCancel,
    onConfirm,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 3000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '500px',
                    background: 'rgba(20,18,18,0.98)',
                    borderRadius: '20px',
                    border: '2.5px solid #f0c040',
                    boxShadow: '0 0 40px rgba(240,192,64,0.2), inset 0 0 20px rgba(0,0,0,0.8)',
                    padding: '35px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                }}
            >
                <span
                    style={{
                        fontSize: '11px',
                        color: '#f0c040',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        fontFamily: "'Cinzel', serif",
                    }}
                >
                    ОБНОВЛЕНИЕ АССОРТИМЕНТА
                </span>
                <div style={{ fontSize: '48px' }}>🔄</div>
                <h3
                    style={{
                        margin: 0,
                        color: '#fff',
                        fontFamily: "'Cinzel', 'Philosopher', serif",
                        fontSize: '22px',
                    }}
                >
                    Обновить товары сейчас?
                </h3>
                <p
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        textAlign: 'center',
                        fontSize: '13px',
                        margin: '0',
                        lineHeight: '1.4',
                    }}
                >
                    Это обновит ассортимент — 4 новых случайных предмета в каждой категории с учётом вашего уровня.
                    Выберите способ оплаты:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <button
                        onClick={() => onConfirm('gold')}
                        style={{
                            height: '45px',
                            background: 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#1a0f00',
                            fontWeight: 900,
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <span>500 Золота</span>
                        <img
                            src={AssetsMap.UI.ICON_GOLD_FULL}
                            alt="Золото"
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        />
                    </button>
                    <button
                        onClick={() => onConfirm('gem')}
                        style={{
                            height: '45px',
                            background: 'linear-gradient(180deg, #00ffff 0%, #008888 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#000',
                            fontWeight: 900,
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <span>10 Кристаллов</span>
                        <img
                            src={AssetsMap.UI.ICON_ALMAZ_FULL}
                            alt="Кристаллы"
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        />
                    </button>
                    <button
                        onClick={() => onConfirm('ad')}
                        disabled={dailyAdWatchesCount >= 2}
                        style={{
                            height: '45px',
                            background:
                                dailyAdWatchesCount >= 2
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'linear-gradient(180deg, #4ade80 0%, #166534 100%)',
                            border: dailyAdWatchesCount >= 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            borderRadius: '8px',
                            color: dailyAdWatchesCount >= 2 ? 'rgba(255,255,255,0.3)' : '#fff',
                            fontWeight: 900,
                            fontSize: '16px',
                            cursor: dailyAdWatchesCount >= 2 ? 'not-allowed' : 'pointer',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        {dailyAdWatchesCount >= 2 ? 'Лимит рекламы исчерпан' : 'Бесплатно за рекламу 📺'}
                    </button>

                    <button
                        onClick={onCancel}
                        style={{
                            height: '40px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            marginTop: '5px',
                        }}
                    >
                        ОТМЕНА
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
