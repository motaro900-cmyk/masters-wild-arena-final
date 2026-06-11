import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { getRankInfo } from '../../../configs/RankSystem';
import { getHeroConfig } from '../../../configs/HeroesConfig';
import { AvatarFrame } from './SharedUI';
import { syncService, SyncService } from '../../../services/SyncService';
import { buildStatsFromEquipment } from '../../../services/MatchmakingService';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { resolveAvatarPath } from '../../../configs/ProfileCustomization';

export const PlayerInspectModal: React.FC = () => {
    const inspectPlayerId = useGameStore((state) => state.inspectPlayerId);
    const inspectPlayerName = useGameStore((state) => state.inspectPlayerName);
    
    const myPlayerId = useGameStore((state) => state.playerId);
    const myVkUser = useGameStore((state) => state.vkUser);
    const myFriends = useGameStore((state) => state.friends) || [];
    const showAlert = useGameStore((state) => state.showAlert);

    const [loading, setLoading] = React.useState(false);
    const [playerData, setPlayerData] = React.useState<any | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const activeInspectVal = inspectPlayerId || inspectPlayerName;

    React.useEffect(() => {
        if (!activeInspectVal) {
            setPlayerData(null);
            setError(null);
            return;
        }

        const fetchPlayer = async () => {
            setLoading(true);
            setError(null);
            try {
                let targetId = inspectPlayerId;

                // Если есть только имя, резолвим ID по имени
                if (!targetId && inspectPlayerName) {
                    targetId = await syncService.getPlayerIdByName(inspectPlayerName);
                }

                if (!targetId) {
                    setError('Игрок не найден');
                    setLoading(false);
                    return;
                }

                const docData = await syncService.searchPlayerById(targetId);
                if (docData) {
                    setPlayerData(docData);
                } else {
                    setError('Не удалось загрузить данные игрока');
                }
            } catch (err) {
                console.error('[PlayerInspectModal] Error fetching player details:', err);
                setError('Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        };

        fetchPlayer();
    }, [inspectPlayerId, inspectPlayerName, activeInspectVal]);

    if (!activeInspectVal) return null;

    const handleClose = () => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        useGameStore.setState({ inspectPlayerId: null, inspectPlayerName: null });
    };

    // Парсим детальную инфу из fullStateJSON
    let frame = 'none';
    let title = 'Странник';
    let wins = 0;
    let totalBattles = 0;
    let selectedHeroId = 'panda';
    let level = 1;
    let rating = 0;
    let name = 'Мастер';
    let avatar = '/assets/images/avatars/panda.webp';
    let vipLevel = 0;
    let isVipActive = false;

    if (playerData) {
        name = playerData.name || playerData.имя || 'Мастер';
        avatar = resolveAvatarPath(playerData.avatar || playerData.фото);
        level = playerData.level || playerData.уровень || 1;
        rating = playerData.rating || playerData.рейтинг || 0;
        vipLevel = playerData.vipLevel || 0;
        isVipActive = playerData.isVipActive || false;
        
        // По умолчанию берём из документа
        wins = playerData.wins || 0;
        totalBattles = playerData.totalBattles || 0;
        selectedHeroId = playerData.hero || 'panda';

        if (playerData.fullStateJSON) {
            try {
                const parsed = JSON.parse(playerData.fullStateJSON);
                frame = parsed.frame || frame;
                title = parsed.title || title;
                wins = parsed.wins !== undefined ? parsed.wins : wins;
                totalBattles = parsed.totalBattles !== undefined ? parsed.totalBattles : totalBattles;
                selectedHeroId = parsed.selectedHeroId || selectedHeroId;
                
                if (parsed.avatar) {
                    avatar = resolveAvatarPath(parsed.avatar);
                }
            } catch (e) {
                console.error('[PlayerInspectModal] Failed to parse fullStateJSON', e);
            }
        }
    }

    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
    const heroConfig = getHeroConfig(selectedHeroId);
    const rankInfo = getRankInfo(rating);

    // Проверяем, не сам ли это игрок
    const isMe = playerData && (
        playerData.id === myPlayerId || 
        String(playerData.vkId) === String(myVkUser?.id) ||
        playerData.id === `VK-${myVkUser?.id}` ||
        playerData.id === `GUEST-${myPlayerId}`
    );

    // Проверяем, есть ли уже в друзьях
    const isAlreadyFriend = playerData && myFriends.some((f: any) => f.id === playerData.id);

    const handleAddFriend = async () => {
        if (!playerData || isMe || isAlreadyFriend) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

        const store = useGameStore.getState();
        const prefixedSenderId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        
        // Уровень берется по выбранному герою
        const activeHeroId = store.selectedHeroId || 'panda';
        const activeHeroLevel = store.heroes?.[activeHeroId]?.level || 1;

        const senderData = {
            id: prefixedSenderId,
            name: store.name || 'Мастер',
            avatar: store.avatar,
            level: activeHeroLevel,
        };

        try {
            const ok = await syncService.sendFriendRequest(playerData.id, senderData);
            if (ok && showAlert) {
                showAlert('Запрос в друзья успешно отправлен!');
            }
        } catch (e) {
            console.error('Failed to send friend request from inspect modal:', e);
            if (showAlert) showAlert('Не удалось отправить запрос.');
        }
    };

    const handleChallenge = () => {
        if (!playerData) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

        const store = useGameStore.getState();
        const computedStats = buildStatsFromEquipment(selectedHeroId, level, playerData.equipment || {});

        const oppObj = {
            id: selectedHeroId,
            name: name,
            rating: rating,
            level: level,
            heroId: selectedHeroId,
            heroImage: heroConfig.image,
            rankIcon: getRankInfo(rating).icon,
            equipment: playerData.equipment || {},
            stats: {
                hp: computedStats.hp,
                attack: computedStats.attack,
                defense: computedStats.defense,
                speed: computedStats.speed,
                crit: computedStats.critChance / 100,
                evasion: computedStats.evasion,
                critChance: computedStats.critChance,
                avgItemLevel: computedStats.avgItemLevel || 1,
            },
            winRate: winRate,
            isBot: false,
            realUserId: playerData.id,
            vipLevel: vipLevel,
        };

        useGameStore.setState({
            selectedEnemyId: selectedHeroId,
            battleMode: 'WARMUP',
            activeRankedOpponent: oppObj,
            inspectPlayerId: null,
            inspectPlayerName: null,
        });

        // Запуск разминочного боя
        if (store.setScreen) {
            store.setScreen('BATTLE');
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 100000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
            }}
            onClick={handleClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '460px',
                    background: 'radial-gradient(circle at center, #231c15 0%, #120e0a 100%)',
                    border: '2px solid #f0c040',
                    borderRadius: '24px',
                    padding: '30px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.95), inset 0 0 30px rgba(240,192,64,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                }}
            >
                {loading ? (
                    <div style={{ padding: '80px 0', color: '#f0c040', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
                        ЗАГРУЗКА ДАННЫХ...
                    </div>
                ) : error ? (
                    <div style={{ padding: '60px 0' }}>
                        <div style={{ color: '#ff4444', fontWeight: 800, marginBottom: '20px' }}>{error}</div>
                        <button
                            onClick={handleClose}
                            style={{
                                padding: '10px 25px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            ЗАКРЫТЬ
                        </button>
                    </div>
                ) : !playerData ? (
                    <div style={{ color: '#fff', opacity: 0.6 }}>Нет данных для отображения</div>
                ) : (
                    <>
                        {/* АВАТАР И РАМКА */}
                        <div style={{ marginBottom: '15px' }}>
                            <AvatarFrame avatarFilename={avatar} frameFilename={frame} size={110} showGlow />
                        </div>

                        {/* НИКНЕЙМ, VIP И ТИТУЛ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ color: '#fff', fontSize: '24px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>
                                {name}
                            </span>
                            {vipLevel > 0 && isVipActive && (
                                <span
                                    style={{
                                        background: 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)',
                                        border: '1px solid #f87171',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: '9px',
                                        padding: '2px 6px',
                                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                                    }}
                                >
                                    VIP {vipLevel}
                                </span>
                            )}
                        </div>

                        <div style={{ color: '#c8a870', fontSize: '13px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {title}
                        </div>
                        <div style={{ color: '#f0c040', fontSize: '14px', fontWeight: 800, marginBottom: '20px' }}>
                            Уровень аккаунта: {level}
                        </div>

                        {/* ЛЮБИМЫЙ ПЕРСОНАЖ */}
                        <div
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.35)',
                                borderRadius: '16px',
                                border: '1px solid rgba(240,192,64,0.15)',
                                padding: '15px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                            }}
                        >
                            <img
                                src={resolveAssetPath(heroConfig.image)}
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
                                }}
                                alt={heroConfig.name}
                            />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Любимый Персонаж
                                </div>
                                <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
                                    {heroConfig.name}
                                </div>
                                <div style={{ color: '#c8a870', fontSize: '12px', opacity: 0.8 }}>
                                    {heroConfig.title} • {heroConfig.role === 'TANK' ? 'Танк' : heroConfig.role === 'ASSASSIN' ? 'Убийца' : heroConfig.role === 'MAGE' ? 'Маг' : heroConfig.role === 'SUPPORT' ? 'Поддержка' : 'Боец'}
                                </div>
                            </div>
                        </div>

                        {/* СТАТИСТИКА */}
                        <div
                            style={{
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '25px',
                            }}
                        >
                            {/* РАНГ (слева) */}
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(240,192,64,0.1)',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }}
                            >
                                <img src={rankInfo.icon} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>РАНГ</div>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: rankInfo.color }}>
                                        {rankInfo.name}
                                    </div>
                                </div>
                            </div>

                            {/* РЕЙТИНГ (справа) */}
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(240,192,64,0.1)',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }}
                            >
                                <img src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="trophy" />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>РЕЙТИНГ</div>
                                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{rating}</div>
                                </div>
                            </div>

                            {/* ВСЕГО БОЕВ */}
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(240,192,64,0.1)',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>ВСЕГО БОЕВ</div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{totalBattles}</div>
                            </div>

                            {/* ДОЛЯ ПОБЕД */}
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(240,192,64,0.1)',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>ПРОЦЕНТ ПОБЕД</div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: '#4ade80' }}>{winRate}%</div>
                            </div>
                        </div>

                        {/* КНОПКИ ДЕЙСТВИЙ */}
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            {!isMe && (
                                <button
                                    onClick={handleAddFriend}
                                    disabled={isAlreadyFriend}
                                    style={{
                                        flex: 1.2,
                                        padding: '14px',
                                        background: isAlreadyFriend ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
                                        border: `1px solid ${isAlreadyFriend ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}`,
                                        borderRadius: '12px',
                                        color: isAlreadyFriend ? 'rgba(255,255,255,0.3)' : '#fff',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: isAlreadyFriend ? 'default' : 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAlreadyFriend) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isAlreadyFriend) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                    }}
                                >
                                    {isAlreadyFriend ? 'УЖЕ В ДРУЗЬЯХ' : 'В ДРУЗЬЯ'}
                                </button>
                            )}

                            {!isMe && (
                                <button
                                    onClick={handleChallenge}
                                    style={{
                                        flex: 1.5,
                                        padding: '14px',
                                        background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#000',
                                        fontSize: '13px',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(240, 192, 64, 0.25)',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                                >
                                    ВЫЗВАТЬ НА БОЙ
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleClose();
                                }}
                                style={{
                                    flex: isMe ? 1 : 0.8,
                                    padding: '14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            >
                                ЗАКРЫТЬ
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};
