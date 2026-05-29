import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { safeGetItem, safeSetItem } from '../../../utils/SafeStorage';
import { audioService } from '../../../services/AudioService';
import { GiftCongratsModal } from './DailyGift/GiftCongratsModal';

// Pure helper functions outside component to satisfy react-hooks/purity
const getNowString = () => Date.now().toString();
const getNow = () => Date.now();
const getRandomSectorIndex = () => Math.floor(Math.random() * 8);
const rollMegaChest = () => {
    const rand = Math.random();
    if (rand < 0.3333) {
        return { type: 'CRYSTAL' as RewardType, amount: 50 };
    } else if (rand < 0.6666) {
        return { type: 'GOLD' as RewardType, amount: 1000 };
    } else {
        return { type: 'ENERGY' as RewardType, amount: 50 };
    }
};

interface DailyGiftWindowProps {
    onClose: () => void;
}

type RewardType = 'GOLD' | 'CRYSTAL' | 'ENERGY' | 'MEGA_CHEST';

interface StreakReward {
    day: number;
    type: RewardType;
    amount: number;
    label: string;
}

const STREAK_REWARDS: StreakReward[] = [
    { day: 1, type: 'GOLD', amount: 100, label: '100 Золота' },
    { day: 2, type: 'CRYSTAL', amount: 10, label: '10 Алмазов' },
    { day: 3, type: 'ENERGY', amount: 25, label: '25 Энергии' },
    { day: 4, type: 'GOLD', amount: 500, label: '500 Золота' },
    { day: 5, type: 'CRYSTAL', amount: 20, label: '20 Алмазов' },
    { day: 6, type: 'ENERGY', amount: 50, label: '50 Энергии' },
    { day: 7, type: 'MEGA_CHEST', amount: 0, label: 'Супер Награда' },
];

interface WheelReward {
    type: 'GOLD' | 'CRYSTAL' | 'ENERGY';
    amount: number;
    label: string;
    icon: string;
    color: string;
}

const WHEEL_REWARDS: WheelReward[] = [
    { type: 'GOLD', amount: 500, label: '500 Золота', icon: '/assets/images/ui/icons/Gold.webp', color: '#2c1d11' },
    { type: 'CRYSTAL', amount: 10, label: '10 Алмазов', icon: '/assets/images/ui/icons/almaz.webp', color: '#1e293b' },
    { type: 'ENERGY', amount: 15, label: '15 Энергии', icon: '/assets/images/ui/icons/energy.webp', color: '#0f172a' },
    { type: 'ENERGY', amount: 20, label: '20 Энергии', icon: '/assets/images/ui/icons/energy.webp', color: '#14532d' },
    { type: 'GOLD', amount: 1000, label: '1000 Золота', icon: '/assets/images/ui/icons/Gold.webp', color: '#3a2818' },
    { type: 'CRYSTAL', amount: 25, label: '25 Алмазов', icon: '/assets/images/ui/icons/almaz.webp', color: '#334155' },
    { type: 'ENERGY', amount: 30, label: '30 Энергии', icon: '/assets/images/ui/icons/energy.webp', color: '#1e293b' },
    { type: 'CRYSTAL', amount: 15, label: '15 Алмазов', icon: '/assets/images/ui/icons/almaz.webp', color: '#581c87' },
];

export const DailyGiftWindow: React.FC<DailyGiftWindowProps> = ({ onClose }) => {
    const { addGold, addCrystals, addEnergy, setCanClaimDailyGift } = useGameStore();

    // Tab control
    const [activeTab, setActiveTab] = useState<'CALENDAR' | 'WHEEL'>('CALENDAR');

    // Calendar states
    const [streak, setStreak] = useState<number>(1);
    const [claimedToday, setClaimedToday] = useState<boolean>(false);
    const [rewardClaimed, setRewardClaimed] = useState<{
        type: string;
        amount: number;
        isFromChest?: boolean;
        label?: string;
        icon?: string;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [wheelRotation, setWheelRotation] = useState<number>(0);
    const lastWheelSpinTime = useGameStore((state) => state.lastWheelSpinTime || 0);
    const [isFreeSpinAvailable, setIsFreeSpinAvailable] = useState<boolean>(false);
    const [wheelTimeLeft, setWheelTimeLeft] = useState<string>('');

    useEffect(() => {
        const updateWheelTimer = () => {
            const now = Date.now();
            const isAvail = now - lastWheelSpinTime >= 24 * 60 * 60 * 1000;
            setIsFreeSpinAvailable(isAvail);

            if (isAvail) {
                setWheelTimeLeft('');
                return;
            }
            const diff = 24 * 60 * 60 * 1000 - (now - lastWheelSpinTime);
            if (diff <= 0) {
                setWheelTimeLeft('');
                return;
            }
            const h = Math.floor(diff / (3600 * 1000));
            const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
            const s = Math.floor((diff % (60 * 1000)) / 1000);
            setWheelTimeLeft(`${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`);
        };

        const wheelTimer = setInterval(updateWheelTimer, 1000);
        updateWheelTimer();
        return () => clearInterval(wheelTimer);
    }, [lastWheelSpinTime]);

    useEffect(() => {
        const checkStreakStatus = () => {
            const lastClaim = safeGetItem('lastGiftClaim');
            const streakStr = safeGetItem('loginStreak') || '0';
            let currentStreak = parseInt(streakStr);

            if (!lastClaim) {
                setStreak(1);
                setClaimedToday(false);
                setCanClaimDailyGift(true);
                return;
            }

            const now = Date.now();
            const lastClaimTime = parseInt(lastClaim);
            const diffTime = now - lastClaimTime;
            const oneDayMs = 24 * 60000 * 60; // 24 hours

            const lastClaimDate = new Date(lastClaimTime);
            const nowDate = new Date(now);

            // check if same calendar day (based on local timezone)
            const isSameDay =
                lastClaimDate.getDate() === nowDate.getDate() &&
                lastClaimDate.getMonth() === nowDate.getMonth() &&
                lastClaimDate.getFullYear() === nowDate.getFullYear();

            if (isSameDay) {
                setClaimedToday(true);
                setStreak(currentStreak);
                setCanClaimDailyGift(false);
            } else {
                setClaimedToday(false);
                setCanClaimDailyGift(true);
                // If last claim was more than 48 hours ago, reset streak
                if (diffTime > 2 * oneDayMs) {
                    currentStreak = 0;
                    safeSetItem('loginStreak', '0');
                } else if (currentStreak >= 7) {
                    // If all 7 days claimed, reset back to 0
                    currentStreak = 0;
                    safeSetItem('loginStreak', '0');
                }
                setStreak(currentStreak + 1);
            }
        };

        const timer = setInterval(() => {
            checkStreakStatus();
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();

            const h = Math.floor(diff / (3600 * 1000));
            const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
            const s = Math.floor((diff % (60 * 1000)) / 1000);
            setTimeLeft(`${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`);
        }, 1000);

        checkStreakStatus();
        return () => clearInterval(timer);
    }, [setCanClaimDailyGift]);

    const handleClaim = () => {
        if (claimedToday) return;

        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
        const currentReward = STREAK_REWARDS[streak - 1];

        let claimedType = currentReward.type;
        let claimedAmount = currentReward.amount;
        let isFromChest = false;

        // Award rewards
        if (currentReward.type === 'GOLD') {
            addGold(currentReward.amount);
        } else if (currentReward.type === 'CRYSTAL') {
            addCrystals(currentReward.amount);
        } else if (currentReward.type === 'ENERGY') {
            addEnergy(currentReward.amount);
        } else if (currentReward.type === 'MEGA_CHEST') {
            isFromChest = true;
            const rolled = rollMegaChest();
            claimedType = rolled.type;
            claimedAmount = rolled.amount;
            if (rolled.type === 'CRYSTAL') addCrystals(rolled.amount);
            else if (rolled.type === 'GOLD') addGold(rolled.amount);
            else if (rolled.type === 'ENERGY') addEnergy(rolled.amount);
        }

        // Update storage
        safeSetItem('lastGiftClaim', getNowString());
        safeSetItem('loginStreak', streak.toString());

        setRewardClaimed({
            type: claimedType,
            amount: claimedAmount,
            isFromChest,
            label: claimedType === 'GOLD' ? 'Золота' : claimedType === 'CRYSTAL' ? 'Алмазов' : 'Энергии',
            icon: getRewardIcon(claimedType as RewardType),
        });
        setClaimedToday(true);
        setCanClaimDailyGift(false);
        useGameStore.getState().updateQuestProgress('OPEN_CHEST', 1);
    };

    const getRewardIcon = (type: RewardType) => {
        switch (type) {
            case 'GOLD':
                return AssetsMap.UI.ICON_GOLD_FULL;
            case 'CRYSTAL':
                return AssetsMap.UI.ICON_ALMAZ_FULL;
            case 'ENERGY':
                return AssetsMap.UI.ICON_ENERGY_FULL;
            case 'MEGA_CHEST':
                return AssetsMap.UI.ICON_DAILY_CHEST;
        }
    };

    // Spin the wheel handler
    const handleSpinWheel = () => {
        if (isSpinning) return;
        if (!isFreeSpinAvailable) return;

        const store = useGameStore.getState();

        setIsSpinning(true);
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

        // Generate target sector index
        const sectorIndex = getRandomSectorIndex();
        const sectorDegrees = 45;
        // Pointer is at the top (0 deg). To align a sector at the top:
        // We need to rotate by: 360 - (sectorIndex * 45) - 22.5 (for center of wedge)
        const targetAngle = 360 - sectorIndex * sectorDegrees - 22.5;

        // Add 5 full rotations (1800 deg) for a premium feel
        const finalRotation = wheelRotation + 1800 + targetAngle - (wheelRotation % 360);
        setWheelRotation(finalRotation);

        // Tick sounds
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            if (tickCount < 18) {
                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                tickCount++;
            } else {
                clearInterval(tickInterval);
            }
        }, 180);

        setTimeout(() => {
            clearInterval(tickInterval);
            setIsSpinning(false);
            const wonReward = WHEEL_REWARDS[sectorIndex];

            // Award reward
            if (wonReward.type === 'GOLD') {
                store.addGold(wonReward.amount);
            } else if (wonReward.type === 'CRYSTAL') {
                store.addCrystals(wonReward.amount);
            } else if (wonReward.type === 'ENERGY') {
                store.addEnergy(wonReward.amount);
            }

            // Save spin time (one spin per day)
            useGameStore.setState({ lastWheelSpinTime: getNow() });

            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);

            let labelText = '';
            if (wonReward.type === 'GOLD') labelText = 'Золота';
            else if (wonReward.type === 'CRYSTAL') labelText = 'Алмазов';
            else if (wonReward.type === 'ENERGY') labelText = 'Энергии';

            setRewardClaimed({
                type: wonReward.type,
                amount: wonReward.amount,
                isFromChest: false,
                label: labelText,
                icon: wonReward.icon,
            });

            useGameStore.getState().updateQuestProgress('OPEN_CHEST', 1);
        }, 4100);
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '20px 40px',
                fontFamily: "'Nunito', sans-serif",
                color: '#fff',
                position: 'relative',
            }}
        >
            {/* Tabs Header */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', zIndex: 5 }}>
                <button
                    onClick={() => {
                        if (isSpinning) return;
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        setActiveTab('CALENDAR');
                    }}
                    style={{
                        padding: '10px 24px',
                        background:
                            activeTab === 'CALENDAR'
                                ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)'
                                : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(240, 192, 64, 0.3)',
                        borderRadius: '12px',
                        color: activeTab === 'CALENDAR' ? '#000' : '#c8a870',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '1px',
                        boxShadow: activeTab === 'CALENDAR' ? '0 0 15px rgba(240, 192, 64, 0.3)' : 'none',
                    }}
                >
                    КАЛЕНДАРЬ НАГРАД
                </button>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        setActiveTab('WHEEL');
                    }}
                    style={{
                        padding: '10px 24px',
                        background:
                            activeTab === 'WHEEL'
                                ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)'
                                : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(240, 192, 64, 0.3)',
                        borderRadius: '12px',
                        color: activeTab === 'WHEEL' ? '#000' : '#c8a870',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '1px',
                        boxShadow: activeTab === 'WHEEL' ? '0 0 15px rgba(240, 192, 64, 0.3)' : 'none',
                    }}
                >
                    КОЛЕСО ФОРТУНЫ
                </button>
            </div>

            {activeTab === 'CALENDAR' ? (
                <>
                    <p style={{ color: '#a08860', fontSize: '15px', margin: '0 0 15px 0', textAlign: 'center' }}>
                        Заходи в игру каждый день, чтобы забирать более ценные дары!
                    </p>

                    {/* Calendar Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 185px)',
                            gap: '15px',
                            justifyContent: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        {STREAK_REWARDS.map((rewardItem) => {
                            const isCurrent = rewardItem.day === streak && !claimedToday;
                            const isClaimed = rewardItem.day < streak || (rewardItem.day === streak && claimedToday);
                            const isLocked = rewardItem.day > streak;
                            const isDay7 = rewardItem.day === 7;

                            return (
                                <div
                                    key={rewardItem.day}
                                    style={{
                                        width: '100%',
                                        height: '170px',
                                        background: isCurrent
                                            ? 'rgba(240, 192, 64, 0.15)'
                                            : isClaimed
                                              ? 'rgba(0, 0, 0, 0.4)'
                                              : 'rgba(255, 255, 255, 0.03)',
                                        border: isCurrent
                                            ? '2px solid #f0c040'
                                            : isClaimed
                                              ? '1px solid rgba(240, 192, 64, 0.3)'
                                              : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 10px',
                                        position: 'relative',
                                        boxShadow: isCurrent ? '0 0 25px rgba(240, 192, 64, 0.3)' : 'none',
                                        opacity: isLocked ? 0.6 : 1,
                                        gridColumn: isDay7 ? 'span 2' : 'auto',
                                    }}
                                >
                                    {/* Claimed overlay checkmark */}
                                    {isClaimed && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.5)',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '40px',
                                                color: '#f0c040',
                                                zIndex: 2,
                                            }}
                                        >
                                            ✓
                                        </div>
                                    )}

                                    <span
                                        style={{
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: '13px',
                                            color: isCurrent ? '#f0c040' : '#888',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        ДЕНЬ {rewardItem.day}
                                    </span>

                                    <img
                                        src={getRewardIcon(rewardItem.type)}
                                        alt={rewardItem.type}
                                        style={{
                                            width: isDay7 ? '55px' : '40px',
                                            height: isDay7 ? '55px' : '40px',
                                            objectFit: 'contain',
                                            filter: isLocked ? 'grayscale(0.6)' : 'none',
                                        }}
                                    />

                                    <span
                                        style={{
                                            fontSize: '12px',
                                            color: isCurrent ? '#fff' : '#aaa',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {rewardItem.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Actions */}
                    <div
                        style={{
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        {!claimedToday ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClaim}
                                style={{
                                    padding: '14px 60px',
                                    background: 'linear-gradient(180deg, #f0c040 0%, #8a5a10 100%)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    color: '#000',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 900,
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(240,192,64,0.3)',
                                }}
                            >
                                ЗАБРАТЬ НАГРАДУ
                            </motion.button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <p style={{ color: '#888', fontSize: '13px' }}>Вы уже забрали сегодняшнюю награду!</p>
                                <div
                                    style={{
                                        padding: '8px 20px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(240,192,64,0.15)',
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ fontSize: '11px', color: '#a08860' }}>СЛЕДУЮЩАЯ НАГРАДА ЧЕРЕЗ:</span>
                                    <span
                                        style={{
                                            fontSize: '18px',
                                            fontFamily: "'Cinzel', serif",
                                            color: '#fff',
                                            fontWeight: 900,
                                        }}
                                    >
                                        {timeLeft}
                                    </span>
                                </div>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            style={{
                                padding: '8px 24px',
                                background: 'transparent',
                                border: '1px solid rgba(240, 192, 64, 0.4)',
                                borderRadius: '10px',
                                color: '#f0c040',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                marginTop: '5px',
                                letterSpacing: '1px',
                            }}
                        >
                            ЗАКРЫТЬ
                        </motion.button>
                    </div>
                </>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        gap: '15px',
                    }}
                >
                    <p style={{ color: '#a08860', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                        Испытай свою удачу! Раз в сутки вращение абсолютно бесплатно.
                    </p>

                    <div
                        style={{
                            position: 'relative',
                            width: '310px',
                            height: '310px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Pointer pin at the top */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                width: '24px',
                                height: '32px',
                                background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                            }}
                        />

                        {/* Outer Wheel container */}
                        <motion.div
                            style={{
                                width: '300px',
                                height: '300px',
                                borderRadius: '50%',
                                border: '6px solid #f59e0b',
                                boxShadow: '0 0 25px rgba(245, 158, 11, 0.35), inset 0 0 20px rgba(0,0,0,0.8)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            animate={{ rotate: wheelRotation }}
                            transition={isSpinning ? { duration: 4, ease: [0.1, 0.7, 0.2, 1] } : { duration: 0 }}
                        >
                            {/* Sectors background segments (drawn via CSS angles) */}
                            {WHEEL_REWARDS.map((reward, i) => (
                                <div
                                    key={`seg-${i}`}
                                    style={{
                                        position: 'absolute',
                                        width: '150px',
                                        height: '150px',
                                        transformOrigin: '100% 100%',
                                        left: 0,
                                        top: 0,
                                        transform: `rotate(${i * 45}deg) skewY(45deg)`,
                                        background: reward.color,
                                        border: '1px solid rgba(245, 158, 11, 0.15)',
                                    }}
                                />
                            ))}

                            {/* Reward Content labels positioned at center of each segment */}
                            {WHEEL_REWARDS.map((reward, i) => {
                                const angle = i * 45 + 22.5; // Offset by 22.5 to center in 45deg sector
                                return (
                                    <div
                                        key={`label-${i}`}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '50%',
                                            width: '90px',
                                            height: '150px',
                                            transformOrigin: '50% 100%',
                                            transform: `translateX(-50%) rotate(${angle}deg)`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            paddingTop: '20px',
                                            zIndex: 2,
                                        }}
                                    >
                                        <img
                                            src={reward.icon}
                                            alt={reward.type}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                                                marginBottom: '3px',
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                color: '#fff',
                                                textShadow: '0 2px 4px #000',
                                            }}
                                        >
                                            {reward.amount > 1 ? reward.amount : ''}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '8px',
                                                fontWeight: 700,
                                                color: '#fcd34d',
                                                textShadow: '0 1px 3px #000',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {reward.type === 'GOLD'
                                                ? 'Золото'
                                                : reward.type === 'CRYSTAL'
                                                  ? 'Алмазы'
                                                  : 'Энергия'}
                                        </span>
                                    </div>
                                );
                            })}
                        </motion.div>

                        {/* Center Pin & Spin Button overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #f59e0b 0%, #b45309 100%)',
                                border: '3px solid #fef3c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: (isSpinning || !isFreeSpinAvailable) ? 'default' : 'pointer',
                                zIndex: 12,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.8)',
                            }}
                            onClick={isFreeSpinAvailable ? handleSpinWheel : undefined}
                        >
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                }}
                            >
                                SPIN
                            </span>
                        </div>
                    </div>

                    {/* Wheel Info & Manual Spin button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {isFreeSpinAvailable ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSpinWheel}
                                disabled={isSpinning}
                                style={{
                                    padding: '12px 50px',
                                    background: 'linear-gradient(180deg, #f0c040 0%, #8a5a10 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#000',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 900,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(240,192,64,0.3)',
                                }}
                            >
                                БЕСПЛАТНЫЙ СПИН
                            </motion.button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>Вы уже крутили колесо сегодня!</p>
                                {wheelTimeLeft && (
                                    <div
                                        style={{
                                            padding: '8px 20px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(240,192,64,0.15)',
                                            display: 'inline-flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span style={{ fontSize: '11px', color: '#a08860' }}>БЕСПЛАТНЫЙ СПИН ЧЕРЕЗ:</span>
                                        <span
                                            style={{
                                                fontSize: '18px',
                                                fontFamily: "'Cinzel', serif",
                                                color: '#fff',
                                                fontWeight: 900,
                                                marginTop: '2px',
                                            }}
                                        >
                                            {wheelTimeLeft}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                if (isSpinning) return;
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            disabled={isSpinning}
                            style={{
                                padding: '8px 24px',
                                background: 'transparent',
                                border: '1px solid rgba(240, 192, 64, 0.4)',
                                borderRadius: '10px',
                                color: '#f0c040',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                marginTop: '5px',
                                letterSpacing: '1px',
                                opacity: isSpinning ? 0.4 : 1,
                            }}
                        >
                            ЗАКРЫТЬ
                        </motion.button>
                    </div>
                </div>
            )}

            <GiftCongratsModal
                rewardClaimed={rewardClaimed}
                onClose={() => setRewardClaimed(null)}
            />
        </div>
    );
};
