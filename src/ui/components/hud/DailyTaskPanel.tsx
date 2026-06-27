import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { QUESTS_POOL } from '../../../configs/QuestsConfig';
import { safeGetItem, safeSetItem } from '../../../utils/SafeStorage';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { TimeService } from '../../../utils/TimeService';

interface IDailyQuest {
    questId: string;
    progress: number;
    isClaimed: boolean;
}

export const DailyTaskPanel = React.memo(() => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dailyQuests = useGameStore((state) => state.dailyQuests);
    const claimQuestReward = useGameStore((state) => state.claimQuestReward);
    const refreshDailyQuests = useGameStore((state) => state.refreshDailyQuests);
    const vipLevel = useGameStore((state) => state.vipLevel);
    const vipEndTime = useGameStore((state) => state.vipEndTime);
    const storeLastVipQuestPassDate = useGameStore((state) => (state as any).lastVipQuestPassDate);
    const isMobileFromStore = useGameStore((state) => state.isMobile);
    const graphicsQuality = useGameStore((state) => state.graphicsQuality);
    const [isMobileLayout, setIsMobileLayout] = useState(isMobileFromStore);

    const isLow = graphicsQuality === 'LOW';

    useEffect(() => {
        const checkLayout = () => {
            const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
            setIsMobileLayout(isMobileFromStore || isSmallScreen);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, [isMobileFromStore]);

    const [floatingRewards, setFloatingRewards] = useState<{ id: number; amount: number; type: string; x: number; y: number }[]>([]);

    const handleClaimReward = (dq: IDailyQuest, qData: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const parent = document.getElementById('daily-task-panel-root');
        const parentRect = parent ? parent.getBoundingClientRect() : null;

        // Position coordinates relative to the panel
        const x = rect.left - (parentRect?.left || 0) + rect.width / 2;
        const y = rect.top - (parentRect?.top || 0) - 10;

        const newRewards = [
            { id: Date.now(), amount: qData.rewardGold, type: 'GOLD', x: x - 40, y: y },
            { id: Date.now() + 1, amount: qData.rewardGems, type: 'GEM', x: x, y: y - 15 },
            { id: Date.now() + 2, amount: qData.rewardExp, type: 'EXP', x: x + 40, y: y },
        ];

        setFloatingRewards((prev) => [...prev, ...newRewards]);

        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
        claimQuestReward(dq.questId);

        setTimeout(() => {
            setFloatingRewards((prev) => prev.filter((r) => !newRewards.some((nr) => nr.id === r.id)));
        }, 1500);
    };

    const getMoscowDateString = () => {
        const now = TimeService.now();
        const msk = new Date(now + (new Date().getTimezoneOffset() + 180) * 60000);
        return `${msk.getFullYear()}-${(msk.getMonth() + 1).toString().padStart(2, '0')}-${msk.getDate().toString().padStart(2, '0')}`;
    };

    const todayStr = getMoscowDateString();
    const [lastPassDate, setLastPassDate] = useState(() => storeLastVipQuestPassDate || safeGetItem('lastVipQuestPassDate') || '');

    // Sync local state if store value updates
    useEffect(() => {
        if (storeLastVipQuestPassDate) {
            setLastPassDate(storeLastVipQuestPassDate);
        }
    }, [storeLastVipQuestPassDate]);

    const hasVip = vipLevel > 0 || (vipEndTime ? vipEndTime > TimeService.now() : false);
    const canInstantPass = hasVip && lastPassDate !== todayStr;

    const handleInstantPassQuest = (questId: string) => {
        if (!hasVip || !canInstantPass) return;

        const qData = QUESTS_POOL.find((q) => q.id === questId);
        if (!qData) return;

        // Заполняем прогресс квеста до максимума
        const updatedQuests = dailyQuests.map((dq: any) => {
            if (dq.questId === questId) {
                return {
                    ...dq,
                    progress: qData.target,
                };
            }
            return dq;
        });

        // Записываем в Zustand
        useGameStore.setState({ 
            dailyQuests: updatedQuests,
            lastVipQuestPassDate: todayStr 
        });

        // Сохраняем дату авто-прохождения
        safeSetItem('lastVipQuestPassDate', todayStr);
        setLastPassDate(todayStr);

        audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP);

        // Триггерим фоновую синхронизацию
        import('../../../services/SyncService').then(({ syncService }) => {
            syncService.debouncedSync();
        });
    };

    React.useEffect(() => {
        if (!dailyQuests || dailyQuests.length === 0) {
            refreshDailyQuests();
        }
    }, [dailyQuests, refreshDailyQuests]);

    const getTimeRemaining = () => {
        const MSK_OFFSET = 3 * 60 * 60 * 1000;
        const DAY_MS = 24 * 60 * 60 * 1000;

        // eslint-disable-next-line react-hooks/purity
        const nowUTC = Date.now();
        const nowMSK = nowUTC + MSK_OFFSET;

        // Находим следующую полночь по МСК
        const nextMidnightMSK = Math.floor(nowMSK / DAY_MS + 1) * DAY_MS;
        const diff = nextMidnightMSK - nowMSK;

        if (diff <= 0) return '0h 0m';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div
            id="daily-task-panel-root"
            style={{
                width: 420,
                height: isCollapsed ? 70 : 540,
                padding: '28px 28px 22px 28px',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                transition: 'height 0.3s ease-in-out',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Background image with filter */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${AssetsMap.UI.PANEL_QUEST})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    filter: isLow ? 'none' : 'contrast(1.1) saturate(1.1) brightness(1.0)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />
            {/* HEADER */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: isCollapsed ? 0 : 15,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontFamily: "'Cinzel', serif",
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#3a220b',
                        textAlign: 'center',
                        letterSpacing: '1.5px',
                        textShadow: '0 1px 0px rgba(255,255,255,0.5)',
                    }}
                >
                    ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
                </h3>
                <span
                    style={{
                        position: 'absolute',
                        right: 0,
                        fontSize: 16,
                        color: '#3d2a10',
                        transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                    }}
                >
                    ▲
                </span>
            </div>

            {!isCollapsed && (
                <AnimatePresence>
                    <motion.div
                        key="task-list-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            flex: 1,
                            overflow: 'hidden',
                            marginTop: '0px',
                            paddingTop: '0px',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {dailyQuests
                            ?.slice(0, 4)
                            .filter((dq: IDailyQuest) => dq.questId)
                            .map((dq: IDailyQuest, index: number) => {
                                const qData = QUESTS_POOL.find((q) => q.id === dq.questId);
                                if (!qData) return null;

                                const isComplete = dq.progress >= qData.target;

                                // Сетка на фоновой картинке фиксированная, поэтому позиционирование квестов
                                // должно быть одинаковым для ПК и мобильных, так как размер панели неизменен (420x540).
                                const currentStyle = [
                                    { padding: '18px 0 0 0', height: '88px' },
                                    { padding: '12px 0 0 0', height: '94px' },
                                    { padding: '4px 0 0 0', height: '94px' },
                                    { padding: '2px 0 0 0', height: '94px' }
                                ][index] || { padding: '12px 0 0 0', height: '94px' };

                                return (
                                    <div
                                        key={`quest-item-${dq.questId}-${index}`}
                                        style={{
                                            ...currentStyle,
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '5px' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        color: '#36200a',
                                                        fontWeight: 950,
                                                        fontSize: '15px',
                                                        textTransform: 'uppercase',
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        textShadow: '0 1px 0px rgba(255,255,255,0.8)',
                                                    }}
                                                >
                                                    {qData.title}
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: isComplete ? '#1a6a34' : '#36200a',
                                                        fontWeight: 950,
                                                        fontSize: '14px',
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        textShadow: '0 1px 0px rgba(255,255,255,0.8)',
                                                    }}
                                                >
                                                    {dq.progress}/{qData.target} {isComplete && '✓'}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    color: '#4e381f',
                                                    fontSize: '12px',
                                                    fontWeight: 800,
                                                    marginTop: '2px',
                                                    fontFamily: "'Montserrat', sans-serif",
                                                    lineHeight: '1.25',
                                                    textShadow: '0 1px 0px rgba(255,255,255,0.6)',
                                                }}
                                            >
                                                {qData.description}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: isMobileLayout ? '10px' : '15px',
                                                marginTop: '3px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <img
                                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                                    style={{ width: 28, height: 28, objectFit: 'contain' }}
                                                    alt=""
                                                />
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#3d260f' }}>
                                                    {qData.rewardGold}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <img
                                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                                    style={{ width: 26, height: 26, objectFit: 'contain' }}
                                                    alt=""
                                                />
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#3d260f' }}>
                                                    {qData.rewardGems}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <img
                                                    src={AssetsMap.UI.ICON_XP}
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        objectFit: 'contain',
                                                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                                                        transform: 'scale(1.3)',
                                                        transformOrigin: 'center',
                                                    }}
                                                    alt=""
                                                />
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#3d260f' }}>
                                                    {qData.rewardExp}
                                                </span>
                                            </div>

                                            <div style={{ flex: 1 }} />

                                            {dq.isClaimed ? (
                                                <span
                                                    style={{
                                                        color: '#208040',
                                                        fontWeight: 900,
                                                        fontSize: '11px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    ВЫПОЛНЕНО
                                                </span>
                                            ) : isComplete ? (
                                                <button
                                                    onClick={(e) => handleClaimReward(dq, qData, e)}
                                                    style={{
                                                        minWidth: 'unset',
                                                        minHeight: 'unset',
                                                        padding: isMobileLayout ? '3.5px 10px' : '5px 12px',
                                                        background: 'linear-gradient(180deg, #f0c040 0%, #c87820 100%)',
                                                        border: '1px solid #3d2a10',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        fontWeight: 900,
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    ЗАБРАТЬ
                                                </button>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: isMobileLayout ? '5px' : '8px',
                                                    }}
                                                >
                                                    {/* Шкала прогресса */}
                                                    <div
                                                        style={{
                                                            width:
                                                                hasVip && canInstantPass
                                                                    ? isMobileLayout
                                                                        ? '50px'
                                                                        : '60px'
                                                                    : isMobileLayout
                                                                      ? '100px'
                                                                      : '120px',
                                                            height: '8px',
                                                            background: 'rgba(0,0,0,0.1)',
                                                            borderRadius: '4px',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${(dq.progress / qData.target) * 100}%`,
                                                                height: '100%',
                                                                background: '#7a5828',
                                                                transition: 'width 0.3s',
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Кнопка VIP Пройти (показывается только при наличии VIP и возможности прохождения) */}
                                                    {hasVip && canInstantPass && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleInstantPassQuest(dq.questId);
                                                            }}
                                                            style={{
                                                                minWidth: 'unset',
                                                                minHeight: 'unset',
                                                                padding: isMobileLayout ? '2.5px 6px' : '3.5px 7px',
                                                                background:
                                                                    'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)', // Фиолетовый градиент VIP
                                                                border: '1.2px solid #c084fc',
                                                                borderRadius: '4px',
                                                                color: '#ffffff',
                                                                fontWeight: 900,
                                                                fontSize: '9.5px',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 0 8px rgba(139, 92, 246, 0.45)',
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '2px',
                                                                transition: 'all 0.2s',
                                                                pointerEvents: 'auto',
                                                                zIndex: 10,
                                                            }}
                                                            title="Авто-прохождение задания (1 раз в день для VIP)"
                                                        >
                                                            <span style={{ fontSize: '8.5px' }}>★</span>
                                                            <span>{isMobileLayout ? 'АВТО' : 'VIP АВТО'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </motion.div>
                    <div
                        style={{
                            marginTop: '10px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#3d2a10',
                            fontWeight: 900,
                            fontFamily: "'Montserrat', sans-serif",
                            textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.4)',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        Обновится через: {getTimeRemaining()}
                    </div>
                </AnimatePresence>
            )}

            {/* FLOATING REWARDS OVERLAY */}
            <AnimatePresence>
                {floatingRewards.map((reward) => (
                    <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: reward.y, scale: 0.8 }}
                        animate={{ opacity: 1, y: reward.y - 60, scale: 1.1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            left: reward.x,
                            color: reward.type === 'GOLD'
                                ? '#f1c40f'
                                : reward.type === 'GEM'
                                  ? '#00ffff'
                                  : '#38bdf8',
                            fontWeight: 900,
                            fontSize: '15px',
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 2px 6px #000, 0 0 10px rgba(0,0,0,0.8)',
                            pointerEvents: 'none',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <span>+{reward.amount}</span>
                        {reward.type === 'GOLD' && (
                            <img
                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                alt=""
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                        )}
                        {reward.type === 'GEM' && (
                            <img
                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                alt=""
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                        )}
                        {reward.type === 'EXP' && (
                            <img
                                src={AssetsMap.UI.ICON_XP}
                                alt="xp"
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});
