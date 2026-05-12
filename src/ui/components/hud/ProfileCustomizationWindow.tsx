import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

// Типы данных
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CustomItem {
    id: string;
    name: string;
    rarity: Rarity;
    image: string;
    locked: boolean;
    unlockCondition?: string;
}

// Реальные аватары
const AVATAR_FILES = [
    { file: 'панда.webp', name: 'Мастер Панда', rarity: 'common', locked: false },
    { file: 'лев.webp', name: 'Король Саванны', rarity: 'legendary', locked: true, condition: 'Топ-1 Арены' },
    { file: 'тигр.webp', name: 'Полосатый Кошмар', rarity: 'epic', locked: true, condition: 'Уровень 40+' },
    { file: 'пантера.webp', name: 'Тень Джунглей', rarity: 'epic', locked: true, condition: 'Ночной охотник' },
    { file: 'медведь.webp', name: 'Горный Сокрушитель', rarity: 'epic', locked: true, condition: 'Мастер Силы' },
    { file: 'крокодил.webp', name: 'Речной Ужас', rarity: 'rare', locked: true, condition: 'Победа над Боссом' },
    { file: 'носорог.webp', name: 'Стальной Рог', rarity: 'rare', locked: true, condition: 'VIP 3+' },
    { file: 'обезьяна.webp', name: 'Ловкий Трюкач', rarity: 'common', locked: true, condition: '10 побед подряд' },
    { file: 'кабан.webp', name: 'Лесной Вепрь', rarity: 'common', locked: true, condition: 'Уровень 10+' },
    { file: 'баран.webp', name: 'Горный Таран', rarity: 'common', locked: true, condition: 'Стартовый набор' },
    { file: 'кот.webp', name: 'Хитрый Мяут', rarity: 'rare', locked: true, condition: 'Подарок за вход' },
    { file: 'лось.webp', name: 'Лесной Исполин', rarity: 'rare', locked: true, condition: 'Топ-50 сезона' },
];

const AVATARS: CustomItem[] = AVATAR_FILES.map(item => ({
    id: item.file,
    name: item.name,
    rarity: item.rarity as Rarity,
    image: `/assets/images/avatars/${item.file}`,
    locked: item.locked,
    unlockCondition: item.condition
}));

const FRAMES: CustomItem[] = [
    { id: 'frame_base', name: 'Стандартная', rarity: 'common', image: AssetsMap.UI.AVATAR_FRAME_NEW, locked: false },
    { id: 'frame_ice', name: 'Ледяной Осколок', rarity: 'epic', image: '/assets/images/frames/gem03-Photoroom-export.png', locked: true, unlockCondition: 'Зимний поход' },
    { id: 'frame_silver', name: 'Священное Серебро', rarity: 'rare', image: '/assets/images/frames/gemini-2 (1)-Photoroom-export.png', locked: true, unlockCondition: 'Ранг: Рыцарь' },
    { id: 'frame_ember', name: 'Ярость Вулкана', rarity: 'legendary', image: '/assets/images/frames/gemini-2)-Photoroom-export.png', locked: true, unlockCondition: 'Топ-10 арены' },
    { id: 'frame_magic', name: 'Эфирное Пламя', rarity: 'epic', image: '/assets/images/frames/gemini-20002 (1)-Photoroom-export.png', locked: true, unlockCondition: 'Магистр стихий' },
    { id: 'frame_sun', name: 'Солнечный Триумф', rarity: 'legendary', image: '/assets/images/frames/gemini-2026-01-Photoroom-export.png', locked: true, unlockCondition: 'VIP 10+' },
    { id: 'frame_forest', name: 'Сердце Леса', rarity: 'epic', image: '/assets/images/frames/gemini-2026-05-12-002 (1)-Photoroom-export.png', locked: true, unlockCondition: 'Друид-мастер' },
    { id: 'frame_guardian', name: 'Страж Порядка', rarity: 'rare', image: '/assets/images/frames/gemini-2026-05-12-003-Phooom (1)-export.png', locked: true, unlockCondition: '50 побед' },
    { id: 'frame_ancient', name: 'Древний Камень', rarity: 'rare', image: '/assets/images/frames/gemini-2026-05-12-003-oom (1)-export.png', locked: true, unlockCondition: 'Уровень 50+' },
    { id: 'frame_nature', name: 'Дыхание Природы', rarity: 'epic', image: '/assets/images/frames/gemini-2026-05-12-oom (1)-export.png', locked: true, unlockCondition: 'Боевой Пропуск' },
    { id: 'frame_leaf', name: 'Изумрудный Лист', rarity: 'rare', image: '/assets/images/frames/gemini-2026-05-oom (1)-export.png', locked: true, unlockCondition: 'Лесной охотник' },
    { id: 'frame_void', name: 'Око Пустоты', rarity: 'legendary', image: '/assets/images/frames/gemini-2026-12-001-Photoroom-export.png', locked: true, unlockCondition: 'Секретное достижение' },
];

const TITLES: CustomItem[] = [
    { id: 'title_1', name: 'Masters of the Wild', rarity: 'epic', image: '', locked: false },
    { id: 'title_2', name: 'Новичок', rarity: 'common', image: '', locked: false },
    { id: 'title_3', name: 'Гроза лесов', rarity: 'rare', image: '', locked: true, unlockCondition: 'Убейте 1000 монстров' },
];

const RARITY_COLORS = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
};

const RARITY_GRADIENTS = {
    common: 'linear-gradient(180deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)',
    rare: 'linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
    epic: 'linear-gradient(180deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
    legendary: 'linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
};

export const ProfileCustomizationWindow: React.FC = () => {
    const { isMobile, graphicsQuality } = useGameStore();
    const [activeTab, setActiveTab] = useState<'avatar' | 'frame' | 'title'>('avatar');
    const [tempAvatar, setTempAvatar] = useState(AVATARS[0]);
    const [tempFrame, setTempFrame] = useState(FRAMES[0]);
    const [tempTitle, setTempTitle] = useState(TITLES[0]);

    const isLow = graphicsQuality === 'LOW';
    const gridRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (previewRef.current && !isLow) {
            gsap.to(previewRef.current, {
                scale: 1.02,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }
    }, [isLow]);

    useEffect(() => {
        if (gridRef.current) {
            gsap.fromTo(gridRef.current.children,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.3, stagger: 0.02, ease: "power1.out" }
            );
        }
    }, [activeTab]);

    const selectedItem = activeTab === 'avatar' ? tempAvatar : activeTab === 'frame' ? tempFrame : tempTitle;

    return (
        <div className="flex flex-col bg-[#0d0a08] text-white select-none overflow-hidden h-full max-h-[600px] w-full">

            {/* ВКЛАДКИ */}
            <div className="flex bg-[#050403] border-b border-[#c48b3b]/20 shrink-0">
                {(['avatar', 'frame', 'title'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 px-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all border-b-2 ${activeTab === tab
                            ? 'text-[#facc15] border-[#facc15] bg-[#110d0a]'
                            : 'text-[#4a3a2a] border-transparent hover:text-[#c48b3b]/60'
                            }`}
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        {tab === 'avatar' && (isMobile ? 'Герой' : 'Аватар')}
                        {tab === 'frame' && (isMobile ? 'Рамка' : 'Рамка')}
                        {tab === 'title' && (isMobile ? 'Звание' : 'Звание')}
                    </button>
                ))}
            </div>

            {/* КОНТЕНТ */}
            <div className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>

                {/* ЛЕВАЯ ПАНЕЛЬ (ПРЕВЬЮ) */}
                <div className={`${isMobile ? 'h-[180px] w-full border-b' : 'w-[320px] border-r'} flex flex-col items-center justify-center bg-[#0a0807] p-4 border-white/5 shrink-0`}>

                    <div className={`${isMobile ? 'scale-75' : ''} relative w-48 h-48 flex items-center justify-center`}>
                        {/* Фоновое свечение - отключаем на LOW */}
                        {!isLow && (
                            <div className="absolute inset-0 rounded-full blur-[40px] opacity-20"
                                style={{ backgroundColor: RARITY_COLORS[tempAvatar.rarity] }} />
                        )}

                        {/* КОНТЕЙНЕР ПРЕВЬЮ */}
                        <div ref={previewRef} className="relative w-[160px] h-[160px] flex items-center justify-center">
                            {/* Рамка */}
                            <img
                                src={tempFrame.image}
                                className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none scale-110"
                                alt="frame-preview"
                            />

                            {/* Изображение аватара */}
                            <div className="w-[74%] h-[74%] rounded-full overflow-hidden z-10 shadow-inner bg-[#1a1512] translate-x-[1px] translate-y-[2px]">
                                <img
                                    src={tempAvatar.image}
                                    className="w-full h-full object-cover scale-[1.2]"
                                    alt="preview"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`text-center ${isMobile ? 'mt-0' : 'mt-4'}`}>
                        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-black uppercase tracking-widest leading-none`} style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
                            {selectedItem.name}
                        </h3>
                        <p className="text-[#a08b70] text-xs italic mt-2 opacity-60">
                            {selectedItem.locked ? selectedItem.unlockCondition : 'Этот облик доступен вам'}
                        </p>
                    </div>

                    {!isMobile && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full border border-white/5 mt-6">
                            <span className="font-bold text-sm tracking-widest uppercase opacity-80">Motaro</span>
                            <img src={AssetsMap.UI.HUB_ICON_EDIT} alt="edit" className="w-3.5 h-3.5 opacity-40 hover:opacity-100 invert" />
                        </div>
                    )}
                </div>

                {/* ПРАВАЯ ПАНЕЛЬ (СЕТКА) */}
                <div className="flex-1 flex flex-col bg-[#110d0a] p-6">
                    <div
                        ref={gridRef}
                        className="grid grid-cols-5 gap-2.5 overflow-y-auto pr-1.5 custom-scrollbar flex-1"
                    >
                        {activeTab === 'avatar' && AVATARS.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setTempAvatar(item)}
                                className={`relative group rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${tempAvatar.id === item.id ? 'border-[#facc15] z-10' : 'border-white/5'
                                    }`}
                                style={{
                                    background: RARITY_GRADIENTS[item.rarity]
                                }}
                            >
                                <div className="aspect-[4/5] overflow-hidden rounded-md m-0.5">
                                    <img src={item.image} className={`w-full h-full object-cover transition-transform duration-500 ${item.locked ? 'grayscale brightness-50 opacity-30' : 'group-hover:scale-110'}`} alt={item.name} />
                                </div>
                                {item.locked && <div className="absolute inset-0 flex items-center justify-center text-sm">🔒</div>}
                                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full mx-1.5 mb-0.5 opacity-60" style={{ backgroundColor: RARITY_COLORS[item.rarity] }} />
                            </div>
                        ))}

                        {activeTab === 'frame' && FRAMES.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setTempFrame(item)}
                                className={`relative aspect-square rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center bg-black/20 ${tempFrame.id === item.id ? 'border-[#facc15]' : 'border-white/5'
                                    }`}
                            >
                                <img src={item.image} className={`w-full h-full object-contain p-1.5 ${item.locked ? 'grayscale brightness-50 opacity-40' : ''}`} alt={item.name} />
                                {item.locked && <div className="absolute inset-0 flex items-center justify-center">🔒</div>}
                            </div>
                        ))}

                        {activeTab === 'title' && (
                            <div className="col-span-5 flex flex-col gap-2">
                                {TITLES.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setTempTitle(item)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${tempTitle.id === item.id ? 'bg-[#facc15]/10 border-[#facc15]' : 'bg-white/5 border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-bold tracking-widest uppercase text-xs" style={{ color: item.locked ? '#3d2e22' : RARITY_COLORS[item.rarity] }}>
                                            {item.name}
                                        </span>
                                        {tempTitle.id === item.id && <span className="text-[#facc15] text-[10px] font-black">✓</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* КНОПКА ПРИМЕНИТЬ */}
                    <div className="mt-5">
                        <button
                            disabled={selectedItem.locked}
                            className={`w-full py-4 font-black uppercase tracking-[0.5em] rounded-xl transition-all text-sm ${selectedItem.locked
                                ? 'bg-white/5 text-[#3d2e22] cursor-not-allowed'
                                : 'bg-gradient-to-b from-[#facc15] to-[#b45309] text-black hover:brightness-110 active:scale-95 shadow-xl'
                                }`}
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            {selectedItem.locked ? 'Заблокировано' : 'Применить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
