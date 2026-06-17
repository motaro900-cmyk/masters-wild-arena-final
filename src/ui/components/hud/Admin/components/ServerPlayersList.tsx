import React, { useState, useEffect } from 'react';
import { RealPlayer, inputStyle, smallBtnStyle, applyBtn, mapRawPlayerToRealPlayer } from '../AdminShared';
import { syncService } from '../../../../../services/SyncService';
import { useGameStore } from '../../../../../store/useGameStore';

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
    const localPlayerId = useGameStore((s) => s.playerId);
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

    const activeList = searchQuery.trim() ? searchResults : realPlayers;

    const filteredBase = activeList.filter((p) => {
        if (p.id === localPlayerId) return false; // self is prepended manually

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
            className="h-[400px] lg:h-full"
            style={{
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Строка поиска + кнопка обновления */}
            <div style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="Поиск по Имени/ID/VK..."
                        style={{ ...inputStyle, flex: 1 }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={onRefresh} style={{ ...applyBtn, padding: '0 10px' }} disabled={isLoadingPlayers || isSearching}>
                        {isLoadingPlayers || isSearching ? '...' : '🔄'}
                    </button>
                </div>

                {/* Фильтр по статусу */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        style={{
                            ...smallBtnStyle,
                            flex: 1,
                            background: filterStatus === 'ALL' ? '#222' : '#111',
                            color: filterStatus === 'ALL' ? '#fff' : '#666',
                        }}
                    >
                        Все
                    </button>
                    <button
                        onClick={() => setFilterStatus('ONLINE')}
                        style={{
                            ...smallBtnStyle,
                            flex: 1,
                            background: filterStatus === 'ONLINE' ? '#1b4332' : '#111',
                            color: filterStatus === 'ONLINE' ? '#fff' : '#666',
                        }}
                    >
                        Online
                    </button>
                    <button
                        onClick={() => setFilterStatus('BANNED')}
                        style={{
                            ...smallBtnStyle,
                            flex: 1,
                            background: filterStatus === 'BANNED' ? '#431b1b' : '#111',
                            color: filterStatus === 'BANNED' ? '#fff' : '#666',
                        }}
                    >
                        Banned
                    </button>
                </div>

                {/* Фильтр по типу аккаунта */}
                <div
                    style={{
                        fontSize: '9px',
                        color: '#555',
                        marginTop: '10px',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                    }}
                >
                    Тип аккаунтов
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                    <button
                        onClick={() => setFilterType('VK_REAL')}
                        style={{
                            ...smallBtnStyle,
                            padding: '6px 2px',
                            fontSize: '10px',
                            background: filterType === 'VK_REAL' ? '#1b4332' : '#111',
                            borderColor: filterType === 'VK_REAL' ? '#4dff4d' : '#222',
                            color: filterType === 'VK_REAL' ? '#4dff4d' : '#888',
                        }}
                    >
                        👥 ВК Игроки
                    </button>
                    <button
                        onClick={() => setFilterType('VK_TEST')}
                        style={{
                            ...smallBtnStyle,
                            padding: '6px 2px',
                            fontSize: '10px',
                            background: filterType === 'VK_TEST' ? '#1d4ed8' : '#111',
                            borderColor: filterType === 'VK_TEST' ? '#3b82f6' : '#222',
                            color: filterType === 'VK_TEST' ? '#60a5fa' : '#888',
                        }}
                    >
                        🧪 Тест ВК
                    </button>
                    <button
                        onClick={() => setFilterType('GUEST')}
                        style={{
                            ...smallBtnStyle,
                            padding: '6px 2px',
                            fontSize: '10px',
                            background: filterType === 'GUEST' ? '#451a03' : '#111',
                            borderColor: filterType === 'GUEST' ? '#f97316' : '#222',
                            color: filterType === 'GUEST' ? '#fdba74' : '#888',
                        }}
                    >
                        🤖 Гости
                    </button>
                    <button
                        onClick={() => setFilterType('ALL')}
                        style={{
                            ...smallBtnStyle,
                            padding: '6px 2px',
                            fontSize: '10px',
                            background: filterType === 'ALL' ? '#222' : '#111',
                            borderColor: filterType === 'ALL' ? '#444' : '#222',
                            color: filterType === 'ALL' ? '#fff' : '#888',
                        }}
                    >
                        🌐 Все типы
                    </button>
                </div>
            </div>

            {/* Прокручиваемый список игроков */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isSearching && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        Идет поиск в базе данных... ⏳
                    </div>
                )}
                {!isSearching && finalPlayers.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        Ничего не найдено
                    </div>
                )}
                {!isSearching && finalPlayers.map((p) => {
                    const isSelf = p.id === localPlayerId;
                    return (
                        <div
                            key={p.id}
                            onClick={() => onSelectPlayer(p.id)}
                            style={{
                                padding: '12px',
                                borderBottom: '1px solid #111',
                                cursor: 'pointer',
                                background: selectedPlayerId === p.id ? '#1a1a1a' : 'transparent',
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                borderLeft: isSelf ? '3px solid #f0c040' : 'none',
                            }}
                        >
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background:
                                        p.status === 'ONLINE' ? '#4dff4d' : p.status === 'BATTLE' ? '#3b82f6' : '#777',
                                }}
                            />
                            <img
                                src={p.photo}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: `1px solid ${isSelf ? '#f0c040' : '#444'}`,
                                }}
                                alt=""
                            />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: isSelf ? '#f0c040' : '#ffffff' }}>
                                    {p.name} {isSelf && <span style={{ fontSize: '9px', fontWeight: 'normal', opacity: 0.65 }}>(Вы)</span>}
                                </div>
                                <div style={{ fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace' }}>ID: {p.id}</div>
                                <div
                                    style={{
                                        fontSize: '10px',
                                        color: p.status === 'ONLINE' || p.status === 'BATTLE' ? '#4dff4d' : '#888888',
                                    }}
                                >
                                    {p.status === 'ONLINE'
                                        ? 'В сети'
                                        : p.status === 'BATTLE'
                                          ? 'В бою ⚔️'
                                          : p.status === 'BANNED'
                                            ? 'Забанен'
                                            : `Был(а) в сети: ${p.lastSeenTime}`}
                                </div>
                            </div>
                            {p.reports > 0 && (
                                <div
                                    style={{
                                        background: '#ff4d4d',
                                        color: '#fff',
                                        fontSize: '8px',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
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
