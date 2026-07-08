import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import { GiftCongratsModal } from './DailyGift/GiftCongratsModal';
import { db, USERS_COLLECTION } from '../../../utils/firebase';
import { syncService, SyncService } from '../../../services/SyncService';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { showRewardedVideo } from '../../../utils/VKBridge';
import { DailyCalendarTab } from './DailyGift/DailyCalendarTab';
import { FortuneWheelTab } from './DailyGift/FortuneWheelTab';

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

export type RewardType = 'GOLD' | 'CRYSTAL' | 'ENERGY' | 'MEGA_CHEST';

export interface StreakReward {
    day: number;
    type: RewardType;
    amount: number;
    label: string;
}

export const STREAK_REWARDS: StreakReward[] = [
    { day: 1, type: 'GOLD', amount: 100, label: '100 Золота' },
    { day: 2, type: 'CRYSTAL', amount: 10, label: '10 Алмазов' },
    { day: 3, type: 'ENERGY', amount: 25, label: '25 Энергии' },
    { day: 4, type: 'GOLD', amount: 500, label: '500 Золота' },
    { day: 5, type: 'CRYSTAL', amount: 20, label: '20 Алмазов' },
    { day: 6, type: 'ENERGY', amount: 50, label: '50 Энергии' },
    { day: 7, type: 'MEGA_CHEST', amount: 0, label: 'Супер Награда' },
];

export interface WheelReward {
    type: 'GOLD' | 'CRYSTAL' | 'ENERGY';
    amount: number;
    label: string;
    icon: string;
    color: string;
}

export const WHEEL_REWARDS: WheelReward[] = [
    { type: 'GOLD', amount: 1000, label: '1000 Золота', icon: '/assets/images/ui/icons/Gold.webp', color: '#2c1d11' },
    { type: 'CRYSTAL', amount: 4, label: '4 Алмаза', icon: '/assets/images/ui/icons/almaz.webp', color: '#1e293b' },
    { type: 'ENERGY', amount: 15, label: '15 Энергии', icon: '/assets/images/ui/icons/energy.webp', color: '#0f172a' },
    { type: 'ENERGY', amount: 20, label: '20 Энергии', icon: '/assets/images/ui/icons/energy.webp', color: '#14532d' },
    { type: 'GOLD', amount: 2500, label: '2500 Золота', icon: '/assets/images/ui/icons/Gold.webp', color: '#3a2818' },
    { type: 'CRYSTAL', amount: 10, label: '10 Алмазов', icon: '/assets/images/ui/icons/almaz.webp', color: '#334155' },
    { type: 'ENERGY', amount: 30, label: '30 Энергии', icon: '/assets/images/ui/icons/energy.webp', color: '#1e293b' },
    { type: 'CRYSTAL', amount: 6, label: '6 Алмазов', icon: '/assets/images/ui/icons/almaz.webp', color: '#581c87' },
];

export const getSectorBg = (type: RewardType, index: number) => {
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
    const addGold = useGameStore((state) => state.addGold);
    const addCrystals = useGameStore((state) => state.addCrystals);
    const addEnergy = useGameStore((state) => state.addEnergy);
    const setCanClaimDailyGift = useGameStore((state) => state.setCanClaimDailyGift);

    // Tab control
    const [activeTab, setActiveTab] = useState<'CALENDAR' | 'WHEEL'>('CALENDAR');

    const isMobile = useGameStore((state) => state.isMobile);

    // Calendar states
    const initialGiftTime = useGameStore.getState().lastDailyGiftClaimedTime || 0;
    const initialWheelTime = useGameStore.getState().lastWheelSpinTime || 0;
    const initialStreak = useGameStore.getState().loginStreak || 0;

    // Compute initial values based on current store state to prevent layout flickering on mount
    const computeInitialDailyState = () => {
        const giftTime = initialGiftTime;
        const streak = initialStreak;

        if (!giftTime) {
            return { streak: 1, claimedToday: false };
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        const lastClaimedSeconds = Math.floor(giftTime / 1000);
        const diffSeconds = nowSeconds - lastClaimedSeconds;
        const hoursSinceLast = diffSeconds / 3600;

        if (hoursSinceLast < 24) {
            return { streak: streak || 1, claimedToday: true };
        } else {
            let currentStreak = streak || 0;
            if (diffSeconds > 2 * 24 * 3600 || currentStreak >= 7) {
                currentStreak = 0;
            }
            return { streak: currentStreak + 1, claimedToday: false };
        }
    };

    const initialDaily = computeInitialDailyState();

    const [streak, setStreak] = useState<number>(initialDaily.streak);
    const [claimedToday, setClaimedToday] = useState<boolean>(initialDaily.claimedToday);
    const [rewardClaimed, setRewardClaimed] = useState<{
        type: string;
        amount: number;
        isFromChest?: boolean;
        label?: string;
        icon?: string;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isClaiming, setIsClaiming] = useState<boolean>(false);

    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [wheelRotation, setWheelRotation] = useState<number>(0);
    const [targetSectorIndex, setTargetSectorIndex] = useState<number>(0);

    const computeInitialWheelState = () => {
        const wheelTime = initialWheelTime;
        if (!wheelTime) return true;
        const nowSeconds = Math.floor(Date.now() / 1000);
        const lastSpinSeconds = Math.floor(wheelTime / 1000);
        const diffSeconds = nowSeconds - lastSpinSeconds;
        return diffSeconds >= 24 * 3600;
    };

    const [isFreeSpinAvailable, setIsFreeSpinAvailable] = useState<boolean>(computeInitialWheelState());
    const [wheelTimeLeft, setWheelTimeLeft] = useState<string>('');

    // Server time offset
    const [timeOffset, setTimeOffset] = useState<number>(0);

    // Firestore server dates
    const [lastGiftClaimedTime, setLastGiftClaimedTime] = useState<Timestamp | null>(
        initialGiftTime ? Timestamp.fromMillis(initialGiftTime) : null,
    );
    const [lastWheelSpinTimeServer, setLastWheelSpinTimeServer] = useState<Timestamp | null>(
        initialWheelTime ? Timestamp.fromMillis(initialWheelTime) : null,
    );
    const [dbLoginStreak, setDbLoginStreak] = useState<number>(initialStreak);
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

    const handleClaim = async (double: boolean = false) => {
        if (claimedToday || isClaiming) return;

        setIsClaiming(true);

        if (double) {
            // Show rewarded ad
            const success = await showRewardedVideo();
            if (!success) {
                // Ad failed or closed early
                setIsClaiming(false);
                alert(
                    'Не удалось посмотреть рекламу до конца или видео недоступно. Попробуйте еще раз или заберите обычную награду.',
                );
                return;
            }
        }

        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
        const currentReward = STREAK_REWARDS[streak - 1];

        let claimedType = currentReward.type;
        let claimedAmount = double ? currentReward.amount * 2 : currentReward.amount;
        let isFromChest = false;

        // Award rewards
        if (currentReward.type === 'GOLD') {
            addGold(claimedAmount);
        } else if (currentReward.type === 'CRYSTAL') {
            addCrystals(claimedAmount);
        } else if (currentReward.type === 'ENERGY') {
            addEnergy(claimedAmount);
        } else if (currentReward.type === 'MEGA_CHEST') {
            isFromChest = true;
            const rolled = rollMegaChest();
            claimedType = rolled.type;
            claimedAmount = double ? rolled.amount * 2 : rolled.amount;
            if (rolled.type === 'CRYSTAL') addCrystals(claimedAmount);
            else if (rolled.type === 'GOLD') addGold(claimedAmount);
            else if (rolled.type === 'ENERGY') addEnergy(claimedAmount);
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
        setIsClaiming(false);
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
        setTargetSectorIndex(sectorIndex);
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
                padding: isMobile ? '8px 16px' : '16px 32px',
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
            <div
                style={{
                    display: 'flex',
                    gap: isMobile ? '12px' : '18px',
                    marginBottom: isMobile ? '10px' : '16px',
                    zIndex: 5,
                }}
            >
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
                        padding: isMobile ? '8px 16px' : '11px 28px',
                        background:
                            activeTab === 'CALENDAR'
                                ? 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)'
                                : 'rgba(255, 255, 255, 0.03)',
                        border: activeTab === 'CALENDAR' ? '2px solid #ffd700' : '1.5px solid rgba(240, 192, 64, 0.2)',
                        borderRadius: '12px',
                        color: activeTab === 'CALENDAR' ? '#1c1002' : '#c8a870',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        fontSize: isMobile ? '12px' : '13px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        letterSpacing: '1.5px',
                        textShadow:
                            activeTab === 'CALENDAR' ? '0 1px 1px rgba(255,255,255,0.2)' : '0 2px 4px rgba(0,0,0,0.8)',
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
                        padding: isMobile ? '8px 16px' : '11px 28px',
                        background:
                            activeTab === 'WHEEL'
                                ? 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)'
                                : 'rgba(255, 255, 255, 0.03)',
                        border: activeTab === 'WHEEL' ? '2px solid #ffd700' : '1.5px solid rgba(240, 192, 64, 0.2)',
                        borderRadius: '12px',
                        color: activeTab === 'WHEEL' ? '#1c1002' : '#c8a870',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        fontSize: isMobile ? '12px' : '13px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        letterSpacing: '1.5px',
                        textShadow:
                            activeTab === 'WHEEL' ? '0 1px 1px rgba(255,255,255,0.2)' : '0 2px 4px rgba(0,0,0,0.8)',
                        boxShadow:
                            activeTab === 'WHEEL'
                                ? '0 0 20px rgba(240, 192, 64, 0.35), inset 0 1px 0 rgba(255,255,255,0.35)'
                                : 'none',
                    }}
                >
                    РУЛЕТКА УДАЧИ
                </button>
            </div>

            <motion.div
                drag={isMobile ? 'x' : undefined}
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
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    touchAction: isMobile ? 'pan-y' : 'auto',
                }}
            >
                {activeTab === 'CALENDAR' ? (
                    <DailyCalendarTab
                        streak={streak}
                        claimedToday={claimedToday}
                        isClaiming={isClaiming}
                        isMobile={isMobile}
                        timeLeft={timeLeft}
                        handleClaim={handleClaim}
                    />
                ) : (
                    <FortuneWheelTab
                        isMobile={isMobile}
                        isSpinning={isSpinning}
                        isFreeSpinAvailable={isFreeSpinAvailable}
                        targetSectorIndex={targetSectorIndex}
                        handleSpinWheel={handleSpinWheel}
                        wheelTimeLeft={wheelTimeLeft}
                    />
                )}
            </motion.div>

            <GiftCongratsModal rewardClaimed={rewardClaimed} onClose={() => setRewardClaimed(null)} />
        </div>
    );
};

export default DailyGiftWindow;
