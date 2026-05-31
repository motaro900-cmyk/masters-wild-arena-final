import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import {
    contentGrid,
    Section,
    editRow,
    statLabel,
    inputStyle,
    applyBtn,
    smallBtnStyle,
    bigBtnStyle,
    btnStyle,
    ToggleRow,
} from './AdminShared';

export const AdminPlayersTab: React.FC = () => {
    const gold = useGameStore((state) => state.gold);
    const crystals = useGameStore((state) => state.crystals);
    const level = useGameStore((state) => state.level);
    const talentPoints = useGameStore((state) => state.talentPoints);
    const activeScreen = useGameStore((state) => state.activeScreen);
    const hasInfiniteEnergy = useGameStore((state) => state.hasInfiniteEnergy);

    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ (ИГРОК) ---
    const [customGold, setCustomGold] = useState(String(gold));
    const [customCrystals, setCustomCrystals] = useState(String(crystals));
    const [customLevel, setCustomLevel] = useState(String(level));
    const [customPoints, setCustomPoints] = useState(String(talentPoints));
    const [selectedItemId, setSelectedItemId] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setCustomGold(String(gold));
            setCustomCrystals(String(crystals));
            setCustomLevel(String(level));
            setCustomPoints(String(talentPoints));
        }, 0);
        return () => clearTimeout(timer);
    }, [gold, crystals, level, talentPoints]);

    return (
        <div style={contentGrid}>
            <Section title="РЕДАКТОР РЕСУРСОВ (Direct Input)">
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <div style={statLabel}>ЗОЛОТО</div>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customGold}
                            onChange={(e) => setCustomGold(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().setGold(Number(customGold));
                        }}
                        style={applyBtn}
                    >
                        OK
                    </button>
                </div>
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <div style={statLabel}>КРИСТАЛЛЫ</div>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customCrystals}
                            onChange={(e) => setCustomCrystals(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().setCrystals(Number(customCrystals));
                        }}
                        style={applyBtn}
                    >
                        OK
                    </button>
                </div>
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <div style={statLabel}>УРОВЕНЬ</div>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customLevel}
                            onChange={(e) => setCustomLevel(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().setLevel(Number(customLevel));
                        }}
                        style={applyBtn}
                    >
                        OK
                    </button>
                </div>
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <div style={statLabel}>ТАЛАНТЫ</div>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customPoints}
                            onChange={(e) => setCustomPoints(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().setTalentPoints(Number(customPoints));
                        }}
                        style={applyBtn}
                    >
                        OK
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().addExp(level * 600);
                        }}
                        style={{ ...smallBtnStyle, flex: 1 }}
                    >
                        LVL UP (+1)
                    </button>
                    <button
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            useGameStore.getState().setLevel(level + 10);
                        }}
                        style={{ ...smallBtnStyle, flex: 1, color: '#f0c040' }}
                    >
                        LVL +10
                    </button>
                </div>
            </Section>
            <Section title="ИНВЕНТАРЬ & ТЕЛЕПОРТ">
                <div style={statLabel}>ГЕНЕРАТОР ПРЕДМЕТОВ</div>
                <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} style={inputStyle}>
                    <option value="">Выбрать предмет...</option>
                    {Object.keys(ITEMS_DATABASE).map((id) => (
                        <option key={id} value={id}>
                            {id}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        if (selectedItemId)
                            useGameStore.getState().addItemToInventory({ id: selectedItemId, level: 1 });
                    }}
                    style={{ ...bigBtnStyle, marginTop: '10px' }}
                >
                    ДОБАВИТЬ В ИНВЕНТАРЬ
                </button>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        useGameStore.getState().addItemToInventory({ id: 'season_chest', level: 1, amount: 1 });
                    }}
                    style={{
                        ...bigBtnStyle,
                        marginTop: '5px',
                        background: '#d4af37',
                        color: '#000',
                        fontWeight: 'bold',
                    }}
                >
                    🎁 ДОБАВИТЬ СУНДУК СЕЗОНА
                </button>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        if (confirm('Очистить инвентарь?')) useGameStore.getState().clearInventory();
                    }}
                    style={{ ...bigBtnStyle, marginTop: '5px', background: '#301010', color: '#ff4d4d' }}
                >
                    WIPE INVENTORY
                </button>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        Object.keys(ITEMS_DATABASE).forEach((id) =>
                            useGameStore.getState().addItemToInventory({ id, level: 1 }),
                        );
                        alert('ВЕСЬ АРСЕНАЛ ВЫДАН!');
                    }}
                    style={{ ...bigBtnStyle, marginTop: '5px', background: '#1a1a2e', color: '#8888ff' }}
                >
                    ВЫДАТЬ ВЕСЬ АРСЕНАЛ (Unlock All)
                </button>

                <div style={{ marginTop: '20px' }}>
                    <div style={statLabel}>МГНОВЕННЫЙ ПЕРЕХОД (Screens)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                        {['MAP', 'BOSS', 'ARENA', 'SHOP', 'HEROES', 'CLAN'].map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    useGameStore.getState().setScreen(s);
                                }}
                                style={{
                                    ...btnStyle,
                                    background: activeScreen === s ? '#222' : '#111',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        useGameStore.getState().setGold(999999);
                        useGameStore.getState().setCrystals(99999);
                        useGameStore.getState().setLevel(100);
                        useGameStore.getState().setTalentPoints(500);
                    }}
                    style={{ ...bigBtnStyle, marginTop: '20px', background: '#1b4332', color: '#4dff4d' }}
                >
                    БОЖЕСТВЕННЫЙ СТАРТ (Full Max Out)
                </button>
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        if (confirm('ВЫПОЛНИТЬ ПОЛНЫЙ СБРОС ИГРОВОГО ПРОГРЕССА?'))
                            useGameStore.getState().resetAllProgress();
                    }}
                    style={{ ...bigBtnStyle, marginTop: '10px', background: '#431b1b', color: '#ff4d4d' }}
                >
                    СБРОСИТЬ ВЕСЬ ПРОГРЕСС (Wipe Progress)
                </button>
                <ToggleRow
                    label="БЕСКОНЕЧНАЯ ЭНЕРГИЯ"
                    active={hasInfiniteEnergy}
                    onToggle={() => {
                        const action = useGameStore.getState().setHasInfiniteEnergy;
                        if (action) action(!hasInfiniteEnergy);
                    }}
                />
            </Section>
        </div>
    );
};
