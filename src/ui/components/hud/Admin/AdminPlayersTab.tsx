import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';
import { syncService } from '../../../../services/SyncService';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { getRankInfo } from '../../../../configs/RankSystem';
import { ServerPlayersList } from './components/ServerPlayersList';
import { AdminSpectatorModal } from './AdminSpectatorModal';
import {
    RealPlayer,
    Section,
    editRow,
    inputStyle,
    applyBtn,
    smallBtnStyle,
    bigBtnStyle,
    btnStyle,
    ToggleRow,
    statLabel,
    statBox,
} from './AdminShared';

// ─── Local style helpers ───────────────────────────────────────────────────────
const hint = (text: string) => (
    <div
        style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.28)',
            lineHeight: 1.5,
            marginTop: '-8px',
            marginBottom: '10px',
            paddingLeft: '2px',
        }}
    >
        {text}
    </div>
);

const subTitle = (text: React.ReactNode) => (
    <div
        style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 900,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '6px',
            marginTop: '4px',
            borderLeft: '2px solid rgba(255,255,255,0.15)',
            paddingLeft: '7px',
        }}
    >
        {text}
    </div>
);

const Divider = () => (
    <div
        style={{
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
            margin: '14px 0',
        }}
    />
);

const RankBadge = ({ name, rating }: { name: string; rating: number }) => (
    <div
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(240,192,64,0.10)',
            border: '1px solid rgba(240,192,64,0.35)',
            borderRadius: '8px',
            padding: '6px 14px',
            color: '#f0c040',
            fontWeight: 900,
            fontSize: '12px',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            width: '100%',
        }}
    >
        <img src={AssetsMap.UI.TROPHY_PREMIUM} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="trophy" />
        <span style={{ flex: 1 }}>
            Текущий ранг: <strong>{name}</strong>
        </span>
        <span style={{ opacity: 0.65 }}>{rating} куб.</span>
    </div>
);

const TrophyBtn = ({ label, onClick, positive }: { label: string; onClick: () => void; positive: boolean }) => (
    <button
        onClick={onClick}
        style={{
            flex: '1 1 auto',
            padding: '8px 6px',
            borderRadius: '7px',
            background: positive ? 'rgba(74,222,128,0.09)' : 'rgba(248,113,113,0.09)',
            border: `1.5px solid ${positive ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
            color: positive ? '#4ade80' : '#f87171',
            fontWeight: 900,
            fontSize: '11px',
            cursor: 'pointer',
            minWidth: '54px',
            textAlign: 'center' as const,
            letterSpacing: '0.3px',
        }}
    >
        {label}
    </button>
);

const BigApplyBtn = ({ onClick, flash }: { onClick: () => void; flash: boolean }) => (
    <button
        onClick={onClick}
        title="Применяет сразу все четыре поля выше — золото, алмазы, уровень и таланты"
        style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: '8px',
            background: flash
                ? 'linear-gradient(135deg,#0d4a1e 0%,#093314 100%)'
                : 'linear-gradient(135deg,#1a6b2e 0%,#0d4a1e 100%)',
            border: `1.5px solid ${flash ? '#2ecc71' : 'rgba(46,204,113,0.5)'}`,
            color: '#2ecc71',
            fontWeight: 900,
            fontSize: '13px',
            letterSpacing: '1.5px',
            cursor: 'pointer',
            marginTop: '8px',
            boxShadow: flash ? '0 0 22px rgba(46,204,113,0.55)' : '0 4px 18px rgba(46,204,113,0.15)',
            transition: 'all 0.2s',
        }}
    >
        ✅ ПРИМЕНИТЬ ВСЁ СРАЗУ
    </button>
);

const addItemToInventoryList = (inventory: any[], item: any) => {
    const itemObj = typeof item === 'string' ? { id: item } : item;
    const itemId = String(itemObj.id);
    const itemConfig = ITEMS_DATABASE[itemId];
    if (!itemConfig) return inventory;

    const list = [...inventory];
    if (itemConfig.mainTab === 'ALCHEMY') {
        const existingIdx = list.findIndex((i: any) => String(i?.id) === itemId);
        if (existingIdx > -1) {
            list[existingIdx] = {
                ...list[existingIdx],
                amount: (list[existingIdx].amount || 1) + (itemObj.amount || 1),
            };
            return list;
        }
    }

    const newItem = {
        ...itemObj,
        id: itemId,
        type: (itemConfig as any).subTab || (itemConfig as any).type || itemObj.type || 'WEAPONS',
        rarity: itemConfig.rarity || itemObj.rarity || 'COMMON',
        level: itemObj.level || 1,
        amount: itemObj.amount || 1,
        instanceId: itemObj.instanceId || `${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    list.push(newItem);
    return list;
};

interface AdminPlayersTabProps {
    selectedPlayerId: string | null;
    onSelectPlayer: (id: string | null) => void;
    realPlayers: RealPlayer[];
    isLoadingPlayers: boolean;
    refreshPlayers: () => void;
    setMailRecipient: (id: string) => void;
    setActiveTab: (tab: any) => void;
}

export const AdminPlayersTab: React.FC<AdminPlayersTabProps> = ({
    selectedPlayerId,
    onSelectPlayer,
    realPlayers,
    isLoadingPlayers,
    refreshPlayers,
    setMailRecipient,
    setActiveTab,
}) => {
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

    // Selected player state resolution
    const getSelectedPlayerObj = (): RealPlayer | undefined => {
        if (!selectedPlayerId) return undefined;
        if (selectedPlayerId === localPlayerId) {
            return {
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
        }
        return realPlayers.find((p) => p.id === selectedPlayerId);
    };

    const selectedPlayer = getSelectedPlayerObj();

    // Editor field states
    const [customGold, setCustomGold] = useState('');
    const [customCrystals, setCustomCrystals] = useState('');
    const [customLevel, setCustomLevel] = useState('');
    const [customPoints, setCustomPoints] = useState('');
    const [customRating, setCustomRating] = useState('');
    const [trophyDelta, setTrophyDelta] = useState('100');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [batchFlash, setBatchFlash] = useState(false);

    // Moderation fields
    const [banDuration, setBanDuration] = useState('24h');
    const [muteDuration, setMuteDuration] = useState('1h');
    const [modReason, setModReason] = useState('');
    const [isSpectating, setIsSpectating] = useState(false);

    // Sync input fields when player changes
    useEffect(() => {
        if (selectedPlayer) {
            setCustomGold(String(selectedPlayer.gold));
            setCustomCrystals(String(selectedPlayer.crystals));
            setCustomLevel(String(selectedPlayer.level));
            setCustomPoints(String(selectedPlayer.talentPoints || 0));
            setCustomRating(String(selectedPlayer.rating || 0));
        }
    }, [
        selectedPlayerId,
        selectedPlayer?.gold,
        selectedPlayer?.crystals,
        selectedPlayer?.level,
        selectedPlayer?.talentPoints,
        selectedPlayer?.rating,
    ]);

    const sfx = () => audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

    // Universal state updater
    const handleUpdate = async (fields: any) => {
        if (!selectedPlayerId) return;
        sfx();
        try {
            // 1. If self, update local Zustand state so UI reactive binding updates instantly
            if (selectedPlayerId === localPlayerId) {
                const store = useGameStore.getState();

                if (fields.gold !== undefined) store.setGold(Number(fields.gold));
                if (fields.crystals !== undefined) store.setCrystals(Number(fields.crystals));
                if (fields.level !== undefined) store.setLevel(Number(fields.level));
                if (fields.talentPoints !== undefined) store.setTalentPoints(Number(fields.talentPoints));
                if (fields.rating !== undefined) store.setRating(Number(fields.rating));
                if (fields.hasInfiniteEnergy !== undefined) store.setHasInfiniteEnergy(!!fields.hasInfiniteEnergy);
                if (fields.inventory !== undefined) {
                    useGameStore.setState({ inventory: fields.inventory, isSystemUpdate: true });
                }
                if (fields.activeScreen !== undefined) {
                    store.setScreen(fields.activeScreen);
                }
            }

            // 2. Synchronize remotely to Firestore
            await syncService.updateRemotePlayerData(selectedPlayerId, fields);
            useGameStore.getState().showAlert('Изменения успешно применены! ✅');
            refreshPlayers();
        } catch (err) {
            console.error('[AdminPlayersTab] Update failed:', err);
            useGameStore.getState().showAlert('Не удалось сохранить изменения ❌');
        }
    };

    const applyAll = () => {
        handleUpdate({
            gold: Number(customGold),
            crystals: Number(customCrystals),
            level: Number(customLevel),
            talentPoints: Number(customPoints),
        });
        setBatchFlash(true);
        setTimeout(() => setBatchFlash(false), 600);
    };

    const RANK_PRESETS = [
        { label: 'Новобранец', value: 0 },
        { label: 'Воин', value: 400 },
        { label: 'Ветеран', value: 1000 },
        { label: 'Мастер', value: 2000 },
        { label: 'Герой', value: 3000 },
        { label: 'Легенда', value: 5000 },
    ];

    const rating = selectedPlayer?.rating || 0;
    const rankInfo = getRankInfo(rating);

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                gap: '20px',
                height: 'auto',
                minHeight: '680px',
            }}
        >
            {/* Левая колонка — Список игроков */}
            <ServerPlayersList
                realPlayers={realPlayers}
                isLoadingPlayers={isLoadingPlayers}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={onSelectPlayer}
                onRefresh={refreshPlayers}
            />

            {/* Правая колонка — Универсальная панель управления */}
            <div
                className="h-auto lg:h-[700px] lg:overflow-y-auto"
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                {selectedPlayer ? (
                    <>
                        {/* 1. ШАПКА ПРОФИЛЯ */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                            <img
                                src={selectedPlayer.photo}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '10px',
                                    border: `2px solid ${selectedPlayer.id === localPlayerId ? '#f0c040' : '#222'}`,
                                }}
                                alt=""
                            />
                            <div style={{ flex: 1 }}>
                                <h2
                                    style={{
                                        margin: 0,
                                        color: selectedPlayer.id === localPlayerId ? '#f0c040' : '#ffffff',
                                        fontSize: '24px',
                                    }}
                                >
                                    {selectedPlayer.name}{' '}
                                    {selectedPlayer.id === localPlayerId && (
                                        <span style={{ fontSize: '12px', color: '#ff4d4d' }}>(Я)</span>
                                    )}
                                </h2>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: '#666',
                                        fontFamily: 'monospace',
                                        marginTop: '4px',
                                    }}
                                >
                                    ID: {selectedPlayer.id} | VK ID: {selectedPlayer.vkId || 'Нет'}
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
                                                fontWeight: 'bold',
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
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        СМОТРЕТЬ БОЙ 👁️
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '20px',
                            }}
                        >
                            {/* СТОЛБЕЦ A: РЕДАКТОР РЕСУРСОВ */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <Section
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img
                                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                                alt=""
                                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                            />
                                            <span>Баланс и Ресурсы</span>
                                        </div>
                                    }
                                >
                                    {subTitle(
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <img
                                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                                alt=""
                                                style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                                            />
                                            <span>Золото</span>
                                        </div>
                                    )}
                                    {hint('Тратится на снаряжение и клановые постройки')}
                                    <div style={editRow}>
                                        <input
                                            type="number"
                                            style={inputStyle}
                                            value={customGold}
                                            onChange={(e) => setCustomGold(e.target.value)}
                                        />
                                        <button onClick={() => handleUpdate({ gold: customGold })} style={applyBtn}>
                                            ОК
                                        </button>
                                    </div>

                                    {subTitle(
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <img
                                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                                alt=""
                                                style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                                            />
                                            <span>Алмазы</span>
                                        </div>
                                    )}
                                    {hint('Премиум-валюта магазина')}
                                    <div style={editRow}>
                                        <input
                                            type="number"
                                            style={inputStyle}
                                            value={customCrystals}
                                            onChange={(e) => setCustomCrystals(e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleUpdate({ crystals: customCrystals })}
                                            style={applyBtn}
                                        >
                                            ОК
                                        </button>
                                    </div>

                                    {subTitle(
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <img src={AssetsMap.UI.ICON_XP} style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="xp" />
                                            Уровень игрока
                                        </span>
                                    )}
                                    <div style={editRow}>
                                        <input
                                            type="number"
                                            style={inputStyle}
                                            value={customLevel}
                                            onChange={(e) => setCustomLevel(e.target.value)}
                                        />
                                        <button onClick={() => handleUpdate({ level: customLevel })} style={applyBtn}>
                                            ОК
                                        </button>
                                    </div>

                                    {subTitle('🎯 Очки талантов')}
                                    <div style={editRow}>
                                        <input
                                            type="number"
                                            style={inputStyle}
                                            value={customPoints}
                                            onChange={(e) => setCustomPoints(e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleUpdate({ talentPoints: customPoints })}
                                            style={applyBtn}
                                        >
                                            ОК
                                        </button>
                                    </div>

                                    <BigApplyBtn onClick={applyAll} flash={batchFlash} />

                                    <Divider />

                                    {subTitle(
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <img src={AssetsMap.UI.ICON_ENERGY_FULL} style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="energy" />
                                            Быстрый левел-ап
                                        </span>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleUpdate({ level: selectedPlayer.level + 1 })}
                                            style={{ ...smallBtnStyle, flex: 1 }}
                                        >
                                            LVL +1
                                        </button>
                                        <button
                                            onClick={() => handleUpdate({ level: selectedPlayer.level + 10 })}
                                            style={{ ...smallBtnStyle, flex: 1, color: '#f0c040' }}
                                        >
                                            LVL +10
                                        </button>
                                    </div>
                                </Section>

                                <Section title={
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <img src={AssetsMap.UI.TROPHY_PREMIUM} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="trophy" />
                                        Арена и Ранг PvP
                                    </span>
                                }>
                                    <RankBadge name={rankInfo.name} rating={rating} />

                                    {subTitle('🎯 Точное число кубков')}
                                    <div style={editRow}>
                                        <input
                                            type="number"
                                            style={inputStyle}
                                            value={customRating}
                                            onChange={(e) => setCustomRating(e.target.value)}
                                        />
                                        <button onClick={() => handleUpdate({ rating: customRating })} style={applyBtn}>
                                            ОК
                                        </button>
                                    </div>

                                    <Divider />

                                    {subTitle('➕➖ Изменить на шаг')}
                                    <input
                                        type="number"
                                        style={{ ...inputStyle, marginBottom: '8px' }}
                                        value={trophyDelta}
                                        onChange={(e) => setTrophyDelta(e.target.value)}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                        <TrophyBtn
                                            label={`− ${trophyDelta}`}
                                            onClick={() =>
                                                handleUpdate({ rating: Math.max(0, rating - Number(trophyDelta)) })
                                            }
                                            positive={false}
                                        />
                                        <TrophyBtn
                                            label={`+ ${trophyDelta}`}
                                            onClick={() => handleUpdate({ rating: rating + Number(trophyDelta) })}
                                            positive
                                        />
                                    </div>

                                    {subTitle('🚀 Прыжки по пресетам')}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3,1fr)',
                                            gap: '6px',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        {RANK_PRESETS.map((preset) => (
                                            <button
                                                key={preset.label}
                                                onClick={() => handleUpdate({ rating: preset.value })}
                                                style={{
                                                    ...btnStyle,
                                                    fontSize: '9px',
                                                    padding: '6px 2px',
                                                    borderColor: rating >= preset.value ? '#f0c040' : '#222',
                                                    color: rating >= preset.value ? '#f0c040' : '#888',
                                                }}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleUpdate({ rating: 0 })}
                                        style={{
                                            ...bigBtnStyle,
                                            background: '#1c0808',
                                            color: '#f87171',
                                            border: '1px solid rgba(248,113,113,0.3)',
                                            fontSize: '11px',
                                            padding: '10px',
                                        }}
                                    >
                                        🔄 Обнулить рейтинг PvP
                                    </button>
                                </Section>
                            </div>

                            {/* СТОЛБЕЦ B: ИНВЕНТАРЬ И МОДЕРАЦИЯ */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <Section title="📦 Инвентарь и Предметы">
                                    {subTitle('Генератор предметов')}
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(e.target.value)}
                                        style={{ ...inputStyle, marginBottom: '8px' }}
                                    >
                                        <option value="">— Выбрать предмет —</option>
                                        {Object.keys(ITEMS_DATABASE).map((id) => (
                                            <option key={id} value={id}>
                                                {id}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            if (selectedItemId) {
                                                const updated = addItemToInventoryList(selectedPlayer.inventory, {
                                                    id: selectedItemId,
                                                    level: 1,
                                                });
                                                handleUpdate({ inventory: updated });
                                            }
                                        }}
                                        style={{
                                            ...bigBtnStyle,
                                            marginBottom: '6px',
                                            fontSize: '11px',
                                            padding: '10px 12px',
                                        }}
                                    >
                                        ➕ Добавить в инвентарь
                                    </button>

                                    <button
                                        onClick={() => {
                                            const updated = addItemToInventoryList(selectedPlayer.inventory, {
                                                id: 'season_chest',
                                                level: 1,
                                                amount: 1,
                                            });
                                            handleUpdate({ inventory: updated });
                                        }}
                                        style={{
                                            ...bigBtnStyle,
                                            marginBottom: '6px',
                                            background: '#d4af37',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            padding: '10px 12px',
                                        }}
                                    >
                                        🎁 Выдать сундук сезона
                                    </button>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        <button
                                            onClick={() => {
                                                useGameStore.getState().showConfirm('Очистить инвентарь?', () => {
                                                    handleUpdate({ inventory: [] });
                                                });
                                            }}
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: '#2a0808',
                                                color: '#ff6b6b',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            🗑️ Очистить
                                        </button>
                                        <button
                                            onClick={() => {
                                                const items = Object.keys(ITEMS_DATABASE).map((id) => ({
                                                    id,
                                                    level: 1,
                                                }));
                                                let updated = [...selectedPlayer.inventory];
                                                items.forEach((item) => {
                                                    updated = addItemToInventoryList(updated, item);
                                                });
                                                handleUpdate({ inventory: updated });
                                            }}
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: '#0d0d2e',
                                                color: '#9b9bff',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            🔓 Разблокировать всё
                                        </button>
                                    </div>
                                </Section>

                                <Section title="🛡️ Модерация и Санкции">
                                    <input
                                        type="text"
                                        placeholder="Укажите причину блокировки..."
                                        style={{ ...inputStyle, marginBottom: '10px' }}
                                        value={modReason}
                                        onChange={(e) => setModReason(e.target.value)}
                                    />

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '8px',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <select
                                                value={banDuration}
                                                onChange={(e) => setBanDuration(e.target.value)}
                                                style={{ ...inputStyle, padding: '8px' }}
                                            >
                                                <option value="1h">1 Час</option>
                                                <option value="24h">1 День</option>
                                                <option value="7d">7 Дней</option>
                                                <option value="perm">Перманент</option>
                                            </select>
                                            <button
                                                onClick={() =>
                                                    handleUpdate({
                                                        status: 'BANNED',
                                                        banReason: modReason,
                                                        banUntil: banDuration,
                                                    })
                                                }
                                                style={{
                                                    ...btnStyle,
                                                    background: '#431b1b',
                                                    color: '#ff4d4d',
                                                    padding: '0 10px',
                                                    fontSize: '11px',
                                                }}
                                            >
                                                БАН
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <select
                                                value={muteDuration}
                                                onChange={(e) => setMuteDuration(e.target.value)}
                                                style={{ ...inputStyle, padding: '8px' }}
                                            >
                                                <option value="1h">1 Час</option>
                                                <option value="24h">1 День</option>
                                            </select>
                                            <button
                                                onClick={() =>
                                                    handleUpdate({
                                                        isMuted: true,
                                                        muteReason: modReason,
                                                        muteUntil: muteDuration,
                                                    })
                                                }
                                                style={{ ...btnStyle, padding: '0 10px', fontSize: '11px' }}
                                            >
                                                МУТ
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                        <button
                                            onClick={() => {
                                                useGameStore
                                                    .getState()
                                                    .showConfirm(`Кикнуть игрока ${selectedPlayer.name}?`, () => {
                                                        handleUpdate({ status: 'KICKED' });
                                                    });
                                            }}
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: '#301010',
                                                color: '#fff',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            КИКНУТЬ
                                        </button>
                                        <button
                                            onClick={() => {
                                                useGameStore
                                                    .getState()
                                                    .showConfirm('Выполнить мягкий сброс сезона?', () => {
                                                        let newRating = 0;
                                                        if (rating >= 10500) newRating = 7500;
                                                        else if (rating >= 9000) newRating = 6000;
                                                        else if (rating >= 6000) newRating = 4500;
                                                        handleUpdate({ rating: newRating, trophies: newRating });
                                                    });
                                            }}
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: '#2d3748',
                                                color: '#fff',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            СБРОС СЕЗОНА
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => {
                                                useGameStore
                                                    .getState()
                                                    .showConfirm(
                                                        `СБРОСИТЬ ВЕСЬ ПРОГРЕСС ИГРОКА ${selectedPlayer.name}?`,
                                                        () => {
                                                            handleUpdate({
                                                                gold: 0,
                                                                crystals: 0,
                                                                level: 1,
                                                                rating: 0,
                                                                talentPoints: 0,
                                                                inventory: [],
                                                                equipment: {
                                                                    WEAPONS: null,
                                                                    HELMETS: null,
                                                                    ARMOR: null,
                                                                    SHIELDS: null,
                                                                    SHOULDERS: null,
                                                                    PANTS: null,
                                                                    BOOTS: null,
                                                                },
                                                                fullStateJSON: '',
                                                            });
                                                        },
                                                    );
                                            }}
                                            style={{
                                                ...btnStyle,
                                                flex: 1.5,
                                                background: '#601010',
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                fontSize: '10px',
                                                padding: '10px',
                                            }}
                                        >
                                            ПОЛНЫЙ ВАЙП 🔥
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
                                                fontSize: '10px',
                                                padding: '10px',
                                            }}
                                        >
                                            ПИСЬМО ✉️
                                        </button>
                                    </div>
                                </Section>

                                <Section title="🔧 Читы разработчика">
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <button
                                            onClick={() =>
                                                handleUpdate({
                                                    ownedSkins: [
                                                        'default',
                                                        'panda_frost',
                                                        'raccoon_default',
                                                        'skin_lava_golem',
                                                    ],
                                                })
                                            }
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                                borderColor: '#f59e0b',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            👑 Все скины
                                        </button>
                                        <button
                                            onClick={() => handleUpdate({ ownedHeroes: ['panda', 'raccoon'] })}
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                borderColor: '#10b981',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            👥 Все герои
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() =>
                                                handleUpdate({
                                                    gold: selectedPlayer.gold + 100000,
                                                    crystals: selectedPlayer.crystals + 5000,
                                                })
                                            }
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
                                                borderColor: '#eab308',
                                                fontSize: '10px',
                                                padding: '8px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' }}>
                                                <img
                                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                                    alt=""
                                                    style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                                                />
                                                <span>+100к,</span>
                                                <img
                                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                                    alt=""
                                                    style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                                                />
                                                <span>+5к</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleUpdate({ energy: 9999, maxEnergy: 9999 })}
                                            style={{
                                                ...btnStyle,
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                                borderColor: '#0ea5e9',
                                                fontSize: '10px',
                                                padding: '8px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <img src={AssetsMap.UI.ICON_ENERGY_FULL} style={{ width: '12px', height: '12px', objectFit: 'contain' }} alt="energy" />
                                            9999 энергии
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '12px' }}>
                                        <ToggleRow
                                            label="♾️ БЕСКОНЕЧНАЯ ЭНЕРГИЯ"
                                            active={selectedPlayer.hasInfiniteEnergy}
                                            onToggle={() =>
                                                handleUpdate({ hasInfiniteEnergy: !selectedPlayer.hasInfiniteEnergy })
                                            }
                                        />
                                    </div>
                                </Section>
                            </div>
                        </div>

                        {/* 2. ДЕТАЛИ И СПИСКИ ПРЕДМЕТОВ */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <Section title="🔎 Логи жалоб">
                                <div
                                    style={{
                                        background: '#050505',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        color: '#888',
                                        maxHeight: '100px',
                                        overflowY: 'auto',
                                    }}
                                >
                                    {selectedPlayer.reportLogs && selectedPlayer.reportLogs.length > 0
                                        ? selectedPlayer.reportLogs.map((log, i) => (
                                              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #111' }}>
                                                  • {log}
                                              </div>
                                          ))
                                        : 'История жалоб пуста'}
                                </div>
                            </Section>

                            <Section title="📱 Метаданные устройства">
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2,1fr)',
                                        gap: '10px',
                                        fontSize: '11px',
                                    }}
                                >
                                    <div style={statBox}>
                                        <div style={statLabel}>Разрешение экрана</div>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                            🖥️ {selectedPlayer.screen}
                                        </span>
                                    </div>
                                    <div style={statBox}>
                                        <div style={statLabel}>Регистрация (Был в сети)</div>
                                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '10px' }}>
                                            🕒 {selectedPlayer.regDate}
                                        </span>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    </>
                ) : (
                    <div style={{ color: '#888', textAlign: 'center', marginTop: '140px', fontSize: '14px' }}>
                        Выберите игрока в списке слева для детального управления балансом, инвентарем, читами и
                        санкциями
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
