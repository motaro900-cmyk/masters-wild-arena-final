import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { EditorPanel } from './EditorPanel';
import { HudAvatar } from './HudAvatar';

export const LeftBar: React.FC = () => {
    const menuItems = [
        { id: 'MAIN_MENU', label: 'ГЛАВНАЯ', icon: '👑' },
        { id: 'HEROES', label: 'ГЕРОИ', icon: '🐾' },
        { id: 'INVENTORY', label: 'ИНВЕНТАРЬ', icon: '🎒' },
        { id: 'STORE', label: 'МАГАЗИН', icon: '🛒' },
        { id: 'ARENA', label: 'АРЕНА', icon: '⚔️' },
    ];

    const store = useGameStore();
    const expNeeded = (store.level || 1) * 600;
    const expPercent = Math.min(100, ((store.exp || 0) / expNeeded) * 100);

    return (
        <EditorPanel id="LeftBar" className="flex flex-col gap-6 h-full py-2">
            {/* Профиль игрока (AAA Badge) */}
            <div className="relative bg-[#11131a]/90 border-2 border-black/80 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-4">
                    {/* Аватарка */}
                    <HudAvatar heroId={store.currentHeroId || 'panda'} />
                    <div className="flex flex-col">
                        <h2 className="text-white font-black text-xl tracking-wide text-stroke uppercase">
                            {store.currentHeroId || 'ПАНДА'}
                        </h2>
                        <p className="text-[#ffcc00] font-bold text-sm text-stroke">Уровень {store.level || 1}</p>
                    </div>
                </div>
                {/* Полоска EXP */}
                <div className="w-full h-3 bg-black/90 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                    <div
                        className="h-full bg-[#4caf50] relative transition-all duration-500"
                        style={{ width: `${expPercent}%` }}
                    >
                        <div className="absolute top-0 left-1 right-1 h-1 bg-white/30 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Навигационное меню */}
            <div className="bg-[#23283b]/90 rounded-2xl p-4 flex flex-col gap-3 flex-grow backdrop-blur-md border-2 border-black/50 shadow-2xl">
                {menuItems.map((item, index) => (
                    <button
                        key={item.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 border-2 active:scale-[0.98] pointer-events-auto ${index === 0 ? 'bg-gradient-to-b from-[#ffee55] to-[#ff9900] text-black border-[#b37700] shadow-md' : 'bg-[#2a2f45] text-white hover:bg-[#343b57] border-transparent hover:border-white/10'}`}
                    >
                        <span className="text-2xl drop-shadow-sm">{item.icon}</span>
                        <span className="font-black tracking-wide text-lg">{item.label}</span>
                    </button>
                ))}
            </div>
        </EditorPanel>
    );
};
