import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import '../../styles/profile-hub.css';

type TabType = 'avatar' | 'frame' | 'title';

export const ProfileHub: React.FC = () => {
    const { level, vipLevel, exp, vkUser, title } = useGameStore();

    const getBadgeColor = (lvl: number) => {
        if (lvl >= 72) return 'from-[#8c6a3d] to-[#1a150f]'; // Эфир (Золотое сияние)
        if (lvl >= 64) return 'from-[#4a2a5d] to-[#120a1a]'; // Аметист
        if (lvl >= 56) return 'from-[#6d1a1a] to-[#1a0a0a]'; // Рубин
        if (lvl >= 48) return 'from-[#1a3a5d] to-[#0a121a]'; // Сапфир
        if (lvl >= 40) return 'from-[#1a4d2a] to-[#0a1a0d]'; // Изумруд
        if (lvl >= 32) return 'from-[#b38b3b] to-[#2d1f0a]'; // Золото
        if (lvl >= 24) return 'from-[#7a7a7a] to-[#1a1a1a]'; // Серебро
        if (lvl >= 16) return 'from-[#8c4a2a] to-[#2d150a]'; // Бронза
        if (lvl >= 8)  return 'from-[#454d55] to-[#1a1c1e]'; // Железо
        return 'from-[#3d2b1f] to-[#1a0f0a]'; // Странник
    };

    const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('avatar');
    const maxExp = level * 600;
    const expPct = Math.min(100, (exp / maxExp) * 100);

    return (
        <>
            <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 15, opacity: 1 }}
                className="relative pointer-events-auto cursor-pointer"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    setIsCustomizationOpen(true);
                }}
                style={{
                    width: '465px',
                    height: '112px',
                    backgroundImage: `url(${AssetsMap.UI.PROFILE_PANEL_BASE})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    border: 'none'
                }}
            >
                {/* ШАГ 3: АВАТАР И НОВАЯ РАМКА */}
                <div className="absolute left-[-18px] top-[-20px] w-[160px] h-[160px] flex items-center justify-center">
                    {/* 1. Само изображение (Круг под рамкой) */}
                    <div className="w-[108px] h-[108px] rounded-full overflow-hidden bg-black/40 z-10 flex items-center justify-center relative translate-y-[1px]">
                        <img
                            src={vkUser?.photo_200 || "/assets/images/avatars/панда.webp"}
                            className="w-full h-full object-cover scale-105"
                            alt="avatar"
                        />
                    </div>

                    <img
                        src={AssetsMap.UI.AVATAR_FRAME_NEW}
                        className="absolute inset-0 w-full h-full pointer-events-none z-20"
                        alt="frame"
                    />

                    {/* 3. Элемент уровня (LVL BADGE) */}
                    <div className="absolute bottom-[8px] left-[112px] w-[40px] h-[40px] z-30 flex items-center justify-center">
                        {/* Подложка круга */}
                        <div className={`absolute inset-[4px] rounded-full bg-gradient-to-b ${getBadgeColor(level)} shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] border border-white/10`} />

                        <img
                            src={AssetsMap.UI.LVL_BADGE}
                            className="absolute inset-0 w-full h-full object-contain"
                            alt="lvl-bg"
                        />
                        <span style={{
                            position: 'relative',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                            fontWeight: 900,
                            color: '#fff',
                            textShadow: '0 2px 5px rgba(0,0,0,1)',
                            zIndex: 1,
                            marginTop: '-1px'
                        }}>
                            {level}
                        </span>
                    </div>
                </div>

                {/* VIP ПЛАШКА (ОРИГИНАЛЬНЫЙ СПРАЙТ + ФУНКЦИОНАЛ) */}
                <button
                    className="absolute left-[345px] top-[10px] flex items-center justify-center group z-[101] outline-none bg-transparent border-none p-0 cursor-pointer"
                    style={{ width: '105px', height: '38px' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        if ((window as any).setActiveHUDWindow) {
                            (window as any).setActiveHUDWindow('VIP');
                        }
                    }}
                >
                    <img
                        src={AssetsMap.UI.VIP_PLAQUE}
                        className="absolute inset-0 w-full h-full object-contain"
                        alt="vip"
                    />
                    <span style={{
                        position: 'relative',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '16px',
                        fontWeight: 900,
                        color: '#fff',
                        textShadow: '0 1px 3px rgba(0,0,0,1)',
                        zIndex: 1
                    }}>
                        VIP {vipLevel}
                    </span>
                </button>

                {/* ИМЯ И ЗВАНИЕ */}
                <div className="absolute left-[140px] top-[15px] flex items-center gap-0">
                    <img
                        src={AssetsMap.UI.ICON_CROWN}
                        className="w-[40px] h-[40px] object-contain relative"
                        style={{
                            left: '0px',
                            top: '3px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        }}
                        alt="crown"
                    />
                    <div className="flex flex-col items-start" style={{ marginLeft: '5px' }}>
                        <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '24px',
                            fontWeight: 900,
                            color: '#fff',
                            textShadow: '0 2px 4px rgba(0,0,0,1)',
                            letterSpacing: '2px',
                            lineHeight: '1.1'
                        }}>
                            {vkUser?.first_name || 'Мастер'}
                        </span>
                        <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#a0a0a0',
                            textShadow: '0 1px 2px rgba(0,0,0,1)',
                            letterSpacing: '1px',
                            marginTop: '-1px'
                        }}>
                            {title}
                        </span>
                    </div>
                </div>

                {/* ПОЛОСКА ОПЫТА */}
                <div className="absolute left-[130px] bottom-[11px] w-[280px] h-[35px] flex items-center justify-center">
                    <img
                        src={AssetsMap.UI.EXP_BAR_BG}
                        className="absolute inset-0 w-full h-full object-fill"
                        alt="exp-bg"
                    />

                    {/* Внутренняя полоска (заполнение) */}
                    <div className="absolute left-[15px] right-[50px] h-[22px] bg-black/50 rounded-full overflow-hidden border border-white/5" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${expPct}%` }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #001144 0%, #0044bb 100%)',
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6), 0 0 15px rgba(0,30,120,0.4)',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '9999px'
                            }}
                        />
                    </div>

                    {/* Текст опыта */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '10px',
                            fontWeight: 900,
                            color: '#fff',
                            textShadow: '0 1px 3px #000',
                            letterSpacing: '1px'
                        }}>
                            {exp} / {maxExp} XP
                        </span>
                    </div>
                </div>

                {/* КНОПКА НАСТРОЕК */}
                <button
                    className="absolute right-[15px] bottom-[8px] w-[50px] h-[50px] flex items-center justify-center cursor-pointer group z-[100] outline-none bg-transparent border-none p-0"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if ((window as any).setActiveHUDWindow) {
                            (window as any).setActiveHUDWindow('PROFILE_CUSTOM');
                        }
                    }}
                >
                    <img
                        src={AssetsMap.UI.ICON_SETTINGS_PROFILE}
                        className="w-[34px] h-[34px] object-contain transition-all duration-300 group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
                        alt="settings"
                    />
                </button>
            </motion.div>

            {/* ОКНО КАСТОМИЗАЦИИ — Телепортируем в корень body для 100% центрирования */}
            {createPortal(
                <AnimatePresence>
                    {isCustomizationOpen && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-[500px] bg-[#1a1512] border-2 border-[#c48b3b]/50 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Шапка */}
                                <div className="p-4 border-b border-[#c48b3b]/20 flex justify-between items-center bg-[#251d18]">
                                    <h2 className="text-[#c48b3b] font-bold text-xl uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                                        Настройки Профиля
                                    </h2>
                                    <button
                                        onClick={() => setIsCustomizationOpen(false)}
                                        className="text-[#c48b3b] hover:text-white transition-colors text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Вкладки */}
                                <div className="flex bg-[#0f0a07]">
                                    {(['avatar', 'frame', 'title'] as TabType[]).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 p-3 text-sm uppercase tracking-wider font-bold transition-all border-b-2 ${activeTab === tab
                                                ? 'text-[#c48b3b] border-[#c48b3b] bg-[#1a1512]'
                                                : 'text-[#5a4a3a] border-transparent hover:text-[#c48b3b]/60'
                                                }`}
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            {tab === 'avatar' && 'Аватар'}
                                            {tab === 'frame' && 'Рамка'}
                                            {tab === 'title' && 'Звание'}
                                        </button>
                                    ))}
                                </div>

                                {/* Контент */}
                                <div className="p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="w-full"
                                    >
                                        {activeTab === 'avatar' && (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-24 h-24 rounded-full border-2 border-[#c48b3b] overflow-hidden shadow-[0_0_20px_rgba(196,139,59,0.3)]">
                                                    <img src="/assets/images/avatars/панда.webp" className="w-full h-full object-cover" alt="current-avatar" />
                                                </div>
                                                <p className="text-[#8a7a6a] italic">Выберите ваш облик в мире Masters of the Wild</p>
                                                <div className="grid grid-cols-3 gap-3 mt-4">
                                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                                        <div key={i} className="w-16 h-16 bg-[#0f0a07] border border-[#c48b3b]/20 rounded-lg hover:border-[#c48b3b] cursor-pointer transition-colors shadow-inner" />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'frame' && (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-24 h-24 relative flex items-center justify-center">
                                                    <img src={AssetsMap.UI.AVATAR_FRAME_NEW} className="absolute inset-0 w-full h-full object-contain" alt="current-frame" />
                                                    <div className="w-16 h-16 rounded-full overflow-hidden">
                                                        <img src="/assets/images/avatars/панда.webp" className="w-full h-full object-cover" alt="avatar" />
                                                    </div>
                                                </div>
                                                <p className="text-[#8a7a6a] italic">Рамка подчеркивает ваше величие</p>
                                                <div className="grid grid-cols-2 gap-4 mt-4 w-full px-10">
                                                    <div className="p-3 bg-[#0f0a07] border border-[#c48b3b] rounded-lg text-[#c48b3b] text-xs font-bold shadow-lg">Стандартная</div>
                                                    <div className="p-3 bg-[#0f0a07] border border-[#c48b3b]/20 rounded-lg text-[#5a4a3a] text-xs font-bold opacity-50">Золотая (VIP)</div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'title' && (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-[#0f0a07] border-2 border-[#c48b3b]/50 rounded-lg shadow-inner">
                                                    <span className="text-[#c48b3b] text-lg font-bold tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                                                        Masters of the Wild
                                                    </span>
                                                </div>
                                                <p className="text-[#8a7a6a] italic">Звание, которое знают все враги</p>
                                                <div className="flex flex-col gap-2 mt-4 w-full px-10 text-left">
                                                    <div className="p-2 border-b border-[#c48b3b]/20 text-[#c48b3b] text-sm font-bold">Новичок</div>
                                                    <div className="p-2 border-b border-[#c48b3b]/20 text-[#c48b3b] text-sm font-bold bg-[#c48b3b]/10">Masters of the Wild</div>
                                                    <div className="p-2 border-b border-[#c48b3b]/20 text-[#5a4a3a] text-sm font-bold opacity-50 italic">Завоеватель (Заблокировано)</div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Футер */}
                                <div className="p-4 bg-[#0f0a07] border-t border-[#c48b3b]/20 flex gap-3">
                                    <button
                                        onClick={() => setIsCustomizationOpen(false)}
                                        className="flex-1 py-3 bg-gradient-to-b from-[#c48b3b] to-[#8a622a] text-black font-bold uppercase rounded shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-transform"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={() => setIsCustomizationOpen(false)}
                                        className="px-8 py-3 bg-[#251d18] text-[#c48b3b] font-bold uppercase rounded border border-[#c48b3b]/30 hover:bg-[#1a1512] transition-colors"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
