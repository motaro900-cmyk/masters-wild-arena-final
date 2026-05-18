import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

interface Reward {
    level: number;
    free: {
        id: string;
        name: string;
        icon: string;
        amount?: number;
        type: 'GOLD' | 'ITEM' | 'CHEST' | 'WEAPON' | 'GEMS' | 'SKIN';
    };
    premium: {
        id: string;
        name: string;
        icon: string;
        amount?: number;
        type: 'GOLD' | 'ITEM' | 'CHEST' | 'WEAPON' | 'GEMS' | 'SKIN';
    };
}

interface Quest {
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    rewardXp: number;
    icon: string;
}

const DAILY_QUESTS: Quest[] = [
    {
        id: 'd1',
        title: 'Первая Кровь',
        description: 'Победите в 3 сражениях на Арене',
        progress: 1,
        target: 3,
        rewardXp: 200,
        icon: '⚔️',
    },
    {
        id: 'd2',
        title: 'Золотая Лихорадка',
        description: 'Заработайте 1000 золота в боях',
        progress: 450,
        target: 1000,
        rewardXp: 150,
        icon: '💰',
    },
    {
        id: 'd3',
        title: 'Алхимик',
        description: 'Используйте 5 любых зелий',
        progress: 2,
        target: 5,
        rewardXp: 100,
        icon: '🧪',
    },
];

const WEEKLY_QUESTS: Quest[] = [
    {
        id: 'w1',
        title: 'Чемпион Арены',
        description: 'Победите в 20 сражениях',
        progress: 12,
        target: 20,
        rewardXp: 1000,
        icon: 'sprite-trophy',
    },
    {
        id: 'w2',
        title: 'Коллекционер',
        description: 'Откройте 10 любых сундуков',
        progress: 3,
        target: 10,
        rewardXp: 800,
        icon: '📦',
    },
    {
        id: 'w3',
        title: 'Мастер Стали',
        description: 'Улучшите любое оружие 3 раза',
        progress: 1,
        target: 3,
        rewardXp: 600,
        icon: '⚒️',
    },
];

const BATTLE_PASS_REWARDS: Reward[] = [
    {
        level: 1,
        free: { id: 'gold_500', name: '500 Золота', icon: '💰', amount: 500, type: 'GOLD' },
        premium: { id: 'weapon_moon_sword', name: 'Эпический Меч Луны', icon: '⚔️', type: 'WEAPON' },
    },
    {
        level: 2,
        free: { id: 'chest_small', name: 'Малый Сундук', icon: '📦', type: 'CHEST' },
        premium: { id: 'gems_100', name: '100 Кристаллов', icon: '💎', amount: 100, type: 'GEMS' },
    },
    {
        level: 3,
        free: { id: 'potion_strength', name: 'Зелье Силы', icon: '🧪', type: 'ITEM' },
        premium: { id: 'skin_shadow_panda', name: 'Скин: Теневой Панда', icon: '🎭', type: 'SKIN' },
    },
    {
        level: 4,
        free: { id: 'gold_1000', name: '1000 Золота', icon: '💰', amount: 1000, type: 'GOLD' },
        premium: { id: 'chest_epic', name: 'Эпический Сундук', icon: 'sprite-gift', type: 'CHEST' },
    },
    {
        level: 5,
        free: { id: 'shard_rare', name: 'Редкий Осколок', icon: '✨', type: 'ITEM' },
        premium: { id: 'pedestal_legendary', name: 'Легендарный Пьедестал', icon: '🏛️', type: 'ITEM' },
    },
];

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
    } = useGameStore();
    const [activeTab, setActiveTab] = useState<'REWARDS' | 'QUESTS'>('REWARDS');

    const handleClaim = (item: any) => {
        claimReward(item.id);
        addItemToInventory(item.id);
        if (item.type === 'WEAPON' || item.type === 'SKIN') {
            setEquippedWeapon(item.id); // Сразу надеваем для "ВАУ-эффекта"
        }
    };
    const [selectedReward, setSelectedReward] = useState<any | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const maxExp = 1000;
    const progress = (bpExp / maxExp) * 100;

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
                background: '#050505',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Inter', sans-serif",
                color: '#fff',
                overflow: 'hidden',
                pointerEvents: 'auto',
            }}
        >
            {/* КИНЕМАТОГРАФИЧЕСКИЙ ФОН */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url("${AssetsMap.BACKGROUNDS.BATTLE_PASS}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 1,
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            {/* ЛЕГКИЙ ГРАДИЕНТ ДЛЯ АКЦЕНТА НА ЦЕНТРЕ */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            {/* ШАПКА БОЕВОГО ПРОПУСКА (GLASS) */}
            <div
                style={{
                    height: '140px',
                    padding: '0 80px',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(15px)',
                    borderBottom: '1px solid rgba(240,192,64,0.3)',
                    zIndex: 10,
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, #f0c040 0%, #a88020 100%)',
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            boxShadow: '0 0 30px rgba(240,192,64,0.5)',
                        }}
                    />
                    <span style={{ zIndex: 1, fontSize: '42px', fontWeight: 900, color: '#000' }}>{bpLevel}</span>
                </div>

                <div style={{ marginLeft: '40px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                        <div>
                            <h1
                                style={{
                                    fontSize: '32px',
                                    margin: 0,
                                    fontFamily: "'Cinzel', serif",
                                    color: '#fff',
                                    letterSpacing: '2px',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                }}
                            >
                                БОЕВОЙ ПРОПУСК
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                                <div
                                    style={{
                                        width: '250px',
                                        height: '6px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <motion.div
                                        animate={{ width: `${progress}%` }}
                                        style={{ height: '100%', background: '#f0c040', boxShadow: '0 0 10px #f0c040' }}
                                    />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f0c040' }}>
                                    {bpExp} / {maxExp} XP
                                </span>
                            </div>
                        </div>

                        {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
                        <div
                            style={{
                                display: 'flex',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '4px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <TabButton
                                active={activeTab === 'REWARDS'}
                                onClick={() => setActiveTab('REWARDS')}
                                label="НАГРАДЫ"
                                icon="sprite-gift"
                            />
                            <TabButton
                                active={activeTab === 'QUESTS'}
                                onClick={() => setActiveTab('QUESTS')}
                                label="ЗАДАНИЯ"
                                icon="📜"
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {!isPremium && (
                        <motion.button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(240,192,64,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '12px 30px',
                                background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '15px',
                                cursor: 'pointer',
                            }}
                        >
                            КУПИТЬ ПРЕМИУМ
                        </motion.button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            width: '45px',
                            height: '45px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '20px',
                            cursor: 'pointer',
                        }}
                    >
                        ×
                    </button>
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
                                alignItems: 'center',
                                padding: '0 100px',
                                gap: '45px',
                                overflowX: 'auto',
                            }}
                            className="custom-scrollbar"
                        >
                            {BATTLE_PASS_REWARDS.map((reward) => (
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
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="quests"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            style={{
                                height: '100%',
                                padding: '60px 100px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '40px',
                            }}
                        >
                            <QuestSection title="ЕЖЕДНЕВНЫЕ" quests={DAILY_QUESTS} />
                            <QuestSection title="ЕЖЕНЕДЕЛЬНЫЕ" quests={WEEKLY_QUESTS} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* МОДАЛКИ */}
            <AnimatePresence>
                {selectedReward && <PreviewModal item={selectedReward} onClose={() => setSelectedReward(null)} />}
                {isPurchaseModalOpen && (
                    <PurchaseModal
                        onClose={() => setIsPurchaseModalOpen(false)}
                        onBuy={() => {
                            setPremium(true);
                            setIsPurchaseModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ФУТЕР С ПОДСКАЗКОЙ */}
            <div
                style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    zIndex: 10,
                }}
            >
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', letterSpacing: '1px', fontWeight: 800 }}>
                    ЗАРАБАТЫВАЙТЕ ОПЫТ В БОЯХ, ЧТОБЫ ОТКРЫВАТЬ НОВЫЕ УРОВНИ
                </p>
            </div>
        </motion.div>
    );
};

const RewardColumn: React.FC<{
    reward: Reward;
    isUnlocked: boolean;
    isPremium: boolean;
    claimedRewards: string[];
    onClaim: (item: any) => void;
    onPreview: (item: any) => void;
    isMilestone?: boolean;
}> = ({ reward, isUnlocked, isPremium, claimedRewards, onClaim, onPreview, isMilestone }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMilestone ? '40px' : '20px',
                minWidth: isMilestone ? '280px' : '220px',
                position: 'relative',
                zIndex: isMilestone ? 5 : 1,
            }}
        >
            {/* ПРЕМИУМ ДОРОЖКА (СВЕРХУ) */}
            <RewardCard
                item={reward.premium}
                isPremiumCard
                isUnlocked={isUnlocked && isPremium}
                isClaimed={claimedRewards.includes(reward.premium.id)}
                onClaim={() => onClaim(reward.premium)}
                onPreview={onPreview}
                isMilestone={isMilestone}
            />

            {/* УРОВЕНЬ ПОСЕРЕДИНЕ */}
            <div
                style={{
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        width: '120%',
                        height: '2px',
                        background: isUnlocked ? '#f0c040' : 'rgba(255,255,255,0.1)',
                        zIndex: 0,
                    }}
                />
                <div
                    style={{
                        width: isMilestone ? '70px' : '50px',
                        height: isMilestone ? '70px' : '50px',
                        borderRadius: '50%',
                        background: isUnlocked ? '#f0c040' : '#222',
                        border: `4px solid ${isMilestone ? '#f0c040' : '#111'}`,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        color: isUnlocked ? '#000' : '#666',
                        fontSize: isMilestone ? '28px' : '20px',
                        boxShadow: isUnlocked ? `0 0 30px ${isMilestone ? '#f0c040' : 'rgba(240,192,64,0.5)'}` : 'none',
                        transition: 'all 0.3s',
                    }}
                >
                    {reward.level}
                </div>
            </div>

            {/* БЕСПЛАТНАЯ ДОРОЖКА (СНИЗУ) */}
            <RewardCard
                item={reward.free}
                isUnlocked={isUnlocked}
                isClaimed={claimedRewards.includes(reward.free.id)}
                onClaim={() => onClaim(reward.free)}
                onPreview={onPreview}
                isMilestone={isMilestone}
            />
        </div>
    );
};

const RewardCard: React.FC<{
    item: any;
    isPremiumCard?: boolean;
    isUnlocked: boolean;
    isClaimed: boolean;
    onClaim: () => void;
    onPreview: (item: any) => void;
    isMilestone?: boolean;
}> = ({ item, isPremiumCard, isUnlocked, isClaimed, onClaim, onPreview, isMilestone }) => {
    return (
        <motion.div
            onClick={() => onPreview(item)}
            whileHover={isUnlocked && !isClaimed ? { scale: 1.05, y: isPremiumCard ? -10 : 10 } : { scale: 1.02 }}
            style={{
                height: isMilestone ? '300px' : '240px',
                background: isMilestone
                    ? isPremiumCard
                        ? 'linear-gradient(180deg, rgba(240,192,64,0.15) 0%, rgba(20,20,20,0.4) 100%)'
                        : 'rgba(255,255,255,0.05)'
                    : isPremiumCard
                      ? 'rgba(240,192,64,0.1)'
                      : 'rgba(255,255,255,0.03)',
                borderRadius: '24px',
                backdropFilter: 'blur(8px)',
                border: isMilestone
                    ? `2px solid ${isPremiumCard ? '#f0c040' : 'rgba(255,255,255,0.4)'}`
                    : `1px solid ${isPremiumCard ? 'rgba(240,192,64,0.4)' : 'rgba(255,255,255,0.15)'}`,
                padding: '25px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.8) opacity(0.7)',
                opacity: isClaimed ? 0.4 : 1,
                boxShadow:
                    isMilestone && isUnlocked
                        ? `0 0 40px ${isPremiumCard ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.1)'}`
                        : 'none',
                transition: 'all 0.3s',
            }}
        >
            {isPremiumCard && (
                <div
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        fontSize: '24px',
                        filter: 'drop-shadow(0 0 10px #f0c040)',
                    }}
                >
                    👑
                </div>
            )}

            {isMilestone && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: isPremiumCard
                            ? 'linear-gradient(90deg, transparent, #f0c040, transparent)'
                            : 'linear-gradient(90deg, transparent, #fff, transparent)',
                    }}
                />
            )}

            <div
                style={{
                    width: isMilestone ? '120px' : '90px',
                    height: isMilestone ? '120px' : '90px',
                    marginBottom: '15px',
                    filter: isUnlocked ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' : 'blur(5px)',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {item.icon.startsWith('sprite-') ? (
                    <div className={item.icon} style={{ width: '100%', height: '100%', backgroundSize: '300% 100%' }} />
                ) : (
                    <span style={{ fontSize: isMilestone ? '90px' : '64px' }}>{item.icon}</span>
                )}
            </div>

            <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div
                    style={{
                        fontSize: isMilestone ? '20px' : '16px',
                        fontWeight: 900,
                        color: isPremiumCard ? '#f0c040' : '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                >
                    {item.name}
                </div>
                <div
                    style={{
                        fontSize: '11px',
                        color: isPremiumCard ? 'rgba(240,192,64,0.6)' : 'rgba(255,255,255,0.4)',
                        marginTop: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        fontWeight: 800,
                    }}
                >
                    {item.type}
                </div>
            </div>

            <AnimatePresence>
                {isUnlocked && !isClaimed && (
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClaim();
                        }}
                        style={{
                            marginTop: '20px',
                            padding: '10px 25px',
                            background: isPremiumCard ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)' : '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#000',
                            fontWeight: 900,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                        }}
                    >
                        ЗАБРАТЬ
                    </motion.button>
                )}
            </AnimatePresence>

            {isClaimed && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '60px',
                        zIndex: 10,
                    }}
                >
                    ✅
                </motion.div>
            )}

            {!isUnlocked && isPremiumCard && !isClaimed && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        fontSize: '11px',
                        color: '#f0c040',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                    }}
                >
                    НУЖЕН ПРЕМИУМ
                </div>
            )}
        </motion.div>
    );
};

const PreviewModal: React.FC<{ item: any; onClose: () => void }> = ({ item, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
            }}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '600px',
                    padding: '60px',
                    background: 'rgba(30,30,30,0.95)',
                    borderRadius: '40px',
                    border: '2px solid rgba(240,192,64,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: '0 0 100px rgba(240,192,64,0.1)',
                }}
            >
                <div
                    style={{
                        fontSize: '180px',
                        marginBottom: '40px',
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
                    }}
                >
                    {item.icon}
                </div>
                <h2 style={{ fontSize: '42px', margin: 0, color: '#f0c040', fontFamily: "'Cinzel', serif" }}>
                    {item.name}
                </h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginTop: '20px', lineHeight: '1.6' }}>
                    Эксклюзивная награда первого сезона. Улучшает ваши возможности и подчеркивает статус легендарного
                    бойца арены.
                </p>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '40px',
                        padding: '15px 50px',
                        background: '#f0c040',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '18px',
                        cursor: 'pointer',
                    }}
                >
                    ПОНЯТНО
                </button>
            </motion.div>
        </motion.div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({
    active,
    onClick,
    label,
    icon,
}) => (
    <motion.button
        onClick={onClick}
        whileHover={{ background: active ? '#f0c040' : 'rgba(255,255,255,0.1)' }}
        style={{
            padding: '10px 25px',
            borderRadius: '10px',
            border: 'none',
            background: active ? '#f0c040' : 'transparent',
            color: active ? '#000' : 'rgba(255,255,255,0.6)',
            fontWeight: 900,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
        }}
    >
        {icon.startsWith('sprite-') ? (
            <div className={icon} style={{ width: '24px', height: '24px', backgroundSize: '300% 100%' }} />
        ) : (
            <span style={{ fontSize: '18px' }}>{icon}</span>
        )}
        {label}
    </motion.button>
);

const QuestSection: React.FC<{ title: string; quests: Quest[] }> = ({ title, quests }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <h3
            style={{
                fontSize: '24px',
                color: '#f0c040',
                fontFamily: "'Cinzel', serif",
                margin: '0 0 10px 0',
                letterSpacing: '2px',
            }}
        >
            {title}
        </h3>
        {quests.map((quest) => (
            <motion.div
                key={quest.id}
                whileHover={{ x: 10, background: 'rgba(255,255,255,0.05)' }}
                style={{
                    padding: '25px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '25px',
                }}
            >
                <div
                    style={{
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {quest.icon.startsWith('sprite-') ? (
                        <div
                            className={quest.icon}
                            style={{ width: '40px', height: '40px', backgroundSize: '300% 100%' }}
                        />
                    ) : (
                        <span style={{ fontSize: '40px' }}>{quest.icon}</span>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '5px' }}>{quest.title}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>
                        {quest.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div
                            style={{
                                flex: 1,
                                height: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${(quest.progress / quest.target) * 100}%`,
                                    height: '100%',
                                    background: '#f0c040',
                                }}
                            />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800 }}>
                            {quest.progress} / {quest.target}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#f0c040' }}>+{quest.rewardXp} XP</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>НАГРАДА</div>
                </div>
            </motion.div>
        ))}
    </div>
);

const PurchaseModal: React.FC<{ onClose: () => void; onBuy: () => void }> = ({ onClose, onBuy }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                background: 'rgba(0,0,0,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(20px)',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, rotateX: 20 }}
                animate={{ scale: 1, rotateX: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '900px',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                    borderRadius: '40px',
                    border: '3px solid #f0c040',
                    overflow: 'hidden',
                    display: 'flex',
                    position: 'relative',
                }}
            >
                <div style={{ flex: 1, padding: '60px' }}>
                    <h2 style={{ fontSize: '48px', color: '#f0c040', fontFamily: "'Cinzel', serif", margin: 0 }}>
                        ЗОЛОТОЙ ПРОПУСК
                    </h2>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
                        РАЗБЛОКИРУЙТЕ МАКСИМУМ ВОЗМОЖНОСТЕЙ
                    </p>

                    <ul
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            marginTop: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                    >
                        {[
                            'Эксклюзивная дорожка наград',
                            'Уникальный скин "Теневой Панда"',
                            'Множитель опыта +50%',
                            'Золотая рамка профиля',
                        ].map((text, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                }}
                            >
                                <span style={{ color: '#f0c040' }}>✔</span> {text}
                            </li>
                        ))}
                    </ul>

                    <div style={{ marginTop: '60px', display: 'flex', alignItems: 'center', gap: '30px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 900 }}>
                            <span
                                style={{
                                    fontSize: '20px',
                                    color: 'rgba(255,255,255,0.4)',
                                    textDecoration: 'line-through',
                                    marginRight: '10px',
                                }}
                            >
                                1999
                            </span>
                            999 <span style={{ color: '#f0c040' }}>💎</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBuy}
                            style={{
                                padding: '20px 60px',
                                background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                border: 'none',
                                borderRadius: '15px',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '22px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 40px rgba(240,192,64,0.4)',
                            }}
                        >
                            РАЗБЛОКИРОВАТЬ
                        </motion.button>
                    </div>
                </div>
                <div
                    style={{
                        width: '350px',
                        background: 'rgba(240,192,64,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '200px',
                    }}
                >
                    👑
                </div>
            </motion.div>
        </motion.div>
    );
};
