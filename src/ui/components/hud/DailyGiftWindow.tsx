import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { safeGetItem, safeSetItem } from '../../../utils/SafeStorage';

interface DailyGiftWindowProps {
    onClose: () => void;
}

type RewardType = 'GOLD' | 'CRYSTAL' | 'ENERGY';

/**
 * DailyGiftWindow (v2.2) — Использование РЕАЛЬНОГО сундука (iconrgy.png).
 */
export const DailyGiftWindow: React.FC<DailyGiftWindowProps> = ({ onClose }) => {
    const { addGold, addCrystals } = useGameStore();
    
    const [status, setStatus] = useState<'READY' | 'OPENING' | 'CLAIMED'>('READY');
    const [reward, setReward] = useState<{ type: RewardType, amount: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const checkStatus = () => {
            const lastClaim = safeGetItem('lastGiftClaim');
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;

            if (lastClaim && now - parseInt(lastClaim) < dayInMs) {
                setStatus('CLAIMED');
                updateTimer(parseInt(lastClaim), dayInMs);
            } else {
                setStatus('READY');
            }
        };

        checkStatus();
        const timer = setInterval(checkStatus, 60000);
        return () => clearInterval(timer);
    }, []);

    const updateTimer = (last: number, day: number) => {
        const diff = day - (Date.now() - last);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}ч ${mins}м`);
    };

    const handleOpen = () => {
        setStatus('OPENING');
        
        const rand = Math.random();
        let type: RewardType = 'GOLD';
        let amount = 0;

        if (rand < 0.1) {
            type = 'CRYSTAL';
            amount = 25 + Math.floor(Math.random() * 50);
        } else if (rand < 0.3) {
            type = 'ENERGY';
            amount = 5 + Math.floor(Math.random() * 10);
        } else {
            type = 'GOLD';
            amount = 1500 + Math.floor(Math.random() * 3500);
        }

        setTimeout(() => {
            setReward({ type, amount });
            setStatus('CLAIMED');
                safeSetItem('lastGiftClaim', Date.now().toString());
        }, 1500);
    };

    const getRewardInfo = () => {
        if (!reward) return null;
        switch(reward.type) {
            case 'GOLD': return { icon: AssetsMap.UI.ICON_GOLD_FULL, label: 'ЗОЛОТА', color: '#f0c040' };
            case 'CRYSTAL': return { icon: AssetsMap.UI.ICON_ALMAZ_FULL, label: 'АЛМАЗОВ', color: '#c084fc' };
            case 'ENERGY': return { icon: AssetsMap.UI.ICON_ENERGY_FULL, label: 'ЭНЕРГИИ', color: '#f0c040' };
        }
    };

    const info = getRewardInfo();

    return (
        <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '30px',
            fontFamily: "'Nunito', sans-serif"
        }}>
            
            <AnimatePresence mode="wait">
                {status === 'READY' && (
                    <motion.div 
                        key="ready"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        style={{ textAlign: 'center' }}
                    >
                        <motion.div 
                            animate={{ rotate: [0, -3, 3, -3, 3, 0], scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ width: 220, height: 220, cursor: 'pointer', margin: '0 auto' }}
                            onClick={handleOpen}
                        >
                            <img 
                                src={AssetsMap.UI.ICON_DAILY_CHEST} 
                                alt="chest" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(240,192,64,0.5))' }} 
                            />
                        </motion.div>
                        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 28, color: '#f0c040', marginTop: 25, letterSpacing: '1px' }}>
                            ТВОЁ СОКРОВИЩЕ ГОТОВО!
                        </h2>
                        <p style={{ opacity: 0.6, fontSize: 16 }}>Нажми на сундук, чтобы открыть его</p>
                    </motion.div>
                )}

                {status === 'OPENING' && (
                    <motion.div 
                        key="opening"
                        animate={{ scale: [1, 1.4], rotate: [0, 15, -15, 15, -15, 720], opacity: [1, 1, 0] }}
                        transition={{ duration: 1.5 }}
                        style={{ width: 220, height: 220 }}
                    >
                        <img src={AssetsMap.UI.ICON_DAILY_CHEST} alt="opening" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </motion.div>
                )}

                {status === 'CLAIMED' && reward && (
                    <motion.div 
                        key="reward"
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
                             <img 
                                src={info?.icon} 
                                alt="reward" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 50px ${info?.color})` }} 
                            />
                        </div>
                        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 48, color: info?.color, margin: '20px 0 5px 0', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                            +{reward.amount}
                        </h1>
                        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 24, color: '#fff', letterSpacing: '3px', opacity: 0.9 }}>
                            {info?.label}
                        </h2>
                        <button 
                            onClick={onClose}
                            style={{
                                marginTop: 40, padding: '18px 50px', background: 'linear-gradient(180deg, #f0c040, #c87820)',
                                border: 'none', borderRadius: 12, color: '#1a0f00', fontFamily: "'Cinzel', serif",
                                fontWeight: 900, fontSize: 20, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                                transition: '0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            В ИНВЕНТАРЬ
                        </button>
                    </motion.div>
                )}

                {status === 'CLAIMED' && !reward && (
                    <motion.div 
                        key="wait"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ width: 150, height: 150, opacity: 0.3, margin: '0 auto' }}>
                            <img src={AssetsMap.UI.ICON_DAILY_CHEST} alt="wait" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(1)' }} />
                        </div>
                        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 24, color: '#f0c040', marginTop: 25 }}>
                            СОКРОВИЩНИЦА ПУСТА
                        </h2>
                        <p style={{ opacity: 0.6, fontSize: 18, marginTop: 10 }}>
                            Следующий сундук будет доступен через:<br/>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{timeLeft}</span>
                        </p>
                        <button onClick={onClose} style={{ marginTop: 40, background: 'transparent', border: '1px solid rgba(240,192,64,0.3)', color: '#f0c040', padding: '12px 40px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 14 }}>ЗАКРЫТЬ</button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
