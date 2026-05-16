import React, { useState, useRef } from 'react';
import { Icon } from './HUDIcons';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

type TabType = 'collection' | 'equipment' | 'talents';
type EquipTab = 'stats' | 'history';

export const BeastsMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('collection');
    const [equipTab, setEquipTab] = useState<EquipTab>('stats');
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            gsap.from('.beasts-menu-panel', {
                y: 50,
                opacity: 0,
                scale: 0.95,
                duration: 0.4,
                ease: 'back.out(1.2)',
            });
        },
        { scope: containerRef },
    );

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] pointer-events-none p-20"
        >
            <div className="beasts-menu-panel w-full h-full bg-[#0c0c0e] border-2 border-white/10 rounded-[60px] relative flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto">
                {/* HEADER */}
                <div className="flex items-center justify-between px-12 py-8 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                            <Icon name="PawPrint" size={32} className="text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter">ЗВЕРИ</h2>
                            <p className="text-yellow-500/60 font-bold text-xs tracking-[0.3em] uppercase">
                                Твой боевой отряд
                            </p>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="bg-black/40 p-2 rounded-3xl flex gap-2 border border-white/5">
                        {[
                            { id: 'collection', label: 'КОЛЛЕКЦИЯ', icon: 'Package' },
                            { id: 'equipment', label: 'СНАРЯЖЕНИЕ', icon: 'Settings' },
                            { id: 'talents', label: 'ТАЛАНТЫ', icon: 'Crown' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-b from-yellow-400 to-orange-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                                        : 'text-white/30 hover:text-white/60'
                                }`}
                            >
                                <Icon name={tab.icon as any} size={20} />
                                <span className="text-sm tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors border border-white/10"
                    >
                        <span className="text-3xl font-light text-white/40">✕</span>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'collection' && <CollectionTab />}
                    {activeTab === 'equipment' && <EquipmentTab subTab={equipTab} setSubTab={setEquipTab} />}
                    {activeTab === 'talents' && <TalentsTab />}
                </div>
            </div>
        </div>
    );
};

/* --- ПОД-КОМПОНЕНТЫ ВКЛАДОК --- */

const CollectionTab = () => (
    <div className="h-full flex p-12 gap-12">
        <div className="w-[500px] flex flex-col items-center justify-center bg-black/20 rounded-[40px] border border-white/5 p-8 relative overflow-hidden">
            <div className="absolute top-10 left-10 flex flex-col gap-1">
                <h3 className="text-4xl font-black italic uppercase">Панда Бакс</h3>
                <span className="text-purple-400 font-black tracking-[0.3em] text-xs uppercase">Легендарный</span>
            </div>
            <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Panda&backgroundColor=transparent"
                className="w-80 h-80 drop-shadow-[0_0_50px_rgba(168,85,247,0.4)]"
                alt="Preview"
            />
            <button className="mt-10 px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black tracking-widest text-white/20 uppercase">
                ВЫБРАНО
            </button>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pr-4">
            {['Панда Бакс', 'Лось Булли', 'Кот Феликс'].map((name, i) => (
                <div
                    key={i}
                    className={`p-6 bg-slate-900/40 rounded-[32px] border-2 flex flex-col items-center gap-4 transition-all cursor-pointer ${i === 0 ? 'border-yellow-500 bg-yellow-500/5 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'border-white/5 hover:border-white/20'}`}
                >
                    <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=transparent`}
                        className="w-40 h-40"
                        alt={name}
                    />
                    <div className="text-center">
                        <h4 className="text-xl font-black uppercase tracking-widest">{name}</h4>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
                            {i < 2 ? 'Легендарный' : 'Эпический'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const EquipmentTab = ({ subTab, setSubTab }: { subTab: EquipTab; setSubTab: (t: EquipTab) => void }) => {
    const tabRef = useRef<HTMLDivElement>(null);
    useGSAP(
        () => {
            gsap.to('.anim-pulse', {
                opacity: 0.5,
                scale: 1.1,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        },
        { scope: tabRef },
    );

    return (
        <div ref={tabRef} className="h-full flex flex-col">
            <div className="flex justify-center gap-8 py-6">
                {['СТАТЫ', 'ИСТОРИЯ'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setSubTab(t === 'СТАТЫ' ? 'stats' : 'history')}
                        className={`text-xl font-black tracking-[0.2em] transition-all ${subTab === (t === 'СТАТЫ' ? 'stats' : 'history') ? 'text-yellow-500' : 'text-white/20 hover:text-white/40'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <div className="flex-1 p-12 pt-0 flex gap-12">
                {subTab === 'stats' ? (
                    <>
                        <div className="w-[300px] flex flex-col gap-4">
                            {['ШЛЕМ', 'ОДЕЖДА', 'ОРУЖИЕ', 'АРТЕФАКТ'].map((slot) => (
                                <div
                                    key={slot}
                                    className="flex-1 bg-black/40 rounded-3xl border border-white/5 flex flex-col items-center justify-center group cursor-pointer hover:bg-white/5 transition-all"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-xl mb-2 flex items-center justify-center text-white/10 group-hover:text-white/30 group-hover:scale-110 transition-all">
                                        ?
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 tracking-widest uppercase italic">
                                        {slot}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            <div className="absolute w-[500px] h-[500px] bg-yellow-500/10 blur-[100px] rounded-full anim-pulse"></div>
                            <img
                                src="https://api.dicebear.com/7.x/bottts/svg?seed=Panda&backgroundColor=transparent"
                                className="w-[450px] h-[450px] relative z-10"
                                alt="Panda"
                            />
                        </div>
                        <div className="w-[400px] flex flex-col gap-6 justify-center">
                            {[
                                { label: 'ЗДОРОВЬЕ', val: '3250', p: '80%', icon: 'Heart', color: 'text-red-400' },
                                { label: 'АТАКА', val: '520', p: '65%', icon: 'Zap', color: 'text-yellow-400' },
                                { label: 'СКОРОСТЬ', val: '110', p: '45%', icon: 'Play', color: 'text-blue-400' },
                                { label: 'КРИТ. ШАНС', val: '12%', p: '25%', icon: 'Target', color: 'text-orange-400' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={stat.color}>{stat.label}</span>
                                        </div>
                                        <span className="text-xl font-black italic">{stat.val}</span>
                                    </div>
                                    <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full bg-current ${stat.color} shadow-[0_0_10px_currentColor] opacity-60`}
                                            style={{ width: stat.p }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-black/40 rounded-[40px] border border-white/5 p-16 flex flex-col gap-8">
                        <div className="flex items-center gap-6">
                            <Icon name="Users" size={32} className="text-yellow-500" />
                            <h3 className="text-4xl font-black uppercase tracking-widest italic">ДОСЬЕ</h3>
                        </div>
                        <p className="text-2xl font-bold text-white/50 leading-relaxed italic italic">
                            Бывший охранник бамбукового склада. Теперь он наводит порядок в южных кварталах города. Его
                            кулаки тяжелее его прошлого.
                        </p>
                        <div className="mt-auto p-8 border-t border-white/5">
                            <p className="text-white/20 font-black tracking-widest text-sm uppercase italic">
                                "Район ошибок не прощает, а я не прощаю тех, кто их совершает."
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TalentsTab = () => (
    <div className="h-full flex flex-col p-12">
        <div className="flex justify-between items-center mb-12 px-8">
            <div className="flex flex-col">
                <span className="text-yellow-500/50 font-black text-sm uppercase tracking-[0.4em]">ОЧКИ ДВОРА</span>
                <div className="flex items-baseline gap-4">
                    <span className="text-8xl font-black italic italic leading-none">5 ТР</span>
                    <span className="text-white/20 font-black text-xl uppercase tracking-widest">СВОБОДНО</span>
                </div>
            </div>
            <div className="flex gap-4">
                <button className="px-10 py-5 bg-white/5 rounded-2xl border border-white/10 font-black tracking-widest text-white/40 hover:text-white transition-all">
                    СБРОСИТЬ
                </button>
                <button className="px-10 py-5 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-2xl font-black tracking-widest shadow-xl hover:scale-105 transition-all">
                    ПРИМЕНИТЬ
                </button>
            </div>
        </div>
        <div className="grid grid-cols-4 gap-8 flex-1">
            {[
                { n: 'КРЕПКИЙ ЧЕРЕП', l: 'LVL 2 / 5', i: 'Shield', a: true },
                { n: 'УДАР В ПРЫЖКЕ', l: 'LVL 0 / 5', i: 'Zap', a: false },
                { n: 'ЯРОСТЬ УЛИЦ', l: 'LVL 1 / 3', i: 'Zap', a: true },
                { n: 'ИНТУИЦИЯ ЗВЕРЯ', l: 'LVL 0 / 1', i: 'Heart', a: false },
            ].map((t, idx) => (
                <div
                    key={idx}
                    className={`p-8 bg-slate-900/40 rounded-[40px] border-2 flex flex-col items-center justify-center gap-6 transition-all cursor-pointer ${t.a ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_40px_rgba(234,179,8,0.2)]' : 'border-white/5 opacity-40 hover:opacity-100 hover:bg-white/5'}`}
                >
                    <div
                        className={`p-6 rounded-[28px] ${t.a ? 'bg-yellow-500 text-black shadow-[0_0_30px_#eab308]' : 'bg-black/60 text-white/30'}`}
                    >
                        <Icon name={t.i as any} size={48} />
                    </div>
                    <div className="text-center">
                        <h5 className="text-xl font-black uppercase tracking-widest mb-1 italic leading-tight">
                            {t.n}
                        </h5>
                        <span className="text-[10px] font-black tracking-widest text-white/30 uppercase">{t.l}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
