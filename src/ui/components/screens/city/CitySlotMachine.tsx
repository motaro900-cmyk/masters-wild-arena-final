import React from 'react';
import { motion } from 'framer-motion';
import { SlotSymbol, Particle } from './CitySlotLogic';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface CitySlotMachineProps {
    winLineActive: boolean;
    particles: Particle[];
    winSymbolId: string | null;
    reel1Spinning: boolean;
    reel2Spinning: boolean;
    reel3Spinning: boolean;
    reel1: SlotSymbol[];
    reel2: SlotSymbol[];
    reel3: SlotSymbol[];
    controls1: any;
    controls2: any;
    controls3: any;
    leverPulling: boolean;
    isSpinning: boolean;
    turboMode: boolean;
    autoSpin: boolean;
    lastSummonType: 'SINGLE' | 'MULTI';
    setTurboMode: (val: boolean | ((p: boolean) => boolean)) => void;
    setAutoSpin: (val: boolean | ((p: boolean) => boolean)) => void;
    handleSummon: (type: 'SINGLE' | 'MULTI') => void;
}

export const CitySlotMachine: React.FC<CitySlotMachineProps> = ({
    winLineActive,
    particles,
    reel1Spinning,
    reel2Spinning,
    reel3Spinning,
    reel1,
    reel2,
    reel3,
    controls1,
    controls2,
    controls3,
    leverPulling,
    isSpinning,
    turboMode,
    autoSpin,
    lastSummonType,
    setTurboMode,
    setAutoSpin,
    handleSummon,
}) => {

    const renderReelSymbols = (symbols: SlotSymbol[]) => {
        return symbols.map((sym, idx) => {
            const isCenterSymbol = symbols.length === 3 ? idx === 1 : false;
            const isFlashing = winLineActive && isCenterSymbol;

            return (
                <div
                    key={idx}
                    style={{
                        width: '100%',
                        height: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        borderBottom: '1px solid rgba(240, 192, 64, 0.05)',
                        background: `radial-gradient(circle at center, ${sym.color}15 0%, transparent 70%)`,
                        animation: isFlashing ? 'pulseGlow 0.8s infinite ease-in-out' : 'none',
                        transform: isFlashing ? 'scale(1.08)' : 'scale(1)',
                        transition: 'transform 0.3s ease-in-out',
                    }}
                >
                    <div
                        style={{
                            fontSize: '48px',
                            filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 10px ${sym.color}40)`,
                        }}
                    >
                        {sym.emoji}
                    </div>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: '900',
                            color: sym.color,
                            letterSpacing: '1.5px',
                            marginTop: '6px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        }}
                    >
                        {sym.label}
                    </div>
                </div>
            );
        });
    };

    return (
        <>
            {/* Falling particles cascade */}
            {winLineActive &&
                particles.map((p) => (
                    <motion.img
                        key={p.id}
                        src={p.type === 'crystal' ? AssetsMap.UI.ICON_ALMAZ_FULL : AssetsMap.UI.ICON_GOLD_FULL}
                        initial={{ y: p.y, x: `${p.x}%`, rotate: 0 }}
                        animate={{
                            y: 1100,
                            rotate: p.targetRotation,
                        }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            ease: 'linear',
                            repeat: Infinity,
                        }}
                        style={{
                            position: 'absolute',
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            pointerEvents: 'none',
                            zIndex: 150,
                            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
                        }}
                    />
                ))}

            {/* Slot Machine Container with Lever */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '40px',
                    marginBottom: '40px',
                    position: 'relative',
                }}
            >
                {/* Golden/Bronze Cabinet */}
                <div
                    style={{
                        width: '500px',
                        height: '420px',
                        background: 'linear-gradient(135deg, #2a2015 0%, #15100a 100%)',
                        border: '4px solid #c8a870',
                        borderRadius: '24px',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(0, 0, 0, 0.9)',
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '30px 20px 20px 20px',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Decorative Marquee Banner */}
                    {winLineActive ? (
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                            style={{
                                position: 'absolute',
                                top: '-24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                border: '3px solid #f0c040',
                                borderRadius: '12px',
                                padding: '6px 30px',
                                fontSize: '18px',
                                fontWeight: '900',
                                fontFamily: "'Cinzel', serif",
                                color: '#fff',
                                letterSpacing: '3px',
                                boxShadow: '0 0 25px #ef4444, 0 0 10px #f0c040',
                                zIndex: 10,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            💥 ПОБЕДА! 💥
                        </motion.div>
                    ) : (
                        <div
                            style={{
                                position: 'absolute',
                                top: '-16px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(240, 192, 64, 0.9)',
                                border: '2px solid #fff',
                                borderRadius: '10px',
                                padding: '4px 20px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                fontFamily: "'Cinzel', serif",
                                color: '#000',
                                letterSpacing: '2px',
                                boxShadow: '0 0 15px #f0c040',
                                zIndex: 10,
                            }}
                        >
                            JACKPOT SUMMON
                        </div>
                    )}

                    {/* Payline Overlay Laser */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '10px',
                            right: '10px',
                            top: 'calc(50% - 62px)',
                            height: '124px',
                            borderTop: '2px dashed rgba(240, 192, 64, 0.7)',
                            borderBottom: '2px dashed rgba(240, 192, 64, 0.7)',
                            background: 'rgba(240, 192, 64, 0.04)',
                            borderRadius: '8px',
                            pointerEvents: 'none',
                            zIndex: 5,
                            boxShadow: 'inset 0 0 10px rgba(240, 192, 64, 0.1)',
                        }}
                    />

                    {/* Pulsing Win Line */}
                    {winLineActive && (
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                right: '10px',
                                top: 'calc(50% - 2px)',
                                height: '4px',
                                background:
                                    'linear-gradient(90deg, transparent, #f0c040, #fff, #f0c040, transparent)',
                                boxShadow: '0 0 15px #f0c040, 0 0 30px #f0c040',
                                zIndex: 8,
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    {/* Side arrows pointing to the payline */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '-5px',
                            top: 'calc(50% - 12px)',
                            color: '#f0c040',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textShadow: '0 0 8px #f0c040',
                            zIndex: 6,
                        }}
                    >
                        ▶
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            right: '-5px',
                            top: 'calc(50% - 12px)',
                            color: '#f0c040',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textShadow: '0 0 8px #f0c040',
                            zIndex: 6,
                        }}
                    >
                        ◀
                    </div>

                    {/* REEL 1 */}
                    <div
                        style={{
                            width: '140px',
                            height: '360px',
                            background: 'rgba(5, 3, 2, 0.85)',
                            borderRadius: '16px',
                            border: '2px solid #5a452a',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
                                pointerEvents: 'none',
                                zIndex: 4,
                            }}
                        />
                        {reel1Spinning ? (
                            <motion.div
                                animate={controls1}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                }}
                            >
                                {renderReelSymbols(reel1)}
                            </motion.div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                }}
                            >
                                {renderReelSymbols(reel1.slice(-3))}
                            </div>
                        )}
                    </div>

                    {/* REEL 2 */}
                    <div
                        style={{
                            width: '140px',
                            height: '360px',
                            background: 'rgba(5, 3, 2, 0.85)',
                            borderRadius: '16px',
                            border: '2px solid #5a452a',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
                                pointerEvents: 'none',
                                zIndex: 4,
                            }}
                        />
                        {reel2Spinning ? (
                            <motion.div
                                animate={controls2}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                }}
                            >
                                {renderReelSymbols(reel2)}
                            </motion.div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                }}
                            >
                                {renderReelSymbols(reel2.slice(-3))}
                            </div>
                        )}
                    </div>

                    {/* REEL 3 */}
                    <div
                        style={{
                            width: '140px',
                            height: '360px',
                            background: 'rgba(5, 3, 2, 0.85)',
                            borderRadius: '16px',
                            border: '2px solid #5a452a',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
                                pointerEvents: 'none',
                                zIndex: 4,
                            }}
                        />
                        {reel3Spinning ? (
                            <motion.div
                                animate={controls3}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                }}
                            >
                                {renderReelSymbols(reel3)}
                            </motion.div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                }}
                            >
                                {renderReelSymbols(reel3.slice(-3))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pullable Mechanical Lever */}
                <div
                    style={{
                        width: '60px',
                        height: '360px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: isSpinning ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => {
                        if (!isSpinning) {
                            handleSummon('SINGLE');
                        }
                    }}
                    onMouseEnter={(e) => {
                        if (!isSpinning) {
                            e.currentTarget.style.filter = 'brightness(1.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                    }}
                >
                    {/* Base Mount cylinder */}
                    <div
                        style={{
                            width: '32px',
                            height: '40px',
                            background: 'linear-gradient(to right, #4a3b2c, #2a1f15)',
                            border: '2px solid #c8a870',
                            borderLeft: 'none',
                            borderRadius: '0 8px 8px 0',
                            position: 'absolute',
                            left: '-5px',
                            top: '200px',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
                        }}
                    />

                    {/* Rotating Shaft/Arm & Knob */}
                    <motion.div
                        animate={leverPulling ? { rotate: 75 } : { rotate: -15 }}
                        transition={{
                            type: 'spring',
                            stiffness: leverPulling ? 350 : 120,
                            damping: leverPulling ? 15 : 8,
                        }}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '80px',
                            height: '140px',
                            width: '10px',
                            background: 'linear-gradient(to right, #e2e8f0, #94a3b8, #475569)',
                            borderRadius: '5px',
                            transformOrigin: 'center 120px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Sphere Knob */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '-26px',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle at 30% 30%, #ff4d4d, #b30000)',
                                border: '2px solid #ff9999',
                                boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 -4px 8px rgba(0,0,0,0.4)',
                            }}
                        />
                    </motion.div>
                </div>
            </div>

            {/* CONTROL PANEL DASHBOARD */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    background: 'rgba(15, 10, 5, 0.9)',
                    padding: '20px 40px',
                    borderRadius: '20px',
                    border: '2px solid #5a452a',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                }}
            >
                {/* Toggles (Turbo and Auto-Spin) */}
                <div style={{ display: 'flex', gap: '30px' }}>
                    <button
                        onClick={() => {
                            setTurboMode((prev) => !prev);
                        }}
                        style={{
                            padding: '10px 24px',
                            background: turboMode
                                ? 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)'
                                : 'rgba(20, 15, 10, 0.85)',
                            border: `2px solid ${turboMode ? '#22d3ee' : '#5a452a'}`,
                            color: turboMode ? '#fff' : '#888',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: "'Cinzel', serif",
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: turboMode ? '0 0 15px rgba(34, 211, 238, 0.4)' : 'none',
                            letterSpacing: '1px',
                        }}
                    >
                        ТУРБО: {turboMode ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>

                    <button
                        onClick={() => {
                            setAutoSpin((prev) => !prev);
                        }}
                        style={{
                            padding: '10px 24px',
                            background: autoSpin
                                ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
                                : 'rgba(20, 15, 10, 0.85)',
                            border: `2px solid ${autoSpin ? '#4ade80' : '#5a452a'}`,
                            color: autoSpin ? '#fff' : '#888',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: "'Cinzel', serif",
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: autoSpin ? '0 0 15px rgba(74, 222, 128, 0.4)' : 'none',
                            letterSpacing: '1px',
                        }}
                    >
                        АВТО-СПИН: {autoSpin ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>
                </div>

                {/* SUMMON BUTTONS */}
                <div style={{ display: 'flex', gap: '30px' }}>
                    <button
                        onClick={() => handleSummon('SINGLE')}
                        disabled={isSpinning}
                        style={{
                            padding: '18px 45px',
                            background: isSpinning
                                ? '#333'
                                : 'linear-gradient(135deg, #f0c040 0%, #c8a870 100%)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '14px',
                            fontWeight: '900',
                            cursor: isSpinning ? 'not-allowed' : 'pointer',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '18px',
                            letterSpacing: '2px',
                            boxShadow: isSpinning ? 'none' : '0 10px 25px rgba(240,192,64,0.3)',
                            transition: 'all 0.3s',
                            opacity: isSpinning ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) =>
                            !isSpinning && (e.currentTarget.style.transform = 'translateY(-3px)')
                        }
                        onMouseLeave={(e) => !isSpinning && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        {isSpinning && lastSummonType === 'SINGLE' ? (
                            'КРУТИМ...'
                        ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                ПРИЗЫВ X1 (100{' '}
                                <img
                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                    style={{ width: '22px', height: '22px' }}
                                    alt="diamond"
                                />
                                )
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => handleSummon('MULTI')}
                        disabled={isSpinning}
                        style={{
                            padding: '18px 45px',
                            background: isSpinning
                                ? '#222'
                                : 'linear-gradient(135deg, #1f1a10 0%, #0a0500 100%)',
                            color: '#f0c040',
                            border: '2px solid #f0c040',
                            borderRadius: '14px',
                            fontWeight: '900',
                            cursor: isSpinning ? 'not-allowed' : 'pointer',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '18px',
                            letterSpacing: '2px',
                            transition: 'all 0.3s',
                            opacity: isSpinning ? 0.3 : 1,
                            boxShadow: isSpinning ? 'none' : '0 10px 25px rgba(0,0,0,0.5)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSpinning) {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.background = 'rgba(240,192,64,0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSpinning) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background =
                                    'linear-gradient(135deg, #1f1a10 0%, #0a0500 100%)';
                            }
                        }}
                    >
                        {isSpinning && lastSummonType === 'MULTI' ? (
                            'КРУТИМ...'
                        ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                ПРИЗЫВ X10 (950{' '}
                                <img
                                    src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                    style={{ width: '22px', height: '22px' }}
                                    alt="diamond"
                                />
                                )
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulseGlow {
                    0% { filter: brightness(1) drop-shadow(0 0 15px rgba(240,192,64,0.8)); }
                    50% { filter: brightness(1.35) drop-shadow(0 0 30px rgba(240,192,64,1)); }
                    100% { filter: brightness(1) drop-shadow(0 0 15px rgba(240,192,64,0.8)); }
                }
            `}</style>
        </>
    );
};
