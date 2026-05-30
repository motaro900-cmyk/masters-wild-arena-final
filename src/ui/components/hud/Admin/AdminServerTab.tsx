import React, { useState, useEffect } from 'react';
import { syncService } from '../../../../services/SyncService';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import {
    RealPlayer,
    Section,
    inputStyle,
    smallBtnStyle,
    applyBtn,
    btnStyle,
    statBox,
    statLabel,
    editRow,
} from './AdminShared';

interface AdminServerTabProps {
    realPlayers: RealPlayer[];
    isLoadingPlayers: boolean;
    refreshPlayers: () => void;
    selectedPlayerId: string | null;
    setSelectedPlayerId: (id: string | null) => void;
    setMailRecipient: (id: string) => void;
    setActiveTab: (tab: any) => void;
}

export const AdminServerTab: React.FC<AdminServerTabProps> = ({
    realPlayers,
    isLoadingPlayers,
    refreshPlayers,
    selectedPlayerId,
    setSelectedPlayerId,
    setMailRecipient,
    setActiveTab,
}) => {
    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (СЕРВЕР) ---
    const [searchQuery, setSearchQuery] = useState('');
    const [banDuration, setBanDuration] = useState('24h');
    const [muteDuration, setMuteDuration] = useState('1h');
    const [modReason, setModReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'BANNED'>('ALL');
    const [filterType, setFilterType] = useState<'VK_REAL' | 'VK_TEST' | 'GUEST' | 'ALL'>('VK_REAL');

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (СЕРВЕР - ПРАВКА ИГРОКА) ---
    const [serverPlayerGold, setServerPlayerGold] = useState('');
    const [serverPlayerCrystals, setServerPlayerCrystals] = useState('');
    const [serverPlayerLevel, setServerPlayerLevel] = useState('');

    const selectedPlayer = realPlayers.find((p) => p.id === selectedPlayerId);

    useEffect(() => {
        if (selectedPlayer) {
            const timer = setTimeout(() => {
                setServerPlayerGold(String(selectedPlayer.gold));
                setServerPlayerCrystals(String(selectedPlayer.crystals));
                setServerPlayerLevel(String(selectedPlayer.level));
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [selectedPlayerId, selectedPlayer]);

    const handleRemoteUpdate = async (field: string, value: any) => {
        if (!selectedPlayer) return;
        try {
            const updateData = { [field]: Number(value) };
            await syncService.updateRemotePlayerData(selectedPlayer.id, updateData);
            alert(`Успешно: ${field} установлено на ${value}`);
            refreshPlayers();
        } catch (e) {
            console.error('Remote update error:', e);
            alert('Ошибка при обновлении данных');
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', height: '700px' }}>
            <div
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
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
                            onClick={refreshPlayers}
                            style={{ ...applyBtn, padding: '0 10px' }}
                            disabled={isLoadingPlayers}
                        >
                            {isLoadingPlayers ? '...' : '🔄'}
                        </button>
                    </div>
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

                    <div style={{ fontSize: '9px', color: '#555', marginTop: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Тип аккаунтов</div>
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
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {realPlayers
                        .filter((p) => {
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
                        })
                        .map((p) => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPlayerId(p.id)}
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
                                                  : '#555',
                                    }}
                                />
                                <img
                                    src={p.photo}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: '1px solid #333',
                                    }}
                                    alt=""
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{p.name}</div>
                                    <div style={{ fontSize: '8px', color: '#444' }}>ID: {p.id}</div>
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
            <div
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '20px',
                    overflowY: 'auto',
                }}
            >
                {selectedPlayer ? (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'center',
                                marginBottom: '20px',
                            }}
                        >
                            <img
                                src={selectedPlayer.photo}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '10px',
                                    border: '2px solid #222',
                                }}
                                alt=""
                            />
                            <div style={{ flex: 1 }}>
                                <h2 style={{ margin: 0, color: '#f0c040', fontSize: '24px' }}>{selectedPlayer.name}</h2>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    VK ID: {selectedPlayer.vkId} | Регистрация: {selectedPlayer.regDate}
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                    {selectedPlayer.vkId > 0 && (
                                        <a
                                            href={`https://vk.com/id${selectedPlayer.vkId}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                fontSize: '11px',
                                                color: '#3b82f6',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            ПРОФИЛЬ ВК 🔗
                                        </a>
                                    )}
                                    <button
                                        onClick={() => alert('SPECTATING')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#60a5fa',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        СМОТРЕТЬ БОЙ 👁️
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Section title="ИНСПЕКТОР СТАТИСТИКИ">
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '10px',
                                }}
                            >
                                <div style={statBox}>
                                    <div style={statLabel}>GOLD</div>
                                    {selectedPlayer.gold}
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>GEMS</div>
                                    {selectedPlayer.crystals}
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>LVL</div>
                                    {selectedPlayer.level}
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>GOLD</div>
                                    <span style={{ color: '#ffd700', fontWeight: 'bold' }}>💰 {selectedPlayer.gold.toLocaleString()}</span>
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>GEMS</div>
                                    <span style={{ color: '#00ffff', fontWeight: 'bold' }}>💎 {selectedPlayer.crystals.toLocaleString()}</span>
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>LVL</div>
                                    <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>🌟 {selectedPlayer.level}</span>
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>REPORTS</div>
                                    <span style={{ color: selectedPlayer.reports > 0 ? '#ff4d4d' : '#888', fontWeight: 'bold' }}>
                                        🚨 {selectedPlayer.reports}
                                    </span>
                                </div>
                            </div>
                        </Section>

                        <Section title="БЫСТРОЕ РЕДАКТИРОВАНИЕ ПАРАМЕТРОВ (Modify Selected Player)">
                            <div style={editRow}>
                                <div style={{ flex: 1 }}>
                                    <div style={statLabel}>УСТАНОВИТЬ ЗОЛОТО</div>
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        value={serverPlayerGold}
                                        onChange={(e) => setServerPlayerGold(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => handleRemoteUpdate('золото', serverPlayerGold)} style={applyBtn}>
                                    SET
                                </button>
                            </div>
                            <div style={editRow}>
                                <div style={{ flex: 1 }}>
                                    <div style={statLabel}>УСТАНОВИТЬ КРИСТАЛЛЫ</div>
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        value={serverPlayerCrystals}
                                        onChange={(e) => setServerPlayerCrystals(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoteUpdate('кристаллы', serverPlayerCrystals)}
                                    style={applyBtn}
                                >
                                    SET
                                </button>
                            </div>
                            <div style={editRow}>
                                <div style={{ flex: 1 }}>
                                    <div style={statLabel}>УСТАНОВИТЬ УРОВЕНЬ</div>
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        value={serverPlayerLevel}
                                        onChange={(e) => setServerPlayerLevel(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => handleRemoteUpdate('уровень', serverPlayerLevel)} style={applyBtn}>
                                    SET
                                </button>
                            </div>
                        </Section>

                        <Section title="ПАНЕЛЬ БЫСТРЫХ ЧИТОВ / ХЕЛПЕРЫ РАЗРАБОТЧИКА">
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '10px',
                                    marginBottom: '15px',
                                }}
                            >
                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        try {
                                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                ownedSkins: ['default', 'panda_frost', 'raccoon_default', 'skin_lava_golem'],
                                            });
                                            alert('Все облики успешно открыты игроку!');
                                            refreshPlayers();
                                        } catch {
                                            alert('Ошибка при выдаче обликов');
                                        }
                                    }}
                                    style={{
                                        ...btnStyle,
                                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                        borderColor: '#f59e0b',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.2)';
                                    }}
                                >
                                    👑 ВЫДАТЬ ВСЕ СКИНЫ
                                </button>

                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        try {
                                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                ownedHeroes: ['panda', 'raccoon'],
                                            });
                                            alert('Все герои успешно разблокированы игроку!');
                                            refreshPlayers();
                                        } catch {
                                            alert('Ошибка при разблокировке героев');
                                        }
                                    }}
                                    style={{
                                        ...btnStyle,
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        borderColor: '#10b981',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
                                    }}
                                >
                                    👥 ОТКРЫТЬ ВСЕХ ГЕРОЕВ
                                </button>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                }}
                            >
                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        try {
                                            const newGold = selectedPlayer.gold + 100000;
                                            const newCrystals = selectedPlayer.crystals + 5000;
                                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                золото: newGold,
                                                кристаллы: newCrystals,
                                            });
                                            alert('Ресурсный пак (+100к золота, +5к кристаллов) успешно начислен!');
                                            refreshPlayers();
                                        } catch {
                                            alert('Ошибка при начислении ресурсов');
                                        }
                                    }}
                                    style={{
                                        ...btnStyle,
                                        background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
                                        borderColor: '#eab308',
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 0 10px rgba(234, 179, 8, 0.15)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(234, 179, 8, 0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.15)';
                                    }}
                                >
                                    💰 +100к, 💎 +5к
                                </button>

                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        try {
                                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                energy: 9999,
                                                maxEnergy: 9999,
                                            });
                                            alert('Энергия игрока установлена на 9999/9999!');
                                            refreshPlayers();
                                        } catch {
                                            alert('Ошибка при установке энергии');
                                        }
                                    }}
                                    style={{
                                        ...btnStyle,
                                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                        borderColor: '#0ea5e9',
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 0 10px rgba(14, 165, 233, 0.15)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(14, 165, 233, 0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(14, 165, 233, 0.15)';
                                    }}
                                >
                                    ⚡ 9999 ЭНЕРГИИ
                                </button>

                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        try {
                                            await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                уровень: 100,
                                            });
                                            alert('Уровень игрока повышен до 100 LVL!');
                                            refreshPlayers();
                                        } catch {
                                            alert('Ошибка при повышении уровня');
                                        }
                                    }}
                                    style={{
                                        ...btnStyle,
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                        borderColor: '#8b5cf6',
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.15)';
                                    }}
                                >
                                    🌟 УРОВЕНЬ 100
                                </button>
                            </div>
                        </Section>

                        <Section title="ИНСПЕКТОР (Stats & Gear)">
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '10px',
                                    marginBottom: '15px',
                                }}
                            >
                                <div style={statBox}>
                                    <div style={statLabel}>GOLD</div>
                                    <span style={{ color: '#ffd700', fontWeight: 'bold' }}>💰 {selectedPlayer.gold.toLocaleString()}</span>
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>GEMS</div>
                                    <span style={{ color: '#00ffff', fontWeight: 'bold' }}>💎 {selectedPlayer.crystals.toLocaleString()}</span>
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>LVL</div>
                                    <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>🌟 {selectedPlayer.level}</span>
                                </div>
                                <div style={statBox}>
                                    <div style={statLabel}>LOCATION</div>
                                    <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>📍 {selectedPlayer.screen}</span>
                                </div>
                            </div>
                            <div style={statLabel}>GEAR DUMP:</div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    background: '#050505',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #111',
                                }}
                            >
                                {['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS'].map((slot) => (
                                    <div
                                        key={slot}
                                        style={{
                                            flex: 1,
                                            height: '50px',
                                            background: '#111',
                                            border: '1px solid #222',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            minWidth: '50px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '6px',
                                                color: '#444',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {slot}
                                        </div>
                                        <div style={{ fontSize: '8px', color: '#888', wordBreak: 'break-all' }}>
                                            {(selectedPlayer.gear as any)[slot] || 'EMPTY'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section title="КОНТЕКСТ ЖАЛОБ (Report Logs)">
                            <div
                                style={{
                                    background: '#050505',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    color: '#888',
                                    maxHeight: '80px',
                                    overflowY: 'auto',
                                }}
                            >
                                {selectedPlayer.reportLogs.length > 0
                                    ? selectedPlayer.reportLogs.map((log, i) => (
                                          <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #111' }}>
                                              • {log}
                                          </div>
                                      ))
                                    : 'История жалоб пуста'}
                            </div>
                        </Section>

                        <Section title="МОДЕРАЦИЯ">
                            <input
                                type="text"
                                placeholder="Укажите причину..."
                                style={{ ...inputStyle, marginBottom: '10px' }}
                                value={modReason}
                                onChange={(e) => setModReason(e.target.value)}
                            />
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    marginBottom: '10px',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <select
                                        value={banDuration}
                                        onChange={(e) => setBanDuration(e.target.value)}
                                        style={{ ...inputStyle, flex: 1 }}
                                    >
                                        <option value="1h">1 Час</option>
                                        <option value="24h">1 День</option>
                                        <option value="7d">7 Дней</option>
                                        <option value="perm">Перманент</option>
                                    </select>
                                    <button
                                        onClick={async () => {
                                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                            if (!selectedPlayer) return;
                                            try {
                                                await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                    status: 'BANNED',
                                                    banReason: modReason,
                                                    banUntil: banDuration,
                                                });
                                                alert(`Игрок ${selectedPlayer.name} ЗАБАНЕН`);
                                                refreshPlayers();
                                            } catch {
                                                alert('Ошибка при бане');
                                            }
                                        }}
                                        style={{
                                            ...btnStyle,
                                            background: '#431b1b',
                                            color: '#ff4d4d',
                                            padding: '0 15px',
                                        }}
                                    >
                                        БАН
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <select
                                        value={muteDuration}
                                        onChange={(e) => setMuteDuration(e.target.value)}
                                        style={{ ...inputStyle, flex: 1 }}
                                    >
                                        <option value="1h">1 Час</option>
                                        <option value="24h">1 День</option>
                                    </select>
                                    <button
                                        onClick={async () => {
                                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                            if (!selectedPlayer) return;
                                            try {
                                                await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                    isMuted: true,
                                                    muteReason: modReason,
                                                    muteUntil: muteDuration,
                                                });
                                                alert(`Игрок ${selectedPlayer.name} получил МУТ`);
                                                refreshPlayers();
                                            } catch {
                                                alert('Ошибка при муте');
                                            }
                                        }}
                                        style={{ ...btnStyle, padding: '0 15px' }}
                                    >
                                        МУТ
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        if (confirm(`Кикнуть игрока ${selectedPlayer.name}?`)) {
                                            try {
                                                await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                    status: 'KICKED',
                                                });
                                                alert('Игрок кикнут');
                                                refreshPlayers();
                                            } catch {
                                                alert('Ошибка при кике');
                                            }
                                        }
                                    }}
                                    style={{ ...btnStyle, flex: 1, background: '#301010', color: '#fff' }}
                                >
                                    КИКНУТЬ (Disconnect)
                                </button>
                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        if (confirm('Сбросить рейтинг игрока?')) {
                                            try {
                                                await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                    rating: 0,
                                                });
                                                alert('Рейтинг сброшен');
                                                refreshPlayers();
                                            } catch {
                                                alert('Ошибка сброса');
                                            }
                                        }
                                    }}
                                    style={{ ...btnStyle, flex: 1 }}
                                >
                                    СБРОСИТЬ РЕЙТИНГ
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={async () => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        if (!selectedPlayer) return;
                                        if (confirm(`ВНИМАНИЕ: Выполнить полный вайп игрока ${selectedPlayer.name}?`)) {
                                            try {
                                                await syncService.updateRemotePlayerData(selectedPlayer.id, {
                                                    золото: 0,
                                                    кристаллы: 0,
                                                    уровень: 1,
                                                    рейтинг: 0,
                                                    инвентарь: [],
                                                    снаряжение: {
                                                        WEAPONS: null,
                                                        HELMETS: null,
                                                        ARMOR: null,
                                                        SHIELDS: null,
                                                        SHOULDERS: null,
                                                        PANTS: null,
                                                        BOOTS: null,
                                                    },
                                                    полноеСостояниеJSON: '',
                                                });
                                                alert('Аккаунт полностью очищен');
                                                refreshPlayers();
                                            } catch {
                                                alert('Ошибка при вайпе');
                                            }
                                        }
                                    }}
                                    style={{
                                        ...btnStyle,
                                        flex: 1.5,
                                        background: '#601010',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    ПОЛНЫЙ ВАЙП АККАУНТА 🔥
                                </button>
                                <button
                                    onClick={() => {
                                        setMailRecipient(selectedPlayer.id);
                                        setActiveTab('ПОЧТА');
                                    }}
                                    style={{
                                        ...btnStyle,
                                        flex: 1,
                                        background: '#1b4332',
                                        color: '#4dff4d',
                                    }}
                                >
                                    ОТПРАВИТЬ ПИСЬМО ✉️
                                </button>
                            </div>
                        </Section>
                    </>
                ) : (
                    <div style={{ color: '#222', textAlign: 'center', marginTop: '220px', fontSize: '14px' }}>
                        Выберите игрока в списке слева для управления
                    </div>
                )}
            </div>
        </div>
    );
};
