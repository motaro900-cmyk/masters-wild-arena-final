import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, Shield, Award } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { AvatarFrame } from './SharedUI';
import { cn } from '../../../utils/cn';
import { resolveAssetPath } from '../../../utils/assetPath';

interface ProfileWindowProps {
    onClose?: () => void;
}

export const ProfileWindow: React.FC<ProfileWindowProps> = ({ onClose }) => {
    const { 
        avatar, 
        frame, 
        title, 
        setAvatar, 
        setFrame, 
        setTitle,
        vkUser
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<'avatars' | 'frames' | 'titles'>('avatars');
    const [selectedAvatar, setSelectedAvatar] = useState(avatar);
    const [selectedFrame, setSelectedFrame] = useState(frame);
    const [selectedTitle, setSelectedTitle] = useState(title);

    const handleSave = () => {
        setAvatar(selectedAvatar);
        setFrame(selectedFrame);
        setTitle(selectedTitle);
        if (onClose) onClose();
    };

    const AVATARS_DATA = [
        'панда.png', 'лев.png', 'тигр.png', 'обезьяна.png', 'баран.png', 'кабан.png', 'кот.png', 'крокодил.png', 'лось.png', 'медведь.png', 'носорог.png', 'пантера.png'
    ];
    const FRAMES_DATA = [
        'Рамка 1.png', 'Рамка 2.png', 'Рамка 3.png', 'Рамка 4.png', 'Рамка 5.png', 'Рамка 6.png'
    ];
    const TITLES_DATA = [
        'ЛЕГЕНДА АРЕНЫ', 'НОВИЧОК', 'ВОИН ДВОРА', 'МАСТЕР ЗВЕРЕЙ', 'СОКРУШИТЕЛЬ', 'ВЕЧНЫЙ', 'МУДРЫЙ БАМБУК'
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-[1100px] h-[800px] flex flex-col overflow-hidden rounded-[40px] border-[3px] border-[#c8a870]/30 shadow-[0_0_100px_rgba(0,0,0,1)] bg-[#0a0a0c] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* BACKGROUND DECORATION */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#c8a87033_0%,transparent_70%)]" />
                     <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: `url(${resolveAssetPath('/assets/images/ui/panel_parchment.png')})`, backgroundSize: 'cover' }} />
                </div>

                {/* HEADER */}
                <div className="relative z-10 flex items-center justify-between px-10 py-8 shrink-0 bg-gradient-to-b from-black/40 to-transparent">
                    <div className="flex flex-col">
                        <h2 className="text-4xl font-black text-[#f0c040] tracking-[0.3em] uppercase drop-shadow-[0_0_20px_rgba(240,192,64,0.3)]" style={{ fontFamily: "'Cinzel', serif" }}>
                            Профиль Героя
                        </h2>
                        <p className="text-[#c8a870]/60 text-sm font-bold tracking-[0.4em] uppercase mt-1">Персонализация внешнего вида</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-14 h-14 rounded-2xl bg-black/40 border-2 border-[#c8a870]/20 flex items-center justify-center text-[#c8a870] hover:bg-[#c8a870] hover:text-black transition-all shadow-xl active:scale-90"
                    >
                        <X size={32} strokeWidth={3} />
                    </button>
                </div>

                <div className="relative z-10 flex flex-1 overflow-hidden px-10 pb-10 gap-10">
                    
                    {/* LEFT: PREVIEW PANEL */}
                    <div className="w-[400px] flex flex-col items-center justify-center bg-black/40 rounded-[32px] border border-white/5 p-10 shadow-inner relative overflow-hidden group shrink-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,192,64,0.1)_0%,transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <motion.div
                            key={`${selectedAvatar}-${selectedFrame}`}
                            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="relative z-10"
                        >
                            <AvatarFrame 
                                avatarFilename={(vkUser?.photo || selectedAvatar).replace('.png','')} 
                                frameFilename={selectedFrame.replace('.png','')} 
                                size={280} 
                                showGlow={true}
                            />
                        </motion.div>

                        <div className="mt-12 text-center z-10">
                            <motion.div
                                key={selectedTitle}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="px-6 py-2 bg-[#f0c040] text-black font-black text-xs tracking-[0.5em] uppercase rounded-full shadow-[0_0_30px_rgba(240,192,64,0.4)]"
                            >
                                {selectedTitle}
                            </motion.div>
                            <h3 className="text-3xl font-black text-white mt-4 tracking-tighter uppercase italic" style={{ fontFamily: "'Cinzel', serif" }}>
                                {vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : "ИГРОК ВК"}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#c8a870]" />
                                <span className="text-[10px] font-bold text-[#c8a870] tracking-[0.3em]">ЛЕГЕНДА АРЕНЫ</span>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#c8a870]" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: SELECTION AREA */}
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                        
                        {/* TABS */}
                        <div className="flex gap-4 p-1.5 bg-black/40 rounded-2xl border border-white/5 shrink-0">
                            {[
                                { id: 'avatars', label: 'АВАТАРЫ', Icon: Camera },
                                { id: 'frames',  label: 'РАМКИ',   Icon: Shield },
                                { id: 'titles',  label: 'ЗВАНИЯ',  Icon: Award },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-black text-[10px] tracking-[0.2em] transition-all border-2",
                                        activeTab === tab.id 
                                            ? "bg-[#c8a870] text-black border-[#f0c040] shadow-[0_0_20px_rgba(200,168,112,0.3)]" 
                                            : "text-stone-500 border-transparent hover:text-stone-300 hover:bg-white/5"
                                    )}
                                >
                                    <tab.Icon size={14} strokeWidth={3} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* SCROLLABLE GRID */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 overflow-x-hidden">
                            <AnimatePresence mode="wait">
                                {activeTab === 'avatars' && (
                                    <motion.div 
                                        key="avatars"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-4 gap-4"
                                    >
                                        {AVATARS_DATA.map((av) => (
                                            <motion.button
                                                key={av}
                                                whileHover={{ scale: 1.05, y: -5 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedAvatar(av)}
                                                className={cn(
                                                    "relative aspect-square rounded-[24px] flex items-center justify-center bg-stone-900/30 border-2 transition-all overflow-hidden group",
                                                    selectedAvatar === av 
                                                        ? "border-[#f0c040] shadow-[0_0_25px_rgba(240,192,64,0.2)] bg-[#f0c040]/10" 
                                                        : "border-white/5 hover:border-[#c8a870]/40 hover:bg-white/5"
                                                )}
                                            >
                                                <div className="w-full h-full p-3 flex items-center justify-center group-hover:scale-115 transition-transform duration-700">
                                                    <img src={resolveAssetPath(`/assets/images/avatars/${av}`)} alt="" className="w-full h-full object-contain" />
                                                </div>
                                                {selectedAvatar === av && (
                                                    <div className="absolute top-3 right-3 w-6 h-6 bg-[#f0c040] rounded-full flex items-center justify-center shadow-lg">
                                                        <Check className="text-black" size={14} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'frames' && (
                                    <motion.div 
                                        key="frames"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        {FRAMES_DATA.map((fr) => (
                                            <button
                                                key={fr}
                                                onClick={() => setSelectedFrame(fr)}
                                                className={cn(
                                                    "group flex flex-col items-center p-6 rounded-[32px] border-2 transition-all bg-black/40",
                                                    selectedFrame === fr 
                                                        ? "border-[#f0c040] bg-[#f0c040]/10 shadow-xl" 
                                                        : "border-white/5 hover:border-[#c8a870]/40"
                                                )}
                                            >
                                                <AvatarFrame avatarFilename={selectedAvatar.replace('.png','')} frameFilename={fr.replace('.png','')} size={120} showGlow={selectedFrame === fr} />
                                                <span className={cn(
                                                    "mt-4 font-black text-xs tracking-[0.3em] uppercase transition-colors",
                                                    selectedFrame === fr ? "text-[#f0c040]" : "text-stone-500 group-hover:text-stone-300"
                                                )}>
                                                    {fr.replace('.png','')}
                                                </span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'titles' && (
                                    <motion.div 
                                        key="titles"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col gap-3"
                                    >
                                        {TITLES_DATA.map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setSelectedTitle(t)}
                                                className={cn(
                                                    "group flex items-center justify-between px-8 py-6 rounded-2xl border-2 transition-all bg-black/40",
                                                    selectedTitle === t ? "border-[#f0c040] bg-[#f0c040]/10" : "border-white/5 hover:border-[#c8a870]/40"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-black text-xl tracking-[0.4em] uppercase drop-shadow-lg transition-all",
                                                    selectedTitle === t ? "text-[#f0c040] scale-105" : "text-stone-500 group-hover:text-stone-300"
                                                )}>
                                                    {t}
                                                </span>
                                                {selectedTitle === t && (
                                                    <Check className="text-[#f0c040]" size={24} strokeWidth={4} />
                                                )}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* APPLY BUTTON */}
                        <div className="mt-auto pt-6 flex justify-end">
                            <button 
                                onClick={handleSave}
                                className="w-full h-[75px] bg-gradient-to-r from-[#c8a870] to-[#f0c040] hover:brightness-110 active:scale-95 transition-all rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(240,192,64,0.3)] group"
                            >
                                <span className="font-black text-black text-lg uppercase tracking-[0.3em]">Сохранить изменения</span>
                                <Check className="ml-4 text-black group-hover:scale-125 transition-transform" size={24} strokeWidth={4} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
