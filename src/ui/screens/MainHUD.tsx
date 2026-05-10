import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { UIManager } from '../../engine/systems/UIManager';
import { BattleScene } from '../screens/BattleScene';

const MainHUD: React.FC = () => {
    const store = useGameStore();
    const stats = store.getCalculatedStats(store.currentHeroId);

    const expNeeded = store.level * 600;
    const expPercent = Math.min(100, (store.exp / expNeeded) * 100);

    return (
        <div className="absolute inset-0 pointer-events-none font-sans">
            
            {/* --- ВЕРХНЯЯ ПАНЕЛЬ: ПРОФИЛЬ --- */}
            <div className="absolute top-4 left-4 pointer-events-auto flex items-center gap-3 bg-[#1a1f35]/90 p-2 pr-6 rounded-full border border-slate-700 shadow-lg backdrop-blur-sm">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-3xl border-2 border-blue-500 shadow-inner">
                    🐼
                </div>
                <div className="flex flex-col drop-shadow-md">
                    <span className="text-white font-bold text-base leading-tight tracking-wide">Панда</span>
                    <span className="text-yellow-400 font-bold text-xs tracking-widest uppercase">Уровень {store.level}</span>
                    <div className="w-24 h-2 bg-gray-800 rounded-full mt-1 overflow-hidden border border-gray-900 shadow-inner">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${expPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* --- ВЕРХНЯЯ ПАНЕЛЬ: РЕСУРСЫ --- */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-4">
                <div className="flex items-center gap-2 bg-[#1a1f35]/90 px-5 py-2 rounded-full border border-slate-700 shadow-lg backdrop-blur-sm">
                    <span className="text-xl drop-shadow-md">💰</span>
                    <span className="text-white font-black text-lg tracking-wide drop-shadow-md">{store.gold.toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#1a1f35]/90 px-5 py-2 rounded-full border border-slate-700 shadow-lg backdrop-blur-sm">
                    <span className="text-xl drop-shadow-md">💎</span>
                    <span className="text-white font-black text-lg tracking-wide drop-shadow-md">{store.crystals.toLocaleString('ru-RU')}</span>
                </div>
            </div>

            {/* --- ЛЕВОЕ МЕНЮ (SIDEBAR) --- */}
            <div className="absolute top-24 left-0 bottom-12 w-[280px] bg-[#1a1f35]/95 backdrop-blur-md rounded-tr-3xl rounded-br-3xl border-r border-t border-b border-slate-700 p-5 flex flex-col gap-3 pointer-events-auto shadow-2xl">
                <button className="flex items-center gap-4 bg-yellow-400 text-black px-5 py-4 rounded-2xl font-black text-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg">
                    <span className="text-2xl drop-shadow-sm">👑</span> ГЛАВНАЯ
                </button>
                <button className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg">
                    <span className="text-2xl opacity-80 drop-shadow-sm">🐾</span> ГЕРОИ
                </button>
                <button onClick={() => useGameStore.setState({ activeScreen: 'INVENTORY' })} className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg">
                    <span className="text-2xl opacity-80 drop-shadow-sm">🎒</span> ИНВЕНТАРЬ
                </button>
                <button className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg">
                    <span className="text-2xl opacity-80 drop-shadow-sm">🛒</span> МАГАЗИН
                </button>
                <button onClick={() => UIManager.getInstance().switchScreen(new BattleScene(), 'ARENA')} className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg mt-auto">
                    <span className="text-2xl opacity-80 drop-shadow-sm">⚔️</span> АРЕНА
                </button>
            </div>

            {/* --- ПРАВАЯ ПАНЕЛЬ (STATS) --- */}
            <div className="absolute top-24 right-8 w-[320px] bg-[#1e2336]/95 backdrop-blur-md rounded-[2rem] p-6 border border-slate-600 pointer-events-auto shadow-2xl flex flex-col gap-4">
                <div className="text-center mb-2">
                    <h2 className="text-white font-black text-3xl tracking-widest uppercase mb-1 drop-shadow-md">ПАНДА</h2>
                    <p className="text-yellow-400 font-bold tracking-widest text-sm drop-shadow-md">УРОВЕНЬ {store.level}</p>
                    <div className="w-full h-3 bg-gray-800 rounded-full mt-3 overflow-hidden border border-slate-700 shadow-inner">
                        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${expPercent}%` }}></div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between items-center bg-[#131726]/60 px-4 py-3 rounded-xl border border-slate-700/50">
                        <span className="text-gray-300 font-bold flex items-center gap-2 drop-shadow-sm"><span className="text-xl">❤️</span> ЗДОРОВЬЕ</span>
                        <span className="text-white font-black text-xl drop-shadow-md">{stats?.hp || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 px-4 py-3 rounded-xl border border-white/5">
                        <span className="text-gray-300 font-bold flex items-center gap-2 drop-shadow-sm"><span className="text-xl">⚔️</span> АТАКА</span>
                        <span className="text-white font-black text-xl drop-shadow-md">{stats?.attack || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#131726]/60 px-4 py-3 rounded-xl border border-slate-700/50">
                        <span className="text-gray-300 font-bold flex items-center gap-2 drop-shadow-sm"><span className="text-xl">⚡</span> СКОРОСТЬ</span>
                        <span className="text-white font-black text-xl drop-shadow-md">{stats?.speed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#131726]/60 px-4 py-3 rounded-xl border border-slate-700/50">
                        <span className="text-gray-300 font-bold flex items-center gap-2 drop-shadow-sm"><span className="text-xl">💥</span> КРИТ. ШАНС</span>
                        <span className="text-purple-400 font-black text-xl drop-shadow-md">{((stats?.critChance || 0) * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* --- НИЖНЯЯ КНОПКА (В БОЙ!) --- */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-auto">
                <button 
                    onClick={() => UIManager.getInstance().switchScreen(new BattleScene(), 'ARENA')} 
                    className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-400 to-yellow-600 border-b-8 border-yellow-800 px-24 py-6 rounded-2xl hover:scale-105 hover:brightness-110 active:scale-95 active:border-b-4 active:translate-y-2 transition-all shadow-[0_0_40px_rgba(234,179,8,0.4)] group">
                    <span className="text-4xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 0 #000' }}>
                        В БОЙ! ⚔️
                    </span>
                    <span className="text-sm font-bold text-yellow-100 opacity-80 mt-1 uppercase tracking-widest group-hover:opacity-100" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                        Быстрый поиск соперника
                    </span>
                </button>
            </div>
        </div>
    );
};

export default MainHUD;
