import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getHeroConfig } from '../../../configs/HeroesConfig';
import { audioService } from '../../../services/AudioService';
import { BossPortal } from './AncientsSanctuary/BossPortal';
import { MobStatsCard } from './AncientsSanctuary/MobStatsCard';
import { FloorRouteTimeline } from './AncientsSanctuary/FloorRouteTimeline';
import { EnergyControlPanel } from './AncientsSanctuary/EnergyControlPanel';
import { ResourceBar } from '../hud/ResourceBar';

const getMobDataForFloor = (floor: number) => {
    const isBoss = floor % 5 === 0;
    let mobId = 'ancient_wolf';
    if (isBoss) {
        if (floor % 15 === 5) mobId = 'ancient_treant';
        else if (floor % 15 === 10) mobId = 'ancient_griffin';
        else mobId = 'ancient_golem';
    } else {
        if (floor % 3 === 1) mobId = 'ancient_wolf';
        else if (floor % 3 === 2) mobId = 'ancient_panther';
        else mobId = 'ancient_spider';
    }
    const mobData = MOBS_DB.find((m) => m.id === mobId) || MOBS_DB[0];
    const difficultyMult = 1 + floor * 0.15;
    return {
        id: mobId,
        name: mobData.name,
        image: mobData.image,
        icon: mobData.icon,
        isBoss,
        hp: Math.floor(mobData.baseStats.hp * difficultyMult * (isBoss ? 1.5 : 1.0)),
        attack: Math.floor(mobData.baseStats.attack * difficultyMult * (isBoss ? 1.2 : 1.0)),
        defense: Math.floor(mobData.baseStats.defense * difficultyMult),
        speed: Math.round(mobData.baseStats.speed * 10) / 10,
    };
};

export const AncientsSanctuaryScreen: React.FC = () => {
    const {
        pveStage,
        startPveBattle,
        winStreak,
        energy,
        maxEnergy,
        maxPveStage,
        watchAdForReward,
        dailyAdWatchesCount,
        setScreen,
        goToShop,
        selectedHeroId,
        getCalculatedStats,
        isMobile,
    } = useGameStore();

    const [adLoading, setAdLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<number>(pveStage);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSelectedFloor(pveStage);
        }, 0);
        return () => clearTimeout(timer);
    }, [pveStage]);

    const selectedMob = getMobDataForFloor(selectedFloor);

    const heroConfig = getHeroConfig(selectedHeroId);
    const heroStats = getCalculatedStats(selectedHeroId);
    const heroPower = heroStats
        ? Math.floor(heroStats.total.attack * 10 + heroStats.total.hp + heroStats.total.defense * 5)
        : 1000;
    const recommendedPower = selectedFloor * 1700;
    const isPowerEnough = heroPower >= recommendedPower;

    // Все этажи от 1-го до текущего + 4 будущих для вертикального маршрута
    const allFloors = Array.from({ length: pveStage + 4 }, (_, i) => i + 1);

    // Ближайшие 5 этажей текущего блока (до босса) для горизонтального индикатора под порталом
    const blockStartFloor = Math.max(1, pveStage - ((pveStage - 1) % 5));
    const portalFloors = Array.from({ length: 5 }, (_, i) => blockStartFloor + i);

    const hasEnoughEnergy = energy >= 10;

    const handleBuyEnergy = () => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        goToShop('BANK', 'ENERGY');
    };

    const handleWatchAd = async () => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        const currentCount = useGameStore.getState().dailyAdWatchesCount || 0;
        if (currentCount >= 2) {
            showNotification('❌ Суточный лимит рекламы исчерпан!');
            return;
        }
        setAdLoading(true);
        try {
            const success = await watchAdForReward('ENERGY');
            if (success) {
                showNotification('⚡ Получено +25 Энергии за просмотр рекламы!');
            } else {
                showNotification('❌ Реклама не была завершена или достигнут лимит!');
            }
        } catch {
            showNotification('❌ Ошибка загрузки видео');
        } finally {
            setAdLoading(false);
        }
    };

    const showNotification = (msg: string) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(null), 3000);
    };

    const handleBack = () => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setScreen('CITY');
    };

    const handleEnterBattle = () => {
        if (!hasEnoughEnergy) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            showNotification('❌ Недостаточно энергии! Восстановите её ниже.');
            return;
        }
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        startPveBattle(selectedFloor);
    };

    const [particles, setParticles] = React.useState<
        { startX: number; endX: number; duration: number; delay: number; size: number }[]
    >([]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setParticles(
                Array.from({ length: 15 }).map(() => ({
                    startX: Math.random() * 1920,
                    endX: Math.random() * 1920,
                    duration: 10 + Math.random() * 15,
                    delay: Math.random() * 10,
                    size: 4 + Math.random() * 6,
                })),
            );
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto', // Restore click interactivity blocked by HUD layer
                backgroundImage: `linear-gradient(to bottom, rgba(5, 3, 15, 0.4), rgba(5, 3, 15, 0.85)), url(${isMobile ? AssetsMap.BACKGROUNDS.SANCTUARY_MOBILE : AssetsMap.BACKGROUNDS.SANCTUARY})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '30px 40px 20px 40px',
                boxSizing: 'border-box',
                fontFamily: "'Russo One', sans-serif",
                color: '#fff',
            }}
        >
            {/* Анимированные фоновые частицы */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [-20, 1100],
                            x: [p.startX, p.endX],
                            opacity: [0, 0.4, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: p.delay,
                        }}
                        style={{
                            position: 'absolute',
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            borderRadius: '50%',
                            background: i % 2 === 0 ? '#f0c040' : '#f97316',
                            filter: 'blur(1px)',
                        }}
                    />
                ))}
            </div>

            {/* ВЕРХНЯЯ ШАПКА */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr',
                    alignItems: 'center',
                    zIndex: 10,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {/* Кнопка назад */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <motion.button
                        whileHover={{
                            scale: 1.03,
                            borderColor: '#ef4444',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBack}
                        style={{
                            background:
                                'linear-gradient(180deg, rgba(185, 28, 28, 0.4) 0%, rgba(127, 29, 29, 0.6) 100%)',
                            border: '1.5px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: "'Cinzel', serif",
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>←</span> В ГОРОД
                    </motion.button>
                </div>

                {/* Название экрана по центру */}
                <div style={{ textAlign: 'center' }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: '28px',
                            letterSpacing: '3px',
                            background: 'linear-gradient(135deg, #f0c040 0%, #c48b3b 50%, #f0c040 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 900,
                        }}
                    >
                        ОБИТЕЛЬ ДРЕВНИХ
                    </h1>
                    <p
                        style={{
                            margin: '3px 0 0 0',
                            fontSize: '10px',
                            color: '#a3a3a3',
                            letterSpacing: '1.5px',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        СВЯЩЕННЫЕ РУИНЫ ВЕЛИКИХ ХРАНИТЕЛЕЙ
                    </p>
                </div>

                {/* Ресурс-бар справа */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <ResourceBar
                        onOpenShop={(tab) => {
                            if (tab === 'GOLD' || tab === 'GEMS' || tab === 'ENERGY') {
                                goToShop('BANK', tab);
                            } else {
                                goToShop('ALCHEMY');
                            }
                        }}
                    />
                </div>
            </div>

            {/* ЦЕНТРАЛЬНЫЙ БЛОК: МАРШРУТ (СЛЕВА) + ХАРАКТЕРИСТИКИ / ПОРТАЛ */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'space-between',
                    gap: '30px',
                    flex: 1,
                    margin: '10px 0',
                    zIndex: 5,
                }}
            >
                {/* Левая колонка: предстоящий маршрут + награды за этаж */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        justifyContent: 'flex-start',
                        width: '420px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(196, 139, 59, 0.15)',
                        borderRadius: '6px',
                        padding: '24px 28px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                        boxSizing: 'border-box',
                    }}
                >
                    <FloorRouteTimeline
                        floors={allFloors}
                        selectedFloor={selectedFloor}
                        pveStage={pveStage}
                        onSelectFloor={setSelectedFloor}
                        getMobDataForFloor={getMobDataForFloor}
                    />

                    <div style={{ height: '1px', background: 'rgba(196, 139, 59, 0.12)' }} />

                    {/* Блок наград за этаж */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '11px',
                                color: '#b8860b',
                                letterSpacing: '1px',
                                fontWeight: 700,
                                fontFamily: "'Cinzel', serif",
                                textTransform: 'uppercase',
                                textAlign: 'center',
                            }}
                        >
                            НАГРАДЫ ЗА ЭТАЖ
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Золото */}
                            <div
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.4)',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    border: '1px solid rgba(196, 139, 59, 0.25)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <img
                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                    alt="Gold"
                                />
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24' }}>
                                    {selectedFloor * 100}
                                </span>
                            </div>
                            {/* Опыт */}
                            <div
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.4)',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    border: '1px solid rgba(196, 139, 59, 0.25)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <img
                                    src={AssetsMap.UI.ICON_XP}
                                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                    alt="XP"
                                />
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8' }}>
                                    {selectedFloor * 50}
                                </span>
                            </div>
                            {/* Алмазы */}
                            <div
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.4)',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    border: '1px solid rgba(196, 139, 59, 0.25)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <img
                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                    alt="Gems"
                                />
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#0ea5e9' }}>
                                    {selectedMob.isBoss ? 20 : 2}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(196, 139, 59, 0.12)' }} />

                    {/* Блок статистики походов */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '11px',
                                color: '#b8860b',
                                letterSpacing: '1px',
                                fontWeight: 700,
                                fontFamily: "'Cinzel', serif",
                                textTransform: 'uppercase',
                                textAlign: 'center',
                            }}
                        >
                            СТАТИСТИКА ЭКСПЕДИЦИИ
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    border: '1px solid rgba(196, 139, 59, 0.1)',
                                }}
                            >
                                <span style={{ fontSize: '11px', color: '#a3a3a3' }}>Текущий прогресс:</span>
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24' }}>
                                    Этаж {pveStage}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    border: '1px solid rgba(196, 139, 59, 0.1)',
                                }}
                            >
                                <span style={{ fontSize: '11px', color: '#a3a3a3' }}>Максимальный рекорд:</span>
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#60a5fa' }}>
                                    {maxPveStage - 1} этаж
                                </span>
                            </div>
                            {winStreak > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(69, 10, 10, 0.3)',
                                        borderRadius: '4px',
                                        padding: '8px 12px',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                    }}
                                >
                                    <span style={{ fontSize: '11px', color: '#f87171' }}>Серия побед:</span>
                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#f87171' }}>
                                        🔥 {winStreak}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Центр: Портал */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '15px',
                    }}
                >
                    {/* Крупные премиальные кнопки выбора этажа сверху над боссом */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(196,139,59,0.3)',
                            borderRadius: '10px',
                            padding: '6px 14px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                            zIndex: 10,
                        }}
                    >
                        {portalFloors.map((floor) => {
                            const isSelected = floor === selectedFloor;
                            const isLocked = floor > pveStage;
                            return (
                                <motion.button
                                    key={floor}
                                    whileHover={!isLocked ? { scale: 1.05, borderColor: '#fbbf24' } : {}}
                                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                                    onClick={() => {
                                        if (!isLocked) {
                                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                            setSelectedFloor(floor);
                                        }
                                    }}
                                    style={{
                                        minWidth: '90px',
                                        height: '38px',
                                        borderRadius: '6px',
                                        background: isSelected
                                            ? 'linear-gradient(180deg, rgba(240, 192, 64, 0.25) 0%, rgba(196, 139, 59, 0.15) 100%)'
                                            : 'rgba(0,0,0,0.5)',
                                        border: isSelected ? '2.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                                        color: isSelected ? '#fbbf24' : isLocked ? '#666' : '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        boxShadow: isSelected ? '0 0 15px rgba(240,192,64,0.3)' : 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {isLocked ? '🔒' : `ЭТАЖ ${floor}`}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <BossPortal selectedMob={selectedMob} />
                    </div>
                </div>

                {/* Правая колонка: характеристики стража */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        gap: '20px',
                        width: '420px',
                    }}
                >
                    <MobStatsCard selectedMob={selectedMob} selectedFloor={selectedFloor} />

                    {/* Карточка текущего героя */}
                    <div
                        style={{
                            background: 'rgba(0, 0, 0, 0.45)',
                            border: '1px solid rgba(196, 139, 59, 0.15)',
                            borderRadius: '6px',
                            padding: '16px 20px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                        }}
                    >
                        <div
                            style={{
                                width: '66px',
                                height: '66px',
                                borderRadius: '6px',
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(196, 139, 59, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                padding: '0px',
                            }}
                        >
                            <img
                                src={heroConfig.image}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                alt={heroConfig.name}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                                    {heroConfig.name}
                                </span>
                                <span style={{ fontSize: '9px', color: '#a3a3a3', letterSpacing: '0.5px' }}>
                                    {heroConfig.title}
                                </span>
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '2px',
                                }}
                            >
                                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700 }}>МОЩЬ ГЕРОЯ:</span>
                                <span
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 900,
                                        color: isPowerEnough ? '#10b981' : '#f87171',
                                        fontFamily: "'Cinzel', serif",
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <img
                                        src="/assets/images/ui/mosh.png"
                                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                        alt="Power"
                                    />
                                    {heroPower.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ: ЭНЕРГИЯ И КНОПКА БОЯ */}
            <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, margin: '0 -40px -20px -40px' }}>
                <EnergyControlPanel
                    energy={energy}
                    maxEnergy={maxEnergy}
                    dailyAdWatchesCount={dailyAdWatchesCount}
                    adLoading={adLoading}
                    hasEnoughEnergy={hasEnoughEnergy}
                    pveStage={selectedFloor}
                    currentMob={selectedMob}
                    onBuyEnergy={handleBuyEnergy}
                    onWatchAd={handleWatchAd}
                    onEnterBattle={handleEnterBattle}
                />
            </div>

            {/* Тост уведомление действий */}
            <AnimatePresence>
                {actionMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        style={{
                            position: 'absolute',
                            bottom: '120px',
                            left: '50%',
                            background: 'rgba(10, 8, 20, 0.95)',
                            border: '1px solid rgba(240, 192, 64, 0.4)',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 900,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                            zIndex: 9999,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {actionMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
