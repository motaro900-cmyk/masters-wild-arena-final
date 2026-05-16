import React from 'react';
import { EditorPanel } from './EditorPanel';

export const BottomBar: React.FC = () => {
    return (
        <EditorPanel id="BottomBar" className="w-full flex justify-between items-end mb-2">
            {/* Панель прогресса сезона */}
            <div className="bg-[#11131a]/90 p-4 rounded-2xl border-2 border-black/80 backdrop-blur-md flex flex-col gap-2 w-[280px] shadow-xl pointer-events-auto">
                <div className="flex justify-between text-sm font-black tracking-wide">
                    <span className="text-[#00ffff] text-stroke">СЕЗОН 1</span>
                    <span className="text-white text-stroke">12 / 50</span>
                </div>
                <div className="w-full h-4 bg-black/90 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#00ffff] to-[#4a90e2] w-1/4 relative">
                        <div className="absolute top-0 left-1 right-1 h-1.5 bg-white/40 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Массивная кнопка FIGHT! */}
            <button className="relative group w-[360px] h-[110px] transition-transform hover:scale-105 active:scale-95 duration-150 ease-out pointer-events-auto">
                <div className="absolute inset-0 bg-black/60 rounded-3xl translate-y-4 blur-sm"></div>
                <div className="absolute inset-0 bg-[#b37700] rounded-3xl translate-y-3"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#ffee55] to-[#ff9900] rounded-3xl border-2 border-[#ffe066] flex items-center justify-center overflow-hidden">
                    <div className="absolute top-1 left-2 right-2 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-t-2xl"></div>
                    <span className="text-white font-black text-5xl tracking-widest text-stroke drop-shadow-md">
                        В БОЙ!
                    </span>
                </div>
            </button>
        </EditorPanel>
    );
};
