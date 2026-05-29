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
                        height: '120px',
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
                    <div
                        style={{
                            position: 'relative',
                            width: '80px',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            filter: 'drop-shadow(0 0 15px rgba(240,192,64,0.4))',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #f0c040 0%, #a88020 100%)',
                                border: '4px solid #ffd700',
                                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
                            }}
                        />
                        <span
                            style={{
                                zIndex: 1,
                                fontSize: '32px',
                                fontWeight: 900,
                                color: '#1a0d00',
                                textShadow: '0 1px 1px rgba(255,255,255,0.4)',
                            }}
                        >
                            {bpLevel}
                        </span>
                    </div>

                    <div style={{ marginLeft: '30px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                            <div>
                                <h1
                                    style={{
                                        fontSize: '28px',
                                        margin: 0,
                                        fontFamily: "'Cinzel', serif",
                                        color: '#f0c040',
                                        letterSpacing: '2px',
                                        textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                                    }}
                                >
                                    БОЕВОЙ ПРОПУСК
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                                    <div
                                        style={{
                                            width: '400px',
                                            height: '12px',
                                            background: '#0d0805',
                                            border: '1px solid rgba(240,192,64,0.3)',
                                            borderRadius: '6px',
                                            padding: '2px',
                                            overflow: 'hidden',
                                            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)',
                                        }}
                                    >
                                        <motion.div
                                            animate={{ width: `${progress}%` }}
                                            className="bp-gold-sweep"
                                            style={{
                                                height: '100%',
                                                background:
                                                    'linear-gradient(90deg, #f0c040 0%, #ffea80 25%, #f0c040 50%, #ffea80 75%, #f0c040 100%)',
                                                backgroundSize: '200% 100%',
                                                borderRadius: '4px',
                                                boxShadow: '0 0 12px rgba(240,192,64,0.9)',
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 900,
                                            color: '#f0c040',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        {bpExp} / {maxExp} XP
                                    </span>
                                </div>
                            </div>

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
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {!isPremium && (
                            <motion.button
                                onClick={() => {
                                    setIsPurchaseModalOpen(true);
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                }}
                                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(240,192,64,0.4)' }}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    padding: '12px 30px',
                                    background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                                    border: '2px solid #ffffff',
                                    borderRadius: '8px',
                                    color: '#1a0d00',
                                    fontWeight: 900,
                                    fontSize: '14px',
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    letterSpacing: '1px',
                                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 8px rgba(255,255,255,0.6)',
                                    textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                                }}
                            >
                                КУПИТЬ ПРЕМИУМ
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
                                background: '#24140e',
                                border: '2px solid #b8860b',
                                borderRadius: '8px',
                                color: '#f0c040',
                                fontSize: '24px',
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
                                        width: '140px',
                                        background: 'linear-gradient(90deg, #1b120c 0%, #150f0c 100%)',
                                        borderRight: '3px solid #b8860b',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        padding: '20px 10px',
                                        boxShadow: '5px 0 15px rgba(0,0,0,0.5)',
                                        zIndex: 2,
                                    }}
                                >
                                    {/* Вверхняя метка - Премиум */}
                                    <div
                                        style={{
                                            height: '240px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background:
                                                'linear-gradient(180deg, rgba(153, 27, 27, 0.25) 0%, transparent 100%)',
                                            border: '1px solid rgba(153, 27, 27, 0.5)',
                                            borderRadius: '8px',
                                            padding: '10px 5px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '32px',
                                                marginBottom: '8px',
                                                filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))',
                                            }}
                                        >
                                            👑
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontWeight: 950,
                                                fontSize: '11px',
                                                color: '#ffd700',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                display: 'block',
                                                width: '100%',
                                            }}
                                        >
                                            КОРОЛЕВСКИЙ
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontWeight: 900,
                                                fontSize: '9px',
                                                color: '#f59e0b',
                                                letterSpacing: '2px',
                                                textTransform: 'uppercase',
                                                marginTop: '3px',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                            }}
                                        >
                                            ПУТЬ
                                        </span>
                                    </div>

                                    {/* Центр - Разделитель */}
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
                                                fontSize: '12px',
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
                                            height: '240px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background:
                                                'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            padding: '10px 5px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '32px',
                                                marginBottom: '8px',
                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                            }}
                                        >
                                            ⚔️
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontWeight: 950,
                                                fontSize: '11px',
                                                color: '#c8a870',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                display: 'block',
                                                width: '100%',
                                            }}
                                        >
                                            ВОИНСКИЙ
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontWeight: 900,
                                                fontSize: '9px',
                                                color: '#a3a3a3',
                                                letterSpacing: '2px',
                                                textTransform: 'uppercase',
                                                marginTop: '3px',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                            }}
                                        >
                                            ПУТЬ
                                        </span>
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
                                            gap: '20px',
                                            justifyContent: 'center',
                                            margin: '15px 0 10px 0',
                                        }}
                                    >
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
                                                        border: isActive ? '2px solid #ffffff' : '2px solid #b8860b',
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
