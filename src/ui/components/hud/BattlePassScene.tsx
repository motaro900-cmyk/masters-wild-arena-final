import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, WEEKLY_QUESTS_POOL } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { QUESTS_POOL } from '../../../configs/QuestsConfig';
import { audioService } from '../../../services/AudioService';
import { TabButton } from './BattlePass/TabButton';
import { QuestSection } from './BattlePass/QuestSection';
import { BpLevelUpOverlay } from './BattlePass/BpLevelUpOverlay';
import { PurchaseModal } from './BattlePass/PurchaseModal';
import { RewardPreviewModal } from './BattlePass/RewardPreviewModal';
import { BattlePassStyles, CornerOrnament, BATTLE_PASS_REWARDS } from './BattlePass/BattlePassShared';
import { RewardColumn } from './BattlePass/RewardColumn';

export const BattlePassScene: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        bpLevel,
        bpExp,
        isPremium,
        claimReward,
        claimedRewards,
        setPremium,
        buyBpLevel,
        addItemToInventory,
        setEquippedWeapon,
        dailyQuests,
        weeklyQuests,
        claimQuestReward,
        claimWeeklyQuestReward,
        showBpLevelUpOverlay,
        hideBpLevelUpOverlay,
        isMobile,
    } = useGameStore();
    const [activeTab, setActiveTab] = useState<'REWARDS' | 'QUESTS'>('REWARDS');
    const [currentPage, setCurrentPage] = useState(Math.min(2, Math.max(0, Math.floor((bpLevel - 1) / 5))));

    const handleClaimAll = () => {
        let claimedAny = false;
        BATTLE_PASS_REWARDS.forEach((reward) => {
            const levelUnlocked = bpLevel >= reward.level;

            // Claim free reward if unlocked and not claimed
            if (levelUnlocked && !claimedRewards.includes(reward.free.id)) {
                claimReward(reward.free.id);
                addItemToInventory(reward.free.id);
                claimedAny = true;
            }

            // Claim premium reward if unlocked, premium active, and not claimed
            if (levelUnlocked && isPremium && !claimedRewards.includes(reward.premium.id)) {
                claimReward(reward.premium.id);
                addItemToInventory(reward.premium.id);
                claimedAny = true;
            }
        });

        if (claimedAny) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
        } else {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
        }
    };

    const handleClaim = (item: any) => {
        claimReward(item.id);
        addItemToInventory(item.id);
        if (item.type === 'WEAPON' || item.type === 'SKIN') {
            setEquippedWeapon(item.id); // Сразу надеваем для "ВАУ-эффекта"
        }
        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
    };
    const [selectedReward, setSelectedReward] = useState<any | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    React.useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            const diff = endOfMonth.getTime() - now.getTime();

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}д ${hours}ч ${mins}м`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, []);

    const maxExp = 1000;
    const progress = (bpExp / maxExp) * 100;

    const currentDailyQuests = (dailyQuests || []).map((dq: any) => {
        const meta = QUESTS_POOL.find((q) => q.id === dq.questId) || {
            title: 'Неизвестное задание',
            description: '',
            target: 1,
            rewardExp: 100,
            icon: '📜',
            type: 'LOGIN',
        };
        const xp = meta.rewardExp || 100;
        let icon = '📜';
        if (meta.type === 'LOGIN') icon = '🚪';
        else if (meta.type === 'PLAY') icon = '🎮';
        else if (meta.type === 'WIN') icon = '🏆';
        else if (meta.type === 'DAMAGE') icon = '💥';
        else if (meta.type === 'SPEND_GOLD') icon = '💰';
        else if (meta.type === 'OPEN_CHEST') icon = '📦';
        else if (meta.type === 'UPGRADE') icon = '⚒️';
        else if (meta.type === 'WIN_STREAK') icon = '🔥';

        return {
            id: dq.questId,
            title: meta.title,
            description: meta.description,
            progress: dq.progress,
            target: meta.target,
            rewardXp: xp,
            icon: icon,
            isClaimed: dq.isClaimed,
            canClaim: dq.progress >= meta.target && !dq.isClaimed,
        };
    });

    const currentWeeklyQuests = (weeklyQuests || []).map((wq: any) => {
        const meta = WEEKLY_QUESTS_POOL.find((q) => q.id === wq.questId) || {
            title: 'Неизвестное задание',
            description: '',
            target: 1,
            rewardExp: 500,
            icon: '📜',
        };
        return {
            id: wq.questId,
            title: meta.title,
            description: meta.description,
            progress: wq.progress,
            target: meta.target,
            rewardXp: meta.rewardExp || 500,
            icon: meta.icon || '📜',
            isClaimed: wq.isClaimed,
            canClaim: wq.progress >= meta.target && !wq.isClaimed,
        };
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: '1920px',
                height: '1080px',
                position: 'fixed',
                top: 0,
                left: 0,
                background: '#020202',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Cinzel', serif",
                color: '#fff',
                overflow: 'hidden',
                pointerEvents: 'auto',
            }}
        >
            <BattlePassStyles />

            {/* КИНЕМАТОГРАФИЧЕСКИЙ ФОН */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url("${isMobile ? AssetsMap.BACKGROUNDS.BATTLE_PASS_MOBILE : AssetsMap.BACKGROUNDS.BATTLE_PASS}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 1,
                    filter: 'brightness(0.4) blur(4px)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            {/* ЛЕГКИЙ ГРАДИЕНТ ДЛЯ АКЦЕНТА НА ЦЕНТРЕ */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            {/* ГЛАВНАЯ ГОТИЧЕСКАЯ ПАНЕЛЬ-СУНДУК */}
            <div
                style={{
                    width: '1720px',
                    height: '920px',
                    background:
                        'radial-gradient(circle at center, rgba(27, 18, 12, 0.8) 0%, rgba(10, 6, 4, 0.94) 100%)',
                    border: '4px solid #b8860b',
                    borderRadius: '16px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.95), inset 0 0 40px rgba(0,0,0,0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 5,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* ВНУТРЕННИЙ ПОЛУПРОЗРАЧНЫЙ ФОН ДЛЯ ГЛУБИНЫ ИНТЕРФЕЙСА */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url("${isMobile ? AssetsMap.BACKGROUNDS.BATTLE_PASS_MOBILE : AssetsMap.BACKGROUNDS.BATTLE_PASS}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.16,
                        zIndex: 0,
                        pointerEvents: 'none',
                    }}
                />
                {/* ДЕКОРАТИВНЫЕ МЕТАЛЛИЧЕСКИЕ УГОЛКИ */}
                <CornerOrnament style={{ top: '8px', left: '8px' }} />
                <CornerOrnament style={{ top: '8px', right: '8px', transform: 'rotate(90deg)' }} />
                <CornerOrnament style={{ bottom: '8px', left: '8px', transform: 'rotate(-90deg)' }} />
                <CornerOrnament style={{ bottom: '8px', right: '8px', transform: 'rotate(180deg)' }} />

                {/* АНИМИРОВАННЫЕ ИСКРЫ НА ФОНЕ */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
                    {Array.from({ length: 12 }).map((_, idx) => {
                        const left = `${5 + idx * 8}%`;
                        const size = `${3 + (idx % 3) * 2}px`;
                        const delay = `${idx * 0.8}s`;
                        const duration = `${6 + (idx % 4) * 2.5}s`;
                        const drift = `${(idx % 2 === 0 ? 50 : -50) * (idx + 1)}px`;
                        return (
                            <div
                                key={idx}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left,
                                    width: size,
                                    height: size,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, #ffaa33 0%, #cc5500 100%)',
                                    boxShadow: '0 0 10px #ffaa33, 0 0 20px #ff5500',
                                    animation: `bpEmberFloat ${duration} infinite linear`,
                                    animationDelay: delay,
                                    opacity: 0,
                                    ['--drift-x' as any]: drift,
                                }}
                            />
                        );
                    })}
                </div>

                <div
                    style={{
                        height: '135px',
                        padding: '0 40px',
                        display: 'flex',
                        alignItems: 'center',
                        background: 'linear-gradient(180deg, #251b14 0%, #150f0c 100%)',
                        borderBottom: '3px solid #b8860b',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        zIndex: 10,
                        position: 'relative',
                    }}
                >
                    {/* ГОТОВЫЙ СПРАЙТ БАННЕРА */}
                    <div
                        style={{
                            width: 550,
                            height: 120,
                            backgroundImage: `url(${AssetsMap.UI.ICON_BEAST_PASS})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            position: 'relative',
                            marginRight: '20px',
                            flexShrink: 0,
                        }}
                    >
                        {/* УРОВЕНЬ НА ГЕРБЕ */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '12.1%',
                                top: '46%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: 38,
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    textShadow: '0 0 10px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)',
                                    lineHeight: '1',
                                }}
                            >
                                {bpLevel}
                            </span>
                        </div>

                        {/* ДИНАМИЧЕСКИЙ ПРОГРЕСС-БАР ОПЫТА */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '24.9%',
                                top: 'calc(49% + 10px)',
                                width: '48.2%',
                                height: '18px',
                                transform: 'translateY(-50%)',
                                borderRadius: '9px',
                                pointerEvents: 'none',
                                background: '#0c0d10',
                                border: '1px solid rgba(240, 192, 64, 0.45)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.8), inset 0 1px 5px rgba(0,0,0,0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #f0c040 0%, #ffea80 50%, #f0c040 100%)',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    borderRadius: '9px',
                                    boxShadow: '0 0 10px rgba(240, 192, 64, 0.8)',
                                }}
                                className="bp-gold-sweep"
                            />
                            <div
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    fontFamily: "'Nunito', sans-serif",
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    textShadow: '1px 1px 2px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.8)',
                                }}
                            >
                                {bpExp} / {maxExp} XP
                            </div>
                        </div>

                        {/* ЗАГОЛОВОК */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '48%',
                                top: '18%',
                                transform: 'translateX(-50%)',
                                fontFamily: "'Cinzel', serif",
                                fontSize: 18,
                                fontWeight: 900,
                                color: '#f0c040',
                                textShadow: '0 2px 4px rgba(0,0,0,1)',
                                letterSpacing: '2.8px',
                                textTransform: 'uppercase',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            БОЕВОЙ ПРОПУСК
                        </div>

                        {/* ТАЙМЕР */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '48%',
                                bottom: '12%',
                                transform: 'translateX(-50%)',
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 13,
                                fontWeight: 800,
                                color: 'rgba(255, 255, 255, 0.6)',
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ fontSize: 11 }}>⏳</span>
                            <span>ДО КОНЦА: {timeLeft}</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
                        <div
                            style={{
                                display: 'flex',
                                background: '#120b08',
                                padding: '4px',
                                borderRadius: '8px',
                                border: '2px solid #5c4033',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                            }}
                        >
                            <TabButton
                                active={activeTab === 'REWARDS'}
                                onClick={() => {
                                    setActiveTab('REWARDS');
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                }}
                                label="НАГРАДЫ"
                                icon="sprite-gift"
                            />
                            <TabButton
                                active={activeTab === 'QUESTS'}
                                onClick={() => {
                                    setActiveTab('QUESTS');
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                }}
                                label="ЗАДАНИЯ"
                                icon="📜"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {bpLevel < 15 && (
                            <motion.button
                                onClick={() => {
                                    buyBpLevel();
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    height: '52px',
                                    padding: '0 20px',
                                    background: 'linear-gradient(180deg, #2a1b14 0%, #150f0c 100%)',
                                    border: '2px solid #b8860b',
                                    borderRadius: '8px',
                                    color: '#c8a870',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '1px',
                                    }}
                                >
                                    КУПИТЬ УРОВЕНЬ
                                </span>
                                <div style={{ width: '1px', height: '24px', background: '#3d2314' }} />
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'rgba(0,0,0,0.4)',
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #3d2314',
                                    }}
                                >
                                    <img
                                        src="/assets/images/ui/icons/almaz.webp"
                                        alt="Gems"
                                        style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    />
                                    <span
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        150
                                    </span>
                                </div>
                            </motion.button>
                        )}

                        {!isPremium && (
                            <motion.button
                                onClick={() => {
                                    setIsPurchaseModalOpen(true);
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                }}
                                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    height: '52px',
                                    padding: '0 25px',
                                    background: 'linear-gradient(180deg, #1b3a24 0%, #0c1c11 100%)',
                                    border: '2px solid #b8860b',
                                    borderRadius: '8px',
                                    color: '#ffd700',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    letterSpacing: '1.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                    textShadow: '0 1.5px 2px rgba(0,0,0,0.8)',
                                }}
                            >
                                <span>👑</span>
                                <span>КУПИТЬ ПРЕМИУМ</span>
                            </motion.button>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                                onClose();
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            }}
                            style={{
                                width: '45px',
                                height: '45px',
                                background: 'linear-gradient(180deg, #8b1c1c 0%, #450a0a 100%)',
                                border: '2px solid #b8860b',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '22px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            }}
                        >
                            ×
                        </motion.button>
                    </div>
                </div>

                {/* КОНТЕНТ В ЗАВИСИМОСТИ ОТ ТАБА */}
                <div style={{ flex: 1, position: 'relative', zIndex: 5, overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'REWARDS' ? (
                            <motion.div
                                key="rewards"
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 50, opacity: 0 }}
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    width: '100%',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* ЛЕВАЯ ФИКСИРОВАННАЯ ПАНЕЛЬ С НАЗВАНИЯМИ ДОРОЖЕК */}
                                <div
                                    style={{
                                        width: '240px',
                                        background: 'linear-gradient(90deg, #1b120c 0%, #150f0c 100%)',
                                        borderRight: '3px solid #b8860b',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 20px',
                                        boxShadow: '5px 0 15px rgba(0,0,0,0.5)',
                                        zIndex: 2,
                                    }}
                                >
                                    {/* Вверхняя метка - Премиум */}
                                    <div
                                        style={{
                                            width: '200px',
                                            height: '240px',
                                            background: 'radial-gradient(circle at center, #3a1515 0%, #150505 100%)',
                                            border: '2px solid #ffd700',
                                            borderRadius: '12px',
                                            boxShadow: '0 0 15px rgba(255,215,0,0.15), inset 0 0 10px rgba(0,0,0,0.6)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            padding: '20px 10px',
                                            gap: '15px',
                                        }}
                                    >
                                        <img
                                            src={AssetsMap.UI.ICON_CROWN}
                                            alt="Premium Path"
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))',
                                            }}
                                        />
                                        <div>
                                            <span
                                                style={{
                                                    fontFamily: "'Cinzel', serif",
                                                    fontWeight: 950,
                                                    fontSize: '15px',
                                                    color: '#ffd700',
                                                    letterSpacing: '1.5px',
                                                    textTransform: 'uppercase',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    display: 'block',
                                                }}
                                            >
                                                КОРОЛЕВСКИЙ
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: "'Cinzel', serif",
                                                    fontWeight: 900,
                                                    fontSize: '12px',
                                                    color: '#f59e0b',
                                                    letterSpacing: '2.5px',
                                                    textTransform: 'uppercase',
                                                    marginTop: '4px',
                                                    display: 'block',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                                }}
                                            >
                                                ПУТЬ
                                            </span>
                                        </div>
                                    </div>

                                    {/* Центр - Разделитель без линии */}
                                    <div
                                        style={{
                                            height: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontWeight: 950,
                                                fontSize: '14px',
                                                color: '#f0c040',
                                                letterSpacing: '2px',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                            }}
                                        >
                                            ЭТАПЫ
                                        </span>
                                    </div>

                                    {/* Нижняя метка - Бесплатный */}
                                    <div
                                        style={{
                                            width: '200px',
                                            height: '240px',
                                            background: 'radial-gradient(circle at center, #1c110a 0%, #0c0704 100%)',
                                            border: '2px solid #c8a870',
                                            borderRadius: '12px',
                                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            padding: '20px 10px',
                                            gap: '15px',
                                        }}
                                    >
                                        <img
                                            src="/assets/images/ui/power_icon.webp"
                                            alt="Free Path"
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
                                            }}
                                        />
                                        <div>
                                            <span
                                                style={{
                                                    fontFamily: "'Cinzel', serif",
                                                    fontWeight: 950,
                                                    fontSize: '15px',
                                                    color: '#c8a870',
                                                    letterSpacing: '1.5px',
                                                    textTransform: 'uppercase',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    display: 'block',
                                                }}
                                            >
                                                ВОИНСКИЙ
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: "'Cinzel', serif",
                                                    fontWeight: 900,
                                                    fontSize: '12px',
                                                    color: '#a3a3a3',
                                                    letterSpacing: '2.5px',
                                                    textTransform: 'uppercase',
                                                    marginTop: '4px',
                                                    display: 'block',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                                }}
                                            >
                                                ПУТЬ
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ПАНЕЛЬ ДОРОЖКИ НАГРАД С ПОСТРАНИЧНОЙ НАВИГАЦИЕЙ */}
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        justifyContent: 'center',
                                        padding: '0 20px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    {/* НАПРАВЛЯЮЩИЕ СТРЕЛКИ И ДОРОЖКА */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            gap: '15px',
                                            flex: 1,
                                        }}
                                    >
                                        {/* ЛЕВАЯ СТРЕЛКА */}
                                        <motion.button
                                            disabled={currentPage === 0}
                                            whileHover={
                                                currentPage > 0
                                                    ? { scale: 1.1, boxShadow: '0 0 15px rgba(240, 192, 64, 0.4)' }
                                                    : {}
                                            }
                                            whileTap={currentPage > 0 ? { scale: 0.9 } : {}}
                                            onClick={() => {
                                                if (currentPage > 0) {
                                                    setCurrentPage(currentPage - 1);
                                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                                }
                                            }}
                                            style={{
                                                width: '50px',
                                                height: '60px',
                                                background:
                                                    currentPage === 0
                                                        ? 'rgba(25, 17, 12, 0.4)'
                                                        : 'linear-gradient(180deg, #4a2f1b 0%, #2b180a 100%)',
                                                border: '2px solid #b8860b',
                                                borderColor: currentPage === 0 ? 'rgba(184, 134, 11, 0.2)' : '#b8860b',
                                                borderRadius: '8px',
                                                color: currentPage === 0 ? 'rgba(200, 168, 112, 0.3)' : '#ffd700',
                                                fontSize: '22px',
                                                fontWeight: 900,
                                                cursor: currentPage === 0 ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: currentPage === 0 ? 0.45 : 1,
                                                boxShadow: currentPage === 0 ? 'none' : '0 4px 10px rgba(0,0,0,0.5)',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            ◀
                                        </motion.button>

                                        {/* КОЛОНКИ НАГРАД ТЕКУЩЕЙ СТРАНИЦЫ */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '30px',
                                            }}
                                        >
                                            {BATTLE_PASS_REWARDS.slice(currentPage * 5, currentPage * 5 + 5).map(
                                                (reward) => (
                                                    <RewardColumn
                                                        key={reward.level}
                                                        reward={reward}
                                                        isUnlocked={bpLevel >= reward.level}
                                                        isPremium={isPremium}
                                                        claimedRewards={claimedRewards}
                                                        onClaim={handleClaim}
                                                        onPreview={setSelectedReward}
                                                        isMilestone={reward.level % 5 === 0}
                                                    />
                                                ),
                                            )}
                                        </div>

                                        {/* ПРАВАЯ СТРЕЛКА */}
                                        <motion.button
                                            disabled={currentPage === 2}
                                            whileHover={
                                                currentPage < 2
                                                    ? { scale: 1.1, boxShadow: '0 0 15px rgba(240, 192, 64, 0.4)' }
                                                    : {}
                                            }
                                            whileTap={currentPage < 2 ? { scale: 0.9 } : {}}
                                            onClick={() => {
                                                if (currentPage < 2) {
                                                    setCurrentPage(currentPage + 1);
                                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                                }
                                            }}
                                            style={{
                                                width: '50px',
                                                height: '60px',
                                                background:
                                                    currentPage === 2
                                                        ? 'rgba(25, 17, 12, 0.4)'
                                                        : 'linear-gradient(180deg, #4a2f1b 0%, #2b180a 100%)',
                                                border: '2px solid #b8860b',
                                                borderColor: currentPage === 2 ? 'rgba(184, 134, 11, 0.2)' : '#b8860b',
                                                borderRadius: '8px',
                                                color: currentPage === 2 ? 'rgba(200, 168, 112, 0.3)' : '#ffd700',
                                                fontSize: '22px',
                                                fontWeight: 900,
                                                cursor: currentPage === 2 ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: currentPage === 2 ? 0.45 : 1,
                                                boxShadow: currentPage === 2 ? 'none' : '0 4px 10px rgba(0,0,0,0.5)',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            ▶
                                        </motion.button>
                                    </div>

                                    {/* ПЕРЕКЛЮЧАТЕЛИ СТРАНИЦ */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            position: 'absolute',
                                            bottom: '20px',
                                            left: 0,
                                            right: 0,
                                            zIndex: 10,
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            {[0, 1, 2].map((pageIndex) => {
                                                const isActive = currentPage === pageIndex;
                                                const startLvl = pageIndex * 5 + 1;
                                                const endLvl = pageIndex * 5 + 5;
                                                return (
                                                    <motion.button
                                                        key={pageIndex}
                                                        whileHover={
                                                            !isActive
                                                                ? {
                                                                      scale: 1.05,
                                                                      boxShadow: '0 0 10px rgba(240,192,64,0.3)',
                                                                  }
                                                                : {}
                                                        }
                                                        whileTap={!isActive ? { scale: 0.95 } : {}}
                                                        onClick={() => {
                                                            setCurrentPage(pageIndex);
                                                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                                        }}
                                                        style={{
                                                            padding: '8px 22px',
                                                            background: isActive
                                                                ? 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)'
                                                                : 'linear-gradient(180deg, #2e1c11 0%, #1c110a 100%)',
                                                            border: isActive
                                                                ? '2px solid #ffffff'
                                                                : '2px solid #b8860b',
                                                            borderRadius: '8px',
                                                            color: isActive ? '#1a0d00' : '#c8a870',
                                                            fontFamily: "'Cinzel', serif",
                                                            fontWeight: 900,
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            boxShadow: isActive
                                                                ? '0 0 15px rgba(240, 192, 64, 0.4)'
                                                                : '0 4px 8px rgba(0,0,0,0.5)',
                                                            letterSpacing: '1px',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        ЭТАПЫ {startLvl}-{endLvl}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,215,0,0.3)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleClaimAll}
                                            style={{
                                                position: 'absolute',
                                                right: '50px',
                                                height: '46px',
                                                padding: '0 25px',
                                                background: 'linear-gradient(180deg, #1b3a24 0%, #0c1c11 100%)',
                                                border: '2px solid #b8860b',
                                                borderRadius: '8px',
                                                color: '#ffd700',
                                                fontWeight: 900,
                                                fontSize: '13px',
                                                fontFamily: "'Cinzel', serif",
                                                letterSpacing: '1.5px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textShadow: '0 1.5px 2px rgba(0,0,0,0.8)',
                                            }}
                                        >
                                            <img
                                                src="/assets/images/ui/gift_premium.png"
                                                alt="Gift"
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    marginRight: '8px',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                            <span>ЗАБРАТЬ ВСЁ</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="quests"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                style={{
                                    height: '100%',
                                    padding: '40px 60px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '40px',
                                }}
                            >
                                <QuestSection
                                    title="ЕЖЕДНЕВНЫЕ"
                                    quests={currentDailyQuests}
                                    onClaim={claimQuestReward}
                                />
                                <QuestSection
                                    title="ЕЖЕНЕДЕЛЬНЫЕ"
                                    quests={currentWeeklyQuests}
                                    onClaim={claimWeeklyQuestReward}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ФУТЕР С ПОДСКАЗКОЙ */}
                <div
                    style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#150f0c',
                        borderTop: '2px solid #b8860b',
                        zIndex: 10,
                    }}
                >
                    <p
                        style={{
                            color: '#c8a870',
                            fontSize: '13px',
                            letterSpacing: '2px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            margin: 0,
                        }}
                    >
                        ЗАРАБАТЫВАЙТЕ ОПЫТ В БОЯХ, ЧТОБЫ ОТКРЫВАТЬ НОВЫЕ УРОВНИ
                    </p>
                </div>

                {/* МОДАЛЬНЫЕ ОКНА И ОВЕРЛЕИ */}
                <AnimatePresence>
                    {isPurchaseModalOpen && (
                        <PurchaseModal
                            onClose={() => setIsPurchaseModalOpen(false)}
                            onBuy={() => {
                                const success = setPremium(true);
                                if (success) {
                                    setIsPurchaseModalOpen(false);
                                }
                            }}
                        />
                    )}
                    {selectedReward && (
                        <RewardPreviewModal item={selectedReward} onClose={() => setSelectedReward(null)} />
                    )}
                    {showBpLevelUpOverlay && <BpLevelUpOverlay level={bpLevel} onClose={hideBpLevelUpOverlay} />}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
