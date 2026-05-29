import React from 'react';
import { motion } from 'framer-motion';

interface MobData {
    id: string;
    name: string;
    image: string;
    icon: string;
    isBoss: boolean;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
}

interface EnergyControlPanelProps {
    energy: number;
    maxEnergy: number;
    dailyAdWatchesCount: number;
    adLoading: boolean;
    hasEnoughEnergy: boolean;
    pveStage: number;
    currentMob: MobData;
    onBuyEnergy: () => void;
    onWatchAd: () => void;
    onEnterBattle: () => void;
}

export const EnergyControlPanel: React.FC<EnergyControlPanelProps> = ({
    energy,
    maxEnergy,
    dailyAdWatchesCount,
    adLoading,
    hasEnoughEnergy,
    pveStage,
    currentMob,
    onBuyEnergy,
    onWatchAd,
    onEnterBattle,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to bottom, #0f0a18 0%, #08050c 100%)',
                borderTop: '1px solid rgba(196, 139, 59, 0.25)',
                padding: '18px 40px',
                gap: '24px',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
            }}
        >
            {/* Энергия и покупка/восстановление */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', color: '#888', fontWeight: 700, letterSpacing: '1px' }}>
                            ВАША ЭНЕРГИЯ
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '18px' }}>⚡</span>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                                {energy}
                            </span>
                            <span style={{ fontSize: '14px', color: '#666' }}>/ {maxEnergy}</span>
                        </div>
                    </div>
                    {/* Кнопочка плюс */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onBuyEnergy}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            background: 'rgba(196, 139, 59, 0.2)',
                            border: '1px solid rgba(196, 139, 59, 0.4)',
                            color: '#fbbf24',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        +
                    </motion.button>
                </div>

                {/* Кнопки восстановления */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <motion.button
                        whileHover={{ background: 'rgba(37, 99, 235, 0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onBuyEnergy}
                        style={{
                            background: 'rgba(37, 99, 235, 0.15)',
                            border: '1px solid rgba(37, 99, 235, 0.4)',
                            borderRadius: '6px',
                            padding: '10px 24px',
                            color: '#93c5fd',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            letterSpacing: '1.5px',
                        }}
                    >
                        КУПИТЬ ЭНЕРГИЮ
                    </motion.button>

                    <motion.button
                        whileHover={
                            adLoading || (dailyAdWatchesCount || 0) >= 2
                                ? {}
                                : { background: 'rgba(16, 185, 129, 0.25)' }
                        }
                        whileTap={adLoading || (dailyAdWatchesCount || 0) >= 2 ? {} : { scale: 0.98 }}
                        onClick={onWatchAd}
                        disabled={adLoading || (dailyAdWatchesCount || 0) >= 2}
                        style={{
                            background:
                                (dailyAdWatchesCount || 0) >= 2 ? 'rgba(55, 65, 81, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                            border:
                                (dailyAdWatchesCount || 0) >= 2
                                    ? '1px solid rgba(75, 85, 99, 0.2)'
                                    : '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '6px',
                            padding: '10px 24px',
                            color: (dailyAdWatchesCount || 0) >= 2 ? '#6b7280' : '#a7f3d0',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: adLoading || (dailyAdWatchesCount || 0) >= 2 ? 'not-allowed' : 'pointer',
                            opacity: adLoading || (dailyAdWatchesCount || 0) >= 2 ? 0.6 : 1,
                            letterSpacing: '1.5px',
                        }}
                    >
                        {adLoading
                            ? 'ЗАГРУЗКА...'
                            : (dailyAdWatchesCount || 0) >= 2
                              ? 'ЛИМИТ РЕКЛАМЫ (2/2)'
                              : 'СМОТРЕТЬ РЕКЛАМУ'}
                    </motion.button>
                </div>
            </div>

            <motion.button
                whileHover={
                    hasEnoughEnergy
                        ? {
                              scale: 1.02,
                              background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                              boxShadow: '0 0 25px rgba(251, 191, 36, 0.55)',
                          }
                        : {}
                }
                whileTap={hasEnoughEnergy ? { scale: 0.98 } : {}}
                onClick={onEnterBattle}
                style={{
                    width: '380px',
                    padding: '14px 0',
                    background: !hasEnoughEnergy
                        ? 'rgba(55, 65, 81, 0.3)'
                        : 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                    border: !hasEnoughEnergy ? '1.5px solid rgba(55, 65, 81, 0.5)' : '2px solid #fbbf24',
                    borderRadius: '8px',
                    color: !hasEnoughEnergy ? '#6b7280' : '#fff',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: !hasEnoughEnergy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: !hasEnoughEnergy ? '0 4px 10px rgba(0,0,0,0.4)' : '0 0 15px rgba(251, 191, 36, 0.35)',
                    letterSpacing: '2px',
                    fontFamily: "'Cinzel', serif",
                }}
            >
                <span>{currentMob.isBoss ? `БОСС: ЭТАЖ ${pveStage}` : `В БОЙ: ЭТАЖ ${pveStage}`}</span>
                <span style={{ fontSize: '13px', opacity: 0.8 }}>⚡ 10</span>
            </motion.button>
        </div>
    );
};
