import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import * as PIXI from 'pixi.js';
import { AssetsMap } from '../configs/AssetsMap';
import { resolveAssetPath } from '../utils/assetPath';

// =========================================
// БАЗА ДАННЫХ ЗВЕРЕЙ (Mock Data)
// =========================================
// eslint-disable-next-line react-refresh/only-export-components
export const BEASTS_DATABASE = [
    {
        id: 'moose',
        name: 'Лось',
        role: 'Танк',
        locked: false,
        condition: '',
        icon: '🫎',
        lore: 'Массивный страж северных лесов, покрытый древними рунами.',
    },
    {
        id: 'panda',
        name: 'Панда',
        role: 'Баланс',
        locked: false,
        condition: '',
        icon: '🐼',
        lore: 'Бывший охранник бамбукового склада. Теперь он наводит порядок в южных кварталах города. Его кулаки тяжелее его прошлого.',
    },
    {
        id: 'cat',
        name: 'Кот',
        role: 'Крит',
        locked: false,
        condition: '',
        icon: '🐱',
        lore: 'Ловкий карманник, знающий каждый переулок. Ни один кошелек не в безопасности.',
    },
    {
        id: 'tiger',
        name: 'Тигр',
        role: 'Урон',
        locked: true,
        condition: 'Достигните 10 уровня',
        icon: '🐯',
        lore: 'Мастер восточных единоборств, изгнанный из монастыря за излишнюю жестокость.',
    },
    {
        id: 'bear',
        name: 'Медведь',
        role: 'Танк',
        locked: true,
        condition: 'Победите босса Леса',
        icon: '🐻',
        lore: 'Непобежденный чемпион подпольных боев без правил.',
    },
    {
        id: 'lion',
        name: 'Лев',
        role: 'Баланс',
        locked: true,
        condition: 'Купите премиум-пропуск',
        icon: '🦁',
        lore: 'Король каменных джунглей, носящий золотую цепь как корону.',
    },
    {
        id: 'monkey',
        name: 'Обезьяна',
        role: 'Крит',
        locked: true,
        condition: 'Соберите 50 бананов',
        icon: '🐵',
        lore: 'Уличный трикстер с бейсбольной битой.',
    },
    {
        id: 'crocodile',
        name: 'Крокодил',
        role: 'Урон',
        locked: true,
        condition: 'Пройдите Болото',
        icon: '🐊',
        lore: 'Безжалостный рэкетир из городских доков.',
    },
    {
        id: 'rhino',
        name: 'Носорог',
        role: 'Танк',
        locked: true,
        condition: 'Соберите 100 жетонов',
        icon: '🦏',
        lore: 'Бронированный таран, способный пробить любую стену.',
    },
    {
        id: 'ram',
        name: 'Баран',
        role: 'Баланс',
        locked: true,
        condition: 'Выиграйте 5 турниров',
        icon: '🐏',
        lore: 'Упрямый боксер с невероятно крепким лбом.',
    },
    {
        id: 'panther',
        name: 'Пантера',
        role: 'Крит',
        locked: true,
        condition: 'Откройте в сундуке',
        icon: '🐆',
        lore: 'Теневой ассасин, действующий под покровом ночи.',
    },
    {
        id: 'boar',
        name: 'Кабан',
        role: 'Урон',
        locked: false,
        condition: '',
        icon: '🐗',
        lore: 'Неудержимый берсерк из грязных подворотен.',
    },
];

// =========================================
// КОМПОНЕНТЫ ВКЛАДОК
// =========================================

// --- ВКЛАДКА 1: СЕТКА ЗВЕРЕЙ ---
const BeastGrid: React.FC<{ selectedId: string; onSelect: (id: string) => void }> = ({ selectedId, onSelect }) => {
    return (
        <div className="grid grid-cols-4 gap-6 p-4 overflow-y-auto custom-scrollbar h-full content-start">
            {BEASTS_DATABASE.map((beast) => {
                const isSelected = selectedId === beast.id;
                return (
                    <div
                        key={beast.id}
                        onClick={() => !beast.locked && onSelect(beast.id)}
                        className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between p-6 aspect-[4/5] select-none
                            ${
                                isSelected
                                    ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)] bg-gradient-to-b from-yellow-500/20 to-orange-600/20 scale-105 z-10'
                                    : beast.locked
                                      ? 'border-slate-800 bg-slate-900/50 grayscale hover:border-slate-600'
                                      : 'border-[#3e2b18] bg-[#1a120c] hover:border-yellow-500/50 hover:bg-[#2a1f16]'
                            }`}
                    >
                        <span
                            className={`text-9xl drop-shadow-xl transition-transform ${isSelected ? 'scale-110' : ''}`}
                        >
                            {beast.icon}
                        </span>
                        <h4
                            className={`font-black text-xl tracking-widest uppercase mb-1 ${beast.locked ? 'text-slate-500' : 'text-white'}`}
                        >
                            {beast.name}
                        </h4>

                        {beast.locked ? (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
                                <span className="text-4xl mb-2 drop-shadow-md">🔒</span>
                                <span className="text-red-400 font-bold text-xs tracking-widest uppercase">
                                    {beast.condition}
                                </span>
                            </div>
                        ) : (
                            <span className="text-yellow-500 font-black text-xs tracking-[0.2em] uppercase">
                                {beast.role}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// --- ВКЛАДКА 2: СНАРЯЖЕНИЕ ---
const EquipSlot = ({ label, icon, item }: { label: string; icon: string; item: any }) => (
    <div
        className={`relative w-24 h-24 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border-2 select-none
        ${
            item
                ? 'bg-gradient-to-b from-yellow-500/20 to-orange-600/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]'
                : 'bg-[#0a0806] border-[#3e2b18] shadow-inner hover:border-[#d4b483]/50'
        }`}
    >
        <span
            className={`text-4xl transition-all ${item ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110' : 'opacity-20 grayscale'}`}
        >
            {item ? '🗡️' : icon}
        </span>
        <span className="absolute -bottom-3 bg-[#16110d] px-3 py-1 rounded-full border border-[#3e2b18] text-[#a08b70] font-black text-[9px] uppercase tracking-widest shadow-md">
            {label}
        </span>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StatsView = ({ beastId: _beastId }: { beastId: string }) => {
    const stats = [
        { id: 'atk', name: 'АТАКА', base: 520, bonus: 150, icon: '⚔️' },
        { id: 'hp', name: 'ЗДОРОВЬЕ', base: 3250, bonus: 500, icon: '❤️' },
        { id: 'def', name: 'ЗАЩИТА', base: 120, bonus: 0, icon: '🛡️' },
        { id: 'spd', name: 'СКОРОСТЬ', base: 110, bonus: 15, icon: '⚡' },
    ];

    return (
        <div className="bg-[#16110d] border-2 border-[#3e2b18] rounded-2xl p-5 flex flex-col gap-3 shadow-inner select-none">
            <h4 className="text-[#a08b70] font-black text-xs tracking-widest uppercase mb-2 border-b border-[#3e2b18] pb-2 text-center">
                Характеристики
            </h4>
            {stats.map((s) => (
                <div
                    key={s.id}
                    className="flex justify-between items-center bg-[#0a0806] p-2.5 rounded-xl border border-[#3e2b18]"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg opacity-80">{s.icon}</span>
                        <span className="text-white/80 font-bold text-xs uppercase tracking-widest">{s.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-white font-black text-sm">{s.base}</span>
                        {s.bonus > 0 && (
                            <span className="text-green-400 font-bold text-xs drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                +{s.bonus}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const EquipmentTab: React.FC = () => {
    const { selectedHeroId, inventory, equipment, equipWeapon, equippedWeaponId } = useGameStore();
    const beast = BEASTS_DATABASE.find((b) => b.id === selectedHeroId) || BEASTS_DATABASE[0];
    const [rightPanelTab, setRightPanelTab] = useState<'stats' | 'inventory' | 'lore'>('inventory');
    const pixiContainerRef = React.useRef<HTMLDivElement>(null);
    const appRef = React.useRef<any>(null);
    const containerRef = React.useRef<any>(null);
    const bodySpriteRef = React.useRef<any>(null);
    const weaponSpriteRef = React.useRef<any>(null);

    // Инициализация превью персонажа (PixiJS) - один раз при монтировании
    React.useEffect(() => {
        if (!pixiContainerRef.current) return;
        let app: any;
        let active = true;

        const initPreview = async () => {
            app = new PIXI.Application();
            await app.init({ width: 600, height: 800, backgroundAlpha: 0, antialias: true });
            if (!active) {
                app.destroy(true, { children: true });
                return;
            }
            appRef.current = app;
            pixiContainerRef.current?.appendChild(app.canvas);

            const container = new PIXI.Container();
            container.x = 300;
            container.y = 700;
            container.scale.set(1.1); // Scaled up slightly since the textures are trimmed smaller
            app.stage.addChild(container);
            containerRef.current = container;

            const body = new PIXI.Sprite();
            body.anchor.set(0.5, 0.95);
            container.addChild(body);
            bodySpriteRef.current = body;

            const weapon = new PIXI.Sprite();
            weapon.anchor.set(0.5, 0.85); // Default anchor for swords
            container.addChild(weapon);
            weaponSpriteRef.current = weapon;

            let time = 0;
            const tickerCallback = (t: any) => {
                if (!active || body.destroyed || weapon.destroyed) {
                    app.ticker.remove(tickerCallback);
                    return;
                }
                time += t.elapsedMS;
                body.scale.y = 1 + Math.sin(time / 500) * 0.02;
                // Weapon Y coordinates perfectly track the body vertical scaling
                const feetY = 0.95;
                const rightHandY = 0.4;
                const texHeight = body.texture.height || 583;
                weapon.y = (rightHandY - feetY) * texHeight * body.scale.y;
            };
            app.ticker.add(tickerCallback);
        };
        initPreview();

        return () => {
            active = false;
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
            containerRef.current = null;
            bodySpriteRef.current = null;
            weaponSpriteRef.current = null;
        };
    }, []);

    // Эффект обновления текстур при изменении выбранного героя или оружия
    React.useEffect(() => {
        let active = true;
        const updateVisuals = async () => {
            // Ожидаем инициализации Pixi приложения и спрайтов
            while (active && (!appRef.current || !bodySpriteRef.current || !weaponSpriteRef.current)) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            if (!active) return;

            const body = bodySpriteRef.current;
            const weapon = weaponSpriteRef.current;

            let sheet;
            try {
                let sheetPath = '/assets/characters/panda/panda_poses.png.json';
                if (selectedHeroId === 'raccoon') {
                    sheetPath = '/assets/characters/raccoon/raccoon_poses.png.json';
                } else if (selectedHeroId === 'panda') {
                    const equippedSkin = useGameStore.getState().equippedSkins?.['panda'] || 'default';
                    if (equippedSkin === 'panda_frost') {
                        sheetPath = '/assets/characters/panda/panda_frost_poses.png.json';
                    }
                }
                sheet = await PIXI.Assets.load(sheetPath);
            } catch (err) {
                console.error(`Failed to load ${selectedHeroId} sheet:`, err);
                return;
            }

            if (!active || body.destroyed) return;

            const idleTexture = sheet.textures['0_idle.png'] || Object.values(sheet.textures)[0];
            if (idleTexture) {
                body.texture = idleTexture;
            }

            if (!equippedWeaponId) {
                weapon.visible = false;
                return;
            }

            const weaponFileMap: Record<string, string> = {
                '1': 'staff',
                '2': 'bow',
                '3': 'daggers',
                '4': 'axe',
                '8': 'moon_sword',
            };
            const file = weaponFileMap[equippedWeaponId] || 'moon_sword';
            try {
                const tex = await PIXI.Assets.load(resolveAssetPath(`/assets/items/${file}.png`));
                if (!active || weapon.destroyed || body.destroyed) return;
                if (tex) {
                    weapon.texture = tex;
                    weapon.visible = true;

                    // Hand coordinates relative to the body pivot computed dynamically
                    const feet = { x: 0.5, y: 0.95 };
                    const rightHand = { x: 0.74, y: 0.4 };
                    const texWidth = body.texture.width || 561;
                    const texHeight = body.texture.height || 583;

                    weapon.x = (rightHand.x - feet.x) * texWidth;
                    weapon.y = (rightHand.y - feet.y) * texHeight * body.scale.y;

                    // Align anchors, rotations, and scales per weapon type
                    if (file === 'staff') {
                        weapon.anchor.set(0.5, 0.7);
                        weapon.rotation = -0.2;
                        weapon.scale.set(1.1);
                    } else if (file === 'bow') {
                        weapon.anchor.set(0.5, 0.5);
                        weapon.rotation = 0.0;
                        weapon.scale.set(1.15);
                    } else if (file === 'daggers') {
                        weapon.anchor.set(0.5, 0.85);
                        weapon.rotation = 0.3;
                        weapon.scale.set(1.0);
                    } else if (file === 'axe') {
                        weapon.anchor.set(0.5, 0.85);
                        weapon.rotation = 0.4;
                        weapon.scale.set(1.2);
                    } else {
                        // Default for swords (e.g. moon_sword)
                        weapon.anchor.set(0.5, 0.85);
                        weapon.rotation = -0.5; // Upward-right angle
                        weapon.scale.set(1.2);
                    }
                }
            } catch (e) {
                console.error('Failed to load weapon texture:', e);
            }
        };

        updateVisuals();

        return () => {
            active = false;
        };
    }, [selectedHeroId, equippedWeaponId]);

    return (
        <div className="flex w-full h-full gap-4 relative overflow-hidden">
            {/* СЛОТЫ СЛЕВА */}
            <div className="w-[300px] flex flex-col gap-4 justify-center pl-10 z-10">
                <EquipSlot label="Шлем" icon="⛑️" item={equipment.head} />
                <EquipSlot label="Броня" icon="👕" item={equipment.body} />
                <EquipSlot label="Оружие" icon="⚔️" item={equippedWeaponId ? { id: equippedWeaponId } : null} />
                <EquipSlot label="Щит" icon="🛡️" item={equipment.shield} />
                <EquipSlot label="Зелье" icon="🧪" item={null} />
            </div>

            {/* ЦЕНТР: ПЕРСОНАЖ */}
            <div className="flex-1 flex flex-col items-center justify-end pb-10 relative z-0">
                <div ref={pixiContainerRef} className="w-[600px] h-[800px] pointer-events-none" />
                <div className="absolute bottom-4 text-center">
                    <h2 className="text-5xl font-black text-yellow-500 italic tracking-tighter uppercase drop-shadow-2xl">
                        {beast.name}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                        <span className="text-green-400 font-black text-xs tracking-widest uppercase">
                            Герой готов к бою
                        </span>
                    </div>
                </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ С ПЕРЕКЛЮЧАТЕЛЕМ */}
            <div className="w-[450px] flex flex-col gap-4 pr-10 pt-10 z-10">
                {/* ПРЕМИАЛЬНЫЙ ТУМБЛЕР ВКЛАДОК */}
                <div className="flex gap-2 p-1 bg-black/60 rounded-xl border-2 border-[#5e4125] shadow-2xl">
                    {[
                        { id: 'inventory', label: 'РЮКЗАК', icon: '🎒' },
                        { id: 'stats', label: 'СТАТЫ', icon: '📊' },
                        { id: 'lore', label: 'ЛЕГЕНДА', icon: '📜' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setRightPanelTab(t.id as any)}
                            className={`flex-1 py-3 px-2 rounded-lg font-black text-[10px] tracking-[0.2em] transition-all duration-300 flex flex-col items-center gap-1
                                ${
                                    rightPanelTab === t.id
                                        ? 'bg-gradient-to-b from-[#f0c040] to-[#a67c00] text-black shadow-[0_0_15px_rgba(240,192,64,0.4)] scale-105 border border-[#ffdf00]'
                                        : 'text-[#a08b70] hover:text-white hover:bg-white/5 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <span className="text-xl">{t.icon}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Контент правой панели */}
                <div className="flex-1 bg-[#16110d]/90 backdrop-blur-md border-2 border-[#3e2b18] rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden">
                    {rightPanelTab === 'stats' && <StatsView beastId={beast.id} />}

                    {rightPanelTab === 'inventory' && (
                        <div className="flex flex-col h-full">
                            <h4 className="text-[#a08b70] font-black text-sm tracking-widest uppercase mb-4 border-b border-[#3e2b18] pb-2">
                                Твоё снаряжение
                            </h4>
                            <div className="grid grid-cols-4 gap-3 overflow-y-auto custom-scrollbar pr-2 h-full content-start">
                                {inventory.map((item: any, i: number) => (
                                    <div
                                        key={item.id + i}
                                        onClick={() => equipWeapon(item.id)}
                                        className={`aspect-square rounded-2xl border-2 cursor-pointer flex items-center justify-center text-3xl transition-all relative group
                                            ${
                                                item.id === equippedWeaponId
                                                    ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                                                    : 'bg-[#0a0806] border-[#3e2b18] hover:border-yellow-500/50 hover:bg-[#2a1f16]'
                                            }`}
                                    >
                                        {item.id === '1' ? '🧙‍♂️' : item.id === '8' ? '🗡️' : '⚔️'}
                                        {item.id === equippedWeaponId && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                                                ✔
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Пустые слоты для вида */}
                                {Array.from({ length: Math.max(0, 20 - inventory.length) }).map((_: any, i: number) => (
                                    <div
                                        key={`empty-${i}`}
                                        className="aspect-square bg-[#0a0806]/50 border-2 border-[#3e2b18]/30 rounded-2xl"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {rightPanelTab === 'lore' && (
                        <div className="flex flex-col h-full">
                            <h4 className="text-[#a08b70] font-black text-sm tracking-widest uppercase mb-4 border-b border-[#3e2b18] pb-2">
                                История героя
                            </h4>
                            <p className="text-slate-300 font-medium leading-relaxed italic border-l-4 border-yellow-500/50 pl-4 py-2 overflow-y-auto custom-scrollbar">
                                {beast.lore}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ВКЛАДКА 3: ДРЕВО ТАЛАНТОВ ---
const TalentTree: React.FC = () => {
    return (
        <div
            className="w-full h-full flex items-center justify-center relative bg-cover bg-center bg-blend-overlay bg-[#1a120c]/80 rounded-3xl overflow-hidden border-2 border-[#3e2b18] shadow-inner select-none"
            style={{ backgroundImage: `url(${AssetsMap.BACKGROUNDS.MAIN_MENU})` }}
        >
            {/* SVG Линии связи */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="50%" y1="80%" x2="50%" y2="50%" stroke="#5e4125" strokeWidth="6" strokeDasharray="10 10" />
                <line
                    x1="50%"
                    y1="50%"
                    x2="30%"
                    y2="25%"
                    stroke="#facc15"
                    strokeWidth="8"
                    className="drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]"
                />
                <line x1="50%" y1="50%" x2="70%" y2="25%" stroke="#5e4125" strokeWidth="6" />
            </svg>

            {/* Узлы (Nodes) */}
            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                <button className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-gradient-to-b from-yellow-400 to-orange-600 shadow-[0_0_30px_rgba(234,179,8,0.6)] flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all">
                    🔥
                </button>
                <span className="text-yellow-500 font-black text-xs uppercase tracking-widest bg-black/80 px-3 py-1 rounded-md border border-yellow-500/30">
                    Основа
                </span>
            </div>

            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                <button className="w-24 h-24 rounded-[30px] border-4 border-yellow-500 bg-gradient-to-b from-yellow-400 to-orange-600 shadow-[0_0_40px_rgba(234,179,8,0.6)] flex items-center justify-center text-4xl hover:scale-110 active:scale-95 transition-all rotate-45">
                    <span className="-rotate-45">💪</span>
                </button>
                <span className="text-yellow-500 font-black text-xs uppercase tracking-widest bg-black/80 px-3 py-1 rounded-md border border-yellow-500/30">
                    Сила двора
                </span>
            </div>

            <div className="absolute top-[25%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                <button className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-gradient-to-b from-yellow-400 to-orange-600 shadow-[0_0_30px_rgba(234,179,8,0.6)] flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all">
                    ⚡
                </button>
                <span className="text-yellow-500 font-black text-xs uppercase tracking-widest bg-black/80 px-3 py-1 rounded-md border border-yellow-500/30">
                    Ловкость
                </span>
            </div>

            <div className="absolute top-[25%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                <button className="w-20 h-20 rounded-full border-4 border-[#5e4125] bg-[#1a120c] flex items-center justify-center text-3xl hover:border-[#d4b483] transition-all grayscale opacity-50 hover:grayscale-0 hover:opacity-100 cursor-pointer">
                    🛡️
                </button>
                <span className="text-[#a08b70] font-black text-xs uppercase tracking-widest bg-black/80 px-3 py-1 rounded-md border border-[#3e2b18]">
                    Защита
                </span>
            </div>
        </div>
    );
};

// =========================================
// ГЛАВНЫЙ ЭКРАН (Обертка)
// =========================================

export const BeastsScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'collection' | 'equipment' | 'talents'>('collection');
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const selectedBeastId = useGameStore((state) => state.selectedBeastId);
    const setSelectedBeastId = useGameStore((state) => state.setSelectedBeastId);

    return (
        <div className="w-full h-full pointer-events-none flex items-center justify-center font-sans">
            {/* OCTAGON FRAME WRAPPER */}
            <div
                className="w-full h-full pointer-events-auto bg-gradient-to-b from-[#3e2b18] to-[#0a0806] p-1.5 shadow-[0_0_100px_rgba(0,0,0,0.9)] relative"
                style={{
                    clipPath:
                        'polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% calc(100% - 40px), calc(100% - 40px) 100%, 40px 100%, 0% calc(100% - 40px), 0% 40px)',
                }}
            >
                {/* INNER BACKGROUND */}
                <div
                    className="w-full h-full bg-[#120e0b] relative flex flex-col"
                    style={{
                        clipPath:
                            'polygon(38px 0%, calc(100% - 38px) 0%, 100% 38px, 100% calc(100% - 38px), calc(100% - 38px) 100%, 38px 100%, 0% calc(100% - 38px), 0% 38px)',
                    }}
                >
                    {/* --- HEADER --- */}
                    <div className="flex items-center justify-between px-14 py-6 border-b border-[#3e2b18] bg-gradient-to-b from-[#1a120c] to-transparent shrink-0">
                        <div className="flex items-center gap-6 select-none">
                            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                                🐾
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-4xl font-black text-white italic tracking-widest uppercase drop-shadow-md">
                                    Звери
                                </h2>
                                <span className="text-yellow-500/80 font-bold text-xs tracking-[0.4em] uppercase">
                                    Отряд чемпионов
                                </span>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-6 bg-[#0a0806] p-3 rounded-3xl border-2 border-[#3e2b18] overflow-visible">
                            {[
                                { id: 'collection', label: 'КОЛЛЕКЦИЯ', icon: '📦' },
                                { id: 'equipment', label: 'СНАРЯЖЕНИЕ', icon: '⚙️' },
                                { id: 'talents', label: 'ТАЛАНТЫ', icon: '✨' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg tracking-wide uppercase transition-all duration-300 pointer-events-auto cursor-pointer select-none
                                            ${
                                                activeTab === tab.id
                                                    ? 'bg-gradient-to-b from-yellow-400 to-orange-600 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105'
                                                    : 'text-[#a08b70] hover:text-white hover:bg-[#2a1f16]'
                                            }`}
                                >
                                    <span className="text-2xl opacity-90">{tab.icon}</span>
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={goToMainMenu}
                            className="w-14 h-14 bg-[#2a1f16] border-2 border-[#5e4125] hover:border-red-500 hover:bg-red-500/20 rounded-2xl flex items-center justify-center text-white/50 hover:text-red-400 transition-all shadow-lg active:scale-95 pointer-events-auto cursor-pointer"
                        >
                            <span className="text-2xl font-black">✕</span>
                        </button>
                    </div>

                    {/* --- CONTENT BODY --- */}
                    <div className="flex-1 p-8 overflow-hidden relative">
                        {activeTab === 'collection' && (
                            <BeastGrid selectedId={selectedBeastId} onSelect={setSelectedBeastId} />
                        )}
                        {activeTab === 'equipment' && <EquipmentTab />}
                        {activeTab === 'talents' && <TalentTree />}
                    </div>
                </div>
            </div>
        </div>
    );
};
