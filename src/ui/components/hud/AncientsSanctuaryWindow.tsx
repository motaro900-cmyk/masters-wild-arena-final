import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';

export const AncientsSanctuaryWindow: React.FC = () => {
    const { pveStage, maxPveStage, startPveBattle } = useGameStore();

    const floors = Array.from({ length: 5 }, (_, i) => pveStage + i);

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            {/* ТЕКУЩИЙ СТАТУС */}
            <div style={{ 
                textAlign: 'center', 
                marginBottom: '30px', 
                background: 'rgba(0,0,0,0.3)', 
                padding: '15px', 
                borderRadius: '12px',
                border: '1px solid rgba(240,192,64,0.2)'
            }}>
                <div style={{ fontSize: '14px', color: '#f0c040', fontWeight: 900, letterSpacing: '2px', marginBottom: '5px' }}>ВАШ ТЕКУЩИЙ ЭТАЖ</div>
                <div style={{ fontSize: '48px', fontFamily: "'Cinzel', serif", fontWeight: 900, textShadow: '0 0 20px rgba(240,192,64,0.4)' }}>{pveStage}</div>
            </div>

            {/* СПИСОК ПРЕДСТОЯЩИХ ЭТАЖЕЙ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                {floors.map((floor, idx) => {
                    const isBoss = floor % 5 === 0;
                    const isCurrent = floor === pveStage;

                    return (
                        <motion.div
                            key={floor}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '15px 20px',
                                background: isCurrent ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.05)',
                                border: isCurrent ? '2px solid #f0c040' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                opacity: isCurrent ? 1 : 0.6
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    background: isBoss ? '#ef4444' : '#333',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: '18px'
                                }}>
                                    {isBoss ? '💀' : floor}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '14px' }}>
                                        {isBoss ? 'СТРАЖ ОБИТЕЛИ' : `Древний Дух - Ур.${floor}`}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                                        Награда: {floor * 100} золота {isBoss && '+ 20 кристаллов'}
                                    </div>
                                </div>
                            </div>
                            {isCurrent && (
                                <div style={{ fontSize: '12px', color: '#f0c040', fontWeight: 900, animation: 'pulse 1.5s infinite' }}>
                                    ТЕКУЩИЙ ЦЕЛЬ
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* КНОПКА В БОЙ */}
            <button
                onClick={() => startPveBattle(pveStage)}
                style={{
                    width: '100%',
                    padding: '20px',
                    background: 'linear-gradient(180deg, #f0c040, #c87820)',
                    border: 'none',
                    borderRadius: '15px',
                    color: '#1a1008',
                    fontSize: '20px',
                    fontWeight: 900,
                    fontFamily: "'Cinzel', serif",
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                ВСТУПИТЬ В БОЙ
            </button>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};
