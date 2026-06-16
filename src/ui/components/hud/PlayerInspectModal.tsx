import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { getRankInfo } from '../../../configs/RankSystem';
import { getHeroConfig } from '../../../configs/HeroesConfig';
import { AvatarFrame } from './SharedUI';
import { syncService, SyncService } from '../../../services/SyncService';
import { buildStatsFromEquipment, calculateCombatPower } from '../../../services/MatchmakingService';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { resolveAvatarPath } from '../../../configs/ProfileCustomization';

const getTemplateId = (id: string) => {
    if (!id) return '';
    if (ITEMS_DATABASE[id]) return id;
    const match = Object.keys(ITEMS_DATABASE)
        .filter((key) => id.startsWith(key + '_'))
        .sort((a, b) => b.length - a.length)[0];
    return match || id;
};

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
    const [activeTab, setActiveTab] = React.useState<'info' | 'gear'>('info');

    const activeInspectVal = inspectPlayerId || inspectPlayerName;

    React.useEffect(() => {
        if (!activeInspectVal) {
            setPlayerData(null);
            setError(null);
            return;
        }
        setActiveTab('info');

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

    let heroLevel = 1;

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
        heroLevel = level;

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

                if (parsed.heroes && parsed.heroes[selectedHeroId]) {
                    heroLevel = parsed.heroes[selectedHeroId].level || heroLevel;
                }
            } catch (e) {
                console.error('[PlayerInspectModal] Failed to parse fullStateJSON', e);
            }
        }
    }

    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
    const heroConfig = getHeroConfig(selectedHeroId);
    const rankInfo = getRankInfo(rating);
    const computedStats = buildStatsFromEquipment(selectedHeroId, heroLevel, playerData?.equipment || playerData?.снаряжение || {});

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

        const oppObj = {
            id: selectedHeroId,
            name: name,
            avatar: avatar,   // real VK photo or in-game avatar
            rating: rating,
            level: heroLevel,
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

    const handleWriteMail = () => {
        if (!playerData) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        useGameStore.setState({
            activeMailRecipientId: playerData.id,
            inspectPlayerId: null,
            inspectPlayerName: null,
        });
        if ((window as any).setActiveHUDWindow) {
            (window as any).setActiveHUDWindow('MAIL');
        }
    };

    const gold = playerData ? (playerData.gold !== undefined ? playerData.gold : playerData.золото !== undefined ? playerData.золото : 0) : 0;
    const crystals = playerData ? (playerData.crystals !== undefined ? playerData.crystals : playerData.кристаллы !== undefined ? playerData.кристаллы : 0) : 0;

    const rarityColors: Record<string, string> = {
        COMMON: '#9ca3af',
        UNCOMMON: '#4ade80',
        RARE: '#3b82f6',
        EPIC: '#a855f7',
        MYTHIC: '#ec4899',
        LEGENDARY: '#eab308',
    };

    const RARITY_RU: Record<string, string> = {
        COMMON: 'Обычный',
        UNCOMMON: 'Необычный',
        RARE: 'Редкий',
        EPIC: 'Эпический',
        MYTHIC: 'Мифический',
        LEGENDARY: 'Легендарный',
    };

    const renderGearCard = (slotKey: string, slotLabel: string) => {
        if (!playerData) return null;
        const itemId = playerData.equipment?.[slotKey] || playerData.снаряжение?.[slotKey] || null;

        let itemData = null;
        if (itemId) {
            const resolvedId = getTemplateId(String(itemId));
            itemData = ITEMS_DATABASE[resolvedId] as any;
        }

        const rarityColor = itemData ? rarityColors[itemData.rarity] || '#f0c040' : '#444';

        const getPlaceholderIcon = () => {
            switch (slotKey) {
                case 'HELMETS': return AssetsMap.UI.BLUEPRINT_HELMET;
                case 'SHOULDERS': return AssetsMap.UI.BLUEPRINT_SHOULDERS;
                case 'ARMOR': return AssetsMap.UI.BLUEPRINT_ARMOR;
                case 'PANTS': return AssetsMap.UI.BLUEPRINT_PANTS;
                case 'WEAPONS': return AssetsMap.UI.BLUEPRINT_WEAPON;
                case 'SHIELDS': return AssetsMap.UI.BLUEPRINT_SHIELD;
                case 'BOOTS': return AssetsMap.UI.BLUEPRINT_BOOTS;
                default: return '';
            }
        };

        return (
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${itemData ? rarityColor + '33' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '12px',
                padding: '8px 12px',
                height: '81px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: itemData ? `0 4px 12px rgba(0,0,0,0.5), inset 0 0 10px ${rarityColor}11` : 'none',
            }}>
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: itemData
                        ? `radial-gradient(circle at 50% 30%, rgba(40, 32, 24, 0.95) 0%, rgba(14, 10, 8, 0.98) 100%)`
                        : 'radial-gradient(circle at 50% 30%, rgba(28, 22, 17, 0.92) 0%, rgba(12, 9, 7, 0.97) 100%)',
                    border: `1.5px solid ${itemData ? rarityColor : 'rgba(240,192,64,0.15)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    boxShadow: itemData ? `0 0 10px ${rarityColor}33` : 'none',
                }}>
                    {itemData ? (
                        itemData.spriteClass ? (
                            <div className={itemData.spriteClass} style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
                        ) : (
                            <img
                                src={resolveAssetPath(itemData.image)}
                                style={{ width: '70%', height: '70%', objectFit: 'contain' }}
                                alt=""
                            />
                        )
                    ) : (
                        <img
                            src={getPlaceholderIcon()}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'sepia(0.9) brightness(0.8) opacity(0.4)',
                            }}
                            alt=""
                        />
                    )}
                </div>

                <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>{slotLabel}</span>
                        {itemData && (
                            <span style={{ fontSize: '8px', color: rarityColor, fontWeight: 900, textTransform: 'uppercase' }}>
                                {RARITY_RU[itemData.rarity] || itemData.rarity}
                            </span>
                        )}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: itemData ? '#fff' : 'rgba(255,255,255,0.3)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {itemData ? itemData.name : 'Пусто'}
                    </div>
                    {itemData && (
                        <div style={{ fontSize: '9px', color: '#4ade80', fontWeight: 700, marginTop: '2px' }}>
                            {[
                                itemData.hpBonus && `+${itemData.hpBonus} HP`,
                                itemData.attackBonus && `+${itemData.attackBonus} ATK`,
                                itemData.defenseBonus && `+${itemData.defenseBonus} DEF`,
                                (itemData.critBonus || itemData.critChance) && `+${Math.round((itemData.critBonus || itemData.critChance) <= 1 ? (itemData.critBonus || itemData.critChance) * 100 : (itemData.critBonus || itemData.critChance))}% CRIT`,
                            ].filter(Boolean).join(' • ')}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPowerCard = () => {
        const baseStats = buildStatsFromEquipment(selectedHeroId, heroLevel, {});
        const basePower = calculateCombatPower(baseStats);
        const totalPower = calculateCombatPower(computedStats);
        const gearPower = totalPower - basePower;

        return (
            <div style={{
                background: 'linear-gradient(135deg, rgba(240,192,64,0.06) 0%, rgba(168,128,32,0.15) 100%)',
                border: '1.5px solid #f0c040',
                borderRadius: '12px',
                padding: '6px 12px',
                height: '94px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(240,192,64,0.15), inset 0 0 15px rgba(240,192,64,0.1)',
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'radial-gradient(circle, rgba(240,192,64,0.2) 0%, rgba(0,0,0,0.5) 100%)',
                    border: '1.5px solid #f0c040',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 8px rgba(240,192,64,0.3)',
                }}>
                    <img
                        src={resolveAssetPath(AssetsMap.UI.ICON_POWER)}
                        style={{ width: '60%', height: '60%', objectFit: 'contain' }}
                        alt="power"
                    />
                </div>

                <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: '9px', color: '#f0c040', fontWeight: 800 }}>БОЕВАЯ МОЩЬ</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: "'Cinzel', serif", textShadow: '0 2px 4px rgba(0,0,0,0.6)', lineHeight: '1.1' }}>
                        {totalPower.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>
                        Герой: {basePower.toLocaleString()} | Снаряж: +{gearPower.toLocaleString()}
                    </div>
                </div>
            </div>
        );
    };

    const renderStatsSummaryCard = () => {
        let totalHp = 0;
        let totalAtk = 0;
        let totalDef = 0;
        let totalCrit = 0;

        const eq = playerData?.equipment || playerData?.снаряжение || {};
        Object.values(eq).forEach((itemId) => {
            if (!itemId) return;
            const resolvedId = getTemplateId(String(itemId));
            const item = ITEMS_DATABASE[resolvedId] as any;
            if (!item) return;
            if (item.hpBonus) totalHp += item.hpBonus;
            if (item.attackBonus) totalAtk += item.attackBonus;
            if (item.defenseBonus) totalDef += item.defenseBonus;
            const rawCrit = item.critBonus || 0;
            if (rawCrit) {
                totalCrit += rawCrit <= 1 ? rawCrit * 100 : rawCrit;
            }
        });

        return (
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1.5px solid rgba(240,192,64,0.15)',
                borderRadius: '12px',
                padding: '8px 12px',
                height: '81px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'left',
                gap: '2px',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
            }}>
                <div style={{ fontSize: '8.5px', color: '#f0c040', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1px' }}>
                    БОНУСЫ ЭКИПИРОВКИ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px' }}>
                    <div style={{ fontSize: '10px', color: totalHp > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                        HP: {totalHp > 0 ? `+${totalHp}` : '0'}
                    </div>
                    <div style={{ fontSize: '10px', color: totalAtk > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                        ATK: {totalAtk > 0 ? `+${totalAtk}` : '0'}
                    </div>
                    <div style={{ fontSize: '10px', color: totalDef > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                        DEF: {totalDef > 0 ? `+${totalDef}` : '0'}
                    </div>
                    <div style={{ fontSize: '10px', color: totalCrit > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                        CRIT: {totalCrit > 0 ? `+${Math.round(totalCrit)}%` : '0%'}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
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
                    width: '820px',
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
                <style>{`
                    .inspect-scrollbar::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }
                    .inspect-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 3px;
                    }
                    .inspect-scrollbar::-webkit-scrollbar-thumb {
                        background: #f0c040;
                        border-radius: 3px;
                    }
                    .inspect-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #ffe880;
                    }
                `}</style>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '18px',
                        right: '18px',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '28px',
                        fontWeight: 300,
                        cursor: 'pointer',
                        lineHeight: 1,
                        transition: 'color 0.2s',
                        zIndex: 10,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                    &times;
                </button>

                {loading ? (
                    <div style={{ padding: '80px 0', color: '#f0c040', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
                        ЗАГРУЗКА ДАННЫХ...
                    </div>
                ) : error ? (
                    <div style={{ padding: '60px 0' }}>
                        <div style={{ color: '#ff4444', fontWeight: 800, marginBottom: '20px' }}>{error}</div>
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
                                <div
                                    style={{
                                        backgroundImage: `url(${resolveAssetPath(AssetsMap.UI.VIP_PLAQUE)})`,
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'center',
                                        width: '45px',
                                        height: '18px',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', 'Philosopher', serif",
                                        fontSize: '9px',
                                        letterSpacing: '0.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                        flexShrink: 0,
                                    }}
                                >
                                    VIP
                                </div>
                            )}
                        </div>

                        <div style={{ color: '#c8a870', fontSize: '13px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {title}
                        </div>
                        <div style={{ color: '#fcd34d', fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>
                            Уровень аккаунта: {level}
                        </div>

                        {/* РЕСУРСЫ (ЗОЛОТО И АЛМАЗЫ) */}
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(240,192,64,0.15)',
                                borderRadius: '12px',
                                padding: '6px 14px',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                            }}>
                                <img
                                    src={resolveAssetPath(AssetsMap.UI.ICON_GOLD_FULL)}
                                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                    alt="gold"
                                />
                                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                                    {gold.toLocaleString()}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(240,192,64,0.15)',
                                borderRadius: '12px',
                                padding: '6px 14px',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                            }}>
                                <img
                                    src={resolveAssetPath(AssetsMap.UI.ICON_ALMAZ_FULL)}
                                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                    alt="diamonds"
                                />
                                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                                    {crystals.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* НАВИГАЦИЯ ВКЛАДОК */}
                        <div style={{
                            display: 'flex',
                            width: '100%',
                            background: 'rgba(20, 15, 10, 0.65)',
                            borderRadius: '16px',
                            border: '1.5px solid rgba(240, 192, 64, 0.25)',
                            padding: '4px',
                            marginBottom: '20px',
                            gap: '8px',
                            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.8), 0 4px 15px rgba(0, 0, 0, 0.5)',
                        }}>
                            <button
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setActiveTab('info');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    background: activeTab === 'info'
                                        ? 'linear-gradient(180deg, #ffe880 0%, #f0c040 40%, #b08010 100%)'
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1.5px solid ${activeTab === 'info' ? '#ffe880' : 'rgba(240, 192, 64, 0.1)'}`,
                                    borderRadius: '12px',
                                    color: activeTab === 'info' ? '#000' : 'rgba(255, 255, 255, 0.6)',
                                    fontWeight: 900,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1.5px',
                                    boxShadow: activeTab === 'info'
                                        ? '0 0 15px rgba(240, 192, 64, 0.45), inset 0 1px 2px rgba(255,255,255,0.4)'
                                        : 'none',
                                    textShadow: activeTab === 'info' ? '0 1px 1px rgba(255,255,255,0.5)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'info') {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.35)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(240, 192, 64, 0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'info') {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                        e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                📊 ОБЩАЯ ИНФО
                            </button>
                            <button
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setActiveTab('gear');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    background: activeTab === 'gear'
                                        ? 'linear-gradient(180deg, #ffe880 0%, #f0c040 40%, #b08010 100%)'
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1.5px solid ${activeTab === 'gear' ? '#ffe880' : 'rgba(240, 192, 64, 0.1)'}`,
                                    borderRadius: '12px',
                                    color: activeTab === 'gear' ? '#000' : 'rgba(255, 255, 255, 0.6)',
                                    fontWeight: 900,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1.5px',
                                    boxShadow: activeTab === 'gear'
                                        ? '0 0 15px rgba(240, 192, 64, 0.45), inset 0 1px 2px rgba(255,255,255,0.4)'
                                        : 'none',
                                    textShadow: activeTab === 'gear' ? '0 1px 1px rgba(255,255,255,0.5)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'gear') {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.35)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(240, 192, 64, 0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'gear') {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                        e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                🛡️ ЭКИПИРОВКА
                            </button>
                        </div>

                        {/* СОДЕРЖИМОЕ ВКЛАДОК */}
                        {activeTab === 'info' ? (
                            <div style={{ width: '100%', height: '350px', overflow: 'hidden' }}>
                                {/* ЛЮБИМЫЙ ПЕРСОНАЖ */}
                                <div
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.35)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(240,192,64,0.15)',
                                        padding: '12px 15px',
                                        marginBottom: '10px',
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
                                            {heroConfig.name} <span style={{ color: '#fcd34d', fontSize: '14px', fontWeight: 700 }}>• Ур. {heroLevel}</span>
                                        </div>
                                        <div style={{ color: '#c8a870', fontSize: '12px', opacity: 0.8 }}>
                                            {heroConfig.title} • {heroConfig.role === 'TANK' ? 'Танк' : heroConfig.role === 'ASSASSIN' ? 'Убийца' : heroConfig.role === 'MAGE' ? 'Маг' : heroConfig.role === 'SUPPORT' ? 'Поддержка' : 'Боец'}
                                        </div>
                                    </div>
                                </div>

                                {/* ХАРАКТЕРИСТИКИ */}
                                <div
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.25)',
                                        border: '1px solid rgba(240,192,64,0.1)',
                                        borderRadius: '16px',
                                        padding: '10px 15px',
                                        marginBottom: '10px',
                                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4)',
                                    }}
                                >
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#f0c040',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        marginBottom: '8px',
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '1px',
                                        textAlign: 'left'
                                    }}>
                                        Характеристики Героя
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '5px 25px',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ЗДОРОВЬЕ (HP)</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>{computedStats.hp}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>АТАКА (ATK)</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>{computedStats.attack}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ЗАЩИТА (DEF)</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>{computedStats.defense}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>СКОРОСТЬ (SPD)</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>{computedStats.speed.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>КРИТ (CRIT)</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>{Math.round(computedStats.critChance)}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>УКЛОНЕНИЕ (EVA)</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800 }}>{Math.round(computedStats.evasion)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* СТАТИСТИКА */}
                                <div
                                    style={{
                                        width: '100%',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    {/* РАНГ */}
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(240,192,64,0.1)',
                                            borderRadius: '12px',
                                            padding: '8px 10px',
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

                                    {/* РЕЙТИНГ */}
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(240,192,64,0.1)',
                                            borderRadius: '12px',
                                            padding: '8px 10px',
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
                                            padding: '8px 10px',
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
                                            padding: '8px 10px',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>ПРОЦЕНТ ПОБЕД</div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#4ade80' }}>{winRate}%</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                width: '100%',
                                display: 'flex',
                                gap: '20px',
                                marginBottom: '20px',
                                height: '350px',
                            }}>
                                {/* LEFT COLUMN: Hero Preview & Combat Power */}
                                <div style={{
                                    width: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    flexShrink: 0,
                                }}>
                                    {/* Hero Card */}
                                    <div style={{
                                        height: '246px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1.5px solid rgba(240,192,64,0.15)',
                                        borderRadius: '16px',
                                        padding: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                                    }}>
                                        <img
                                            src={resolveAssetPath(heroConfig.image)}
                                            style={{
                                                height: '130px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.85))',
                                                marginBottom: '6px',
                                            }}
                                            alt={heroConfig.name}
                                        />
                                        <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800, fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
                                            {heroConfig.name}
                                        </div>
                                        <div style={{ color: '#c8a870', fontSize: '11px', fontWeight: 700, textAlign: 'center', marginTop: '2px' }}>
                                            Ур. {heroLevel} • {heroConfig.role === 'TANK' ? 'Танк' : heroConfig.role === 'ASSASSIN' ? 'Убийца' : heroConfig.role === 'MAGE' ? 'Маг' : heroConfig.role === 'SUPPORT' ? 'Поддержка' : 'Боец'}
                                        </div>
                                    </div>
                                    
                                    {/* Combat Power */}
                                    {renderPowerCard()}
                                </div>

                                {/* RIGHT COLUMN: 2x4 Grid of Gear Slots + Stats Summary */}
                                <div 
                                    style={{
                                        flex: 1,
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px',
                                        height: '350px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {renderGearCard('HELMETS', 'ШЛЕМ')}
                                    {renderGearCard('SHOULDERS', 'ПЛЕЧИ')}
                                    {renderGearCard('ARMOR', 'ДОСПЕХ')}
                                    {renderGearCard('PANTS', 'ПОНОЖИ')}
                                    {renderGearCard('WEAPONS', 'ОРУЖИЕ')}
                                    {renderGearCard('SHIELDS', 'ЩИТ')}
                                    {renderGearCard('BOOTS', 'САПОГИ')}
                                    {renderStatsSummaryCard()}
                                </div>
                            </div>
                        )}

                        {/* КНОПКИ ДЕЙСТВИЙ */}
                        {!isMe && (
                            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
                                <button
                                    onClick={handleAddFriend}
                                    disabled={isAlreadyFriend}
                                    style={{
                                        flex: 1,
                                        height: '46px',
                                        background: isAlreadyFriend ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                                        border: `1.5px solid ${isAlreadyFriend ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)'}`,
                                        borderRadius: '12px',
                                        color: isAlreadyFriend ? 'rgba(255,255,255,0.35)' : '#fff',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: isAlreadyFriend ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAlreadyFriend) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isAlreadyFriend) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    }}
                                >
                                    {isAlreadyFriend ? 'УЖЕ В ДРУЗЬЯХ' : 'В ДРУЗЬЯ'}
                                </button>
                                <button
                                    onClick={handleWriteMail}
                                    style={{
                                        flex: 1,
                                        height: '46px',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1.5px solid rgba(255,255,255,0.2)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                >
                                    НАПИСАТЬ
                                </button>
                                <button
                                    onClick={handleChallenge}
                                    style={{
                                        flex: 1.4,
                                        height: '46px',
                                        background: 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)',
                                        border: '1.5px solid #ffe880',
                                        borderRadius: '12px',
                                        color: '#000',
                                        fontSize: '13px',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(240, 192, 64, 0.3)',
                                        transition: 'all 0.2s',
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '0.5px',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                                >
                                    ВЫЗВАТЬ НА БОЙ
                                </button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};
