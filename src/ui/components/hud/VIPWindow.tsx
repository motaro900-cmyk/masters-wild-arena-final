import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';

interface VIPWindowProps {
    onClose: () => void;
}

export const VIPWindow: React.FC<VIPWindowProps> = ({ onClose }) => {
    const { vipLevel, vipExp } = useGameStore();

    const vipPoints = vipExp;
    const nextLevelPoints = (vipLevel + 1) * 1000;
    const progress = (vipPoints / nextLevelPoints) * 100;

    const benefits = [
        { icon: '💰', text: 'БОНУС ЗОЛОТА В БОЯХ: +15%', unlocked: vipLevel >= 1 },
        { icon: '✨', text: 'БОНУС ОПЫТА ГЕРОЯ: +10%', unlocked: vipLevel >= 1 },
        { icon: '⚡', text: 'МАКС. ЗАПАС ЭНЕРГИИ: +5', unlocked: vipLevel >= 1 },
    ];

    return (
        <div className="flex flex-col gap-6 p-2">
            {/* 1. HEADER STATUS */}
            <div
                style={{
                    background: 'linear-gradient(180deg, #2a1f1a 0%, #1a120f 100%)',
                    padding: '20px',
                    borderRadius: '15px',
                    border: '1px solid #f0c040',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                }}
            >
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span
                            style={{
                                color: '#a0a0a0',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            Ваш Статус
                        </span>
                        <span
                            style={{
                                color: '#f0c040',
                                fontSize: '32px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 0 10px rgba(240,192,64,0.3)',
                            }}
                        >
                            VIP {vipLevel}
                        </span>
                    </div>
                    <div className="text-right">
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                            {vipPoints} / {nextLevelPoints} XP
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div
                    style={{
                        height: '14px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '7px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #8a5a10, #f0c040, #8a5a10)',
                            boxShadow: '0 0 15px rgba(240,192,64,0.5)',
                        }}
                    />
                </div>

                {/* ИНФО О НАЧИСЛЕНИИ */}
                <div
                    style={{
                        background: 'rgba(240,192,64,0.1)',
                        border: '1px dashed rgba(240,192,64,0.3)',
                        borderRadius: '8px',
                        padding: '10px',
                        textAlign: 'center',
                    }}
                >
                    <span style={{ color: '#f0c040', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        💎 1 КУПЛЕННЫЙ АЛМАЗ = 1 ОЧКО VIP ОПЫТА
                    </span>
                </div>
            </div>

            {/* 2. BENEFITS LIST */}
            <div className="flex flex-col gap-3">
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#f0c040',
                        fontSize: '16px',
                        borderBottom: '1px solid rgba(240,192,64,0.2)',
                        paddingBottom: '8px',
                    }}
                >
                    Привилегии VIP 1
                </h3>

                <div className="flex flex-col gap-2">
                    {benefits.map((b, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '15px',
                                background: b.unlocked ? 'rgba(240,192,64,0.08)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                border: `1px solid ${b.unlocked ? 'rgba(240,192,64,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <span
                                style={{ fontSize: '28px', filter: b.unlocked ? 'none' : 'grayscale(1) opacity(0.5)' }}
                            >
                                {b.icon}
                            </span>
                            <span
                                style={{
                                    color: b.unlocked ? '#fff' : '#5a4a3a',
                                    fontSize: '14px',
                                    fontWeight: b.unlocked ? '900' : 'bold',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                {b.text}
                            </span>
                            {b.unlocked ? (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        color: '#f0c040',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    АКТИВНО
                                </span>
                            ) : (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        color: '#5a4a3a',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    ЗАБЛОКИРОВАНО
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. ACTION BUTTON */}
            <button
                onClick={() => {
                    onClose();
                    // Переход в магазин, раздел БАНК -> АЛМАЗЫ
                    useGameStore.getState().goToShop('BANK', 'GEMS');
                }}
                style={{
                    marginTop: '5px',
                    padding: '20px',
                    background: 'linear-gradient(180deg, #f0c040 0%, #8a5a10 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#000',
                    fontSize: '18px',
                    fontWeight: '900',
                    fontFamily: "'Cinzel', serif",
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                    transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(240,192,64,0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)';
                }}
            >
                ПОЛУЧИТЬ VIP
            </button>
        </div>
    );
};
