import React, { useState } from 'react';
import { RealPlayer, inputStyle, smallBtnStyle, applyBtn } from '../AdminShared';

interface ServerPlayersListProps {
    realPlayers: RealPlayer[];
    isLoadingPlayers: boolean;
    selectedPlayerId: string | null;
    onSelectPlayer: (id: string) => void;
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
    const [filterType, setFilterType] = useState<'VK_REAL' | 'VK_TEST' | 'GUEST' | 'ALL'>('VK_REAL');

    const filteredPlayers = realPlayers.filter((p) => {
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

    return (
        <div
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
                    <button
                        onClick={onRefresh}
                        style={{ ...applyBtn, padding: '0 10px' }}
                        disabled={isLoadingPlayers}
                    >
                        {isLoadingPlayers ? '...' : '🔄'}
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
                {filteredPlayers.map((p) => (
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
                        }}
                    >
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background:
                                    p.status === 'ONLINE'
                                        ? '#4dff4d'
                                        : p.status === 'BATTLE'
                                          ? '#3b82f6'
                                          : '#777',
                            }}
                        />
                        <img
                            src={p.photo}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid #444',
                            }}
                            alt=""
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                                {p.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#aaaaaa' }}>ID: {p.id}</div>
                            <div
                                style={{
                                    fontSize: '10px',
                                    color:
                                        p.status === 'ONLINE' || p.status === 'BATTLE' ? '#4dff4d' : '#888888',
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
                ))}
            </div>
        </div>
    );
};
