import React, { useState, useEffect } from 'react';
import { syncService } from '../../../../services/SyncService';
import { useGameStore } from '../../../../store/useGameStore';
import { RealPlayer, Section, inputStyle, applyBtn, statLabel, editRow } from './AdminShared';
import { AdminSpectatorModal } from './AdminSpectatorModal';
import { ServerPlayersList } from './components/ServerPlayersList';
import { PlayerInspector } from './components/PlayerInspector';
import { DevCheatsPanel } from './components/DevCheatsPanel';
import { PlayerModerationPanel } from './components/PlayerModerationPanel';

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
    const [isSpectating, setIsSpectating] = useState(false);

    // --- Быстрое редактирование параметров (стейты остаются здесь — зависят от selectedPlayer) ---
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
            useGameStore.getState().showAlert(`Успешно: ${field} установлено на ${value}`);
            refreshPlayers();
        } catch (e) {
            console.error('Remote update error:', e);
            useGameStore.getState().showAlert('Ошибка при обновлении данных');
        }
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
                height: 'auto',
                minHeight: '600px',
            }}
        >
            {/* Левая колонка — список игроков */}
            <ServerPlayersList
                realPlayers={realPlayers}
                isLoadingPlayers={isLoadingPlayers}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={setSelectedPlayerId}
                onRefresh={refreshPlayers}
            />

            {/* Правая колонка — детали выбранного игрока */}
            <div
                className="h-auto lg:h-full lg:overflow-y-auto"
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '20px',
                }}
            >
                {selectedPlayer ? (
                    <>
                        {/* Шапка профиля */}
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
                                        onClick={() => setIsSpectating(true)}
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

                        {/* Инспектор ресурсов, инвентаря, gear dump */}
                        <PlayerInspector selectedPlayer={selectedPlayer} />

                        {/* Быстрое редактирование параметров */}
                        <Section title="БЫСТРОЕ РЕДАКТИРОВАНИЕ ПАРАМЕТРОВ">
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
                                <button onClick={() => handleRemoteUpdate('gold', serverPlayerGold)} style={applyBtn}>
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
                                    onClick={() => handleRemoteUpdate('crystals', serverPlayerCrystals)}
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
                                <button onClick={() => handleRemoteUpdate('level', serverPlayerLevel)} style={applyBtn}>
                                    SET
                                </button>
                            </div>
                        </Section>

                        {/* Чит-хелперы разработчика */}
                        <DevCheatsPanel selectedPlayer={selectedPlayer} onRefresh={refreshPlayers} />

                        {/* Модерация и логи жалоб */}
                        <PlayerModerationPanel
                            selectedPlayer={selectedPlayer}
                            onRefresh={refreshPlayers}
                            onSendMail={() => {
                                setMailRecipient(selectedPlayer.id);
                                setActiveTab('ПОЧТА');
                            }}
                        />
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div
                            style={{
                                color: '#888',
                                textAlign: 'center',
                                marginTop: '40px',
                                marginBottom: '20px',
                                fontSize: '14px',
                            }}
                        >
                            Выберите игрока в списке слева для детального управления ресурсами и банами
                        </div>

                        <Section title="ГЛОБАЛЬНЫЕ ДЕЙСТВИЯ СЕРВЕРА">
                            <div
                                style={{
                                    padding: '18px',
                                    background: 'rgba(240, 192, 64, 0.03)',
                                    border: '1px solid rgba(240, 192, 64, 0.15)',
                                    borderRadius: '10px',
                                    marginBottom: '15px',
                                }}
                            >
                                <h3
                                    style={{ margin: '0 0 8px 0', color: '#FFE07D', fontSize: '14px', fontWeight: 800 }}
                                >
                                    🏆 РАСПРЕДЕЛЕНИЕ НАГРАД СЕЗОНА I
                                </h3>
                                <p
                                    style={{
                                        margin: '0 0 15px 0',
                                        color: '#a1a1aa',
                                        fontSize: '12px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Начислит награды за Сезон I (кристаллы, золото, сундуки) в почтовые ящики топ-100
                                    игрокам из глобальной таблицы лидеров. Дев-аккаунты и тестеры будут автоматически
                                    отфильтрованы.
                                </p>

                                <button
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        btn.disabled = true;
                                        const originalText = btn.innerText;
                                        btn.innerText = 'РАСПРЕДЕЛЕНИЕ... ⏳';
                                        try {
                                            const count = await syncService.distributeSeasonRewards();
                                            useGameStore
                                                .getState()
                                                .showAlert(`Успешно распределено наград: ${count} игрокам!`);
                                        } catch (err) {
                                            console.error(err);
                                            useGameStore.getState().showAlert('Ошибка при распределении наград');
                                        } finally {
                                            btn.disabled = false;
                                            btn.innerText = originalText;
                                        }
                                    }}
                                    style={{
                                        ...applyBtn,
                                        width: '100%',
                                        background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        padding: '12px',
                                        fontSize: '13px',
                                        border: '1px solid #fcd34d',
                                        cursor: 'pointer',
                                    }}
                                >
                                    РАСПРЕДЕЛИТЬ НАГРАДЫ ТОП-100 ИГРОКАМ
                                </button>
                            </div>
                        </Section>
                    </div>
                )}
            </div>

            {isSpectating && selectedPlayer && (
                <AdminSpectatorModal
                    playerId={selectedPlayer.id}
                    playerName={selectedPlayer.name}
                    onClose={() => setIsSpectating(false)}
                />
            )}
        </div>
    );
};
