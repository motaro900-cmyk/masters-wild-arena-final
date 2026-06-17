import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import { GiftCongratsModal } from './DailyGift/GiftCongratsModal';
import { db, USERS_COLLECTION } from '../../../utils/firebase';
import { syncService, SyncService } from '../../../services/SyncService';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Pure helper functions outside component to satisfy react-hooks/purity
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

const getSectorBg = (type: RewardType, index: number) => {
    const isEven = index % 2 === 0;
    switch (type) {
        case 'GOLD':
            return isEven 
                ? 'linear-gradient(135deg, #2e1d0c 0%, #1a0f05 100%)' 
                : 'linear-gradient(135deg, #3d2712 0%, #251608 100%)';
        case 'CRYSTAL':
            return isEven 
                ? 'linear-gradient(135deg, #101c30 0%, #080e1b 100%)' 
                : 'linear-gradient(135deg, #1a273d 0%, #0d1628 100%)';
        case 'ENERGY':
            return isEven 
                ? 'linear-gradient(135deg, #0d2a1a 0%, #05140b 100%)' 
                : 'linear-gradient(135deg, #143d26 0%, #0a2113 100%)';
        default:
            return isEven ? '#111' : '#222';
    }
};

export const DailyGiftWindow: React.FC<DailyGiftWindowProps> = ({ onClose }) => {
    const addGold = useGameStore(state => state.addGold);
    const addCrystals = useGameStore(state => state.addCrystals);
    const addEnergy = useGameStore(state => state.addEnergy);
    const setCanClaimDailyGift = useGameStore(state => state.setCanClaimDailyGift);

    // Tab control
    const [activeTab, setActiveTab] = useState<'CALENDAR' | 'WHEEL'>('CALENDAR');

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkLayout = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

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
    const [isFreeSpinAvailable, setIsFreeSpinAvailable] = useState<boolean>(false);
    const [wheelTimeLeft, setWheelTimeLeft] = useState<string>('');

    // Server time offset
    const [timeOffset, setTimeOffset] = useState<number>(0);

    // Firestore server dates
    const [lastGiftClaimedTime, setLastGiftClaimedTime] = useState<Timestamp | null>(null);
    const [lastWheelSpinTimeServer, setLastWheelSpinTimeServer] = useState<Timestamp | null>(null);
    const [dbLoginStreak, setDbLoginStreak] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDoc = async () => {
            try {
                const start = Date.now();
                const response = await fetch(window.location.href, { method: 'HEAD' });
                const serverDateStr = response.headers.get('date');
                if (serverDateStr) {
                    const serverTime = new Date(serverDateStr).getTime();
                    const latency = (Date.now() - start) / 2;
                    setTimeOffset(serverTime + latency - Date.now());
                }
            } catch (timeError) {
                console.warn('Failed to fetch server time offset, using local clock:', timeError);
            }

            try {
                const state = useGameStore.getState();
                const giftTime = state.lastDailyGiftClaimedTime || 0;
                const wheelTime = state.lastWheelSpinTime || 0;
                const streak = state.loginStreak || 0;

                setLastGiftClaimedTime(giftTime ? Timestamp.fromMillis(giftTime) : null);
                setLastWheelSpinTimeServer(wheelTime ? Timestamp.fromMillis(wheelTime) : null);
                setDbLoginStreak(streak);
            } catch (e) {
                console.error('Failed to load daily gift data from store:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadDoc();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const updateTimers = () => {
            const nowSeconds = Math.floor((Date.now() + timeOffset) / 1000);

            // 1. Daily Gift Check
            if (!lastGiftClaimedTime) {
                setStreak(1);
                setClaimedToday(false);
                setCanClaimDailyGift(true);
            } else {
                const diffSeconds = nowSeconds - lastGiftClaimedTime.seconds;
                const hoursSinceLast = diffSeconds / 3600;

                if (hoursSinceLast < 24) {
                    setClaimedToday(true);
                    setStreak(dbLoginStreak || 1);
                    setCanClaimDailyGift(false);
                } else {
                    setClaimedToday(false);
                    setCanClaimDailyGift(true);
                    let currentStreak = dbLoginStreak || 0;
                    if (diffSeconds > 2 * 24 * 3600) {
                        currentStreak = 0;
                    } else if (currentStreak >= 7) {
                        currentStreak = 0;
                    }
                    setStreak(currentStreak + 1);
                }
            }

            // 2. Wheel check
            if (!lastWheelSpinTimeServer) {
                setIsFreeSpinAvailable(true);
                setWheelTimeLeft('');
            } else {
                const diffSeconds = nowSeconds - lastWheelSpinTimeServer.seconds;
                if (diffSeconds >= 24 * 3600) {
                    setIsFreeSpinAvailable(true);
                    setWheelTimeLeft('');
                } else {
                    setIsFreeSpinAvailable(false);
                    const remainingSeconds = 24 * 3600 - diffSeconds;
                    const h = Math.floor(remainingSeconds / 3600);
                    const m = Math.floor((remainingSeconds % 3600) / 60);
                    const s = Math.floor(remainingSeconds % 60);
                    setWheelTimeLeft(`${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`);
                }
            }

            // 3. Time left until next calendar day (midnight)
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();
            const h = Math.floor(diff / (3600 * 1000));
            const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
            const s = Math.floor((diff % (60 * 1000)) / 1000);
            setTimeLeft(`${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`);
        };

        const interval = setInterval(updateTimers, 1000);
        updateTimers();
        return () => clearInterval(interval);
    }, [isLoading, lastGiftClaimedTime, lastWheelSpinTimeServer, dbLoginStreak, setCanClaimDailyGift, timeOffset]);

    const handleClaim = async () => {
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

        try {
            const state = useGameStore.getState();
            const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
            const userDocRef = doc(db, USERS_COLLECTION, userId);

            await updateDoc(userDocRef, {
                lastDailyGiftClaimed: serverTimestamp(),
                loginStreak: streak,
            });
        } catch (e) {
            console.error('Failed to update daily gift in Firestore:', e);
        }

        // eslint-disable-next-line react-hooks/purity
        const nowMs = Date.now();
        useGameStore.setState({
            lastDailyGiftClaimedTime: nowMs,
            loginStreak: streak,
        });
        setLastGiftClaimedTime(Timestamp.fromMillis(nowMs));
        setDbLoginStreak(streak);

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
        await syncService.syncPlayerData();
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

        setTimeout(async () => {
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

            try {
                const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
                const userDocRef = doc(db, USERS_COLLECTION, userId);

                await updateDoc(userDocRef, {
                    lastWheelSpinTimeServer: serverTimestamp(),
                });
            } catch (e) {
                console.error('Failed to update wheel spin in Firestore:', e);
            }

            const nowMs = Date.now();
            useGameStore.setState({ lastWheelSpinTime: nowMs });
            setLastWheelSpinTimeServer(Timestamp.fromMillis(nowMs));

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
            await syncService.syncPlayerData();
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
                padding: '24px 40px',
                fontFamily: "'Outfit', 'Nunito', sans-serif",
                color: '#fff',
                position: 'relative',
            }}
        >
            {/* Inject premium keyframes inside style block */}
            <style>{`
                @keyframes shimmerBorder {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 300% 50%; }
                }
                @keyframes bulbFlash {
                    0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 1px rgba(255, 215, 0, 0.2)); }
                    50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.85)) brightness(1.2); }
                }
            `}</style>

            {/* Tabs Header */}
            <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', zIndex: 5 }}>
                <button
                    onClick={() => {
                        if (isSpinning) return;
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        setActiveTab('CALENDAR');
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'CALENDAR') {
                            e.currentTarget.style.background = 'rgba(240, 192, 64, 0.12)';
                            e.currentTarget.style.color = '#ffd700';
                            e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.5)';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'CALENDAR') {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.color = '#c8a870';
                            e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }
                    }}
                    style={{
                        padding: '11px 28px',
                        background:
                            activeTab === 'CALENDAR'
                                ? 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)'
                                : 'rgba(255, 255, 255, 0.03)',
                        border:
                            activeTab === 'CALENDAR'
                                ? '2px solid #ffd700'
                                : '1.5px solid rgba(240, 192, 64, 0.2)',
                        borderRadius: '12px',
                        color: activeTab === 'CALENDAR' ? '#1c1002' : '#c8a870',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        letterSpacing: '1.5px',
                        textShadow: activeTab === 'CALENDAR' ? '0 1px 1px rgba(255,255,255,0.2)' : '0 2px 4px rgba(0,0,0,0.8)',
                        boxShadow:
                            activeTab === 'CALENDAR'
                                ? '0 0 20px rgba(240, 192, 64, 0.35), inset 0 1px 0 rgba(255,255,255,0.35)'
                                : 'none',
                    }}
                >
                    КАЛЕНДАРЬ НАГРАД
                </button>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        setActiveTab('WHEEL');
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'WHEEL') {
                            e.currentTarget.style.background = 'rgba(240, 192, 64, 0.12)';
                            e.currentTarget.style.color = '#ffd700';
                            e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.5)';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'WHEEL') {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.color = '#c8a870';
                            e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }
                    }}
                    style={{
                        padding: '11px 28px',
                        background:
                            activeTab === 'WHEEL'
                                ? 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)'
                                : 'rgba(255, 255, 255, 0.03)',
                        border:
                            activeTab === 'WHEEL'
                                ? '2px solid #ffd700'
                                : '1.5px solid rgba(240, 192, 64, 0.2)',
                        borderRadius: '12px',
                        color: activeTab === 'WHEEL' ? '#1c1002' : '#c8a870',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        letterSpacing: '1.5px',
                        textShadow: activeTab === 'WHEEL' ? '0 1px 1px rgba(255,255,255,0.2)' : '0 2px 4px rgba(0,0,0,0.8)',
                        boxShadow:
                            activeTab === 'WHEEL'
                                ? '0 0 20px rgba(240, 192, 64, 0.35), inset 0 1px 0 rgba(255,255,255,0.35)'
                                : 'none',
                    }}
                >
                    КОЛЕСО ФОРТУНЫ
                </button>
            </div>

            <motion.div
                drag={isMobile ? "x" : undefined}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    if (!isMobile) return;
                    if (isSpinning) return;
                    const swipeThreshold = 50;
                    if (info.offset.x < -swipeThreshold && activeTab === 'CALENDAR') {
                        setActiveTab('WHEEL');
                    } else if (info.offset.x > swipeThreshold && activeTab === 'WHEEL') {
                        setActiveTab('CALENDAR');
                    }
                }}
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    touchAction: isMobile ? 'pan-y' : 'auto',
                }}
            >
                {activeTab === 'CALENDAR' ? (
                <>
                    <p style={{
                        color: '#dfc08a',
                        fontSize: '14.5px',
                        margin: '0 0 16px 0',
                        textAlign: 'center',
                        fontWeight: 800,
                        textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                        letterSpacing: '0.5px'
                    }}>
                        Заходи в игру каждый день, чтобы забирать более ценные дары!
                    </p>

                    {/* Calendar Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 220px)',
                            gap: '15px',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            width: '100%',
                            maxWidth: '920px',
                        }}
                    >
                        {STREAK_REWARDS.map((rewardItem) => {
                            const isCurrent = rewardItem.day === streak && !claimedToday;
                            const isClaimed = rewardItem.day < streak || (rewardItem.day === streak && claimedToday);
                            const isLocked = rewardItem.day > streak;
                            const isDay7 = rewardItem.day === 7;

                            // Premium background card styling
                            const cardBg = isDay7
                                ? 'linear-gradient(135deg, rgba(65, 45, 20, 0.98) 0%, rgba(25, 15, 5, 1) 100%)'
                                : isCurrent
                                  ? 'linear-gradient(135deg, rgba(60, 42, 18, 0.98) 0%, rgba(20, 12, 4, 1) 100%)'
                                  : 'linear-gradient(135deg, rgba(30, 20, 12, 0.45) 0%, rgba(15, 10, 5, 0.7) 100%)';

                            const cardBorder = isCurrent
                                ? 'none' // Shimmer handles this
                                : isDay7
                                  ? '2px dashed rgba(250, 204, 21, 0.55)'
                                  : '1.5px solid rgba(255, 255, 255, 0.08)';

                            const titleColor = isCurrent
                                ? '#ffd700'
                                : isDay7
                                  ? '#ffd700'
                                  : isClaimed
                                    ? '#dfc08a'
                                    : '#8e867e';

                            return (
                                <div
                                    key={rewardItem.day}
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '170px',
                                        gridColumn: isDay7 ? 'span 2' : 'auto',
                                        boxSizing: 'border-box',
                                        opacity: isLocked ? 0.65 : 1,
                                        transition: 'all 0.22s ease',
                                        borderRadius: '16px',
                                        padding: isCurrent ? '2px' : '0px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isDay7 && !isClaimed
                                            ? '0 0 20px rgba(168, 85, 247, 0.22)'
                                            : 'none',
                                    }}
                                >
                                    {/* Shimmer Border for Active Current Day */}
                                    {isCurrent && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '16px',
                                                background: 'linear-gradient(90deg, #ffe57f, #e5a910, #8c6300, #ffe57f)',
                                                backgroundSize: '300% 100%',
                                                animation: 'shimmerBorder 3s linear infinite',
                                                zIndex: 1,
                                                boxShadow: '0 0 25px rgba(240, 192, 64, 0.45)',
                                            }}
                                        />
                                    )}

                                    {/* Card inner body */}
                                    <div
                                        style={{
                                            position: isCurrent ? 'absolute' : 'relative',
                                            inset: isCurrent ? '2px' : '0px',
                                            width: isCurrent ? 'calc(100% - 4px)' : '100%',
                                            height: isCurrent ? 'calc(100% - 4px)' : '100%',
                                            background: cardBg,
                                            border: cardBorder,
                                            borderRadius: '14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 12px 14px 12px',
                                            boxSizing: 'border-box',
                                            zIndex: 2,
                                            overflow: 'visible', // Visible to allow "ДОСТУПНО" badge overlap without clipping
                                            boxShadow: isCurrent 
                                                ? 'inset 0 0 15px rgba(240, 192, 64, 0.2)' 
                                                : 'none',
                                        }}
                                    >
                                        {/* Day 7 Rotating Magical Rays - REMOVED to save GPU power on mobile devices */}

                                        {/* Active badge overlay */}
                                        {isCurrent && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-9px',
                                                background: 'linear-gradient(180deg, #ffd700 0%, #d4af37 100%)',
                                                border: '1px solid #ffffff',
                                                borderRadius: '8px',
                                                padding: '2px 9px',
                                                fontSize: '9px',
                                                fontWeight: 900,
                                                color: '#1a0d00',
                                                letterSpacing: '1px',
                                                boxShadow: '0 4px 10px rgba(212, 175, 55, 0.45)',
                                                zIndex: 3,
                                                textTransform: 'uppercase',
                                                fontFamily: "'Cinzel', serif",
                                            }}>
                                                ДОСТУПНО
                                            </div>
                                        )}

                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: '13px',
                                                color: titleColor,
                                                fontWeight: 900,
                                                letterSpacing: '1.2px',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 5px rgba(0,0,0,0.8)',
                                                zIndex: 2,
                                            }}
                                        >
                                            ДЕНЬ {rewardItem.day}
                                        </span>

                                        <motion.img
                                            src={getRewardIcon(rewardItem.type)}
                                            alt={rewardItem.type}
                                            animate={isCurrent || (isDay7 && !isClaimed) ? { y: [0, -5, 0] } : {}}
                                            transition={isCurrent || (isDay7 && !isClaimed) ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : {}}
                                            style={{
                                                width: isDay7 ? '72px' : '48px',
                                                height: isDay7 ? '72px' : '48px',
                                                objectFit: 'contain',
                                                filter: isLocked 
                                                    ? 'grayscale(0.8) opacity(0.5)' 
                                                    : 'drop-shadow(0 4px 8px rgba(0,0,0,0.65))', // Optimized shadow instead of heavy glowing filter
                                                zIndex: 2,
                                            }}
                                        />

                                        <span
                                            style={{
                                                fontSize: '12px',
                                                color: isCurrent ? '#ffe259' : isDay7 ? '#ffe259' : '#d1c5b8',
                                                fontWeight: 900,
                                                textAlign: 'center',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)',
                                                zIndex: 2,
                                                letterSpacing: '0.3px',
                                            }}
                                        >
                                            {rewardItem.label}
                                        </span>
                                    </div>

                                    {/* Claimed Wax Seal overlay stamp */}
                                    {isClaimed && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(12, 6, 2, 0.72)',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 4,
                                                backdropFilter: 'blur(1.5px)',
                                            }}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.6, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', damping: 12 }}
                                                style={{
                                                    width: '52px',
                                                    height: '52px',
                                                    borderRadius: '50%',
                                                    border: '2px solid rgba(255, 215, 0, 0.75)',
                                                    background: 'radial-gradient(circle, #a81c1c 25%, #600707 90%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 6px 15px rgba(0,0,0,0.85), inset 0 0 10px rgba(255, 215, 0, 0.35)',
                                                    transform: 'rotate(-10deg)',
                                                }}
                                            >
                                                <span style={{
                                                    color: '#ffe57f',
                                                    fontSize: '20px',
                                                    fontWeight: 955,
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                                                    fontFamily: "'Cinzel', serif",
                                                }}>✓</span>
                                            </motion.div>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                color: '#ffe57f', 
                                                fontWeight: 955, 
                                                marginTop: '8px', 
                                                letterSpacing: '1.5px',
                                                fontFamily: "'Cinzel', serif",
                                                textShadow: '0 2px 4px rgba(0,0,0,0.98)',
                                            }}>ПОЛУЧЕНО</span>
                                        </div>
                                    )}
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
                            gap: '12px',
                            marginTop: '5px',
                        }}
                    >
                        {!claimedToday ? (
                            <motion.button
                                whileHover={{ scale: 1.04, y: -1, boxShadow: '0 8px 25px rgba(240,192,64,0.45)' }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleClaim}
                                style={{
                                    padding: '14px 60px',
                                    background: 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)',
                                    border: '2px solid #ffd700',
                                    borderRadius: '12px',
                                    color: '#1c1002',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 955,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(240,192,64,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
                                    letterSpacing: '1.8px',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                ЗАБРАТЬ НАГРАДУ
                            </motion.button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <p style={{ color: '#b5a695', fontSize: '13.5px', margin: 0, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>Вы уже забрали сегодняшнюю награду!</p>
                                <div
                                    style={{
                                        padding: '8px 28px',
                                        background: 'linear-gradient(180deg, rgba(30, 20, 10, 0.95) 0%, rgba(15, 10, 5, 0.99) 100%)',
                                        borderRadius: '10px',
                                        border: '1.5px solid rgba(240,192,64,0.35)',
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.85)',
                                    }}
                                >
                                    <span style={{ fontSize: '10px', color: '#dfc08a', fontWeight: 900, opacity: 0.9, letterSpacing: '0.8px', textShadow: '0 1px 2px #000' }}>СЛЕДУЮЩАЯ НАГРАДА ЧЕРЕЗ:</span>
                                    <span
                                        style={{
                                            fontSize: '19px',
                                            fontFamily: "'Cinzel', serif",
                                            color: '#ffffff',
                                            fontWeight: 955,
                                            marginTop: '3px',
                                            letterSpacing: '1px',
                                            textShadow: '0 0 8px rgba(255,255,255,0.25)',
                                        }}
                                    >
                                        {timeLeft}
                                    </span>
                                </div>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            style={{
                                padding: '8px 30px',
                                background: 'transparent',
                                border: '1.5px solid rgba(240, 192, 64, 0.3)',
                                borderRadius: '10px',
                                color: '#c8a870',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 900,
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                marginTop: '4px',
                                letterSpacing: '1.2px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ffd700';
                                e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#c8a870';
                                e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.3)';
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
                        gap: '16px',
                    }}
                >
                    <p style={{
                        color: '#dfc08a',
                        fontSize: '14.5px',
                        margin: 0,
                        textAlign: 'center',
                        fontWeight: 800,
                        textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                        letterSpacing: '0.5px'
                    }}>
                        Испытай свою удачу! Раз в сутки вращение абсолютно бесплатно.
                    </p>

                    {/* Double gold bezel container with flashing light bulbs */}
                    <div
                        style={{
                            position: 'relative',
                            width: '344px',
                            height: '344px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'radial-gradient(circle, #3d2719 50%, #1c0f08 100%)',
                            border: '6px solid #ffd700',
                            borderRadius: '50%',
                            boxShadow: '0 12px 35px rgba(0,0,0,0.95), 0 0 25px rgba(212, 175, 55, 0.4), inset 0 0 15px rgba(0,0,0,0.6)',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Bulbs on Bezel */}
                        {Array.from({ length: 16 }).map((_, idx) => {
                            const angle = (idx * 360) / 16;
                            const radius = 162; // aligned perfectly on the golden frame ring
                            const x = Math.cos((angle * Math.PI) / 180) * radius;
                            const y = Math.sin((angle * Math.PI) / 180) * radius;
                            return (
                                <div
                                    key={`bulb-${idx}`}
                                    style={{
                                        position: 'absolute',
                                        top: `calc(50% + ${y}px - 4px)`,
                                        left: `calc(50% + ${x}px - 4px)`,
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#ffd700',
                                        boxShadow: '0 0 6px #ffd700',
                                        zIndex: 11,
                                        animation: `bulbFlash 1.8s infinite`,
                                        animationDelay: `${idx * 0.11}s`,
                                        pointerEvents: 'none',
                                    }}
                                />
                            );
                        })}

                        {/* Wiggling Pointer pin at the top */}
                        <motion.div
                            animate={isSpinning ? {
                                rotate: [0, -14, 12, -9, 6, -3, 0],
                            } : { rotate: 0 }}
                            transition={isSpinning ? {
                                duration: 0.32,
                                repeat: 12,
                                ease: 'easeOut',
                            } : {}}
                            style={{
                                position: 'absolute',
                                top: '-14px',
                                left: '50%',
                                transformOrigin: '50% 0%',
                                zIndex: 13,
                                width: '24px',
                                height: '32px',
                                background: 'linear-gradient(180deg, #ffe57f 0%, #d4af37 50%, #8c6300 100%)',
                                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                                filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.75))',
                                borderTop: '2px solid #fff',
                            }}
                        />

                        {/* Outer Wheel container */}
                        <motion.div
                            style={{
                                width: '304px',
                                height: '304px',
                                borderRadius: '50%',
                                border: '3px solid #d4af37',
                                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.5)',
                                position: 'relative',
                                overflow: 'hidden',
                                background: '#1c1c1c',
                            }}
                            animate={{ rotate: wheelRotation }}
                            transition={isSpinning ? { duration: 4, ease: [0.1, 0.7, 0.2, 1] } : { duration: 0 }}
                        >
                            {/* Sectors background segments */}
                            {WHEEL_REWARDS.map((reward, i) => (
                                <div
                                    key={`seg-${i}`}
                                    style={{
                                        position: 'absolute',
                                        width: '152px',
                                        height: '152px',
                                        transformOrigin: '100% 100%',
                                        left: 0,
                                        top: 0,
                                        transform: `rotate(${i * 45}deg) skewY(45deg)`,
                                        background: getSectorBg(reward.type, i),
                                        border: '1px solid rgba(212, 175, 55, 0.15)',
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
                                            height: '152px',
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
                                                width: '32px',
                                                height: '32px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.95))',
                                                marginBottom: '2px',
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '12.5px',
                                                fontWeight: 955,
                                                color: '#fff',
                                                textShadow: '0 2px 4px #000, 0 0 4px #000',
                                                fontFamily: "'Cinzel', serif",
                                            }}
                                        >
                                            {reward.amount > 1 ? reward.amount : ''}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '8.5px',
                                                fontWeight: 900,
                                                color: '#ffd700',
                                                textShadow: '0 1.5px 3px #000, 0 0 3px #000',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                marginTop: '1px',
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

                        {/* Center Pin & SPIN Button overlay with 3D glassmorphic finish */}
                        <motion.div
                            animate={isFreeSpinAvailable && !isSpinning ? {
                                scale: [1, 1.05, 1],
                            } : {}}
                            whileHover={{ scale: isSpinning ? 1 : 1.08 }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                width: '76px',
                                height: '76px',
                                borderRadius: '50%',
                                background: isFreeSpinAvailable && !isSpinning
                                    ? 'radial-gradient(circle, #fffdf0 0%, #ffd700 50%, #c87800 100%)'
                                    : 'radial-gradient(circle, #555 0%, #333 70%, #111 100%)',
                                border: '3.5px solid rgba(255,215,0,0.85)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isSpinning || !isFreeSpinAvailable ? 'default' : 'pointer',
                                zIndex: 12,
                                boxShadow: '0 6px 16px rgba(0,0,0,0.85), inset 0 2px 4px rgba(255,255,255,0.4)',
                            }}
                            onClick={isFreeSpinAvailable ? handleSpinWheel : undefined}
                        >
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '13.5px',
                                    fontWeight: 955,
                                    color: isFreeSpinAvailable && !isSpinning ? '#1c1002' : '#888',
                                    textShadow: isFreeSpinAvailable && !isSpinning 
                                        ? '0 1px 1px rgba(255,255,255,0.5)' 
                                        : '0 2px 4px rgba(0,0,0,0.9)',
                                    letterSpacing: '0.8px',
                                }}
                            >
                                SPIN
                            </span>
                        </motion.div>
                    </div>

                    {/* Wheel Info & Manual Spin button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                        {isFreeSpinAvailable ? (
                            <motion.button
                                whileHover={{ scale: 1.05, y: -1, boxShadow: '0 8px 25px rgba(240,192,64,0.45)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSpinWheel}
                                disabled={isSpinning}
                                style={{
                                    padding: '14px 60px',
                                    background: 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)',
                                    border: '2px solid #ffd700',
                                    borderRadius: '12px',
                                    color: '#1c1002',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 950,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(240,192,64,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
                                    letterSpacing: '1.8px',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                БЕСПЛАТНЫЙ СПИН
                            </motion.button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <p style={{ color: '#b5a695', fontSize: '13.5px', margin: 0, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                                    Вы уже крутили колесо сегодня!
                                </p>
                                {wheelTimeLeft && (
                                    <div
                                        style={{
                                            padding: '8px 28px',
                                            background: 'linear-gradient(180deg, rgba(30, 20, 10, 0.95) 0%, rgba(15, 10, 5, 0.99) 100%)',
                                            borderRadius: '10px',
                                            border: '1.5px solid rgba(240,192,64,0.35)',
                                            display: 'inline-flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.85)',
                                        }}
                                    >
                                        <span style={{ fontSize: '10px', color: '#dfc08a', fontWeight: 900, opacity: 0.9, letterSpacing: '0.8px', textShadow: '0 1px 2px #000' }}>
                                            БЕСПЛАТНЫЙ СПИН ЧЕРЕЗ:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '19px',
                                                fontFamily: "'Cinzel', serif",
                                                color: '#ffffff',
                                                fontWeight: 955,
                                                marginTop: '3px',
                                                letterSpacing: '1px',
                                                textShadow: '0 0 8px rgba(255,255,255,0.25)',
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
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (isSpinning) return;
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            disabled={isSpinning}
                            style={{
                                padding: '8px 30px',
                                background: 'transparent',
                                border: '1.5px solid rgba(240, 192, 64, 0.3)',
                                borderRadius: '10px',
                                color: '#c8a870',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 900,
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                marginTop: '4px',
                                letterSpacing: '1.2px',
                                transition: 'all 0.2s',
                                opacity: isSpinning ? 0.4 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (isSpinning) return;
                                e.currentTarget.style.color = '#ffd700';
                                e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                if (isSpinning) return;
                                e.currentTarget.style.color = '#c8a870';
                                e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.3)';
                            }}
                        >
                            ЗАКРЫТЬ
                        </motion.button>
                    </div>
                </div>
            )}
            </motion.div>

            <GiftCongratsModal rewardClaimed={rewardClaimed} onClose={() => setRewardClaimed(null)} />
        </div>
    );
};

export default DailyGiftWindow;
