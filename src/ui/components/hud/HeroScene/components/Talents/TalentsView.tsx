import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { TALENTS_CONFIG } from '../../constants/talentsConfig';
import { useTalentProgress } from '../../hooks/useTalentProgress';
import { TalentNode } from './TalentNode';
import { TalentTooltip } from './TalentTooltip';
import { audioService } from '../../../../../../services/AudioService';

export const TalentsView = ({ hero }: any) => {
    const { heroTalents, upgradeTalent, resetTalents, talentPoints } = useGameStore();
    const talents = heroTalents[hero.id] || {};

    const availablePoints = talentPoints;

    const [activeTalent, setActiveTalent] = useState<any>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const { handleUpgrade } = useTalentProgress(hero.id, talents, availablePoints, upgradeTalent);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{
                position: 'absolute',
                inset: '40px 80px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10,
            }}
        >
            {/* HEADER */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
            >
                <div
                    style={{
                        background: 'rgba(0,0,0,0.6)',
                        padding: '15px 35px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(240,192,64,0.3)',
                        boxShadow: '0 0 35px rgba(0,0,0,0.6)',
                    }}
                >
                    <h2
                        style={{
                            color: '#fff',
                            fontSize: '36px',
                            margin: 0,
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 4px 15px rgba(0,0,0,0.8)',
                            letterSpacing: '2px',
                        }}
                    >
                        ДРЕВО ТАЛАНТОВ
                    </h2>
                    <p
                        style={{
                            color: 'rgba(255,255,255,0.7)',
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                        }}
                    >
                        Улучшайте способности вашего героя
                    </p>
                </div>

                {/* PREMIUM POINTS BLOCK */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(30, 30, 45, 0.98) 100%)',
                        border: '2px solid rgba(240, 192, 64, 0.6)',
                        padding: '10px 35px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 25px rgba(240,192,64,0.1)',
                        backdropFilter: 'blur(20px)',
                        minWidth: '220px',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span
                            style={{
                                color: '#fff',
                                fontSize: '48px',
                                fontWeight: 950,
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 0 25px rgba(240,192,64,0.6)',
                                lineHeight: 1,
                            }}
                        >
                            {String(availablePoints ?? 0)}
                        </span>
                        <span
                            style={{
                                color: '#f0c040',
                                fontSize: '15px',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                textTransform: 'uppercase',
                                marginTop: '4px',
                            }}
                        >
                            {(() => {
                                const n = availablePoints ?? 0;
                                let m = Math.abs(n) % 100;
                                if (m >= 5 && m <= 20) return 'ОЧКОВ ТАЛАНТОВ';
                                m %= 10;
                                if (m === 1) return 'ОЧКО ТАЛАНТОВ';
                                if (m >= 2 && m <= 4) return 'ОЧКА ТАЛАНТОВ';
                                return 'ОЧКОВ ТАЛАНТОВ';
                            })()}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* TREE COLUMNS */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                {TALENTS_CONFIG.map((branch) => (
                    <div key={branch.id} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* BRANCH HEADER */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                background: `linear-gradient(90deg, ${branch.color}aa 0%, transparent 100%)`,
                                padding: '12px 25px',
                                borderRadius: '12px',
                                borderLeft: `5px solid ${branch.color}`,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            <span style={{ fontSize: '32px', filter: `drop-shadow(0 0 10px ${branch.color})` }}>
                                {branch.icon}
                            </span>
                            <span
                                style={{
                                    color: '#fff',
                                    fontSize: '24px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '3px',
                                    textShadow: `0 0 15px ${branch.color}`,
                                }}
                            >
                                {branch.title}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            {branch.tiers.map((tier, tIndex) => {
                                const branchPoints = Object.entries(talents)
                                    .filter(([id]) => id.startsWith(branch.id.substring(0, 3)))
                                    .reduce((a, [_, v]) => a + (v as number), 0);
                                const isUnlocked = branchPoints >= tier.requiredInBranch;

                                return (
                                    <div
                                        key={tIndex}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            position: 'relative',
                                            width: '100%',
                                        }}
                                    >
                                        {/* CONNECTORS (DYNAMIC GEOMETRY) */}
                                        {tIndex > 0 && (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    height: '50px',
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {/* CASE A: 1 Parent -> 2 Children (Branching) */}
                                                {branch.tiers[tIndex - 1].talents.length === 1 &&
                                                    tier.talents.length > 1 && (
                                                        <>
                                                            {/* Spine UP */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    width: '6px',
                                                                    height: '25px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                }}
                                                            />
                                                            {/* Bridge */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '25px',
                                                                    width: '170px',
                                                                    height: '6px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                    borderRadius: '3px',
                                                                }}
                                                            />
                                                            {/* 2 Legs DOWN */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '25px',
                                                                    left: 'calc(50% - 85px)',
                                                                    width: '6px',
                                                                    height: '25px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                }}
                                                            />
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '25px',
                                                                    left: 'calc(50% + 85px)',
                                                                    width: '6px',
                                                                    height: '25px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                {/* CASE B: 2 Parents -> 1 Child (Merging) */}
                                                {branch.tiers[tIndex - 1].talents.length > 1 &&
                                                    tier.talents.length === 1 && (
                                                        <>
                                                            {/* Bridge MIDDLE */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '25px',
                                                                    width: '170px',
                                                                    height: '6px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                    borderRadius: '3px',
                                                                }}
                                                            />
                                                            {/* 2 Legs UP (Connect to parents above) */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 'calc(50% - 85px)',
                                                                    width: '6px',
                                                                    height: '25px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                }}
                                                            />
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 'calc(50% + 85px)',
                                                                    width: '6px',
                                                                    height: '25px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                }}
                                                            />
                                                            {/* Spine DOWN (Connect to child below) */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '25px',
                                                                    width: '6px',
                                                                    height: '25px',
                                                                    background: isUnlocked ? branch.color : '#0a0a0a',
                                                                    border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                {/* CASE C: 1 Parent -> 1 Child (Straight) */}
                                                {branch.tiers[tIndex - 1].talents.length === 1 &&
                                                    tier.talents.length === 1 && (
                                                        <div
                                                            style={{
                                                                width: '6px',
                                                                height: '100%',
                                                                background: isUnlocked ? branch.color : '#0a0a0a',
                                                                border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`,
                                                            }}
                                                        />
                                                    )}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '60px',
                                                justifyContent: 'center',
                                                width: '100%',
                                                zIndex: 2,
                                            }}
                                        >
                                            {tier.talents.map((talent) => {
                                                const lvl = talents[talent.id] || 0;
                                                return (
                                                    <TalentNode
                                                        key={talent.id}
                                                        talent={talent}
                                                        level={lvl}
                                                        branchColor={branch.color}
                                                        isUnlocked={isUnlocked}
                                                        canAfford={availablePoints > 0}
                                                        onClick={() => handleUpgrade(talent, branch.id)}
                                                        onMouseEnter={(e: any) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const root = document.getElementById('hero-scene-root');
                                                            const rootRect = root?.getBoundingClientRect();
                                                            if (rootRect) {
                                                                const scale = rootRect.width / 1920;
                                                                const x = (rect.right - rootRect.left) / scale + 20;
                                                                const y = (rect.top - rootRect.top) / scale;
                                                                // SMART POSITIONING: Lowered threshold and increased offset to ensure visibility
                                                                setTooltipPos({
                                                                    x: x > 1400 ? x - 520 : x,
                                                                    y: y > 420 ? y - 520 : y,
                                                                });
                                                            }
                                                            setActiveTalent({
                                                                ...talent,
                                                                branchPoints,
                                                                required: tier.requiredInBranch,
                                                                level: lvl,
                                                            });
                                                        }}
                                                        onMouseLeave={() => setActiveTalent(null)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (confirm('Сбросить все таланты? Очки будут возвращены.')) {
                            resetTalents(hero.id);
                            audioService.playSFX('SFX_CLICK');
                        }
                    }}
                    style={{
                        padding: '18px 50px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '15px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '16px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '2px',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    🔄 СБРОСИТЬ ТАЛАНТЫ
                </motion.button>
            </div>

            {/* CONTEXTUAL TOOLTIP (ABSOLUTE) */}
            <AnimatePresence>
                {activeTalent && (
                    <TalentTooltip
                        talent={activeTalent}
                        pos={tooltipPos}
                        color={
                            TALENTS_CONFIG.find((b) =>
                                b.tiers.some((t) => t.talents.some((tt) => tt.id === activeTalent.id)),
                            )?.color || '#fff'
                        }
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
