import React, { useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';

export const ProfileWindow: React.FC = () => {
    const store = useGameStore();
    const { vkUser } = useGameStore();
    const [activeTab, setActiveTab] = useState<'AVATARS' | 'FRAMES' | 'TITLES'>('AVATARS');
    const [selectedAvatar, setSelectedAvatar] = useState(store.avatar);
    const [selectedFrame, setSelectedFrame] = useState(store.frame);
    const [selectedTitle, setSelectedTitle] = useState(store.title);

    const handleSave = () => {
        store.setAvatar(selectedAvatar);
        store.setFrame(selectedFrame);
        store.setTitle(selectedTitle);
        // [Lead Architect]: Интегрировать красивый Toast вместо alert
    };

    const avatars = ['панда.png', 'лев.png', 'тигр.png', 'обезьяна.png', 'баран.png', 'кабан.png', 'кот.png', 'крокодил.png', 'лось.png', 'медведь.png', 'носорог.png', 'пантера.png'];
    const frames = ['Рамка 1.png', 'Рамка 2.png', 'Рамка 3.png', 'Рамка 4.png', 'Рамка 5.png', 'Рамка 6.png'];
    const titles = ['МАСТЕР АРЕНЫ', 'ЛОВЕЦ СУДЬБЫ', 'ЗАЩИТНИК ЛЕСА', 'ЛЕГЕНДА ПАНТЕОНА', 'ГРОЗА ВОЛКОВ', 'МУДРЫЙ БАМБУК'];

    const goldGlow = { filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))' };

    // Защита: на случай, если в сторе лежит старый абсолютный путь
    const avatarUrl = selectedAvatar?.includes('/') ? selectedAvatar : resolveAssetPath(`/assets/images/avatars/${selectedAvatar}`);

    return (
        <div className="flex flex-col h-full gap-8 p-4">
            
            {/* ШАПКА КАРТОЧКИ */}
            <div className="relative p-10 bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex items-center gap-10 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative w-32 h-32 flex-shrink-0">
                    <img 
                        src={vkUser?.photo || avatarUrl} 
                        className="absolute inset-[15%] w-[70%] h-[70%] object-contain rounded-full" 
                        alt=""
                    />
                    <img 
                        src={resolveAssetPath(`/assets/images/frames/${selectedFrame}`)} 
                        className="absolute inset-0 w-full h-full object-contain" 
                        style={goldGlow}
                        alt=""
                    />
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-1" style={goldGlow}>
                        {vkUser?.firstName ? `${vkUser.firstName} ${vkUser.lastName}` : "ИГРОК ВК"}
                    </h2>
                    <div className="text-amber-500 font-black text-sm uppercase tracking-[0.2em]">{selectedTitle}</div>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/40 border border-white/5 uppercase">LVL 24</div>
                        <div className="px-4 py-1 bg-amber-500/20 rounded-full text-[10px] font-black text-amber-500 border border-amber-500/20 uppercase">RANK: ALMAZ</div>
                    </div>
                </div>
            </div>

            {/* ТАБЫ */}
            <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5">
                {[
                    { id: 'AVATARS', label: 'АВАТАРЫ' },
                    { id: 'FRAMES', label: 'РАМКИ' },
                    { id: 'TITLES', label: 'ЗВАНИЯ' }
                ].map((t) => (
                    <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === t.id ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-white/40 hover:text-white'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* СЕТКА КОНТЕНТА */}
            <div className="flex-1 bg-black/20 rounded-[2rem] border border-white/5 p-6 overflow-y-auto custom-scrollbar">
                {activeTab === 'AVATARS' && (
                    <div className="grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
                        {avatars.map(av => (
                            <button 
                                key={av} 
                                onClick={() => setSelectedAvatar(av)}
                                className={`aspect-square relative rounded-2xl border-2 transition-all p-2 ${selectedAvatar === av ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                            >
                                <img src={resolveAssetPath(`/assets/images/avatars/${av}`)} className="w-full h-full object-contain" alt="" />
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'FRAMES' && (
                    <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                        {frames.map(fr => (
                            <button 
                                key={fr} 
                                onClick={() => setSelectedFrame(fr)}
                                className={`aspect-square relative rounded-3xl border-2 transition-all p-4 ${selectedFrame === fr ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                            >
                                <img src={resolveAssetPath(`/assets/images/frames/${fr}`)} className="w-full h-full object-contain" alt="" />
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'TITLES' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                        {titles.map(title => (
                            <button 
                                key={title} 
                                onClick={() => setSelectedTitle(title)}
                                className={`w-full py-6 rounded-2xl border-2 font-black text-sm uppercase tracking-widest transition-all ${selectedTitle === title ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-xl' : 'border-white/5 bg-white/5 text-white/40 hover:text-white'}`}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {/* КНОПКА СОХРАНЕНИЯ */}
            <button 
                onClick={handleSave}
                className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-amber-400 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-[0.98]"
            >
                ПРИМЕНИТЬ ИЗМЕНЕНИЯ
            </button>
        </div>
    );
};
