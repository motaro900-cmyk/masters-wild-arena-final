import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { HEROES_DB } from '../../configs/HeroesConfig';

const MainHUD = React.memo(() => {
    const selectedHeroId = useGameStore((state) => state.selectedHeroId);
    const exp = useGameStore((state) => state.exp);
    const level = useGameStore((state) => state.level);
    const attack = useGameStore((state) => state.attack);
    const defense = useGameStore((state) => state.defense);
    const hp = useGameStore((state) => state.hp);
    const setScreen = useGameStore((state) => state.setScreen);
    const goToInventory = useGameStore((state) => state.goToInventory);
    const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);

    const heroConfig = HEROES_DB.find((h) => h.id === selectedHeroId) || HEROES_DB[0];
    const expPercent = Math.min(100, Math.max(0, (exp / (level * 100)) * 100));

    return (
        <div className="absolute inset-0 pointer-events-none select-none font-['Inter',sans-serif]">
            {/* --- ПРОФИЛЬ ИГРОКА --- */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-6 left-8 flex items-center gap-4 pointer-events-auto"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <img
                        src={heroConfig.image}
                        className="w-16 h-16 rounded-2xl border-2 border-yellow-500/50 object-cover shadow-2xl relative bg-[#131726]"
                        alt="Avatar"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-md border border-black shadow-lg">
                        VIP
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-base leading-tight tracking-wide drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                        {heroConfig.name}
                    </span>
                    <span className="text-yellow-400 font-bold text-xs tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        Уровень {level}
                    </span>
                    <div className="w-24 h-2 bg-gray-900 rounded-full mt-1 overflow-hidden border border-gray-900 shadow-inner relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${expPercent}%` }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        ></motion.div>
                    </div>
                </div>
            </motion.div>

            {/* --- ЛЕВОЕ МЕНЮ (SIDEBAR) --- */}
            <div className="absolute top-24 left-0 bottom-12 w-[280px] bg-[#1a1f35]/95 backdrop-blur-md rounded-tr-3xl rounded-br-3xl border-r border-t border-b border-slate-700 p-5 flex flex-col gap-3 pointer-events-auto shadow-2xl">
                <button className="flex items-center gap-4 bg-yellow-400 text-black px-5 py-4 rounded-2xl font-black text-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-lg">
                    <span className="text-2xl drop-shadow-sm">👑</span> ГЛАВНАЯ
                </button>
                <button
                    onClick={() => setScreen('HEROES')}
                    className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                >
                    <span className="text-2xl opacity-80 drop-shadow-sm">🐾</span> ГЕРОИ
                </button>
                <button
                    onClick={() => goToInventory()}
                    className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                >
                    <span className="text-2xl opacity-80 drop-shadow-sm">🎒</span> ИНВЕНТАРЬ
                </button>
                <button
                    onClick={() => setScreen('SHOP')}
                    className="flex items-center gap-4 bg-[#131726]/80 text-white px-5 py-4 rounded-2xl font-bold text-lg border-b-4 border-slate-900 hover:bg-slate-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                >
                    <span className="text-2xl opacity-80 drop-shadow-sm">🛒</span> МАГАЗИН
                </button>

                {/* --- КНОПКА АРЕНЫ С ПУЛЬСАЦИЕЙ --- */}
                <motion.button
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    onClick={() => setScreen('BATTLE')}
                    className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-4 rounded-2xl font-black text-xl border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] mt-auto"
                >
                    <span className="text-2xl drop-shadow-sm">⚔️</span> АРЕНА
                </motion.button>
            </div>

            {/* --- ПРАВАЯ ПАНЕЛЬ (STATS) --- */}
            <div className="absolute top-24 right-8 w-[320px] bg-[#1e2336]/95 backdrop-blur-md rounded-[2rem] p-6 border border-slate-600 pointer-events-auto shadow-2xl flex flex-col gap-4">
                <div className="text-center mb-2">
                    <h2 className="text-white font-black text-3xl tracking-widest uppercase mb-1 drop-shadow-md">
                        {heroConfig.name}
                    </h2>
                    <p className="text-yellow-400 font-bold tracking-widest text-sm drop-shadow-md">
                        {heroConfig.title}
                    </p>
                    <div className="w-full h-3 bg-gray-850 rounded-full mt-3 overflow-hidden border border-slate-700 shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${expPercent}%` }}
                            className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                        ></motion.div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                    <StatRow label="АТАКА" value={attack} icon="⚔️" color="#ef4444" />
                    <StatRow label="ЗАЩИТА" value={defense} icon="🛡️" color="#3b82f6" />
                    <StatRow label="ЗДОРОВЬЕ" value={hp} icon="❤️" color="#22c55e" />
                    <StatRow
                        label="КРИТ"
                        value={`${Math.round(getCalculatedStats(selectedHeroId || 'panda').total.critChance)}%`}
                        icon="🎯"
                        color="#a855f7"
                    />
                    <StatRow
                        label="СКОРОСТЬ"
                        value={getCalculatedStats(selectedHeroId || 'panda').total.speed.toFixed(1)}
                        icon="⚡"
                        color="#fcd34d"
                    />
                </div>
            </div>
        </div>
    );
});

const StatRow = React.memo(({ label, value, icon, color }: any) => (
    <div className="flex justify-between items-center bg-[#131726]/60 px-4 py-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/80 transition-colors">
        <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <span className="text-slate-400 font-bold text-xs tracking-widest">{label}</span>
        </div>
        <span className="text-white font-black text-lg" style={{ color: value > 100 ? color : '#fff' }}>
            {value}
        </span>
    </div>
));

export default MainHUD;
