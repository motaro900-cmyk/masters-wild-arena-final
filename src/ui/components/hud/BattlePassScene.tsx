import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import { QuestSection } from './BattlePass/QuestSection';
import { BpLevelUpOverlay } from './BattlePass/BpLevelUpOverlay';
import { PurchaseModal } from './BattlePass/PurchaseModal';
import { RewardPreviewModal } from './BattlePass/RewardPreviewModal';
import { BattlePassStyles, CornerOrnament, BATTLE_PASS_REWARDS } from './BattlePass/BattlePassShared';
import { RewardColumn } from './BattlePass/RewardColumn';
import { SKINS_DB } from '../../../configs/SkinsConfig';
import { useBattlePassQuests } from './BattlePass/useBattlePassQuests';
import { BattlePassSidePanel } from './BattlePass/components/BattlePassSidePanel';
import { BattlePassHeader } from './BattlePass/components/BattlePassHeader';

export const BattlePassScene: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        bpLevel,
        bpExp,
        isPremium,
        claimReward,
        claimedRewards,
        setPremium,
        buyBpLevel,
        setEquippedWeapon,
        equipSkin,
        claimBpDailyQuestReward,
        claimWeeklyQuestReward,
        showBpLevelUpOverlay,
        hideBpLevelUpOverlay,
        isMobile,
    } = useGameStore(
        useShallow((state) => ({
            bpLevel: state.bpLevel,
            bpExp: state.bpExp,
            isPremium: state.isPremium,
            claimReward: state.claimReward,
            claimedRewards: state.claimedRewards,
            setPremium: state.setPremium,
            buyBpLevel: state.buyBpLevel,
            setEquippedWeapon: state.setEquippedWeapon,
            equipSkin: state.equipSkin,
            claimBpDailyQuestReward: state.claimBpDailyQuestReward,
            claimWeeklyQuestReward: state.claimWeeklyQuestReward,
            showBpLevelUpOverlay: state.showBpLevelUpOverlay,
            hideBpLevelUpOverlay: state.hideBpLevelUpOverlay,
            isMobile: state.isMobile,
        })),
    );

    const [activeTab, setActiveTab] = useState<'REWARDS' | 'QUESTS'>('REWARDS');
    const [currentPage, setCurrentPage] = useState(Math.min(2, Math.max(0, Math.floor((bpLevel - 1) / 5))));
    const [selectedReward, setSelectedReward] = useState<any | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    // Таймер обратного отсчёта сезона
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

    // Получение квестов из кастомного хука
    const { currentDailyQuests, currentWeeklyQuests } = useBattlePassQuests();

    const handleClaimAll = () => {
        let claimedAny = false;
        BATTLE_PASS_REWARDS.forEach((reward) => {
            const levelUnlocked = bpLevel >= reward.level;
            if (levelUnlocked && !claimedRewards.includes(reward.free.id)) {
                claimReward(reward.free.id);
                if (reward.free.type === 'WEAPON') {
                    setEquippedWeapon(reward.free.id);
                } else if (reward.free.type === 'SKIN') {
                    const skinConfig = SKINS_DB.find((s) => s.id === reward.free.id);
                    if (skinConfig) {
                        equipSkin(skinConfig.heroId, skinConfig.id);
                    }
                }
                claimedAny = true;
            }
            if (levelUnlocked && isPremium && !claimedRewards.includes(reward.premium.id)) {
                claimReward(reward.premium.id);
                if (reward.premium.type === 'WEAPON') {
                    setEquippedWeapon(reward.premium.id);
                } else if (reward.premium.type === 'SKIN') {
                    const skinConfig = SKINS_DB.find((s) => s.id === reward.premium.id);
                    if (skinConfig) {
                        equipSkin(skinConfig.heroId, skinConfig.id);
                    }
                }
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
        if (item.type === 'WEAPON') {
            setEquippedWeapon(item.id); // Сразу надеваем для «ВАУ-эффекта»
        } else if (item.type === 'SKIN') {
            const skinConfig = SKINS_DB.find((s) => s.id === item.id);
            if (skinConfig) {
                equipSkin(skinConfig.heroId, skinConfig.id);
            }
        }
        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
    };

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
                {/* ВНУТРЕННИЙ ПОЛУПРОЗРАЧНЫЙ ФОН */}
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

                {/* ШАПКА */}
                <BattlePassHeader
                    bpLevel={bpLevel}
                    bpExp={bpExp}
                    maxExp={maxExp}
                    timeLeft={timeLeft}
                    isPremium={isPremium}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onBuyLevel={buyBpLevel}
                    onBuyPremium={() => {
                        setIsPurchaseModalOpen(true);
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    }}
                    onClose={onClose}
                />

                {/* КОНТЕНТ В ЗАВИСИМОСТИ ОТ ТАБА */}
                <div style={{ flex: 1, position: 'relative', zIndex: 5, overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'REWARDS' ? (
                            <motion.div
                                key="rewards"
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 50, opacity: 0 }}
                                style={{ height: '100%', display: 'flex', width: '100%', overflow: 'hidden' }}
                            >
                                {/* ЛЕВАЯ ПАНЕЛЬ ДОРОЖЕК */}
                                <BattlePassSidePanel />

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
                                        {!isMobile && (
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
                                                    borderColor:
                                                        currentPage === 0 ? 'rgba(184, 134, 11, 0.2)' : '#b8860b',
                                                    borderRadius: '8px',
                                                    color: currentPage === 0 ? 'rgba(200, 168, 112, 0.3)' : '#ffd700',
                                                    fontSize: '22px',
                                                    fontWeight: 900,
                                                    cursor: currentPage === 0 ? 'default' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: currentPage === 0 ? 0.45 : 1,
                                                    boxShadow:
                                                        currentPage === 0 ? 'none' : '0 4px 10px rgba(0,0,0,0.5)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                ◀
                                            </motion.button>
                                        )}

                                        {/* КОЛОНКИ НАГРАД ТЕКУЩЕЙ СТРАНИЦЫ */}
                                        <motion.div
                                            drag={isMobile ? 'x' : undefined}
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.15}
                                            onDragEnd={(_, info) => {
                                                if (!isMobile) return;
                                                const swipeThreshold = 50;
                                                if (info.offset.x < -swipeThreshold) {
                                                    if (currentPage < 2) {
                                                        setCurrentPage(currentPage + 1);
                                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                                    }
                                                } else if (info.offset.x > swipeThreshold) {
                                                    if (currentPage > 0) {
                                                        setCurrentPage(currentPage - 1);
                                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                                    }
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: isMobile ? '10px' : '30px',
                                                touchAction: isMobile ? 'pan-y' : 'auto',
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
                                        </motion.div>

                                        {/* ПРАВАЯ СТРЕЛКА */}
                                        {!isMobile && (
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
                                                    borderColor:
                                                        currentPage === 2 ? 'rgba(184, 134, 11, 0.2)' : '#b8860b',
                                                    borderRadius: '8px',
                                                    color: currentPage === 2 ? 'rgba(200, 168, 112, 0.3)' : '#ffd700',
                                                    fontSize: '22px',
                                                    fontWeight: 900,
                                                    cursor: currentPage === 2 ? 'default' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: currentPage === 2 ? 0.45 : 1,
                                                    boxShadow:
                                                        currentPage === 2 ? 'none' : '0 4px 10px rgba(0,0,0,0.5)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                ▶
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* ПЕРЕКЛЮЧАТЕЛИ СТРАНИЦ + КНОПКА ЗАБРАТЬ ВСЁ */}
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
                                    onClaim={claimBpDailyQuestReward}
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
                        ВЫПОЛНЯЙТЕ ЗАДАНИЯ БОЕВОГО ПРОПУСКА, ЧТОБЫ ОТКРЫВАТЬ НОВЫЕ УРОВНИ
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
