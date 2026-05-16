import React, { useState } from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';

interface BottomBarProps {
    onOpenWindow: (name: string) => void;
    onStartSearch?: () => void;
    onStartNormal?: () => void;
    mode?: 'chat_only' | 'combat_only' | 'system_only';
}

export const BottomBar: React.FC<BottomBarProps> = ({ onOpenWindow, onStartSearch, onStartNormal, mode }) => {
    const [isChatVisible, setIsChatVisible] = useState(true);
    const whiteText = { color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,1)' };

    if (mode === 'chat_only') {
        return (
            <div
                className={`relative w-[320px] transition-all duration-300 ${isChatVisible ? 'h-[220px]' : 'h-[50px] translate-y-10'}`}
            >
                <img
                    src={AssetsMap.UI.PANEL_CHAT}
                    className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-300 ${isChatVisible ? 'opacity-85' : 'opacity-0'}`}
                    alt=""
                />

                <button
                    onClick={() => setIsChatVisible(!isChatVisible)}
                    className="absolute -top-2 left-6 w-8 h-6 bg-[#1a120b] border border-[#5d4037] rounded flex items-center justify-center cursor-pointer hover:brightness-125 z-10"
                >
                    <div className="w-4 h-0.5 bg-[#d4a373] rounded-full" />
                </button>

                {isChatVisible && (
                    <div className="absolute top-10 left-6 right-10 bottom-12 overflow-y-auto p-1 custom-scrollbar">
                        <div className="font-ui text-[12px] font-bold" style={whiteText}>
                            <p className="mb-1">
                                <span style={{ color: 'white' }}>[СИСТЕМА]:</span>{' '}
                                <span style={{ color: 'rgba(255,255,255,0.9)' }}>Бой готов.</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (mode === 'combat_only') {
        return (
            <div className="flex items-end gap-4 h-[110px] mb-2">
                <div
                    onClick={onStartNormal}
                    className="relative w-[190px] h-[65px] cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center group"
                >
                    <img
                        src={AssetsMap.UI.BTN_BATTLE_NORMAL}
                        className="absolute inset-0 w-full h-full object-contain"
                        alt=""
                    />
                    <span
                        className="relative font-header text-[16px] font-bold uppercase tracking-wider"
                        style={whiteText}
                    >
                        РАЗМИНКА
                    </span>
                </div>

                <div
                    onClick={onStartSearch}
                    className="relative w-[500px] h-[105px] cursor-pointer hover:scale-[1.03] active:scale-95 flex items-center justify-center"
                >
                    <img
                        src={AssetsMap.UI.BTN_BATTLE_RANKED}
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        alt=""
                    />
                </div>

                <div
                    onClick={() => onOpenWindow('TRAINING')}
                    className="relative w-[190px] h-[65px] cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center group"
                >
                    <img
                        src={AssetsMap.UI.BTN_TRAINING}
                        className="absolute inset-0 w-full h-full object-contain"
                        alt=""
                    />
                    <span
                        className="relative font-header text-[16px] font-bold uppercase tracking-wider"
                        style={whiteText}
                    >
                        РЕЖИМЫ
                    </span>
                </div>
            </div>
        );
    }

    if (mode === 'system_only') {
        const systemButtons = [
            { id: 'FRIENDS', icon: AssetsMap.UI.ICON_FRIENDS },
            { id: 'MAIL', icon: AssetsMap.UI.ICON_MAIL },
            { id: 'SETTINGS', icon: AssetsMap.UI.ICON_SETTINGS },
        ];
        return (
            <div className="flex gap-3 mb-4 mr-2">
                {systemButtons.map((btn, i) => (
                    <div
                        key={i}
                        onClick={() => onOpenWindow(btn.id)}
                        className="w-[60px] h-[60px] cursor-pointer hover:scale-110 transition-all active:scale-90"
                    >
                        <img src={btn.icon} className="w-full h-full object-contain drop-shadow-2xl" alt="" />
                    </div>
                ))}
            </div>
        );
    }

    return null;
};
