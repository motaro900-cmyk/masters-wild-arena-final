import { useState, useEffect } from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { syncService } from '../../../../services/SyncService';

export const useFriendsWindow = () => {
    const {
        uiTheme,
        friends,
        friendRequests,
        removeFriend,
        acceptFriendRequest,
        declineFriendRequest,
        sendGift,
        collectAllGifts,
        claimedSocialRewards,
        claimGroupReward,
        claimFavoriteReward,
        playerId,
        name,
        avatar,
        level,
    } = useGameStore();

    const isLight = uiTheme === 'LIGHT';

    const [activeTab, setActiveTab] = useState<'ALL' | 'ONLINE' | 'REQUESTS' | 'REWARDS' | 'WORLD'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundPlayer, setFoundPlayer] = useState<any | null>(null);
    const [worldPlayers, setWorldPlayers] = useState<any[]>([]);
    const [isLoadingWorld, setIsLoadingWorld] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 7;

    const totalPages = Math.ceil(worldPlayers.length / playersPerPage);
    const paginatedWorldPlayers = worldPlayers.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage);

    const fetchWorldPlayers = async () => {
        setIsLoadingWorld(true);
        try {
            // Запрашиваем 100 последних игроков, чтобы отфильтровать тех, кто реально в сети
            const players = await syncService.getGlobalPlayers(100);
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            const onlinePlayers = players.filter((p) => {
                const lastSeenVal = p.былВСети || p.lastSeen;
                if (!lastSeenVal) return false;
                // Преобразуем Firebase Timestamp в миллисекунды
                const lastSeenTime = lastSeenVal.toMillis ? lastSeenVal.toMillis() : lastSeenVal;
                return now - lastSeenTime < fiveMinutes;
            });

            setWorldPlayers(onlinePlayers);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingWorld(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'WORLD') {
            const timer = setTimeout(() => {
                fetchWorldPlayers();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setFoundPlayer(null);
        try {
            const player = await syncService.searchPlayerById(searchQuery);
            setFoundPlayer(player);
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setIsSearching(false);
        }
    };

    // Цветовая палитра темы
    const colors = {
        text: isLight ? '#4a3219' : '#e8d8a8',
        accent: isLight ? '#8b4513' : '#f0c040',
        cardBg: isLight ? 'rgba(0,0,0,0.05)' : 'linear-gradient(90deg, rgba(30,20,10,0.8), rgba(15,10,5,0.8))',
        border: isLight ? 'rgba(139,69,19,0.2)' : 'rgba(240,192,64,0.15)',
        inputBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)',
    };

    const filteredFriends = (activeTab === 'REQUESTS' ? friendRequests : friends).filter((f: any) => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.id.includes(searchQuery);
        if (activeTab === 'ONLINE') return matchesSearch && f.online;
        return matchesSearch;
    });

    const handleSendFriendRequest = async (targetPlayerId: string) => {
        const senderData = {
            id: playerId,
            name: name || 'Мастер',
            avatar: avatar,
            level: level,
        };
        const ok = await syncService.sendFriendRequest(targetPlayerId, senderData);
        return ok;
    };

    return {
        // States & Colors
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isSearching,
        foundPlayer,
        setFoundPlayer,
        worldPlayers,
        isLoadingWorld,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedWorldPlayers,
        colors,
        isLight,
        filteredFriends,
        friends,
        friendRequests,
        claimedSocialRewards,

        // Actions
        removeFriend,
        acceptFriendRequest,
        declineFriendRequest,
        sendGift,
        collectAllGifts,
        claimGroupReward,
        claimFavoriteReward,
        handleSearch,
        handleSendFriendRequest,
    };
};
