import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { TALENTS_CONFIG } from '../../constants/talentsConfig';
import { useTalentProgress } from '../../hooks/useTalentProgress';
import { TalentNode } from './TalentNode';
import { TalentTooltip } from './TalentTooltip';
import { audioService } from '../../../../../../services/AudioService';

export const TalentsView = ({ hero, isCompact = false }: any) => {
    const { heroTalents, upgradeTalent, resetTalents, talentPoints } = useGameStore();
    const talents = heroTalents[hero.id] || {};
    const availablePoints = talentPoints;

    const heroesState = useGameStore((s: any) => s.heroes) || {};
    const heroState = heroesState[hero.id] || { level: 1 };
    const heroLevel = heroState.level || 1;

    const [activeTalent, setActiveTalent] = useState<any>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedBranchId, setSelectedBranchId] = useState(TALENTS_CONFIG[0].id);

    const { handleUpgrade } = useTalentProgress(hero.id, talents, availablePoints, upgradeTalent);

    if (isCompact) {
        return (
            <div
                id="talents-view-root"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: '15px',
                    position: 'relative',
                }}
            >
                {/* Compact Points Block */}
                <div
                    style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(240,192,64,0.3)',
                        padding: '10px 15px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                    }}
                >
                    <span
                        style={{
                            fontSize: '11px',
                            color: '#a88020',
                            fontWeight: 'bold',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        ДОСТУПНЫЕ ОЧКИ:
                    </span>
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '22px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 0 10px rgba(240,192,64,0.6)',
                        }}
                    >
                        {availablePoints ?? 0}
                    </span>
                </div>

                {/* Branch selector tabs */}
                <div
                    style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '10px',
                        padding: '4px',
                        gap: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    {TALENTS_CONFIG.map((b) => {
                        const active = selectedBranchId === b.id;
                        return (
                            <button
                                key={b.id}
                                onClick={() => {
                                    setSelectedBranchId(b.id);
                                    audioService.playSFX('SFX_CLICK');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    background: active ? `${b.color}22` : 'transparent',
                                    color: active ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                    border: active ? `1px solid ${b.color}` : '1px solid transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    fontSize: '10px',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {b.icon} {b.title}
                            </button>
                        );
                    })}
                </div>

                {/* Compact branch tree */}
                {TALENTS_CONFIG.filter((b) => b.id === selectedBranchId).map((branch) => {
                    const branchPoints = Object.entries(talents)
                        .filter(([id]) => id.startsWith(branch.id.substring(0, 3)))
                        .reduce((a, [, v]) => a + (v as number), 0);

                    return (
                        <div
                            key={branch.id}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'rgba(18,18,26,0.3)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '20px',
                                padding: '15px 10px',
                                height: '350px',
                                position: 'relative',
                                overflow: 'visible',
                            }}
                        >
                            {/* SVG Connector Lines */}
                            <svg
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                    overflow: 'visible',
                                }}
                            >
                                <line
                                    x1="50%"
                                    y1="18%"
                                    x2="25%"
                                    y2="50%"
                                    stroke={branchPoints >= branch.tiers[1].requiredInBranch ? branch.color : '#222'}
                                    strokeWidth="3"
                                    style={{
                                        filter:
                                            branchPoints >= branch.tiers[1].requiredInBranch
                                                ? `drop-shadow(0 0 4px ${branch.color})`
                                                : 'none',
                                    }}
                                />
                                <line
                                    x1="50%"
                                    y1="18%"
                                    x2="75%"
                                    y2="50%"
                                    stroke={branchPoints >= branch.tiers[1].requiredInBranch ? branch.color : '#222'}
                                    strokeWidth="3"
                                    style={{
                                        filter:
                                            branchPoints >= branch.tiers[1].requiredInBranch
                                                ? `drop-shadow(0 0 4px ${branch.color})`
                                                : 'none',
                                    }}
                                />
                                <line
                                    x1="25%"
                                    y1="50%"
                                    x2="50%"
                                    y2="82%"
                                    stroke={branchPoints >= branch.tiers[2].requiredInBranch ? branch.color : '#222'}
                                    strokeWidth="3"
                                    style={{
                                        filter:
                                            branchPoints >= branch.tiers[2].requiredInBranch
                                                ? `drop-shadow(0 0 4px ${branch.color})`
                                                : 'none',
                                    }}
                                />
                                <line
                                    x1="75%"
                                    y1="50%"
                                    x2="50%"
                                    y2="82%"
                                    stroke={branchPoints >= branch.tiers[2].requiredInBranch ? branch.color : '#222'}
                                    strokeWidth="3"
                                    style={{
                                        filter:
                                            branchPoints >= branch.tiers[2].requiredInBranch
                                                ? `drop-shadow(0 0 4px ${branch.color})`
                                                : 'none',
                                    }}
                                />
                            </svg>

                            {/* Nodes positioning */}
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                {branch.tiers.map((tier, tIndex) => {
                                    const requiredLevel = tIndex === 0 ? 1 : tIndex === 1 ? 2 : 5;
                                    const isLevelUnlocked = heroLevel >= requiredLevel;
                                    const isUnlocked = branchPoints >= tier.requiredInBranch && isLevelUnlocked;

                                    return tier.talents.map((talent, talentIndex) => {
                                        const lvl = talents[talent.id] || 0;
                                        let left = '50%';
                                        let top = '18%';
                                        if (tIndex === 0) {
                                            left = '50%';
                                            top = '18%';
                                        } else if (tIndex === 1) {
                                            left = talentIndex === 0 ? '25%' : '75%';
                                            top = '50%';
                                        } else if (tIndex === 2) {
                                            left = '50%';
                                            top = '82%';
                                        }

                                        return (
                                            <div
                                                key={talent.id}
                                                style={{
                                                    position: 'absolute',
                                                    left,
                                                    top,
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 2,
                                                }}
                                            >
                                                <TalentNode
                                                    talent={talent}
                                                    level={lvl}
                                                    branchColor={branch.color}
                                                    isUnlocked={isUnlocked}
                                                    canAfford={availablePoints > 0}
                                                    onClick={() => {
                                                        if (isLevelUnlocked) {
                                                            handleUpgrade(talent, branch.id);
                                                        }
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const root = document.getElementById('hero-scene-root');
                                                        const rootRect = root?.getBoundingClientRect();
                                                        if (rootRect) {
                                                            const scale = rootRect.width / 1920;
                                                            // Compact Tooltip Positioning (on the left side of the right panel)
                                                            setTooltipPos({
                                                                x: (rect.left - rootRect.left) / scale - 470,
                                                                y: (rect.top - rootRect.top) / scale - 50,
                                                            });
                                                        }
                                                        setActiveTalent({
                                                            ...talent,
                                                            level: lvl,
                                                            branchPoints,
                                                            required: tier.requiredInBranch,
                                                            requiredLevel,
                                                            isLevelUnlocked,
                                                        });
                                                    }}
                                                    onMouseLeave={() => setActiveTalent(null)}
                                                />
                                            </div>
                                        );
                                    });
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Reset button at the bottom */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
                    <button
                        onClick={() => {
                            useGameStore.getState().showConfirm('Сбросить все таланты? Очки будут возвращены.', () => {
                                resetTalents(hero.id);
                                audioService.playSFX('SFX_CLICK');
                            });
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 0',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                        }}
                    >
                        🔄 СБРОСИТЬ ТАЛАНТЫ
                    </button>
                </div>

                {/* TOOLTIP */}
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
            </div>
        );
    }

    return (
        <motion.div
            id="talents-view-root"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{
                position: 'absolute',
                inset: '20px 60px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10,
            }}
        >
            {/* HEADER */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}
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
                            fontFamily: "'Cinzel', 'Philosopher', serif",
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

                {/* POINTS BLOCK */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(20,20,25,0.95) 0%, rgba(30,30,45,0.98) 100%)',
                        border: '2px solid rgba(240,192,64,0.6)',
                        padding: '10px 35px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 25px rgba(240,192,64,0.1)',
                        backdropFilter: 'blur(20px)',
                        minWidth: '220px',
                        justifyContent: 'center',
                    }}
                >
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
                </motion.div>
            </div>

            {/* TREE COLUMNS */}
            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                    alignItems: 'stretch',
                    minHeight: 0,
                }}
            >
                {TALENTS_CONFIG.map((branch) => {
                    const branchPoints = Object.entries(talents)
                        .filter(([id]) => id.startsWith(branch.id.substring(0, 3)))
                        .reduce((a, [, v]) => a + (v as number), 0);

                    return (
                        <div
                            key={branch.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'rgba(18,18,26,0.45)',
                                border: '1.5px solid rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                padding: '20px 16px 24px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 0 30px rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)',
                                height: '100%',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                            }}
                        >
                            {/* BRANCH HEADER */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: `linear-gradient(90deg, ${branch.color}18 0%, transparent 100%)`,
                                    padding: '10px 18px',
                                    borderRadius: '12px',
                                    borderLeft: `3px solid ${branch.color}`,
                                    marginBottom: '20px',
                                }}
                            >
                                <span style={{ fontSize: '28px', filter: `drop-shadow(0 0 8px ${branch.color})` }}>
                                    {branch.icon}
                                </span>
                                <span
                                    style={{
                                        color: '#fff',
                                        fontSize: '20px',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '2px',
                                        textShadow: `0 0 10px ${branch.color}44`,
                                    }}
                                >
                                    {branch.title}
                                </span>
                            </div>

                            {/* Branch content container - absolute positioning context */}
                            <div
                                style={{
                                    flex: 1,
                                    position: 'relative',
                                    width: '100%',
                                    minHeight: 0,
                                    overflow: 'visible',
                                }}
                            >
                                {/* SVG Connector Lines */}
                                <svg
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        pointerEvents: 'none',
                                        overflow: 'visible',
                                    }}
                                >
                                    {/* Line 1: Tier 1 (50%, 18%) -> Tier 2 Left (25%, 50%) */}
                                    <line
                                        x1="50%"
                                        y1="18%"
                                        x2="25%"
                                        y2="50%"
                                        stroke={
                                            branchPoints >= branch.tiers[1].requiredInBranch ? branch.color : '#222'
                                        }
                                        strokeWidth="4"
                                        style={{
                                            filter:
                                                branchPoints >= branch.tiers[1].requiredInBranch
                                                    ? `drop-shadow(0 0 6px ${branch.color})`
                                                    : 'none',
                                            transition: 'stroke 0.25s ease, filter 0.25s ease',
                                        }}
                                    />
                                    {/* Line 2: Tier 1 (50%, 18%) -> Tier 2 Right (75%, 50%) */}
                                    <line
                                        x1="50%"
                                        y1="18%"
                                        x2="75%"
                                        y2="50%"
                                        stroke={
                                            branchPoints >= branch.tiers[1].requiredInBranch ? branch.color : '#222'
                                        }
                                        strokeWidth="4"
                                        style={{
                                            filter:
                                                branchPoints >= branch.tiers[1].requiredInBranch
                                                    ? `drop-shadow(0 0 6px ${branch.color})`
                                                    : 'none',
                                            transition: 'stroke 0.25s ease, filter 0.25s ease',
                                        }}
                                    />
                                    {/* Line 3: Tier 2 Left (25%, 50%) -> Tier 3 (50%, 82%) */}
                                    <line
                                        x1="25%"
                                        y1="50%"
                                        x2="50%"
                                        y2="82%"
                                        stroke={
                                            branchPoints >= branch.tiers[2].requiredInBranch ? branch.color : '#222'
                                        }
                                        strokeWidth="4"
                                        style={{
                                            filter:
                                                branchPoints >= branch.tiers[2].requiredInBranch
                                                    ? `drop-shadow(0 0 6px ${branch.color})`
                                                    : 'none',
                                            transition: 'stroke 0.25s ease, filter 0.25s ease',
                                        }}
                                    />
                                    {/* Line 4: Tier 2 Right (75%, 50%) -> Tier 3 (50%, 82%) */}
                                    <line
                                        x1="75%"
                                        y1="50%"
                                        x2="50%"
                                        y2="82%"
                                        stroke={
                                            branchPoints >= branch.tiers[2].requiredInBranch ? branch.color : '#222'
                                        }
                                        strokeWidth="4"
                                        style={{
                                            filter:
                                                branchPoints >= branch.tiers[2].requiredInBranch
                                                    ? `drop-shadow(0 0 6px ${branch.color})`
                                                    : 'none',
                                            transition: 'stroke 0.25s ease, filter 0.25s ease',
                                        }}
                                    />
                                </svg>

                                {/* Nodes positioning */}
                                {branch.tiers.map((tier, tIndex) => {
                                    const requiredLevel = tIndex === 0 ? 1 : tIndex === 1 ? 2 : 5;
                                    const isLevelUnlocked = heroLevel >= requiredLevel;
                                    const isUnlocked = branchPoints >= tier.requiredInBranch && isLevelUnlocked;

                                    return tier.talents.map((talent, talentIndex) => {
                                        const lvl = talents[talent.id] || 0;
                                        // Calculate position
                                        let left = '50%';
                                        let top = '18%';
                                        if (tIndex === 0) {
                                            left = '50%';
                                            top = '18%';
                                        } else if (tIndex === 1) {
                                            left = talentIndex === 0 ? '25%' : '75%';
                                            top = '50%';
                                        } else if (tIndex === 2) {
                                            left = '50%';
                                            top = '82%';
                                        }

                                        return (
                                            <div
                                                key={talent.id}
                                                style={{
                                                    position: 'absolute',
                                                    left,
                                                    top,
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 2,
                                                }}
                                            >
                                                <TalentNode
                                                    talent={talent}
                                                    level={lvl}
                                                    branchColor={branch.color}
                                                    isUnlocked={isUnlocked}
                                                    canAfford={availablePoints > 0}
                                                    onClick={() => {
                                                        if (isLevelUnlocked) {
                                                            handleUpgrade(talent, branch.id);
                                                        }
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const root = document.getElementById('hero-scene-root');
                                                        const talentsRoot =
                                                            document.getElementById('talents-view-root');
                                                        const rootRect = root?.getBoundingClientRect();
                                                        const talentsRect = talentsRoot?.getBoundingClientRect();
                                                        if (rootRect && talentsRect) {
                                                            const scale = rootRect.width / 1920;
                                                            const x = (rect.right - talentsRect.left) / scale + 20;
                                                            const y = (rect.top - talentsRect.top) / scale;
                                                            setTooltipPos({
                                                                x: x > 1100 ? x - 610 : x,
                                                                y: y > 500 ? y - 350 : y,
                                                            });
                                                        }
                                                        setActiveTalent({
                                                            ...talent,
                                                            level: lvl,
                                                            branchPoints,
                                                            required: tier.requiredInBranch,
                                                            requiredLevel,
                                                            isLevelUnlocked,
                                                        });
                                                    }}
                                                    onMouseLeave={() => setActiveTalent(null)}
                                                />
                                            </div>
                                        );
                                    });
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        useGameStore.getState().showConfirm('Сбросить все таланты? Очки будут возвращены.', () => {
                            resetTalents(hero.id);
                            audioService.playSFX('SFX_CLICK');
                        });
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

            {/* TOOLTIP */}
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
