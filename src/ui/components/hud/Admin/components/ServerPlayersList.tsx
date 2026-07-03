import React, { useState, useEffect } from 'react';
import { RealPlayer, mapRawPlayerToRealPlayer } from '../AdminShared';
import { syncService } from '../../../../../services/SyncService';
import { useGameStore } from '../../../../../store/useGameStore';
import { AdminAvatar } from './AdminAvatar';

interface ServerPlayersListProps {
    realPlayers: RealPlayer[];
    isLoadingPlayers: boolean;
    selectedPlayerId: string | null;
    onSelectPlayer: (id: string | null) => void;
    onRefresh: () => void;
}

export const ServerPlayersList: React.FC<ServerPlayersListProps> = ({
    realPlayers,
    isLoadingPlayers,
    selectedPlayerId,
    onSelectPlayer,
    onRefresh,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'BANNED'>('ALL');
    const [filterType, setFilterType] = useState<'VK_REAL' | 'VK_TEST' | 'GUEST' | 'ALL'>('ALL');

    const [searchResults, setSearchResults] = useState<RealPlayer[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // 400ms debounced global database search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const rawResults = await syncService.searchPlayersGlobal(searchQuery);
                const mapped = rawResults.map(mapRawPlayerToRealPlayer);
                setSearchResults(mapped);
            } catch (err) {
                console.error('[ServerPlayersList] Global search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Local player identity details to keep self-editor reactive
    const localPlayerId = useGameStore((s) => {
        if (s.vkUser) return `VK-${s.vkUser.id}`;
        if (s.playerId === 'DEVELOPER') return 'DEVELOPER';
        if (s.playerId && s.playerId.startsWith('GUEST-')) return s.playerId;
        const cleanGuest = s.playerId ? s.playerId.replace(/^MW-/, '') : '';
        return cleanGuest ? `GUEST-${cleanGuest}` : 'DEVELOPER';
    });
    const localVkUser = useGameStore((s) => s.vkUser);
    const localPlayerName = useGameStore((s) => s.name);
    const localPlayerAvatar = useGameStore((s) => s.avatar);
    const localPlayerGold = useGameStore((s) => s.gold);
    const localPlayerCrystals = useGameStore((s) => s.crystals);
    const localPlayerLevel = useGameStore((s) => s.level);
    const localPlayerRating = useGameStore((s) => s.rating);
    const localPlayerVipLevel = useGameStore((s) => s.vipLevel);
    const localPlayerIsVipActive = useGameStore((s) => s.isVipActive);
    const localPlayerVipDaysRemaining = useGameStore((s) => s.vipDaysRemaining);
    const localPlayerEnergy = useGameStore((s) => s.energy);
    const localPlayerMaxEnergy = useGameStore((s) => s.maxEnergy);
    const localPlayerInventory = useGameStore((s) => s.inventory);
    const localPlayerActiveScreen = useGameStore((s) => s.activeScreen);
    const localPlayerTalentPoints = useGameStore((s) => s.talentPoints);
    const localPlayerHasInfiniteEnergy = useGameStore((s) => s.hasInfiniteEnergy);

    const selfPlayer: RealPlayer = {
        id: localPlayerId,
        vkId: localVkUser ? Number(localVkUser.id) : 0,
        name: `${localPlayerName || 'Разработчик'} (Я)`,
        photo: localPlayerAvatar || 'https://vk.com/images/camera_100.png',
        status: 'ONLINE',
        screen: localPlayerActiveScreen || 'MAP',
        level: localPlayerLevel || 1,
        gold: localPlayerGold || 0,
        crystals: localPlayerCrystals || 0,
        regDate: 'сегодня',
        reports: 0,
        reportLogs: [],
        gear: {},
        isTest: true,
        isDev: true,
        lastSeenTime: 'сейчас',
        rating: localPlayerRating || 0,
        vipLevel: localPlayerVipLevel || 0,
        isVipActive: localPlayerIsVipActive || false,
        vipDaysRemaining: localPlayerVipDaysRemaining || 0,
        energy: localPlayerEnergy || 0,
        maxEnergy: localPlayerMaxEnergy || 0,
        inventory: localPlayerInventory || [],
        talentPoints: localPlayerTalentPoints || 0,
        hasInfiniteEnergy: localPlayerHasInfiniteEnergy || false,
    };

    // VK numeric ID to detect duplicate self-entries stored as "VK-XXXXXXX"
    const localVkIdNum = localVkUser ? Number(localVkUser.id) : -1;

    const activeList = searchQuery.trim() ? searchResults : realPlayers;

    const filteredBase = activeList.filter((p) => {
        // Exclude self by game ID OR by VK numeric ID (prevents duplicate "VK-XXXXXXX" entry)
        if (p.id === localPlayerId) return false;
        if (localVkIdNum > 0 && p.vkId === localVkIdNum) return false;

        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(p.vkId).includes(searchQuery);

        const matchesStatus =
            filterStatus === 'ALL' ||
            (filterStatus === 'ONLINE' && p.status === 'ONLINE') ||
            (filterStatus === 'BANNED' && p.status === 'BANNED');

        const isVK = p.id.startsWith('VK-') || (p.vkId && p.vkId > 0);
        const matchesType =
            filterType === 'ALL' ||
            (filterType === 'VK_REAL' && isVK && !p.isTest) ||
            (filterType === 'VK_TEST' && isVK && p.isTest) ||
            (filterType === 'GUEST' && !isVK);

        return matchesSearch && matchesStatus && matchesType;
    });

    // Self matching filters
    const matchesSearchSelf =
        selfPlayer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        selfPlayer.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatusSelf = filterStatus === 'ALL' || filterStatus === 'ONLINE';
    const matchesTypeSelf = filterType === 'ALL' || filterType === 'VK_TEST';

    const showSelf = matchesSearchSelf && matchesStatusSelf && matchesTypeSelf;
    const finalPlayers = showSelf ? [selfPlayer, ...filteredBase] : filteredBase;

    return (
        <div
            style={{
                background: '#0a0a0a',
                border: '1px solid #1e1e1e',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
            }}
        >
            {/* ── Search header ── */}
            <div
                style={{
                    padding: '14px',
                    borderBottom: '1px solid #161616',
                    background: 'linear-gradient(180deg, #111 0%, #0c0c0c 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}
            >
                {/* Search input row */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            position: 'absolute',
                            left: '13px',
                            fontSize: '15px',
                            color: searchQuery ? '#ff4d4d' : '#444',
                            pointerEvents: 'none',
                            transition: 'color 0.2s',
                            lineHeight: 1,
                        }}
                    >
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Поиск по имени, ID, VK..."
                        style={{
                            width: '100%',
                            padding: '12px 44px 12px 38px',
                            background: '#141414',
                            border: `1.5px solid ${searchQuery ? 'rgba(255,77,77,0.45)' : '#252525'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '15px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s',
                            fontFamily: 'inherit',
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Clear or Refresh icon */}
                    {searchQuery ? (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                color: '#555',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: '4px',
                            }}
                        >
                            ✕
                        </button>
                    ) : (
                        <button
                            onClick={onRefresh}
                            disabled={isLoadingPlayers || isSearching}
                            title="Обновить список"
                            style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                color: isLoadingPlayers ? '#2a2a2a' : '#444',
                                cursor: isLoadingPlayers ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                                lineHeight: 1,
                                padding: '4px',
                                transition: 'color 0.2s',
                            }}
                        >
                            {isLoadingPlayers || isSearching ? '⏳' : '🔄'}
                        </button>
                    )}
                </div>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: '6px' }}>
                    {(['ALL', 'ONLINE', 'BANNED'] as const).map((s) => {
                        const label = s === 'ALL' ? 'Все' : s === 'ONLINE' ? '🟢 Online' : '🔴 Banned';
                        const active = filterStatus === s;
                        const activeBg = s === 'ONLINE' ? '#0f2d1e' : s === 'BANNED' ? '#2d0f0f' : '#1e1e1e';
                        const activeBorder = s === 'ONLINE' ? '#4dff4d' : s === 'BANNED' ? '#ff4d4d' : '#555';
                        const activeColor = s === 'ONLINE' ? '#4dff4d' : s === 'BANNED' ? '#ff6b6b' : '#fff';
                        return (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    borderRadius: '8px',
                                    border: `1px solid ${active ? activeBorder : '#1e1e1e'}`,
                                    background: active ? activeBg : '#111',
                                    color: active ? activeColor : '#444',
                                    fontSize: '13px',
                                    fontWeight: active ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Account type label */}
                <div
                    style={{
                        fontSize: '11px',
                        color: '#383838',
                        letterSpacing: '1px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                    }}
                >
                    Тип аккаунта
                </div>

                {/* Account type grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {(
                        [
                            {
                                key: 'VK_REAL',
                                label: '👥 ВК Игроки',
                                aColor: '#4dff4d',
                                aBg: '#0f2d1e',
                                aBorder: '#4dff4d',
                            },
                            {
                                key: 'VK_TEST',
                                label: '🧪 Тест ВК',
                                aColor: '#60a5fa',
                                aBg: '#0f1d3a',
                                aBorder: '#3b82f6',
                            },
                            { key: 'GUEST', label: '🤖 Гости', aColor: '#fdba74', aBg: '#2a1005', aBorder: '#f97316' },
                            { key: 'ALL', label: '🌐 Все типы', aColor: '#fff', aBg: '#1e1e1e', aBorder: '#555' },
                        ] as const
                    ).map(({ key, label, aColor, aBg, aBorder }) => {
                        const active = filterType === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilterType(key as any)}
                                style={{
                                    padding: '7px 4px',
                                    borderRadius: '8px',
                                    border: `1px solid ${active ? aBorder : '#1c1c1c'}`,
                                    background: active ? aBg : '#0d0d0d',
                                    color: active ? aColor : '#3a3a3a',
                                    fontSize: '12px',
                                    fontWeight: active ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    textAlign: 'center',
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Player list ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isSearching && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#333', fontSize: '12px' }}>
                        Поиск в базе данных... ⏳
                    </div>
                )}
                {!isSearching && finalPlayers.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#2a2a2a', fontSize: '12px' }}>
                        Никого не найдено
                    </div>
                )}
                {!isSearching &&
                    finalPlayers.map((p) => {
                        const isSelf = p.id === localPlayerId;
                        const isSelected = selectedPlayerId === p.id;
                        return (
                            <div
                                key={p.id}
                                onClick={() => onSelectPlayer(p.id)}
                                style={{
                                    padding: '11px 14px',
                                    borderBottom: '1px solid #0d0d0d',
                                    cursor: 'pointer',
                                    background: isSelected
                                        ? 'rgba(255,77,77,0.07)'
                                        : isSelf
                                          ? 'rgba(240,192,64,0.04)'
                                          : 'transparent',
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'center',
                                    borderLeft: isSelected
                                        ? '3px solid #ff4d4d'
                                        : isSelf
                                          ? '3px solid #f0c040'
                                          : '3px solid transparent',
                                    transition: 'background 0.15s',
                                }}
                            >
                                {/* Status dot */}
                                <div
                                    style={{
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        background:
                                            p.status === 'ONLINE'
                                                ? '#4dff4d'
                                                : p.status === 'BATTLE'
                                                  ? '#3b82f6'
                                                  : '#1e1e1e',
                                        boxShadow: p.status === 'ONLINE' ? '0 0 5px #4dff4d88' : 'none',
                                    }}
                                />

                                {/* Avatar */}
                                <AdminAvatar
                                    photo={p.photo}
                                    name={p.name}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        border: `2px solid ${isSelf ? '#f0c040' : isSelected ? '#ff4d4d' : '#1e1e1e'}`,
                                    }}
                                />

                                {/* Info */}
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            color: isSelf ? '#f0c040' : '#e8e8e8',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {p.name}
                                        {isSelf && (
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    fontWeight: 400,
                                                    opacity: 0.5,
                                                    marginLeft: '6px',
                                                }}
                                            >
                                                (Вы)
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#3a3a3a',
                                            fontFamily: 'monospace',
                                            letterSpacing: '0.3px',
                                        }}
                                    >
                                        {p.id}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color:
                                                p.status === 'ONLINE'
                                                    ? '#4dff4d'
                                                    : p.status === 'BATTLE'
                                                      ? '#60a5fa'
                                                      : '#333',
                                        }}
                                    >
                                        {p.status === 'ONLINE'
                                            ? 'В сети'
                                            : p.status === 'BATTLE'
                                              ? 'В бою ⚔️'
                                              : p.status === 'BANNED'
                                                ? '🚫 Забанен'
                                                : `Был(а): ${p.lastSeenTime}`}
                                    </div>
                                </div>

                                {/* Report badge */}
                                {p.reports > 0 && (
                                    <div
                                        style={{
                                            background: '#ff4d4d',
                                            color: '#fff',
                                            fontSize: '9px',
                                            fontWeight: 900,
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {p.reports}!
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
