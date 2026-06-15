import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useGameStore } from '../../../store/useGameStore';
import { getRankInfo } from '../../../configs/RankSystem';
import { audioService } from '../../../services/AudioService';
import { useGraphicsConfig } from '../../hooks/useGraphicsConfig';

interface ActionButtonsProps {
    onStartBattle: () => void;
    onWarmup: () => void;
    onOpenRanks: () => void;
}

/**
 * ActionButtons (v2.7) — Поддержка модалки разработки для ЗБТ.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ onStartBattle, onWarmup, onOpenRanks }) => {
    const rating = useGameStore((state) => state.rating);
    const isMobile = useGameStore((state) => state.isMobile);
    const rank = getRankInfo(rating);
    const [energyError, setEnergyError] = useState(false);
    const gfx = useGraphicsConfig();

    return (
        <div
            style={{
                width: 720,
                height: 200,
                position: 'relative',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {/* Главный спрайт панели */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${AssetsMap.UI.BTN_BATTLE_GROUP})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    filter: gfx.isUltra
                        ? 'contrast(1.08) saturate(1.15) brightness(1.02)'
                        : gfx.isMedium
                          ? 'contrast(1.04) saturate(1.08) brightness(1.01)'
                          : 'none',
                }}
            >
                {/* ULTRA: dark overlay ONLY on the top info bar, not buttons */}
                {gfx.isUltra && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '48%',
                            background: 'rgba(0, 0, 0, 0.20)',
                            borderRadius: '12px 12px 0 0',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                )}
                {/* Clickable Rank Area (Top part only) */}
                <div
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        onOpenRanks();
                    }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        cursor: 'pointer',
                        zIndex: 1,
                    }}
                />

                {/* ЛЕВАЯ ИКОНКА: КУБОК */}
                <div
                    style={{
                        position: 'absolute',
                        top: '7%',
                        left: 'calc(14% + 10px)',
                        width: '52px',
                        height: '52px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                    }}
                >
                    <img
                        src={AssetsMap.UI.TROPHY_PREMIUM}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'contrast(1.3) saturate(1.15) brightness(1.05) drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                            imageRendering: 'crisp-edges',
                        }}
                        alt="trophy"
                    />
                </div>

                {/* ПРАВАЯ ИКОНКА: РАНГ (ДИНАМИЧЕСКАЯ) */}
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(7% + 3px)',
                        right: 'calc(4% + 10px)',
                        width: '52px',
                        height: '52px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                    }}
                >
                    <img
                        src={rank.icon}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'contrast(1.3) saturate(1.15) brightness(1.05) drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                            imageRendering: 'crisp-edges',
                        }}
                        alt="rank-icon"
                    />
                </div>

                {/* ЛЕВЫЙ БЛОК: РЕЙТИНГ */}
                <div
                    style={{
                        position: 'absolute',
                        top: '12%',
                        left: '12%',
                        width: '35%',
                        height: '22%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '110px',
                        fontFamily: "'Cinzel', serif",
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,1)',
                        pointerEvents: 'none',
                        zIndex: 3,
                    }}
                >
                    РЕЙТИНГ: {rating}
                </div>

                {/* ПРАВЫЙ БЛОК: РАНГ */}
                <div
                    style={{
                        position: 'absolute',
                        top: '12%',
                        right: '12%',
                        width: '35%',
                        height: '22%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingRight: '10px',
                        fontFamily: "'Cinzel', serif",
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,1)',
                        pointerEvents: 'none',
                        zIndex: 3,
                    }}
                >
                    РАНГ: {rank.name}
                </div>

                {/* НИЖНИЙ БЛОК — КНОПКИ БОЯ */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '7%',
                        left: '1%',
                        right: '1%',
                        height: '52%',
                        display: 'flex',
                        zIndex: 2, // Above the clickable background
                    }}
                >
                    {/* ЛЕВАЯ КНОПКА (Синяя) */}
                    <motion.button
                        className={isMobile ? "action-btn-mobile" : ""}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            const store = useGameStore.getState() as any;
                            if (store.setBattleMode) store.setBattleMode('WARMUP');
                            onWarmup();
                        }}
                        style={{
                            flex: '0 0 35%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Cinzel', serif",
                            color: '#a0c0ff',
                            textShadow: '0 0 8px rgba(0,0,0,1)',
                            transition: 'all 0.2s',
                            paddingLeft: '75px',
                            position: 'relative',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,100,255,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 950,
                                    color: '#ffffff',
                                    textShadow: '0 2px 0 rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.85)',
                                }}
                            >
                                РАЗМИНКА
                            </div>

                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginTop: '5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(160, 192, 255, 0.3)',
                                    borderRadius: '12px',
                                    padding: '1px 8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '10px',
                                        color: '#a0c0ff',
                                        fontWeight: 800,
                                        letterSpacing: '1px',
                                    }}
                                >
                                    0 ⚡
                                </span>
                            </div>
                        </div>
                    </motion.button>

                    {/* ПРАВАЯ КНОПКА (Красная) */}
                    <motion.button
                        className={isMobile ? "action-btn-mobile" : ""}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            const store = useGameStore.getState() as any;

                            // Проверяем энергию
                            if (!store.hasInfiniteEnergy && store.energy < 10) {
                                setEnergyError(true);
                                setTimeout(() => setEnergyError(false), 2000);
                                return;
                            }

                            if (store.setBattleMode) store.setBattleMode('RANKED');
                            onStartBattle();
                        }}
                        style={{
                            flex: '1',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Cinzel', serif",
                            color: energyError ? '#ef4444' : '#ffffff',
                            textShadow: '0 2px 8px rgba(0,0,0,1)',
                            transition: 'all 0.2s',
                            paddingRight: '105px',
                            position: 'relative',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,50,0,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        {energyError ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div style={{ fontSize: '22px', fontWeight: 950 }}>НУЖНО 10 ⚡</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ position: 'relative' }}>
                                    <div
                                        style={{
                                            fontSize: '22px',
                                            fontWeight: 950,
                                            color: '#ffffff',
                                            textShadow: '0 2px 0 rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.85)',
                                        }}
                                    >
                                        РЕЙТИНГОВЫЙ БОЙ
                                    </div>

                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            marginTop: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(0,0,0,0.6)',
                                            border: '1px solid rgba(240, 192, 64, 0.5)',
                                            borderRadius: '12px',
                                            padding: '2px 10px',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                color: '#f0c040',
                                                fontWeight: 900,
                                                textShadow: 'none',
                                            }}
                                        >
                                            10
                                        </span>
                                        <img
                                            src={AssetsMap.UI.ICON_ENERGY_FULL}
                                            style={{
                                                width: '14px',
                                                height: '14px',
                                                marginLeft: '4px',
                                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                                            }}
                                            alt="energy"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
