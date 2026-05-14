import React, { useEffect, useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { EditorPanel } from './EditorPanel';

export const NewHUD: React.FC = () => {
    const [scale, setScale] = useState(1);

    // Масштабирование с сохранением пропорций 16:9
    useEffect(() => {
        const handleResize = () => {
            const scaleX = window.innerWidth / 1920;
            const scaleY = window.innerHeight / 1080;
            // Гарантируем, что масштаб никогда не будет равен 0 (защита от краша рендера)
            setScale(Math.max(0.1, Math.min(scaleX, scaleY)));
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Инициализация при монтировании

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden font-sans select-none pointer-events-none">
            
            {/* Базовый контейнер 1920x1080 */}
            <div 
                className="relative w-[1920px] h-[1080px] shrink-0 bg-cover bg-center origin-center"
                style={{ 
                    transform: `scale(${scale})`, 
                    backgroundImage: "url('./bg_main.png')" 
                }}
            >
                {/* Виньетки для затемнения фона (КРИТИЧНО: правильный z-[5] для Tailwind) */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none z-[5]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none z-[5] h-[60%] top-auto" />

                {/* Левая панель */}
                <EditorPanel id="NewLeftPanel" className="absolute left-10 top-10 bottom-10 w-[400px] flex flex-col gap-6 z-20 pointer-events-auto">
                    
                    {/* Профиль */}
                    <div className="bg-black/40 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-slate-700 rounded-full border-4 border-blue-500 overflow-hidden shrink-0 flex items-center justify-center">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div className="flex-1 w-full">
                                <h2 className="text-2xl font-black tracking-wide text-white drop-shadow-md whitespace-nowrap">ИГРОК ВК</h2>
                                <div className="text-blue-400 font-bold mb-2 text-sm uppercase tracking-wider">Уровень 15</div>
                                <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 relative">
                                    <div className="absolute inset-y-0 left-0 w-[65%] bg-blue-500 shadow-[0_0_12px_#3b82f6]"></div>
                                    <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Вертикальное меню */}
                    <div className="flex-1 bg-black/40 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex flex-col gap-3 shadow-2xl overflow-y-auto">
                        
                        <button className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xl hover:scale-105 transition-transform duration-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            ГЛАВНАЯ
                        </button>
                        
                        {['ЗВЕРИ', 'ИНВЕНТАРЬ', 'МАГАЗИН', 'КЛАНЫ', 'РЕЙТИНГ'].map((item) => (
                            <button key={item} className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/20 text-white/80 font-bold text-xl hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200 border border-transparent hover:border-white/10">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                {item}
                            </button>
                        ))}

                        <button className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/20 text-white/80 font-bold text-xl hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200 border border-transparent hover:border-white/10">
                            <div className="relative">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-slate-900">2</span>
                            </div>
                            ПОЧТА
                        </button>

                        <button className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/20 text-white/80 font-bold text-xl hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200 border border-transparent hover:border-white/10 mt-auto">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            ОПЦИИ
                        </button>
                    </div>

                    {/* Сезон */}
                    <div className="bg-black/40 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                                <span className="text-2xl font-black text-yellow-400 tracking-wider drop-shadow-md">СЕЗОН 3</span>
                            </div>
                        </div>
                        <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/10 relative mt-1">
                            <div className="absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-yellow-500 to-yellow-300"></div>
                            <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                        </div>
                    </div>
                </EditorPanel>

                {/* Верхняя правая панель (Экономика) */}
                <EditorPanel id="NewTopRightPanel" className="absolute top-10 right-10 flex gap-5 z-20 pointer-events-auto">
                    {[
                        { icon: <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>, val: '15/30', color: 'text-white' },
                        { icon: <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" /></svg>, val: '14,250', color: 'text-yellow-400' },
                        { icon: <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.11 7.11C2.622 6.598 3.514 6 4.5 6h11c.986 0 1.878.598 2.39 1.11M12 2v4M8 2v4M4 10h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z" /></svg>, val: '1,200', color: 'text-purple-400' }
                    ].map((res, i) => (
                        <div key={i} className="flex items-center bg-black/40 backdrop-blur-md rounded-full pr-1 pl-5 py-1.5 border border-white/10 shadow-xl hover:scale-105 transition-transform cursor-pointer">
                            <div className="mr-3 drop-shadow-[0_0_10px_currentColor]">{res.icon}</div>
                            <span className={`text-2xl font-black tracking-wide mr-5 ${res.color} drop-shadow-md`} style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}>{res.val}</span>
                            <button className="w-10 h-10 bg-gradient-to-b from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-black text-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,197,94,0.5)] border border-green-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                            </button>
                        </div>
                    ))}
                </EditorPanel>

                {/* Правая панель (Статы) */}
                <EditorPanel id="NewStatsPanel" className="absolute right-10 top-1/2 -translate-y-1/2 w-[380px] bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-20 pointer-events-auto">
                    <div className="text-center mb-8 border-b border-white/10 pb-6">
                        <h1 className="text-5xl font-black text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,1)] mb-2" style={{ WebkitTextStroke: '1.5px black' }}>ПАНДА</h1>
                        <div className="text-orange-400 font-black uppercase tracking-[0.2em] text-sm mb-2 drop-shadow-md">Легендарный</div>
                        <div className="inline-block bg-white/10 px-4 py-1 rounded-full text-white/80 font-black text-lg border border-white/5">LVL 12</div>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                        {[
                            { name: 'Здоровье', val: '3250', pct: '80%', color: 'bg-green-500', glow: 'shadow-[0_0_10px_#22c55e]', icon: <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> },
                            { name: 'Атака', val: '570', pct: '45%', color: 'bg-red-500', glow: 'shadow-[0_0_10px_#ef4444]', icon: <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
                            { name: 'Скорость', val: '2.2', pct: '60%', color: 'bg-blue-400', glow: 'shadow-[0_0_10px_#60a5fa]', icon: <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                            { name: 'Крит. Шанс', val: '25%', pct: '25%', color: 'bg-purple-500', glow: 'shadow-[0_0_10px_#a855f7]', icon: <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg> }
                        ].map(stat => (
                            <div key={stat.name} className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        {stat.icon}
                                        <span className="text-white/80 font-bold text-xl uppercase tracking-wide">{stat.name}</span>
                                    </div>
                                    <span className="text-3xl font-black text-white" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}>{stat.val}</span>
                                </div>
                                <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                                    <div className={`absolute inset-y-0 left-0 ${stat.color} ${stat.glow}`} style={{ width: stat.pct }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </EditorPanel>

                {/* Нижний центр (Кнопка "В БОЙ") */}
                <EditorPanel id="NewBattleButton" className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <button 
                        onClick={() => useGameStore.getState().setScreen('BATTLE')}
                        className="relative group w-[580px] h-[170px] transition-transform hover:scale-105 active:scale-95 duration-200 ease-out"
                    >
                        
                        {/* Тень и 3D грань */}
                        <div className="absolute inset-0 bg-orange-950 rounded-[50px] translate-y-6 blur-[10px] opacity-80"></div>
                        <div className="absolute inset-0 bg-[#8a3300] rounded-[50px] border-b-[12px] border-[#5a1e00]"></div>
                        
                        {/* Основной градиент поверхности */}
                        <div className="absolute inset-0 bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 rounded-[50px] flex items-center justify-center overflow-hidden shadow-[inset_0_4px_15px_rgba(255,255,255,0.5)] border border-yellow-300">
                            
                            {/* Блик сверху */}
                            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent rounded-t-[50px]"></div>
                            
                            {/* Контент кнопки */}
                            <div className="flex items-center gap-6 z-10">
                                <svg className="w-20 h-20 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                <div className="flex flex-col items-start -mt-2">
                                    <span className="text-[80px] leading-none font-black text-white tracking-widest drop-shadow-[0_6px_6px_rgba(0,0,0,0.6)]" style={{ WebkitTextStroke: '2.5px #5a1e00', textShadow: '0px 10px 0px rgba(90,30,0,0.5)' }}>В БОЙ!</span>
                                    <span className="text-2xl font-black text-yellow-200 tracking-[0.3em] uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ml-2 mt-1">MASTERS OF THE WILD</span>
                                </div>
                            </div>
                        </div>

                        {/* Бейдж стоимости */}
                        <div className="absolute -top-6 -right-6 bg-slate-900 border-4 border-yellow-500 text-white font-black text-2xl px-6 py-2 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.6)] flex items-center gap-2 transform rotate-6 group-hover:rotate-12 transition-transform duration-300">
                            <svg className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            -5 ЭНЕРГИИ
                        </div>
                    </button>
                </EditorPanel>

                {/* Динамический рендеринг пользовательских UI-элементов из Unity / UIStore */}
                <div className="absolute inset-0 pointer-events-none z-[100]">
                    {Object.values(useUIStore((state: any) => state.elements)).filter((el: any) => el.type !== 'sprite').map((el: any) => {
                        return (
                            <div key={el.id} className="absolute pointer-events-auto" style={{ left: el.x, top: el.y }}>
                                {el.text && <div className="text-white font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap" style={{ color: el.color || el.tint || 'white' }}>{el.text}</div>}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
        </>
    );
};
