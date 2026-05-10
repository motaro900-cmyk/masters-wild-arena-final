import React from 'react';
import { useGameStore } from '../../store/useGameStore';

const SvgIcon = {
  Play: () => <svg viewBox="0 0 24 24" width="36" height="36" fill="black"><path d="M8 5v14l11-7z"/></svg>,
  Gift: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M20 12V22H4V12H2V10C2 8.89543 2.89543 8 4 8H8.33975C8.11677 7.70324 8 7.35515 8 7C8 5.89543 8.89543 5 10 5C10.5113 5 10.9743 5.1915 11.3255 5.5065L12 6.181L12.6745 5.5065C13.0257 5.1915 13.4887 5 14 5C15.1046 5 16 5.89543 16 7C16 7.35515 15.8832 7.70324 15.6603 8H20C21.1046 8 22 8.89543 22 10V12H20ZM4 12V20H11V12H4ZM13 12V20H20V12H13ZM15.6603 8C15.8832 7.70324 16 7.35515 16 7C16 5.89543 15.1046 5 14 5C13.4887 5 13.0257 5.1915 12.6745 5.5065L12 6.181L11.3255 5.5065C10.9743 5.1915 10.5113 5 10 5C8.89543 5 8 5.89543 8 7C8 7.35515 8.11677 7.70324 8.33975 8H15.6603Z"/></svg>
};

export const ActionPanel: React.FC = () => {
    const goToArena = useGameStore(state => state.goToArena);

    return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
       <div className="bg-[#1c1f26] border-[3px] border-[#3d4149] w-[680px] h-[150px] rounded-[24px] p-3.5 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
          {/* Cup Progress */}
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center text-black font-black text-base italic shadow-lg border border-yellow-200">S</div>
                <span className="text-3xl font-black text-white italic drop-shadow-md">1,450</span>
             </div>
             <div className="flex-1 mx-6 relative h-1 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.8)]" style={{width: '90%'}} />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase italic opacity-80">ДАЛЕЕ: 1,500</span>
                <div className="w-7 h-7 bg-[#5d44cc] border-2 border-[#7c66e6] rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                   <SvgIcon.Gift />
                </div>
             </div>
          </div>

          {/* Battle Buttons */}
          <div className="flex gap-2.5 h-[65px]">
             <button className="flex-1 bg-gradient-to-b from-[#2c3340] to-[#1a1e26] border-[2px] border-[#3d4659] rounded-xl flex flex-col items-center justify-center transition-all hover:brightness-125 group">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter mb-0.5 opacity-80">БЕЗ РЕЙТИНГА</span>
                <span className="text-xl font-black text-white uppercase italic tracking-widest leading-none group-hover:scale-105 transition-transform">РАЗМИНКА</span>
             </button>

             <button 
                onClick={goToArena}
                className="flex-[2.5] relative group active:translate-y-1 transition-all"
             >
                <div className="w-full h-full bg-gradient-to-b from-[#ffed47] via-[#f29100] to-[#d66e00] border-b-[6px] border-[#8b4513] flex items-center justify-center gap-5 shadow-xl"
                     style={{ clipPath: 'polygon(8% 0, 92% 0, 100% 20%, 100% 80%, 92% 100%, 8% 100%, 0 80%, 0 20%)' }}>
                   <div className="group-hover:scale-110 transition-transform"><SvgIcon.Play /></div>
                   <div className="flex flex-col items-start leading-none text-left">
                      <span className="text-4xl font-black text-black uppercase italic tracking-tighter leading-none">В БОЙ!</span>
                      <p className="text-[7px] font-black text-black/50 uppercase tracking-[0.4em] mt-1 ml-0.5">НА КУБКИ</p>
                   </div>
                </div>
             </button>
          </div>
       </div>
    </div>
    );
};
