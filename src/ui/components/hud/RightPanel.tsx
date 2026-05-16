import React, { useState } from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';

interface RightPanelProps {
    onOpenWindow: (name: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ onOpenWindow }) => {
    const [isTasksExpanded, setIsTasksExpanded] = useState(true); // Открыто по умолчанию для проверки
    const whiteText = { color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,1)' };

    const dailyTasks = [
        { label: 'Войти в игру', g: 100, done: true },
        { label: 'Сыграть 2 матча', g: 200, done: false },
        { label: 'Победить 2 раза', g: 300, done: false },
    ];

    return (
        <div className="flex flex-col gap-4 items-end mr-2">
            {/* ЕЖЕДНЕВНЫЙ ПОДАРОК */}
            <div
                onClick={() => onOpenWindow('GIFT')}
                className="relative w-[270px] h-[110px] cursor-pointer transition-all hover:scale-105"
            >
                <img src={AssetsMap.UI.ICON_GIFT} className="w-full h-full object-contain" alt="" />
                <div className="absolute inset-0 flex items-center justify-center pt-2 pl-12">
                    <span
                        className="font-header text-[15px] font-bold text-center leading-tight uppercase tracking-wide"
                        style={whiteText}
                    >
                        ПОДАРОК
                    </span>
                </div>
            </div>

            {/* КВЕСТЫ */}
            <div className="relative w-[340px] h-[220px]">
                <img
                    src={AssetsMap.UI.PANEL_TASK}
                    className="absolute inset-0 w-full h-full object-contain opacity-95"
                    alt=""
                />
                <div className="relative z-10 pt-[35px] px-[45px]">
                    <h2
                        className="font-header text-center text-[20px] font-bold tracking-widest mb-4 uppercase"
                        style={whiteText}
                    >
                        КВЕСТЫ
                    </h2>
                    {[
                        { label: 'СЫГРАТЬ 3 МАТЧА', cur: 1, max: 3 },
                        { label: 'ПОБЕДИТЬ 1 РАЗ', cur: 0, max: 1 },
                    ].map((q, i) => (
                        <div key={i} className="mb-4">
                            <div
                                className="flex justify-between font-ui text-[12px] text-white font-bold mb-1 uppercase"
                                style={whiteText}
                            >
                                <span>{q.label}</span>
                                <span>
                                    {q.cur}/{q.max}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-black/60 rounded-full border border-amber-900/30 overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                                    style={{ width: `${(q.cur / q.max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ЕЖЕДНЕВНЫЕ ЗАДАНИЯ (ИСПОЛЬЗУЕМ НОВЫЙ СПРАЙТ) */}
            <div
                className={`relative w-[380px] transition-all duration-300 ease-in-out ${isTasksExpanded ? 'h-[460px]' : 'h-[60px]'}`}
            >
                {/* НОВЫЙ СПРАЙТ ПЕРГАМЕНТА С ЛИНИЯМИ */}
                <img
                    src={AssetsMap.UI.PANEL_PARCHMENT}
                    className="absolute inset-0 w-full h-full object-fill drop-shadow-2xl"
                    alt="parchment"
                />

                {/* Заголовок */}
                <div
                    onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                    className="absolute top-0 left-0 w-full h-[65px] flex items-center justify-center cursor-pointer z-20"
                >
                    <h2
                        className="font-header text-center text-[24px] font-black tracking-widest uppercase"
                        style={whiteText}
                    >
                        ЗАДАНИЯ ДНЯ {isTasksExpanded ? '▼' : '▲'}
                    </h2>
                </div>

                {/* Список заданий, подогнанный под линии спрайта */}
                {isTasksExpanded && (
                    <div className="absolute top-[75px] left-[55px] right-[55px] bottom-[30px] flex flex-col pointer-events-auto">
                        {dailyTasks.map((t, i) => (
                            <div
                                key={i}
                                className="relative flex items-center justify-between h-[73px]" // Высота подогнана под линии пергамента
                            >
                                <div className="flex flex-col justify-center">
                                    <span className="font-ui text-[14px] font-bold leading-tight" style={whiteText}>
                                        {t.label}
                                    </span>
                                    <span
                                        className="font-ui text-[12px] font-black mt-1"
                                        style={{ color: '#FFD700', textShadow: '1px 1px 2px black' }}
                                    >
                                        💰 {t.g}
                                    </span>
                                </div>

                                {t.done ? (
                                    <div className="bg-green-700/90 border border-green-400 rounded-md px-4 py-1 font-ui text-white text-[12px] font-black uppercase shadow-lg flex items-center justify-center">
                                        ВЗЯТО
                                    </div>
                                ) : (
                                    <button className="bg-amber-800 hover:bg-amber-700 border border-amber-400 rounded-md px-6 py-2 font-ui text-white text-[13px] font-black uppercase transition-all active:scale-95 shadow-lg flex items-center justify-center">
                                        ОК
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
