import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { getRankInfo } from '../../../configs/RankSystem';
import { getHeroConfig, HEROES_DB } from '../../../configs/HeroesConfig';
import { AvatarFrame } from './SharedUI';
import { syncService, SyncService } from '../../../services/SyncService';
import { buildStatsFromEquipment } from '../../../services/MatchmakingService';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { calculateTotalPower } from './Matchmaking/utils/matchmakingUtils';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { resolveAvatarPath } from '../../../configs/ProfileCustomization';
import { getItemAtlasStyle } from '../../../utils/itemAtlas';

const getTemplateId = (id: string) => {
    if (!id) return '';
    if (ITEMS_DATABASE[id]) return id;
    const match = Object.keys(ITEMS_DATABASE)
        .filter((k) => id.startsWith(k + '_'))
        .sort((a, b) => b.length - a.length)[0];
    return match || id;
};
const roleToRu = (role: string) => {
    switch (role) {
        case 'TANK':
            return 'Танк';
        case 'ASSASSIN':
            return 'Убийца';
        case 'MAGE':
            return 'Маг';
        case 'SUPPORT':
            return 'Поддержка';
        default:
            return 'Боец';
    }
};
const rarityColors: Record<string, string> = {
    COMMON: '#9ca3af',
    UNCOMMON: '#4ade80',
    RARE: '#3b82f6',
    EPIC: '#a855f7',
    MYTHIC: '#ef4444',
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

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
    .insp-scroll::-webkit-scrollbar { width: 4px; }
    .insp-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 2px; }
    .insp-scroll::-webkit-scrollbar-thumb { background: rgba(240,192,64,0.35); border-radius: 2px; }
    .sc-h { transition: background 0.15s; }
    .sc-h:hover { background: rgba(255,255,255,0.04) !important; }
    .act-btn { transition: all 0.16s ease; }
    @keyframes vip-p { 0%,100%{opacity:.65;}50%{opacity:1;} }
    .vip-a { animation: vip-p 2.8s ease-in-out infinite; }
    @keyframes shimmer-b { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
    .bdg-sh {
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
        background-size: 200% 100%;
        animation: shimmer-b 3.5s linear infinite;
    }
    @keyframes hfloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
    .h-float { animation: hfloat 4s ease-in-out infinite; }
    .d-slot { transition: border-color 0.2s, box-shadow 0.2s; }
    .d-slot:hover { border-color: rgba(240,192,64,0.7) !important; box-shadow: 0 0 14px rgba(240,192,64,0.22) !important; }
`;

/* ─── Components ─────────────────────────────────────────────────────────── */
const GoldDivider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', ...style }}>
        <div
            style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.35))' }}
        />
        <div
            style={{
                width: 5,
                height: 5,
                background: '#c8a040',
                borderRadius: '50%',
                boxShadow: '0 0 5px rgba(240,192,64,0.6)',
                flexShrink: 0,
            }}
        />
        <div
            style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(240,192,64,0.35), transparent)' }}
        />
    </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
        <div
            style={{
                width: '3px',
                height: '13px',
                background: 'linear-gradient(180deg, #ffe880, #c88020)',
                borderRadius: '2px',
                flexShrink: 0,
            }}
        />
        <span
            style={{
                fontSize: '9.5px',
                color: '#d4a030',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1.8px',
                fontFamily: "'Cinzel', serif",
            }}
        >
            {children}
        </span>
    </div>
);

const MiniCard: React.FC<{ emoji: string; label: string; value: React.ReactNode; vc: string; bg?: string }> = ({
    emoji,
    label,
    value,
    vc,
    bg = 'rgba(255,255,255,0.02)',
}) => {
    const isMobile = useGameStore((s) => s.isMobile);
    return (
        <div
            className="sc-h"
            style={{
                background: 'rgba(255,255,255,0.022)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: isMobile ? '10px 12px' : '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxSizing: 'border-box',
                minWidth: 0,
            }}
        >
            <div
                style={{
                    width: isMobile ? '38px' : '32px',
                    height: isMobile ? '38px' : '32px',
                    borderRadius: '8px',
                    flexShrink: 0,
                    background: bg,
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '18px' : '16px',
                    lineHeight: 1,
                }}
            >
                {emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: isMobile ? '12px' : '10px',
                        color: 'rgba(255,255,255,0.35)',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        marginBottom: '2px',
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: isMobile ? '15px' : '13px',
                        fontWeight: 800,
                        color: vc,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: "'Outfit', sans-serif",
                        lineHeight: 1.2,
                    }}
                >
                    {value}
                </div>
            </div>
        </div>
    );
};

const Diamond: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 10, style }) => (
    <div
        style={{
            width: size,
            height: size,
            background: '#f0c040',
            transform: 'rotate(45deg)',
            boxShadow: '0 0 8px rgba(240,192,64,0.9)',
            flexShrink: 0,
            ...style,
        }}
    />
);

/* ══════════════════════════════════════════════════════════════════════════ */
export const PlayerInspectModal: React.FC = () => {
    const inspectPlayerId = useGameStore((s) => s.inspectPlayerId);
    const isMobile = useGameStore((s) => s.isMobile);
    const inspectPlayerName = useGameStore((s) => s.inspectPlayerName);
    const myPlayerId = useGameStore((s) => s.playerId);
    const myVkUser = useGameStore((s) => s.vkUser);
    const myFriends = useGameStore((s) => s.friends) || [];
    const showAlert = useGameStore((s) => s.showAlert);

    const [loading, setLoading] = React.useState(false);
    const [playerData, setPlayer] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTab, setTab] = React.useState<'info' | 'gear'>('info');

    const activeVal = inspectPlayerId || inspectPlayerName;

    React.useEffect(() => {
        if (!activeVal) {
            setPlayer(null);
            setError(null);
            return;
        }
        setTab('info');
        (async () => {
            setLoading(true);
            setError(null);
            try {
                let tid = inspectPlayerId;
                if (!tid && inspectPlayerName) tid = await syncService.getPlayerIdByName(inspectPlayerName);
                if (!tid) {
                    setError('Игрок не найден');
                    return;
                }
                const isMe_ =
                    tid === 'me' || tid === myPlayerId || tid === `VK-${myVkUser?.id}` || tid === `GUEST-${myPlayerId}`;
                if (isMe_) {
                    const st = useGameStore.getState();
                    const ah = st.selectedHeroId || 'panda';
                    setPlayer({
                        id: SyncService.getPrefixedUserId(myVkUser, myPlayerId),
                        name: st.name || 'Мастер',
                        avatar: st.avatar,
                        level: st.level || 1,
                        rating: st.rating || 0,
                        vipLevel: st.vipLevel || 0,
                        isVipActive: st.isVipActive || false,
                        wins: st.wins || 0,
                        totalBattles: st.totalBattles || 0,
                        hero: ah,
                        equipment: st.heroEquipment?.[ah] || {},
                    });
                } else {
                    const doc = await syncService.searchPlayerById(tid);
                    if (doc) setPlayer(doc);
                    else setError('Не удалось загрузить данные игрока');
                }
            } catch {
                setError('Ошибка при загрузке данных');
            } finally {
                setLoading(false);
            }
        })();
    }, [inspectPlayerId, inspectPlayerName, activeVal]);

    if (!activeVal) return null;

    const handleClose = () => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        useGameStore.setState({ inspectPlayerId: null, inspectPlayerName: null });
    };
    const store = useGameStore.getState();
    const isMe =
        activeVal === 'me' ||
        activeVal === myPlayerId ||
        activeVal === `VK-${myVkUser?.id}` ||
        activeVal === `GUEST-${myPlayerId}` ||
        (playerData &&
            (playerData.id === myPlayerId ||
                String(playerData.vkId) === String(myVkUser?.id) ||
                playerData.id === `VK-${myVkUser?.id}` ||
                playerData.id === `GUEST-${myPlayerId}`));

    /* ─── Parse ─────────────────────────────────────────────────────── */
    let frame = 'none',
        title = 'Странник',
        wins = 0,
        totalBattles = 0,
        selectedHeroId = 'panda';
    let level = 1,
        rating = 0,
        name = 'Мастер',
        avatar = '/assets/images/avatars/panda.webp';
    let vipLevel = 0,
        isVipActive = false,
        heroLevel = 1,
        clanName = 'Отсутствует';
    let ownedHeroesCount = 1,
        bpLevel = 1,
        heroTalents: any = {},
        inventory: any[] = [];
    let remoteHeroEquipment: any = null;

    if (isMe) {
        name = store.name || 'Мастер';
        avatar =
            store.avatar && !store.avatar.startsWith('sprite:')
                ? store.avatar
                : myVkUser?.photo_200 || myVkUser?.photo || '/assets/images/avatars/panda.webp';
        level = store.level || 1;
        rating = store.rating || 0;
        vipLevel = store.vipLevel || 0;
        isVipActive = store.isVipActive || false;
        wins = store.wins || 0;
        totalBattles = store.totalBattles || 0;
        selectedHeroId = store.selectedHeroId || 'panda';
        heroLevel = store.heroes?.[selectedHeroId]?.level || 1;
        frame = store.frame || 'none';
        title = store.title || 'Странник';
        clanName = store.clanData?.name || 'Отсутствует';
        ownedHeroesCount = store.ownedHeroes?.length || 1;
        bpLevel = store.bpLevel || 1;
        heroTalents = store.heroTalents?.[selectedHeroId] || {};
        inventory = store.inventory || [];
    } else if (playerData) {
        name = playerData.name || playerData.имя || 'Мастер';
        avatar = playerData.avatar || playerData.фото || 'panda';
        level = playerData.level || playerData.уровень || 1;
        rating = playerData.rating || playerData.рейтинг || 0;
        vipLevel = playerData.vipLevel || 0;
        isVipActive = playerData.isVipActive || false;
        wins = playerData.wins || 0;
        totalBattles = playerData.totalBattles || 0;
        selectedHeroId = playerData.hero || 'panda';
        heroLevel = level;
        clanName = playerData.clanData?.name || (playerData.clanId ? 'В клане' : 'Отсутствует');
        inventory = playerData.inventory || [];
        if (playerData.fullStateJSON) {
            try {
                const p = JSON.parse(playerData.fullStateJSON);
                frame = p.frame || frame;
                title = p.title || title;
                wins = p.wins !== undefined ? p.wins : wins;
                totalBattles = p.totalBattles !== undefined ? p.totalBattles : totalBattles;
                selectedHeroId = p.selectedHeroId || selectedHeroId;
                clanName = p.clanData?.name || (p.clanId ? 'В клане' : 'Отсутствует');
                ownedHeroesCount = p.ownedHeroes?.length || 1;
                bpLevel = p.bpLevel || 1;
                inventory = p.inventory || inventory;
                if (p.avatar) avatar = p.avatar;
                if (p.heroes?.[selectedHeroId]) heroLevel = p.heroes[selectedHeroId].level || heroLevel;
                if (p.heroTalents?.[selectedHeroId]) heroTalents = p.heroTalents[selectedHeroId] || {};
                if (p.heroEquipment?.[selectedHeroId]) remoteHeroEquipment = p.heroEquipment[selectedHeroId];
            } catch {
                /* ignore */
            }
        }
    }

    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
    const heroConfig = getHeroConfig(selectedHeroId);
    const rankInfo = getRankInfo(rating);
    const equipSrc = isMe
        ? store.heroEquipment?.[selectedHeroId] || {}
        : remoteHeroEquipment || playerData?.equipment || playerData?.снаряжение || {};
    const cs = buildStatsFromEquipment(selectedHeroId, heroLevel, equipSrc, 1, inventory, heroTalents);
    const effectiveVip = vipLevel > 0 || isVipActive;
    const isAlreadyFriend = playerData && myFriends.some((f: any) => f.id === playerData.id);
    const gearPower = calculateTotalPower(equipSrc);
    const heroXp = isMe ? store.heroes?.[selectedHeroId]?.xp || 0 : 0;
    const heroXpToNext = isMe ? store.heroes?.[selectedHeroId]?.xpToNext || 100 : 100;
    const xpPct = Math.min(100, (heroXp / heroXpToNext) * 100);

    // ─── Валюта ────────────────────────────────────────────────────────────
    let gold = 0,
        crystals = 0;
    if (isMe) {
        gold = store.gold || 0;
        crystals = store.crystals || 0;
    } else if (playerData?.fullStateJSON) {
        try {
            const p = JSON.parse(playerData.fullStateJSON);
            gold = p.gold || 0;
            crystals = p.crystals || 0;
        } catch {
            /* ignore */
        }
    } else {
        gold = playerData?.gold || 0;
        crystals = playerData?.crystals || 0;
    }

    /* ─── Stat rows ──────────────────────────────────────────────── */
    const statRows = [
        {
            icon: '❤️',
            name: 'ЗДОРОВЬЕ',
            abbr: 'HP',
            value: cs.hp,
            color: '#f87171',
            pct: Math.min(100, (cs.hp / 1000) * 100),
        },
        {
            icon: '⚔️',
            name: 'АТАКА',
            abbr: 'ATK',
            value: cs.attack,
            color: '#fb923c',
            pct: Math.min(100, (cs.attack / 150) * 100),
        },
        {
            icon: '🛡️',
            name: 'ЗАЩИТА',
            abbr: 'DEF',
            value: cs.defense,
            color: '#60a5fa',
            pct: Math.min(100, (cs.defense / 80) * 100),
        },
        {
            icon: '💨',
            name: 'СКОРОСТЬ',
            abbr: 'SPD',
            value: cs.speed.toFixed(2),
            color: '#4ade80',
            pct: Math.min(100, (cs.speed / 3) * 100),
        },
        {
            icon: '💥',
            name: 'КРИТ',
            abbr: 'CRIT',
            value: `${Math.round(cs.critChance)}%`,
            color: '#c084fc',
            pct: Math.min(100, (cs.critChance / 100) * 100),
        },
    ];

    /* ─── Handlers ───────────────────────────────────────────────── */
    const handleAddFriend = async () => {
        if (!playerData || isMe || isAlreadyFriend) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        const st = useGameStore.getState();
        try {
            const ok = await syncService.sendFriendRequest(playerData.id, {
                id: SyncService.getPrefixedUserId(st.vkUser, st.playerId),
                name: st.name || 'Мастер',
                avatar: st.avatar,
                level: st.heroes?.[st.selectedHeroId || 'panda']?.level || 1,
            });
            if (ok && showAlert) showAlert('Запрос в друзья успешно отправлен!');
        } catch {
            if (showAlert) showAlert('Не удалось отправить запрос.');
        }
    };
    const handleChallenge = () => {
        if (!playerData) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        const st = useGameStore.getState();
        useGameStore.setState({
            selectedEnemyId: selectedHeroId,
            battleMode: 'WARMUP',
            activeRankedOpponent: {
                id: selectedHeroId,
                name,
                avatar,
                rating,
                level: heroLevel,
                heroId: selectedHeroId,
                heroImage: heroConfig.image,
                rankIcon: rankInfo.icon,
                equipment: equipSrc,
                stats: {
                    hp: cs.hp,
                    attack: cs.attack,
                    defense: cs.defense,
                    speed: cs.speed,
                    crit: cs.critChance / 100,
                    evasion: cs.evasion,
                    critChance: cs.critChance,
                    avgItemLevel: cs.avgItemLevel || 1,
                },
                winRate,
                isBot: false,
                realUserId: playerData.id,
                vipLevel,
            },
            inspectPlayerId: null,
            inspectPlayerName: null,
        });
        if (st.setScreen) st.setScreen('BATTLE');
    };
    const handleWriteMsg = () => {
        if (!playerData) return;
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        useGameStore.setState({
            chatActiveTab: 'private',
            chatPrivateRecipient: playerData.name || 'Мастер',
            inspectPlayerId: null,
            inspectPlayerName: null,
        });
    };

    /* ─── Diorama slot ───────────────────────────────────────────── */
    const renderSlot = (slotKey: string, label: string, side: 'left' | 'right') => {
        const itemId = equipSrc[slotKey] || null;
        let item: any = null;
        if (itemId) {
            const rid = getTemplateId(String(itemId));
            item = ITEMS_DATABASE[rid] as any;
        }
        const rc = item ? rarityColors[item.rarity] || '#f0c040' : null;
        const icons: Record<string, string> = {
            HELMETS: AssetsMap.UI.BLUEPRINT_HELMET,
            SHOULDERS: AssetsMap.UI.BLUEPRINT_SHOULDERS,
            ARMOR: AssetsMap.UI.BLUEPRINT_ARMOR,
            PANTS: AssetsMap.UI.BLUEPRINT_PANTS,
            WEAPONS: AssetsMap.UI.BLUEPRINT_WEAPON,
            SHIELDS: AssetsMap.UI.BLUEPRINT_SHIELD,
            BOOTS: AssetsMap.UI.BLUEPRINT_BOOTS,
        };

        const iconBox = (
            <div
                className="d-slot"
                style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '8px',
                    flexShrink: 0,
                    background: item
                        ? 'radial-gradient(circle at 40% 30%, rgba(50,36,20,0.98) 0%, rgba(10,7,4,1) 100%)'
                        : 'rgba(0,0,0,0.42)',
                    border: `2px solid ${rc ? rc + 'bb' : 'rgba(240,192,64,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: rc ? `0 0 12px ${rc}44, inset 0 0 8px rgba(0,0,0,0.5)` : 'inset 0 0 8px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {rc && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, ${rc}, transparent)`,
                        }}
                    />
                )}
                {item ? (
                    item.spriteClass ? (
                        <div className={item.spriteClass} style={{ width: '56px', height: '56px' }} />
                    ) : (
                        (() => {
                            const atlasStyle = getItemAtlasStyle(item as any, 50, 50);
                            return atlasStyle ? (
                                <div style={atlasStyle} />
                            ) : (
                                <img
                                    src={resolveAssetPath(item.image)}
                                    style={{ width: '74%', height: '74%', objectFit: 'contain' }}
                                    alt=""
                                />
                            );
                        })()
                    )
                ) : (
                    <img
                        src={icons[slotKey] || ''}
                        style={{
                            width: '50%',
                            height: '50%',
                            objectFit: 'contain',
                            opacity: 0.18,
                            filter: 'grayscale(1)',
                        }}
                        alt=""
                    />
                )}
            </div>
        );

        const txt = (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    justifyContent: side === 'right' ? 'flex-start' : 'flex-end',
                    minWidth: 0,
                }}
            >
                {side === 'right' && (
                    <>
                        <Diamond size={7} />
                        <div
                            style={{ width: '14px', height: '1px', background: 'rgba(240,192,64,0.3)', flexShrink: 0 }}
                        />
                    </>
                )}
                <div style={{ textAlign: side === 'right' ? 'left' : 'right', minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: '10px',
                            color: '#c8921e',
                            fontWeight: 800,
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            fontFamily: "'Cinzel', serif",
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                    </div>
                    <div
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: rc ?? 'rgba(255,255,255,0.18)',
                            fontStyle: item ? 'normal' : 'italic',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '88px',
                            marginTop: '1px',
                        }}
                    >
                        {item ? (item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name) : 'Пусто'}
                    </div>
                    {item && (
                        <div
                            style={{
                                fontSize: '8px',
                                color: rc || '#f0c040',
                                fontWeight: 700,
                                opacity: 0.8,
                                textAlign: side === 'right' ? 'left' : 'right',
                            }}
                        >
                            {RARITY_RU[item.rarity] || ''}
                        </div>
                    )}
                </div>
                {side === 'left' && (
                    <>
                        <div
                            style={{ width: '14px', height: '1px', background: 'rgba(240,192,64,0.3)', flexShrink: 0 }}
                        />
                        <Diamond size={7} />
                    </>
                )}
            </div>
        );

        return (
            <div
                key={slotKey}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
                }}
            >
                {side === 'left' ? (
                    <>
                        {iconBox}
                        {txt}
                    </>
                ) : (
                    <>
                        {txt}
                        {iconBox}
                    </>
                )}
            </div>
        );
    };

    /* ══════════════════════════════════════════════════════════════════ */
    /* RENDER                                                             */
    /* ══════════════════════════════════════════════════════════════════ */
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(12px)',
                zIndex: 100000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                padding: '12px',
            }}
            onClick={handleClose}
        >
            <style>{GLOBAL_STYLES}</style>

            <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '1100px',
                    maxWidth: '100%',
                    /* ★ ФИКСИРОВАННАЯ ВЫСОТА — окно не прыгает при смене вкладок */
                    height: '800px',
                    background: 'linear-gradient(158deg, #231b0e 0%, #160f09 48%, #0e0804 100%)',
                    border: '2px solid rgba(240,192,64,0.42)',
                    borderRadius: '22px',
                    boxShadow:
                        '0 32px 100px rgba(0,0,0,0.98), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Gold top stripe */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '6%',
                        right: '6%',
                        height: '2px',
                        background:
                            'linear-gradient(90deg, transparent, rgba(240,192,64,0.85) 35%, #fff9c0 50%, rgba(240,192,64,0.85) 65%, transparent)',
                        borderRadius: '1px',
                        zIndex: 2,
                    }}
                />

                {/* Close btn */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 20,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '18px',
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(200,50,50,0.22)';
                        e.currentTarget.style.color = '#ff9090';
                        e.currentTarget.style.borderColor = 'rgba(200,50,50,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                >
                    ×
                </button>

                {/* ══════════════════════════════════════════════════════ */}
                {/* ГОРИЗОНТАЛЬНАЯ ШАПКА — баланс верх/низ                */}
                {/* ══════════════════════════════════════════════════════ */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0',
                        padding: '14px 20px 12px',
                        background: 'linear-gradient(180deg, rgba(65,44,18,0.5) 0%, rgba(16,11,6,0.0) 100%)',
                        flexShrink: 0,
                        borderBottom: '1px solid rgba(240,192,64,0.14)',
                        minHeight: '100px',
                    }}
                >
                    {/* LEFT: Аватар */}
                    <div style={{ flexShrink: 0, position: 'relative', marginRight: '18px' }}>
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%,-50%)',
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: effectiveVip
                                    ? 'radial-gradient(circle, rgba(240,192,64,0.18) 0%, transparent 65%)'
                                    : 'radial-gradient(circle, rgba(180,140,80,0.08) 0%, transparent 65%)',
                                pointerEvents: 'none',
                            }}
                        />
                        {loading || !playerData ? (
                            <div
                                style={{
                                    width: 90,
                                    height: 90,
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '2px solid rgba(240,192,64,0.2)',
                                }}
                            />
                        ) : (
                            <AvatarFrame
                                avatarFilename={avatar}
                                frameFilename={frame}
                                size={90}
                                showGlow={effectiveVip}
                            />
                        )}
                    </div>

                    {/* CENTER: Имя + Титул + Badge уровня */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {loading ? (
                            <div
                                style={{
                                    color: '#f0c040',
                                    fontWeight: 800,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '2px',
                                    fontSize: '13px',
                                }}
                            >
                                ЗАГРУЗКА...
                            </div>
                        ) : error ? (
                            <div style={{ color: '#ff5555', fontWeight: 800, fontSize: '15px' }}>{error}</div>
                        ) : playerData ? (
                            <>
                                {/* Имя + VIP */}
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}
                                >
                                    <span
                                        style={{
                                            color: '#fff',
                                            fontSize: '26px',
                                            fontWeight: 900,
                                            fontFamily: "'Cinzel', serif",
                                            letterSpacing: '0.5px',
                                            textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '340px',
                                        }}
                                    >
                                        {name}
                                    </span>
                                    {effectiveVip && (
                                        <div
                                            className="vip-a"
                                            style={{
                                                position: 'relative',
                                                width: '60px',
                                                height: '22px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <img
                                                src={resolveAssetPath(AssetsMap.UI.VIP_PLAQUE)}
                                                style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                    filter: 'drop-shadow(0 1px 5px rgba(240,192,64,0.6))',
                                                }}
                                                alt=""
                                            />
                                            <span
                                                style={{
                                                    position: 'relative',
                                                    fontSize: '9px',
                                                    fontWeight: 900,
                                                    color: '#fff',
                                                    fontFamily: "'Cinzel', serif",
                                                    zIndex: 1,
                                                }}
                                            >
                                                VIP
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Титул */}
                                <div
                                    style={{
                                        color: '#b08848',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '2.5px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {title}
                                </div>

                                {/* Нижняя строка: Level Badge + Быстрые факты */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    {/* Level badge компактный */}
                                    <div
                                        style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderRadius: '20px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background:
                                                    'linear-gradient(180deg, rgba(55,38,16,0.97) 0%, rgba(22,15,6,0.99) 100%)',
                                                border: '1px solid rgba(240,192,64,0.5)',
                                                borderRadius: '20px',
                                                padding: '3px 12px 3px 8px',
                                                boxShadow:
                                                    '0 2px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
                                                position: 'relative',
                                            }}
                                        >
                                            <div
                                                className="bdg-sh"
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '20px',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    color: '#d4a030',
                                                    filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.7))',
                                                    position: 'relative',
                                                }}
                                            >
                                                ✦
                                            </span>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'baseline',
                                                    gap: '4px',
                                                    position: 'relative',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '6.5px',
                                                        color: 'rgba(200,160,80,0.6)',
                                                        fontWeight: 700,
                                                        letterSpacing: '1.5px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    УР.
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '18px',
                                                        fontWeight: 900,
                                                        color: '#fde68a',
                                                        fontFamily: "'Cinzel', serif",
                                                        textShadow:
                                                            '0 0 14px rgba(240,192,64,0.55), 0 2px 4px rgba(0,0,0,0.9)',
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    {level}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    color: '#d4a030',
                                                    filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.7))',
                                                    position: 'relative',
                                                }}
                                            >
                                                ✦
                                            </span>
                                        </div>
                                    </div>

                                    {/* Золото */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            background: 'rgba(240,192,64,0.09)',
                                            border: '1px solid rgba(240,192,64,0.28)',
                                            borderRadius: '16px',
                                            padding: '3px 11px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <img
                                            src={AssetsMap.UI.ICON_GOLD_FULL}
                                            alt="Золото"
                                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 900,
                                                color: '#fde68a',
                                                fontFamily: "'Outfit', sans-serif",
                                            }}
                                        >
                                            {gold.toLocaleString()}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '8.5px',
                                                color: 'rgba(255,255,255,0.28)',
                                                fontWeight: 700,
                                                letterSpacing: '0.3px',
                                            }}
                                        >
                                            ЗОЛОТО
                                        </span>
                                    </div>

                                    {/* Кристаллы */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            background: 'rgba(147,51,234,0.1)',
                                            border: '1px solid rgba(147,51,234,0.3)',
                                            borderRadius: '16px',
                                            padding: '3px 11px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <img
                                            src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                            alt="Кристаллы"
                                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 900,
                                                color: '#d8b4fe',
                                                fontFamily: "'Outfit', sans-serif",
                                            }}
                                        >
                                            {crystals.toLocaleString()}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '8.5px',
                                                color: 'rgba(255,255,255,0.28)',
                                                fontWeight: 700,
                                                letterSpacing: '0.3px',
                                            }}
                                        >
                                            КРИСТАЛЛЫ
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                    {/* Ранг убран — он отображается в разделе Статистика вкладки Общая информация */}
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* BODY — занимает всё оставшееся место                  */}
                {/* ══════════════════════════════════════════════════════ */}
                {!loading && !error && playerData && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            padding: '12px 22px 16px',
                            gap: '10px',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Tabs */}
                        <div
                            style={{
                                display: 'flex',
                                background: 'rgba(8,5,3,0.75)',
                                borderRadius: '12px',
                                border: '1px solid rgba(240,192,64,0.14)',
                                padding: '3px',
                                gap: '4px',
                                flexShrink: 0,
                                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)',
                            }}
                        >
                            {(['info', 'gear'] as const).map((tab) => {
                                const active = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                            setTab(tab);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '9px 0',
                                            background: active
                                                ? 'linear-gradient(180deg, #ffe880 0%, #f0c040 50%, #9a7010 100%)'
                                                : 'transparent',
                                            border: `1px solid ${active ? '#ffe080' : 'transparent'}`,
                                            borderRadius: '9px',
                                            color: active ? '#140900' : 'rgba(255,255,255,0.42)',
                                            fontWeight: 900,
                                            fontSize: '11.5px',
                                            cursor: 'pointer',
                                            transition: 'all .22s ease',
                                            fontFamily: "'Cinzel', serif",
                                            letterSpacing: '1.2px',
                                            boxShadow: active
                                                ? '0 2px 14px rgba(240,192,64,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                                                : 'none',
                                            textShadow: active ? '0 1px 0 rgba(255,255,255,0.3)' : 'none',
                                            whiteSpace: 'nowrap',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'rgba(255,255,255,0.42)';
                                            }
                                        }}
                                    >
                                        {tab === 'info' ? 'ОБЩАЯ ИНФОРМАЦИЯ' : 'ЭКИПИРОВКА'}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ★ Tab content — одинаковая высота для обеих вкладок */}
                        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                            <AnimatePresence mode="wait" initial={false}>
                                {/* ════════════════ INFO TAB ═══════════════════ */}
                                {activeTab === 'info' && (
                                    <motion.div
                                        key="info"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18 }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {/* Любимый персонаж */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '14px',
                                                background:
                                                    'linear-gradient(135deg, rgba(44,30,14,0.85) 0%, rgba(18,12,7,0.92) 100%)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(240,192,64,0.12)',
                                                padding: '9px 14px',
                                                boxSizing: 'border-box',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    flexShrink: 0,
                                                    width: '56px',
                                                    height: '56px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        inset: -5,
                                                        borderRadius: '50%',
                                                        background:
                                                            'radial-gradient(circle, rgba(240,192,64,0.12) 0%, transparent 70%)',
                                                    }}
                                                />
                                                <img
                                                    src={resolveAssetPath(heroConfig.image)}
                                                    style={{
                                                        width: '56px',
                                                        height: '56px',
                                                        objectFit: 'contain',
                                                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
                                                        position: 'relative',
                                                        zIndex: 1,
                                                    }}
                                                    alt={heroConfig.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.opacity = '0';
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        color: 'rgba(255,255,255,0.25)',
                                                        fontSize: '7.5px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1.2px',
                                                        fontWeight: 700,
                                                        marginBottom: '2px',
                                                    }}
                                                >
                                                    Любимый персонаж
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
                                                    <span
                                                        style={{
                                                            color: '#fff',
                                                            fontSize: '16px',
                                                            fontWeight: 800,
                                                            fontFamily: "'Cinzel', serif",
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '180px',
                                                        }}
                                                    >
                                                        {heroConfig.name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: '#f0c040',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        Ур. {heroLevel}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        color: '#907050',
                                                        fontSize: '10.5px',
                                                        fontWeight: 600,
                                                        marginTop: '1px',
                                                    }}
                                                >
                                                    {heroConfig.title} &nbsp;•&nbsp; {roleToRu(heroConfig.role)}
                                                </div>
                                            </div>
                                            <div style={{ flexShrink: 0, textAlign: 'center' }}>
                                                <div
                                                    style={{
                                                        fontSize: '24px',
                                                        lineHeight: 1,
                                                        filter: 'drop-shadow(0 0 5px rgba(240,192,64,0.35))',
                                                    }}
                                                >
                                                    {heroConfig.role === 'TANK'
                                                        ? '🛡️'
                                                        : heroConfig.role === 'ASSASSIN'
                                                          ? '⚔️'
                                                          : heroConfig.role === 'MAGE'
                                                            ? '🔮'
                                                            : heroConfig.role === 'SUPPORT'
                                                              ? '✨'
                                                              : '⚔️'}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '7.5px',
                                                        color: 'rgba(255,255,255,0.22)',
                                                        fontWeight: 600,
                                                        marginTop: '2px',
                                                        letterSpacing: '0.4px',
                                                    }}
                                                >
                                                    {roleToRu(heroConfig.role).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: '12px',
                                                flex: 1,
                                                minHeight: 0,
                                            }}
                                        >
                                            {/* LEFT: Характеристики */}
                                            <div
                                                style={{
                                                    flex: 1,
                                                    background: 'rgba(0,0,0,0.22)',
                                                    border: '1px solid rgba(240,192,64,0.09)',
                                                    borderRadius: '14px',
                                                    padding: '12px 14px',
                                                    boxSizing: 'border-box',
                                                    boxShadow: 'inset 0 0 22px rgba(0,0,0,0.4)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                }}
                                            >
                                                <SectionLabel>Характеристики</SectionLabel>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        flex: 1,
                                                        justifyContent: 'space-evenly',
                                                    }}
                                                >
                                                    {statRows.map((s, i) => (
                                                        <div key={i}>
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        fontSize: '10.5px',
                                                                        color: 'rgba(255,255,255,0.5)',
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    <span style={{ fontSize: '12px' }}>{s.icon}</span>
                                                                    <span>{s.name}</span>
                                                                    <span
                                                                        style={{
                                                                            fontSize: '8.5px',
                                                                            color: 'rgba(255,255,255,0.18)',
                                                                            fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        ({s.abbr})
                                                                    </span>
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize: '15px',
                                                                        color: s.color,
                                                                        fontWeight: 900,
                                                                        textShadow: `0 0 12px ${s.color}55`,
                                                                        minWidth: '44px',
                                                                        textAlign: 'right',
                                                                        fontFamily: "'Outfit', sans-serif",
                                                                    }}
                                                                >
                                                                    {s.value}
                                                                </span>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    width: '100%',
                                                                    height: '5px',
                                                                    background: 'rgba(255,255,255,0.04)',
                                                                    borderRadius: '3px',
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${s.pct}%` }}
                                                                    transition={{
                                                                        duration: 0.75,
                                                                        ease: 'easeOut',
                                                                        delay: i * 0.06,
                                                                    }}
                                                                    style={{
                                                                        height: '100%',
                                                                        background: `linear-gradient(90deg, ${s.color}50 0%, ${s.color} 100%)`,
                                                                        borderRadius: '3px',
                                                                        boxShadow: `0 0 8px ${s.color}99`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* RIGHT: Профиль */}
                                            <div
                                                style={{
                                                    flex: 1.12,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px',
                                                }}
                                            >
                                                <div>
                                                    <SectionLabel>Статистика</SectionLabel>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        {[
                                                            {
                                                                img: rankInfo.icon,
                                                                label: 'РАНГ',
                                                                val: rankInfo.name,
                                                                vc: rankInfo.color,
                                                                top: 'rgba(240,192,64,0.4)',
                                                            },
                                                            {
                                                                img: resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM),
                                                                label: 'РЕЙТИНГ',
                                                                val: rating.toLocaleString(),
                                                                vc: '#fff',
                                                                top: 'rgba(240,192,64,0.4)',
                                                            },
                                                        ].map((c) => (
                                                            <div
                                                                key={c.label}
                                                                className="sc-h"
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.022)',
                                                                    border: '1px solid rgba(255,255,255,0.07)',
                                                                    borderTop: `2px solid ${c.top}`,
                                                                    borderRadius: '10px',
                                                                    padding: '8px 10px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                }}
                                                            >
                                                                <img
                                                                    src={c.img}
                                                                    style={{
                                                                        width: '28px',
                                                                        height: '28px',
                                                                        objectFit: 'contain',
                                                                        flexShrink: 0,
                                                                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
                                                                    }}
                                                                    alt=""
                                                                />
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div
                                                                        style={{
                                                                            fontSize: '10px',
                                                                            color: 'rgba(255,255,255,0.35)',
                                                                            fontWeight: 700,
                                                                            letterSpacing: '0.5px',
                                                                            textTransform: 'uppercase',
                                                                        }}
                                                                    >
                                                                        {c.label}
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            fontSize: '13px',
                                                                            fontWeight: 900,
                                                                            color: c.vc,
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            fontFamily: "'Outfit', sans-serif",
                                                                        }}
                                                                    >
                                                                        {c.val}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div
                                                            className="sc-h"
                                                            style={{
                                                                background: 'rgba(255,255,255,0.022)',
                                                                border: '1px solid rgba(255,255,255,0.07)',
                                                                borderTop: '2px solid rgba(96,165,250,0.4)',
                                                                borderRadius: '10px',
                                                                padding: '8px 10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    flexShrink: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '20px',
                                                                }}
                                                            >
                                                                ⚔️
                                                            </div>
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '10px',
                                                                        color: 'rgba(255,255,255,0.35)',
                                                                        fontWeight: 700,
                                                                        letterSpacing: '0.5px',
                                                                        textTransform: 'uppercase',
                                                                    }}
                                                                >
                                                                    ВСЕГО БОЁВ
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '13px',
                                                                        fontWeight: 900,
                                                                        color: '#e2e8f0',
                                                                        fontFamily: "'Outfit', sans-serif",
                                                                    }}
                                                                >
                                                                    {totalBattles.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="sc-h"
                                                            style={{
                                                                background: 'rgba(255,255,255,0.022)',
                                                                border: '1px solid rgba(255,255,255,0.07)',
                                                                borderTop: '2px solid rgba(74,222,128,0.4)',
                                                                borderRadius: '10px',
                                                                padding: '8px 10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    flexShrink: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '20px',
                                                                }}
                                                            >
                                                                🏆
                                                            </div>
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '10px',
                                                                        color: 'rgba(255,255,255,0.35)',
                                                                        fontWeight: 700,
                                                                        letterSpacing: '0.5px',
                                                                        textTransform: 'uppercase',
                                                                    }}
                                                                >
                                                                    ПОБЕДЫ
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '13px',
                                                                        fontWeight: 900,
                                                                        color: '#4ade80',
                                                                        fontFamily: "'Outfit', sans-serif",
                                                                    }}
                                                                >
                                                                    {winRate}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        minHeight: 0,
                                                    }}
                                                >
                                                    <SectionLabel>Профиль</SectionLabel>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '6px',
                                                            flex: 1,
                                                            gridAutoRows: '1fr',
                                                        }}
                                                    >
                                                        <MiniCard
                                                            emoji="🏰"
                                                            label="Клан"
                                                            value={clanName}
                                                            vc={
                                                                clanName !== 'Отсутствует' && clanName !== 'В клане'
                                                                    ? '#fcd34d'
                                                                    : 'rgba(255,255,255,0.38)'
                                                            }
                                                            bg="rgba(252,211,77,0.08)"
                                                        />
                                                        <MiniCard
                                                            emoji="🎯"
                                                            label="Боевой пропуск"
                                                            value={bpLevel > 0 ? `Ур. ${bpLevel}` : 'Не активен'}
                                                            vc={bpLevel > 0 ? '#fb7185' : 'rgba(255,255,255,0.28)'}
                                                            bg={
                                                                bpLevel > 0
                                                                    ? 'rgba(251,113,133,0.1)'
                                                                    : 'rgba(255,255,255,0.02)'
                                                            }
                                                        />
                                                        <MiniCard
                                                            emoji="🦸"
                                                            label="Герои"
                                                            value={`${ownedHeroesCount} / ${HEROES_DB.length}`}
                                                            vc="#60a5fa"
                                                            bg="rgba(96,165,250,0.09)"
                                                        />
                                                        <MiniCard
                                                            emoji={effectiveVip ? '👑' : '🔒'}
                                                            label="VIP Статус"
                                                            value={effectiveVip ? `VIP Ур. ${vipLevel}` : 'Нет'}
                                                            vc={effectiveVip ? '#fbbf24' : 'rgba(255,255,255,0.28)'}
                                                            bg={
                                                                effectiveVip
                                                                    ? 'rgba(251,191,36,0.1)'
                                                                    : 'rgba(255,255,255,0.02)'
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ════════════════ GEAR TAB ═══════════════════ */}
                                {activeTab === 'gear' && (
                                    <motion.div
                                        key="gear"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18 }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {/* DIORAMA */}
                                        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch' }}>
                                            {/* LEFT SLOTS */}
                                            <div
                                                style={{
                                                    width: '205px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-evenly',
                                                    gap: '5px',
                                                    padding: '4px 0',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {renderSlot('HELMETS', 'ШЛЕМ', 'left')}
                                                {renderSlot('SHOULDERS', 'ПЛЕЧИ', 'left')}
                                                {renderSlot('ARMOR', 'ДОСПЕХ', 'left')}
                                                {renderSlot('PANTS', 'ПОНОЖИ', 'left')}
                                            </div>

                                            {/* CENTER FRAME */}
                                            <div
                                                style={{
                                                    flex: 1,
                                                    position: 'relative',
                                                    margin: '0 10px',
                                                    border: '2px solid rgba(240,192,64,0.48)',
                                                    borderRadius: '10px',
                                                    background:
                                                        'radial-gradient(ellipse at 50% 22%, rgba(55,36,16,0.52) 0%, rgba(8,5,3,0.97) 65%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {/* Corner ornaments */}
                                                {[
                                                    { t: 5, l: 5 },
                                                    { t: 5, r: 5 },
                                                    { b: 5, l: 5 },
                                                    { b: 5, r: 5 },
                                                ].map((p, i) => {
                                                    const s: React.CSSProperties = {
                                                        position: 'absolute',
                                                        width: '14px',
                                                        height: '14px',
                                                        pointerEvents: 'none',
                                                        ...((p as any).t !== undefined
                                                            ? { top: (p as any).t }
                                                            : { bottom: (p as any).b }),
                                                        ...((p as any).l !== undefined
                                                            ? { left: (p as any).l }
                                                            : { right: (p as any).r }),
                                                    };
                                                    const isRight = (p as any).r !== undefined,
                                                        isBottom = (p as any).b !== undefined;
                                                    return (
                                                        <div key={i} style={s}>
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    [isRight ? 'right' : 'left']: 0,
                                                                    width: '8px',
                                                                    height: '1.5px',
                                                                    background: '#f0c040',
                                                                }}
                                                            />
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    [isBottom ? 'bottom' : 'top']: 0,
                                                                    [isRight ? 'right' : 'left']: 0,
                                                                    width: '1.5px',
                                                                    height: '8px',
                                                                    background: '#f0c040',
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                                {/* Diamonds at midpoints */}
                                                <Diamond
                                                    size={10}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: -6,
                                                        transform: 'translateY(-50%) rotate(45deg)',
                                                    }}
                                                />
                                                <Diamond
                                                    size={10}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        right: -6,
                                                        transform: 'translateY(-50%) rotate(45deg)',
                                                    }}
                                                />
                                                <Diamond
                                                    size={10}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -6,
                                                        left: '50%',
                                                        transform: 'translateX(-50%) rotate(45deg)',
                                                    }}
                                                />
                                                <Diamond
                                                    size={10}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: -6,
                                                        left: '50%',
                                                        transform: 'translateX(-50%) rotate(45deg)',
                                                    }}
                                                />
                                                {/* Ground glow */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        width: '70%',
                                                        height: '80px',
                                                        background:
                                                            'radial-gradient(ellipse at 50% 100%, rgba(240,192,64,0.14) 0%, transparent 70%)',
                                                        pointerEvents: 'none',
                                                    }}
                                                />
                                                {/* Top vignette */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '50px',
                                                        background:
                                                            'linear-gradient(180deg, rgba(60,40,14,0.28) 0%, transparent 100%)',
                                                        pointerEvents: 'none',
                                                    }}
                                                />
                                                {/* HERO */}
                                                <img
                                                    src={resolveAssetPath(heroConfig.image)}
                                                    className="h-float"
                                                    style={{
                                                        maxHeight: '88%',
                                                        maxWidth: '88%',
                                                        objectFit: 'contain',
                                                        filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.98)) drop-shadow(0 0 10px rgba(0,0,0,0.7))',
                                                        position: 'relative',
                                                        zIndex: 1,
                                                    }}
                                                    alt={heroConfig.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.opacity = '0.12';
                                                    }}
                                                />
                                            </div>

                                            {/* RIGHT SLOTS */}
                                            <div
                                                style={{
                                                    width: '205px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-evenly',
                                                    gap: '5px',
                                                    padding: '4px 0',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {renderSlot('WEAPONS', 'ОРУЖИЕ', 'right')}
                                                {renderSlot('SHIELDS', 'ЩИТ', 'right')}
                                                {renderSlot('BOOTS', 'САПОГИ', 'right')}
                                                <div />
                                            </div>
                                        </div>

                                        {/* Stats bar */}
                                        <div
                                            style={{
                                                background: 'rgba(0,0,0,0.55)',
                                                border: '1px solid rgba(240,192,64,0.28)',
                                                borderRadius: '10px',
                                                padding: '9px 16px',
                                                display: 'flex',
                                                justifyContent: 'space-around',
                                                alignItems: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {[
                                                {
                                                    label: 'МОЩЬ',
                                                    emoji: '🔥',
                                                    val: gearPower.toLocaleString(),
                                                    color: '#f0c040',
                                                },
                                                { label: 'ЗДОРОВЬЕ', emoji: '❤️', val: cs.hp, color: '#f87171' },
                                                { label: 'АТАКА', emoji: '⚔️', val: cs.attack, color: '#fb923c' },
                                                { label: 'ЗАЩИТА', emoji: '🛡️', val: cs.defense, color: '#60a5fa' },
                                                {
                                                    label: 'СКОРОСТЬ',
                                                    emoji: '💨',
                                                    val: cs.speed.toFixed(2),
                                                    color: '#4ade80',
                                                },
                                                {
                                                    label: 'КРИТ',
                                                    emoji: '💥',
                                                    val: `${Math.round(cs.critChance)}%`,
                                                    color: '#c084fc',
                                                },
                                            ].map((s, i, arr) => (
                                                <React.Fragment key={s.label}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: '7.5px',
                                                                color: '#c8921e',
                                                                fontWeight: 800,
                                                                letterSpacing: '0.6px',
                                                                textTransform: 'uppercase',
                                                                fontFamily: "'Cinzel', serif",
                                                            }}
                                                        >
                                                            {s.label}
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '14px', lineHeight: 1 }}>
                                                                {s.emoji}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: 900,
                                                                    color: s.color,
                                                                    fontFamily: "'Outfit', sans-serif",
                                                                    textShadow: `0 0 10px ${s.color}55`,
                                                                }}
                                                            >
                                                                {s.val}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {i < arr.length - 1 && (
                                                        <div
                                                            style={{
                                                                width: '1px',
                                                                height: '26px',
                                                                background: 'rgba(240,192,64,0.16)',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Hero name + XP */}
                                        <div
                                            style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(240,192,64,0.13)',
                                                borderRadius: '10px',
                                                padding: '9px 16px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    marginBottom: '2px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '18px',
                                                        fontWeight: 800,
                                                        color: '#fff',
                                                        fontFamily: "'Cinzel', serif",
                                                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                                    }}
                                                >
                                                    {heroConfig.name}
                                                </span>
                                                <div
                                                    style={{
                                                        background: 'rgba(240,192,64,0.12)',
                                                        border: '1px solid rgba(240,192,64,0.42)',
                                                        borderRadius: '6px',
                                                        padding: '2px 7px',
                                                        fontSize: '9.5px',
                                                        color: '#f0c040',
                                                        fontWeight: 800,
                                                        fontFamily: "'Cinzel', serif",
                                                    }}
                                                >
                                                    УР. {heroLevel}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: '9px',
                                                    color: 'rgba(255,255,255,0.28)',
                                                    letterSpacing: '2px',
                                                    textTransform: 'uppercase',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                {heroConfig.title}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '3px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '8px',
                                                        color: 'rgba(255,255,255,0.26)',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.5px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    ОПЫТ ГЕРОЯ
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '8px',
                                                        color: 'rgba(255,255,255,0.36)',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {heroXp} / {heroXpToNext} ({Math.round(xpPct)}%)
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '4px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${xpPct}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #c88020, #f0c040)',
                                                        borderRadius: '3px',
                                                        boxShadow: '0 0 6px rgba(240,192,64,0.5)',
                                                        transition: 'width .5s ease',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Action buttons */}
                        {!isMe && (
                            <>
                                <GoldDivider style={{ flexShrink: 0 }} />
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '10px',
                                        flexShrink: 0,
                                        width: '100%',
                                    }}
                                >
                                    <button
                                        onClick={handleAddFriend}
                                        disabled={isAlreadyFriend}
                                        className="act-btn"
                                        style={{
                                            flex: 1,
                                            width: 'auto',
                                            height: '42px',
                                            background: isAlreadyFriend
                                                ? 'rgba(255,255,255,0.02)'
                                                : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${isAlreadyFriend ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)'}`,
                                            borderRadius: '11px',
                                            color: isAlreadyFriend ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: isAlreadyFriend ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isAlreadyFriend) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isAlreadyFriend) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                e.currentTarget.style.transform = 'none';
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: '13px' }}>{isAlreadyFriend ? '✓' : '＋'}</span>
                                        {isAlreadyFriend ? 'УЖЕ В ДРУЗЬЯХ' : 'В ДРУЗЬЯ'}
                                    </button>
                                    <button
                                        onClick={handleWriteMsg}
                                        className="act-btn"
                                        style={{
                                            flex: 1,
                                            width: 'auto',
                                            height: '42px',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: '11px',
                                            color: 'rgba(255,255,255,0.8)',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                    >
                                        <span style={{ fontSize: '13px' }}>💬</span>НАПИСАТЬ
                                    </button>
                                    <button
                                        onClick={handleChallenge}
                                        className="act-btn"
                                        style={{
                                            flex: 1.7,
                                            width: 'auto',
                                            height: '42px',
                                            background:
                                                'linear-gradient(180deg, #ffe880 0%, #f0c040 50%, #9a6e10 100%)',
                                            border: '1px solid #ffe080',
                                            borderRadius: '11px',
                                            color: '#1a0a00',
                                            fontSize: '11.5px',
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            boxShadow:
                                                '0 4px 18px rgba(240,192,64,0.28), inset 0 1px 0 rgba(255,255,255,0.3)',
                                            fontFamily: "'Cinzel', serif",
                                            letterSpacing: '0.5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                            textShadow: '0 1px 0 rgba(255,255,255,0.2)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.filter = 'brightness(1.08)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow =
                                                '0 7px 24px rgba(240,192,64,0.42), inset 0 1px 0 rgba(255,255,255,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.filter = '';
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow =
                                                '0 4px 18px rgba(240,192,64,0.28), inset 0 1px 0 rgba(255,255,255,0.3)';
                                        }}
                                    >
                                        <span style={{ fontSize: '14px' }}>⚔️</span>ВЫЗВАТЬ НА БОЙ
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
