import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { EditorPanel } from './EditorPanel';

export const RightBar: React.FC = () => {
    const store = useGameStore();
    const stats = store.getCalculatedStats(store.currentHeroId) || { hp: 0, attack: 0, speed: 0, critChance: 0 };

    const displayStats = [
        { icon: '❤️', name: 'Здоровье', val: stats.hp },
        { icon: '⚔️', name: 'Атака', val: stats.attack },
        { icon: '⚡', name: 'Скорость', val: stats.speed },
        { icon: '💥', name: 'Крит', val: `${Math.round((stats.critChance || 0) * 100)}%` },
    ];

    return (
        <EditorPanel id="RightBar" className="h-full py-2">
            {/* Панель статов с эффектом "стекла" (Glassmorphism) */}
            <div className="bg-[#23283b]/90 rounded-2xl p-6 h-full flex flex-col backdrop-blur-md border-2 border-black/50 shadow-2xl pointer-events-auto">
                <h2 className="text-center text-white font-black text-3xl tracking-widest text-stroke mb-8 uppercase">
                    {store.currentHeroId || 'ПАНДА'}
                </h2>

                <div className="flex flex-col gap-6 my-auto">
                    {displayStats.map((st, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center bg-[#1a1f33] p-4 rounded-xl border border-black/60 shadow-inner"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl drop-shadow-sm">{st.icon}</span>
                                <span className="text-[#cccccc] font-bold text-lg">{st.name}</span>
                            </div>
                            <span className="text-white font-black text-2xl text-stroke">{st.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </EditorPanel>
    );
};
