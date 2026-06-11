import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';

export const PurchaseModal: React.FC<{ onClose: () => void; onBuy: () => void }> = ({ onClose, onBuy }) => {
    const { crystals } = useGameStore();
    const price = 999;
    const hasEnough = crystals >= price;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(20px)',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, rotateX: 20 }}
                animate={{ scale: 1, rotateX: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '900px',
                    background: 'radial-gradient(circle at center, #1b120c 0%, #0a0604 100%)',
                    borderRadius: '16px',
                    border: '4px solid #b8860b',
                    overflow: 'hidden',
                    display: 'flex',
                    position: 'relative',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.95), inset 0 0 40px rgba(0,0,0,0.85)',
                }}
            >
                <div style={{ flex: 1, padding: '50px' }}>
                    <h2
                        style={{
                            fontSize: '42px',
                            color: '#ffd700',
                            fontFamily: "'Cinzel', serif",
                            margin: 0,
                            textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                        }}
                    >
                        ЗОЛОТОЙ ПРОПУСК
                    </h2>
                    <p
                        style={{
                            fontSize: '15px',
                            color: '#c8a870',
                            marginTop: '10px',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            fontWeight: 900,
                        }}
                    >
                        РАЗБЛОКИРУЙТЕ МАКСИМУМ ВОЗМОЖНОСТЕЙ
                    </p>

                    <ul
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            marginTop: '30px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                        }}
                    >
                        {[
                            'Эксклюзивная дорожка наград',
                            'Уникальный скин "Лазурный Дракон"',
                            'Уникальная рамка и аватар на 5 и 10 уровнях',
                        ].map((text, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    color: '#fff',
                                }}
                            >
                                <span style={{ color: '#ffd700', fontSize: '20px' }}>✔</span> {text}
                            </li>
                        ))}
                    </ul>

                    {/* Показ ошибки о нехватке алмазов */}
                    {!hasEnough && (
                        <div
                            style={{
                                color: '#ff4444',
                                fontSize: '14px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                marginTop: '30px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                        >
                            ⚠️ НЕДОСТАТОЧНО АЛМАЗОВ (ВАШ БАЛАНС: {crystals}{' '}
                            <img
                                src="/assets/images/ui/icons/almaz.webp"
                                alt="Gems"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    objectFit: 'contain',
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                    marginTop: '-3px',
                                }}
                            />
                            )
                        </div>
                    )}

                    <div
                        style={{
                            marginTop: hasEnough ? '45px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '28px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '18px',
                                    color: 'rgba(255,255,255,0.3)',
                                    textDecoration: 'line-through',
                                    marginRight: '12px',
                                }}
                            >
                                1999
                            </span>
                            <span style={{ marginRight: '6px' }}>999</span>
                            <img
                                src="/assets/images/ui/icons/almaz.webp"
                                alt="Gems"
                                style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                            />
                        </div>
                        <motion.button
                            whileHover={hasEnough ? { scale: 1.05 } : {}}
                            whileTap={hasEnough ? { scale: 0.92 } : {}}
                            onClick={hasEnough ? onBuy : undefined}
                            disabled={!hasEnough}
                            style={{
                                padding: '15px 45px',
                                background: hasEnough
                                    ? 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: hasEnough ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: hasEnough ? '#1a0d00' : 'rgba(255, 255, 255, 0.2)',
                                fontWeight: 900,
                                fontSize: '18px',
                                fontFamily: "'Cinzel', serif",
                                cursor: hasEnough ? 'pointer' : 'default',
                                boxShadow: hasEnough
                                    ? '0 10px 30px rgba(240,192,64,0.4), inset 0 0 8px rgba(255,255,255,0.6)'
                                    : 'none',
                                letterSpacing: '1.5px',
                            }}
                        >
                            {hasEnough ? 'РАЗБЛОКИРОВАТЬ' : 'НЕДОСТАТОЧНО СРЕДСТВ'}
                        </motion.button>
                    </div>
                </div>
                <div
                    style={{
                        width: '320px',
                        background: 'linear-gradient(180deg, #251b14 0%, #150f0c 100%)',
                        borderLeft: '3px solid #b8860b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '140px',
                        boxShadow: 'inset 5px 0 15px rgba(0,0,0,0.5)',
                        position: 'relative',
                    }}
                >
                    <motion.div
                        animate={{
                            filter: [
                                'drop-shadow(0 0 5px rgba(255,215,0,0.3))',
                                'drop-shadow(0 0 25px rgba(255,215,0,0.7))',
                                'drop-shadow(0 0 5px rgba(255,215,0,0.3))',
                            ],
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    >
                        👑
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};
