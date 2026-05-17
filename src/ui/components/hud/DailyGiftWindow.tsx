import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { safeGetItem, safeSetItem } from '../../../utils/SafeStorage';
import { audioService } from '../../../services/AudioService';

interface DailyGiftWindowProps {
    onClose: () => void;
}

type RewardType = 'GOLD' | 'CRYSTAL' | 'ENERGY';

/**
 * DailyGiftWindow (v2.2) — Использование РЕАЛЬНОГО сундука (iconrgy.webp).
 */
export const DailyGiftWindow: React.FC<DailyGiftWindowProps> = ({ onClose }) => {
    const { addGold, addCrystals, addEnergy, setCanClaimDailyGift } = useGameStore();

    const [status, setStatus] = useState<'READY' | 'OPENING' | 'CLAIMED'>('READY');
    const [reward, setReward] = useState<{ type: RewardType; amount: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const checkStatus = () => {
            const lastClaim = safeGetItem('lastGiftClaim');
            if (!lastClaim) {
                setStatus('READY');
                return;
            }

            const now = new Date();
            const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
            const mskNow = new Date(utcNow + 3 * 3600000);

            const lastClaimDate = new Date(parseInt(lastClaim));
            const utcLast = lastClaimDate.getTime() + lastClaimDate.getTimezoneOffset() * 60000;
            const mskLast = new Date(utcLast + 3 * 3600000);

            // Если день последнего получения меньше текущего дня МСК — значит можно брать
            const isSameDay =
                mskNow.getDate() === mskLast.getDate() &&
                mskNow.getMonth() === mskLast.getMonth() &&
                mskNow.getFullYear() === mskLast.getFullYear();

            if (isSameDay) {
                setStatus('CLAIMED');
                setCanClaimDailyGift(false);
            } else {
                setStatus('READY');
                setCanClaimDailyGift(true);
            }
        };

        const timer = setInterval(() => {
            checkStatus();

            // Расчет времени до полуночи МСК
            const now = new Date();
            const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
            const mskNow = new Date(utcNow + 3 * 3600000);

            const mskMidnight = new Date(mskNow);
            mskMidnight.setHours(24, 0, 0, 0);

            const diff = mskMidnight.getTime() - mskNow.getTime();
            const h = Math.floor(diff / (3600 * 1000));
            const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
            const s = Math.floor((diff % (60 * 1000)) / 1000);

            setTimeLeft(`${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`);
        }, 1000);

        checkStatus();
        return () => clearInterval(timer);
    }, [setCanClaimDailyGift]);

    const handleOpen = () => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setStatus('OPENING');

        const rand = Math.random();
        let type: RewardType = 'GOLD';
        let amount = 0;

        if (rand < 0.1) {
            // АЛМАЗЫ: 10% шанс, от 1 до 20
            type = 'CRYSTAL';
            amount = 1 + Math.floor(Math.random() * 20);
        } else if (rand < 0.3) {
            // ЭНЕРГИЯ: 20% шанс, от 1 до 10
            type = 'ENERGY';
            amount = 1 + Math.floor(Math.random() * 10);
        } else {
            // ЗОЛОТО: 70% шанс, от 50 до 1000
            type = 'GOLD';
            amount = 50 + Math.floor(Math.random() * 950);
        }

        setTimeout(() => {
            setReward({ type, amount });
            setStatus('CLAIMED');
            safeSetItem('lastGiftClaim', Date.now().toString());
            setCanClaimDailyGift(false);

            if (type === 'GOLD') addGold(amount);
            else if (type === 'CRYSTAL') addCrystals(amount);
            else if (type === 'ENERGY') addEnergy(amount);

            useGameStore.getState().updateQuestProgress('OPEN_CHEST', 1);
        }, 1500);
    };

    const getRewardInfo = () => {
        if (!reward) return null;
        switch (reward.type) {
            case 'GOLD':
                return { icon: AssetsMap.UI.ICON_GOLD_FULL, label: 'ЗОЛОТА', color: '#f0c040' };
            case 'CRYSTAL':
                return { icon: AssetsMap.UI.ICON_ALMAZ_FULL, label: 'АЛМАЗОВ', color: '#c084fc' };
            case 'ENERGY':
                return { icon: AssetsMap.UI.ICON_ENERGY_FULL, label: 'ЭНЕРГИИ', color: '#f0c040' };
        }
    };

    const info = getRewardInfo();

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                gap: '20px',
                fontFamily: "'Nunito', sans-serif",
            }}
        >
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
                            animate={{ rotate: [0, -2, 2, -2, 2, 0], scale: [1, 1.03, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            style={{ width: 220, height: 220, cursor: 'pointer', margin: '0 auto' }}
                            onClick={handleOpen}
                        >
                            <img
                                src={AssetsMap.UI.ICON_DAILY_CHEST}
                                alt="chest"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.4))',
                                }}
                            />
                        </motion.div>
                        <h2
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 32,
                                background: 'linear-gradient(180deg, #fff 0%, #f0c040 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginTop: 15,
                                fontWeight: 900,
                                letterSpacing: '2px',
                            }}
                        >
                            ПОДАРОК ЖДЕТ!
                        </h2>

                        {/* СПИСОК ВОЗМОЖНЫХ НАГРАД */}
                        <div
                            style={{
                                marginTop: 15,
                                padding: '10px 20px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '12px',
                                border: '1px solid rgba(240,192,64,0.15)',
                                display: 'inline-flex',
                                gap: '20px',
                                fontSize: '13px',
                                color: '#e0d0b0',
                                fontFamily: "'Cinzel', serif",
                                alignItems: 'center',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <img
                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                    style={{
                                        width: 16,
                                        height: 16,
                                        objectFit: 'contain',
                                        filter: 'contrast(1.2) brightness(1.1)',
                                    }}
                                    alt="gold"
                                />
                                <span style={{ color: '#f0c040', fontWeight: 900, fontSize: '12px' }}>до 1000</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <img
                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                    style={{
                                        width: 16,
                                        height: 16,
                                        objectFit: 'contain',
                                        filter: 'contrast(1.2) brightness(1.1)',
                                    }}
                                    alt="gems"
                                />
                                <span style={{ color: '#c084fc', fontWeight: 900, fontSize: '12px' }}>до 20</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <img
                                    src={AssetsMap.UI.ICON_ENERGY_FULL}
                                    style={{
                                        width: 16,
                                        height: 16,
                                        objectFit: 'contain',
                                        filter: 'contrast(1.2) brightness(1.1)',
                                    }}
                                    alt="energy"
                                />
                                <span style={{ color: '#fff', fontWeight: 900, fontSize: '12px' }}>до 10</span>
                            </div>
                        </div>

                        <p style={{ color: '#8a7a6a', fontSize: 13, marginTop: 15, fontWeight: 'bold', opacity: 0.8 }}>
                            Нажми на сундук, чтобы забрать награду
                        </p>
                    </motion.div>
                )}

                {status === 'OPENING' && (
                    <motion.div
                        key="opening"
                        animate={{ scale: [1, 1.2], rotate: [0, 5, -5, 5, -5, 360], opacity: [1, 1, 0] }}
                        transition={{ duration: 1.5 }}
                        style={{ width: 180, height: 180 }}
                    >
                        <img
                            src={AssetsMap.UI.ICON_DAILY_CHEST}
                            alt="opening"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </motion.div>
                )}

                {status === 'CLAIMED' && reward && (
                    <motion.div
                        key="reward"
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', paddingTop: 40 }}
                    >
                        <div style={{ position: 'relative', width: 70, height: 70, margin: '0 auto' }}>
                            <img
                                src={info?.icon}
                                alt="reward"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: `contrast(1.2) brightness(1.1) drop-shadow(0 0 30px ${info?.color}66)`,
                                }}
                            />
                        </div>
                        <h1
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 38,
                                color: info?.color,
                                margin: '15px 0 0 0',
                                fontWeight: 900,
                                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            +{reward.amount}
                        </h1>
                        <h2
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 18,
                                color: '#fff',
                                letterSpacing: '3px',
                                opacity: 0.7,
                                marginTop: 0,
                            }}
                        >
                            {info?.label}
                        </h2>
                        <button
                            onClick={() => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            style={{
                                marginTop: 65,
                                padding: '16px 60px',
                                background: 'linear-gradient(180deg, #f0c040, #8a5a10)',
                                border: 'none',
                                borderRadius: 12,
                                color: '#000',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 900,
                                fontSize: 18,
                                cursor: 'pointer',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            ЗАБРАТЬ
                        </button>
                    </motion.div>
                )}

                {status === 'CLAIMED' && !reward && (
                    <motion.div
                        key="wait"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div
                            style={{
                                width: 160,
                                height: 160,
                                opacity: 0.4,
                                filter: 'grayscale(0.8) sepia(1) hue-rotate(-20deg)',
                            }}
                        >
                            <img
                                src={AssetsMap.UI.ICON_DAILY_CHEST}
                                alt="wait"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>

                        <h2
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 22,
                                color: '#f0c040',
                                marginTop: 20,
                                lineHeight: 1.4,
                                maxWidth: '300px',
                            }}
                        >
                            СЕГОДНЯ ВЫ УЖЕ ЗАБИРАЛИ ПОДАРОК
                        </h2>

                        <div
                            style={{
                                marginTop: 25,
                                padding: '15px 30px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                border: '1px solid rgba(240,192,64,0.15)',
                            }}
                        >
                            <p
                                style={{
                                    color: '#8a7a6a',
                                    fontSize: 14,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '5px',
                                }}
                            >
                                Следующий подарок через:
                            </p>
                            <span
                                style={{
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontSize: 26,
                                    fontFamily: "'Cinzel', serif",
                                    textShadow: '0 0 10px rgba(240,192,64,0.3)',
                                }}
                            >
                                {timeLeft}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
