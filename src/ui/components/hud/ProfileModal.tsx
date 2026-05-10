import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, Shield, Award } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { GfxWoodPanel, GfxMenuButton, AvatarFrame } from './SharedUI';
import { cn } from '../../../utils/cn';
import { resolveAssetPath } from '../../../utils/assetPath';

export const AVATARS_DATA = [
    { id: 'баран.png',     label: 'Баран' },
    { id: 'кабан.png',     label: 'Кабан' },
    { id: 'кот.png',       label: 'Кот' },
    { id: 'крокодил.png',  label: 'Крокодил' },
    { id: 'лев.png',       label: 'Лев' },
    { id: 'лось.png',      label: 'Лось' },
    { id: 'медведь.png',   label: 'Медведь' },
    { id: 'носорог.png',   label: 'Носорог' },
    { id: 'обезьяна.png',  label: 'Обезьяна' },
    { id: 'панда.png',     label: 'Панда' },
    { id: 'пантера.png',   label: 'Пантера' },
    { id: 'тигр.png',      label: 'Тигр' },
];

export const FRAMES_DATA = [
    { id: 'Рамка 1.png', label: 'Лесная' },
    { id: 'Рамка 2.png', label: 'Огненная' },
    { id: 'Рамка 3.png', label: 'Костяная' },
    { id: 'Рамка 4.png', label: 'Ледяная' },
    { id: 'Рамка 5.png', label: 'Стимпанк' },
    { id: 'Рамка 6.png', label: 'Бронзовая' },
];

export const ProfileModal: React.FC = () => {
    const { 
        isProfileModalOpen, 
        setProfileModalOpen, 
        avatar, 
        frame, 
        title, 
        updateProfile 
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<'avatars' | 'frames' | 'titles'>('avatars');

    if (!isProfileModalOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto"
                onClick={() => setProfileModalOpen(false)}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="relative w-full max-w-[900px] h-[750px] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GfxWoodPanel className="w-full h-full flex flex-col p-8">
                        
                        {/* HEADER */}
                        <div className="flex items-center justify-between py-2 shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <Award className="text-amber-400" size={32} />
                                <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    Настройка Профиля
                                </h2>
                            </div>
                            <button 
                                onClick={() => setProfileModalOpen(false)}
                                className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                <X size={28} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden mt-6 gap-6">
                            {/* SIDEBAR */}
                            <div className="w-[200px] flex flex-col gap-3 shrink-0">
                                {[
                                    { id: 'avatars', label: 'АВАТАРЫ', Icon: Camera },
                                    { id: 'frames',  label: 'РАМКИ',   Icon: Shield },
                                    { id: 'titles',  label: 'ЗВАНИЯ',  Icon: Award },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-4 px-5 py-4 rounded-xl font-black text-[11px] tracking-[0.25em] transition-all border",
                                            activeTab === tab.id 
                                                ? "bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-inner" 
                                                : "text-stone-500 border-transparent hover:text-stone-300 hover:bg-white/5"
                                        )}
                                    >
                                        <tab.Icon size={16} strokeWidth={3} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* CONTENT AREA */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-black/40 rounded-2xl border border-white/5">
                                
                                {activeTab === 'avatars' && (
                                    <div className="grid grid-cols-4 gap-4">
                                        {AVATARS_DATA.map((av) => (
                                            <motion.button
                                                key={av.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => updateProfile({ avatar: av.id })}
                                                className={cn(
                                                    "relative aspect-square rounded-2xl flex items-center justify-center bg-stone-900/50 border-2 transition-all overflow-hidden group shadow-xl",
                                                    avatar === av.id 
                                                        ? "border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                                                        : "border-stone-800 hover:border-amber-600/60"
                                                )}
                                            >
                                                <div className="w-full h-full p-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                    <img src={resolveAssetPath(`/assets/images/avatars/${av.id}`)} alt={av.label} className="w-full h-full object-contain" />
                                                </div>
                                                
                                                {avatar === av.id && (
                                                    <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'frames' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {FRAMES_DATA.map((fr) => (
                                            <button
                                                key={fr.id}
                                                onClick={() => updateProfile({ frame: fr.id })}
                                                className={cn(
                                                    "group flex items-center justify-between p-4 rounded-xl border-2 transition-all bg-stone-900/40",
                                                    frame === fr.id ? "border-amber-400 bg-amber-600/10" : "border-transparent hover:border-amber-700/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-xl bg-stone-950 flex items-center justify-center shadow-inner">
                                                        <AvatarFrame avatarFilename={avatar.replace('.png','')} frameFilename={fr.id.replace('.png','')} size={70} />
                                                    </div>
                                                    <span className="font-black text-lg tracking-widest text-white uppercase group-hover:text-amber-400 transition-colors">{fr.label}</span>
                                                </div>
                                                {frame === fr.id && (
                                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                                        <Check className="text-white" size={18} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'titles' && (
                                    <div className="flex flex-col gap-3">
                                        {['ЛЕГЕНДА АРЕНЫ', 'НОВИЧОК', 'ВОИН ДВОРА', 'МАСТЕР ЗВЕРЕЙ'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => updateProfile({ title: t })}
                                                className={cn(
                                                    "group flex items-center justify-between p-6 rounded-xl border-2 transition-all bg-stone-900/40",
                                                    title === t ? "border-amber-400 bg-amber-600/10 shadow-xl" : "border-transparent hover:border-amber-700/50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-black text-xl tracking-[0.3em] uppercase drop-shadow-lg transition-all",
                                                    title === t ? "text-amber-400 scale-105" : "text-stone-500 group-hover:text-stone-300"
                                                )}>
                                                    {t}
                                                </span>
                                                {title === t && (
                                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                                        <Check className="text-white" size={24} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="py-6 flex justify-end shrink-0 gap-4">
                            <GfxMenuButton onClick={() => setProfileModalOpen(false)} variant="gold" className="w-[240px] h-[60px]">
                                <span className="font-black text-amber-950 uppercase tracking-widest">Применить</span>
                            </GfxMenuButton>
                        </div>
                    </GfxWoodPanel>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
