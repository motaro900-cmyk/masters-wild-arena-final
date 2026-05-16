import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { EditorPanel } from './EditorPanel';

export const TopBar: React.FC = () => {
    const store = useGameStore();

    return (
        <EditorPanel id="TopBar" className="absolute top-[30px] right-[160px] flex gap-4">
            {/* Плашка с валютой */}
            <div className="flex items-center gap-6 bg-[#11131a]/80 rounded-full px-6 py-2 border-2 border-black/80 backdrop-blur-md shadow-lg pointer-events-auto">
                <div className="flex items-center gap-2">
                    <span className="text-2xl drop-shadow-md">💰</span>
                    <span className="text-[#ffcc00] font-black text-2xl text-stroke">
                        {store.gold?.toLocaleString('ru-RU') || '0'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl drop-shadow-md">💎</span>
                    <span className="text-[#00ffff] font-black text-2xl text-stroke">
                        {store.crystals?.toLocaleString('ru-RU') || '0'}
                    </span>
                </div>
            </div>

            {/* Кнопка настроек */}
            <button className="bg-[#2a2a3e] hover:bg-[#3a3a4e] p-3 rounded-full border-2 border-[#4a4a6a] shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto">
                <span className="text-2xl">⚙️</span>
            </button>
        </EditorPanel>
    );
};
