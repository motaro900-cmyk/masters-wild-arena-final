import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { getRankInfo } from '../../../../configs/RankSystem';
import {
    contentGrid,
    Section,
    editRow,
    inputStyle,
    applyBtn,
    smallBtnStyle,
    bigBtnStyle,
    btnStyle,
    ToggleRow,
} from './AdminShared';

// ─── Local style helpers ───────────────────────────────────────────────────────

/** Серая подсказка под блоком */
const hint = (text: string) => (
    <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.28)',
        lineHeight: 1.5,
        marginTop: '-8px',
        marginBottom: '10px',
        paddingLeft: '2px',
    }}>
        {text}
    </div>
);

/** Заголовок подсекции */
const subTitle = (text: string) => (
    <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.45)',
        fontWeight: 900,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        marginBottom: '6px',
        marginTop: '4px',
        borderLeft: '2px solid rgba(255,255,255,0.15)',
        paddingLeft: '7px',
    }}>
        {text}
    </div>
);

/** Горизонтальный разделитель */
const Divider = () => (
    <div style={{
        width: '100%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
        margin: '14px 0',
    }} />
);

/** Бейдж текущего ранга */
const RankBadge = ({ name, rating }: { name: string; rating: number }) => (
    <div style={{
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
    }}>
        <span>🏆</span>
        <span style={{ flex: 1 }}>Текущий ранг: <strong>{name}</strong></span>
        <span style={{ opacity: 0.65 }}>{rating} куб.</span>
    </div>
);

/** Кнопка быстрого изменения кубков */
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

/** Кнопка прыжка к рангу */
const RankJumpBtn = ({
    label, value, currentRating, onClick,
}: { label: string; value: number; currentRating: number; onClick: () => void }) => {
    const active = currentRating >= value;
    return (
        <button
            onClick={onClick}
            title={`Установить кубки = ${value}`}
            style={{
                ...btnStyle,
                background: active ? 'rgba(240,192,64,0.12)' : '#0d0d0d',
                border: active ? '1px solid rgba(240,192,64,0.35)' : '1px solid #1e1e1e',
                color: active ? '#f0c040' : 'rgba(255,255,255,0.45)',
                fontSize: '10px',
                padding: '8px 4px',
                textAlign: 'center' as const,
            }}
        >
            {label}
            <br />
            <span style={{ fontSize: '9px', opacity: 0.55 }}>{value} куб.</span>
        </button>
    );
};

/** Зелёная кнопка «Применить всё» */
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

// ─── Main Component ────────────────────────────────────────────────────────────
export const AdminPlayersTab: React.FC = () => {
    const gold         = useGameStore((s) => s.gold);
    const crystals     = useGameStore((s) => s.crystals);
    const level        = useGameStore((s) => s.level);
    const talentPoints = useGameStore((s) => s.talentPoints);
    const rating       = useGameStore((s) => s.rating);
    const activeScreen = useGameStore((s) => s.activeScreen);
    const hasInfiniteEnergy = useGameStore((s) => s.hasInfiniteEnergy);

    // Fields for batch editor
    const [customGold,     setCustomGold]     = useState(String(gold));
    const [customCrystals, setCustomCrystals] = useState(String(crystals));
    const [customLevel,    setCustomLevel]    = useState(String(level));
    const [customPoints,   setCustomPoints]   = useState(String(talentPoints));
    const [batchFlash,     setBatchFlash]     = useState(false);

    // Fields for trophies
    const [customRating, setCustomRating] = useState(String(rating));
    const [trophyDelta,  setTrophyDelta]  = useState('100');

    const [selectedItemId, setSelectedItemId] = useState('');

    // Sync from store
    useEffect(() => {
        const t = setTimeout(() => {
            setCustomGold(String(gold));
            setCustomCrystals(String(crystals));
            setCustomLevel(String(level));
            setCustomPoints(String(talentPoints));
        }, 0);
        return () => clearTimeout(t);
    }, [gold, crystals, level, talentPoints]);

    useEffect(() => {
        setCustomRating(String(rating));
    }, [rating]);

    // Helpers
    const sfx  = () => audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
    const st   = useGameStore.getState;

    const applyAll = () => {
        sfx();
        if (customGold     !== '') st().setGold(Math.max(0, Number(customGold)));
        if (customCrystals !== '') st().setCrystals(Math.max(0, Number(customCrystals)));
        if (customLevel    !== '') st().setLevel(Math.max(1, Number(customLevel)));
        if (customPoints   !== '') st().setTalentPoints(Math.max(0, Number(customPoints)));
        setBatchFlash(true);
        setTimeout(() => setBatchFlash(false), 600);
    };

    const applyRating  = () => { sfx(); st().setRating(Math.max(0, Number(customRating))); };
    const changeRating = (delta: number) => { sfx(); st().addRating(delta); };

    const rankInfo = getRankInfo(rating);

    const RANK_PRESETS = [
        { label: 'Новобранец', value: 0 },
        { label: 'Воин',       value: 400 },
        { label: 'Ветеран',    value: 1000 },
        { label: 'Мастер',     value: 2000 },
        { label: 'Герой',      value: 3000 },
        { label: 'Легенда',    value: 5000 },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={contentGrid}>

            {/* ══════════════════════════════════════════════════
                КОЛОНКА 1 — РЕДАКТОР РЕСУРСОВ
            ══════════════════════════════════════════════════ */}
            <Section title="🪙 Редактор ресурсов — прямой ввод">

                {/* Инфо-блок */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.6,
                }}>
                    📝 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Как пользоваться:</strong> введи нужные значения в поля ниже
                    и нажми <strong style={{ color: '#2ecc71' }}>«ПРИМЕНИТЬ ВСЁ СРАЗУ»</strong> — изменения применятся одновременно.
                    Либо нажимай <strong style={{ color: '#4dff4d' }}>«ОК»</strong> рядом с каждым полем отдельно.
                </div>

                {/* ── Золото ── */}
                {subTitle('🪙 Золото — основная валюта')}
                {hint('Тратится на покупку снаряжения, улучшения и открытие героев')}
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customGold}
                            onChange={(e) => setCustomGold(e.target.value)}
                            placeholder="например: 100000"
                        />
                    </div>
                    <button
                        title="Применить только золото"
                        onClick={() => { sfx(); st().setGold(Number(customGold)); }}
                        style={applyBtn}
                    >ОК</button>
                </div>

                {/* ── Алмазы ── */}
                {subTitle('💎 Алмазы (кристаллы) — премиум-валюта')}
                {hint('Нужны для покупки скинов, героев и платных паков в магазине')}
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customCrystals}
                            onChange={(e) => setCustomCrystals(e.target.value)}
                            placeholder="например: 5000"
                        />
                    </div>
                    <button
                        title="Применить только кристаллы"
                        onClick={() => { sfx(); st().setCrystals(Number(customCrystals)); }}
                        style={applyBtn}
                    >ОК</button>
                </div>

                {/* ── Уровень ── */}
                {subTitle('⭐ Уровень игрока (1–100)')}
                {hint('Влияет на силу врагов, доступ к контенту и силу боевых способностей')}
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customLevel}
                            onChange={(e) => setCustomLevel(e.target.value)}
                            placeholder="например: 50"
                            min={1}
                            max={100}
                        />
                    </div>
                    <button
                        title="Применить только уровень"
                        onClick={() => { sfx(); st().setLevel(Number(customLevel)); }}
                        style={applyBtn}
                    >ОК</button>
                </div>

                {/* ── Таланты ── */}
                {subTitle('🎯 Очки талантов')}
                {hint('Используются в дереве талантов для усиления персонажа')}
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customPoints}
                            onChange={(e) => setCustomPoints(e.target.value)}
                            placeholder="например: 20"
                        />
                    </div>
                    <button
                        title="Применить только очки талантов"
                        onClick={() => { sfx(); st().setTalentPoints(Number(customPoints)); }}
                        style={applyBtn}
                    >ОК</button>
                </div>

                {/* ПРИМЕНИТЬ ВСЁ */}
                <BigApplyBtn onClick={applyAll} flash={batchFlash} />

                <Divider />

                {/* Быстрые кнопки уровня */}
                {subTitle('⚡ Быстрые кнопки уровня')}
                {hint('LVL UP — добавляет ровно 1 уровень через опыт. LVL +10 — мгновенно прибавляет 10 уровней')}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        title="Добавить ровно 1 уровень через начисление опыта"
                        onClick={() => { sfx(); st().addExp(level * 600); }}
                        style={{ ...smallBtnStyle, flex: 1 }}
                    >
                        LVL UP (+1)
                    </button>
                    <button
                        title="Мгновенно прибавить 10 уровней (без опыта)"
                        onClick={() => { sfx(); st().setLevel(level + 10); }}
                        style={{ ...smallBtnStyle, flex: 1, color: '#f0c040' }}
                    >
                        LVL +10
                    </button>
                </div>
            </Section>

            {/* ══════════════════════════════════════════════════
                КОЛОНКА 2 — КУБКИ И РАНГ
            ══════════════════════════════════════════════════ */}
            <Section title="🏆 Кубки и ранг (рейтинг PvP)">

                {/* Инфо */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.6,
                }}>
                    🏆 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Кубки</strong> = рейтинг PvP-арены.
                    Они определяют <strong style={{ color: '#f0c040' }}>ранг</strong> игрока и открывают доступ к покупке героев.
                    <br />
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>После сброса сезона кубки снижаются, но купленные герои остаются навсегда.</span>
                </div>

                {/* Текущий ранг */}
                <RankBadge name={rankInfo.name} rating={rating} />

                {/* ── Точная установка ── */}
                {subTitle('🎯 Установить точное количество кубков')}
                {hint('Введи любое число и нажми ОК — кубки станут ровно такими')}
                <div style={editRow}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="number"
                            style={inputStyle}
                            value={customRating}
                            onChange={(e) => setCustomRating(e.target.value)}
                            placeholder="например: 1500"
                            min={0}
                        />
                    </div>
                    <button
                        title="Установить кубки в указанное значение"
                        onClick={applyRating}
                        style={applyBtn}
                    >ОК</button>
                </div>

                <Divider />

                {/* ── Добавить / отнять ── */}
                {subTitle('➕➖ Добавить или отнять кубки')}
                {hint('Сначала задай шаг в поле ниже, потом нажимай + или −')}

                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '5px' }}>
                        ШАГ (сколько кубков за раз):
                    </div>
                    <input
                        type="number"
                        style={{ ...inputStyle, marginBottom: '8px' }}
                        value={trophyDelta}
                        onChange={(e) => setTrophyDelta(e.target.value)}
                        placeholder="100"
                        min={1}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <TrophyBtn
                            label={`− ${trophyDelta} кубков`}
                            onClick={() => changeRating(-Number(trophyDelta))}
                            positive={false}
                        />
                        <TrophyBtn
                            label={`+ ${trophyDelta} кубков`}
                            onClick={() => changeRating(Number(trophyDelta))}
                            positive
                        />
                    </div>
                </div>

                <Divider />

                {/* ── Быстрые пресеты ── */}
                {subTitle('⚡ Быстрые пресеты ±')}
                {hint('Кнопки для быстрого изменения без ввода шага вручную')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '4px' }}>
                    {[100, 500, 1000].map((v) => (
                        <TrophyBtn key={`+${v}`} label={`+${v}`} onClick={() => changeRating(v)} positive />
                    ))}
                    {[-100, -500, -1000].map((v) => (
                        <TrophyBtn key={`${v}`} label={`${v}`} onClick={() => changeRating(v)} positive={false} />
                    ))}
                </div>

                <Divider />

                {/* ── Прыжок к рангу ── */}
                {subTitle('🚀 Прыжок к рангу')}
                {hint('Нажми на ранг — кубки сразу установятся на минимальное значение этого ранга. Подсвечены уже достигнутые')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '6px' }}>
                    {RANK_PRESETS.map(({ label, value }) => (
                        <RankJumpBtn
                            key={label}
                            label={label}
                            value={value}
                            currentRating={rating}
                            onClick={() => { sfx(); st().setRating(value); }}
                        />
                    ))}
                </div>

                {/* Сброс */}
                <button
                    title="Обнулить кубки игрока (имитация сброса сезона)"
                    onClick={() => { sfx(); st().setRating(0); }}
                    style={{
                        ...bigBtnStyle,
                        marginTop: '12px',
                        background: '#1c0808',
                        color: '#f87171',
                        border: '1px solid rgba(248,113,113,0.3)',
                        fontSize: '12px',
                    }}
                >
                    🔄 Сбросить кубки в 0 &nbsp;<span style={{ opacity: 0.45, fontSize: '10px' }}>(имитация нового сезона)</span>
                </button>
            </Section>

            {/* ══════════════════════════════════════════════════
                КОЛОНКА 3 — ИНВЕНТАРЬ, НАВИГАЦИЯ, МЕГА-КНОПКИ
            ══════════════════════════════════════════════════ */}
            <Section title="📦 Инвентарь, навигация и управление">

                {/* ── Инвентарь ── */}
                {subTitle('📦 Генератор предметов')}
                {hint('Выбери предмет из базы и нажми «Добавить» — он появится в инвентаре игрока')}
                <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    style={{ ...inputStyle, marginBottom: '8px' }}
                >
                    <option value="">— Выбрать предмет из базы —</option>
                    {Object.keys(ITEMS_DATABASE).map((id) => (
                        <option key={id} value={id}>{id}</option>
                    ))}
                </select>
                <button
                    title="Добавить выбранный предмет в инвентарь (1 штука, уровень 1)"
                    onClick={() => { sfx(); if (selectedItemId) st().addItemToInventory({ id: selectedItemId, level: 1 }); }}
                    style={{ ...bigBtnStyle, marginBottom: '6px' }}
                >
                    ➕ Добавить выбранный предмет в инвентарь
                </button>

                <button
                    title="Добавить сундук сезона — особый предмет с наградами сезона"
                    onClick={() => { sfx(); st().addItemToInventory({ id: 'season_chest', level: 1, amount: 1 }); }}
                    style={{ ...bigBtnStyle, marginBottom: '6px', background: '#d4af37', color: '#000', fontWeight: 'bold' }}
                >
                    🎁 Добавить сундук сезона
                </button>

                {hint('Выдаёт сундук с призами текущего сезона — как если бы игрок дошёл до него в рейтинге')}

                <button
                    title="Удалить все предметы из инвентаря игрока. Внимание — без отмены!"
                    onClick={() => { sfx(); st().showConfirm('Очистить инвентарь? Отменить нельзя!', () => st().clearInventory()); }}
                    style={{ ...bigBtnStyle, marginBottom: '2px', background: '#2a0808', color: '#ff6b6b', border: '1px solid rgba(255,80,80,0.25)' }}
                >
                    🗑️ Очистить инвентарь (WIPE INVENTORY)
                </button>
                {hint('⚠️ Удаляет всё снаряжение и предметы. Отменить нельзя!')}

                <button
                    title="Добавить сразу все существующие предметы в инвентарь"
                    onClick={() => {
                        sfx();
                        const items = Object.keys(ITEMS_DATABASE).map((id) => ({ id, level: 1 }));
                        st().addItemsToInventory(items);
                        st().showAlert('ВЕСЬ АРСЕНАЛ ВЫДАН!');
                    }}
                    style={{ ...bigBtnStyle, background: '#0d0d2e', color: '#9b9bff', border: '1px solid rgba(150,150,255,0.2)' }}
                >
                    🔓 Выдать весь арсенал (Unlock All)
                </button>
                {hint('Добавляет в инвентарь по 1 штуке каждого предмета из базы — для быстрого тестирования')}

                <Divider />

                {/* ── Быстрый переход ── */}
                {subTitle('🗺️ Мгновенный переход между экранами')}
                {hint('Нажми — игра сразу откроет этот экран без анимации. Активный экран подсвечен')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '4px' }}>
                    {[
                        { id: 'MAP',    label: '🗺️ Карта' },
                        { id: 'BOSS',   label: '💀 Босс' },
                        { id: 'ARENA',  label: '⚔️ Арена' },
                        { id: 'SHOP',   label: '🛒 Магаз.' },
                        { id: 'HEROES', label: '🦸 Герои' },
                        { id: 'CLAN',   label: '🛡️ Клан' },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            title={`Перейти на экран ${id}`}
                            onClick={() => { sfx(); st().setScreen(id); }}
                            style={{
                                ...btnStyle,
                                background: activeScreen === id ? '#1a2a1a' : '#0d0d0d',
                                border: activeScreen === id ? '1px solid #2ecc71' : '1px solid #1a1a1a',
                                color: activeScreen === id ? '#2ecc71' : 'rgba(255,255,255,0.5)',
                                fontSize: '10px',
                                padding: '9px 4px',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <Divider />

                {/* ── Мега-кнопки ── */}
                {subTitle('🚨 Мега-операции')}

                <button
                    title="Мгновенно выдать: 999 999 золота, 99 999 алмазов, уровень 100, 500 очков талантов"
                    onClick={() => {
                        sfx();
                        st().setGold(999999);
                        st().setCrystals(99999);
                        st().setLevel(100);
                        st().setTalentPoints(500);
                    }}
                    style={{ ...bigBtnStyle, marginBottom: '6px', background: '#0d2a18', color: '#4dff88', border: '1px solid rgba(77,255,136,0.25)' }}
                >
                    ⚡ БОЖЕСТВЕННЫЙ СТАРТ (Full Max Out)
                </button>
                {hint('Выдаёт: 999 999 🪙 + 99 999 💎 + Уровень 100 + 500 очков талантов — всё одной кнопкой')}

                <button
                    title="Полный сброс всего прогресса до начального состояния. Требует подтверждения"
                    onClick={() => {
                        sfx();
                        st().showConfirm(
                            'ПОЛНЫЙ СБРОС ПРОГРЕССА? Вернёт игрока к началу. Отменить нельзя!',
                            () => st().resetAllProgress()
                        );
                    }}
                    style={{ ...bigBtnStyle, marginBottom: '6px', background: '#2a0808', color: '#ff4d4d', border: '1px solid rgba(255,80,80,0.25)' }}
                >
                    💣 СБРОСИТЬ ВЕСЬ ПРОГРЕСС (Wipe Progress)
                </button>
                {hint('⚠️ Удаляет всё: золото, уровень, инвентарь, героев, кубки. Потребует подтверждения')}

                <Divider />

                {/* ── Тогглы ── */}
                {subTitle('🔧 Режимы и читы')}

                <div style={{ marginBottom: '4px' }}>
                    <ToggleRow
                        label="♾️ БЕСКОНЕЧНАЯ ЭНЕРГИЯ"
                        active={hasInfiniteEnergy}
                        onToggle={() => {
                            const action = useGameStore.getState().setHasInfiniteEnergy;
                            if (action) action(!hasInfiniteEnergy);
                        }}
                    />
                </div>
                {hint('Включи — энергия перестанет тратиться на бои. Удобно для тестирования карты и арены')}
            </Section>
        </div>
    );
};
