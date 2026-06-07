import React from 'react';
import { motion } from 'framer-motion';
import { SceneTab } from '../types';

interface HeroSceneSidebarProps {
    activeTab: SceneTab;
    setActiveTab: (tab: SceneTab) => void;
    onBack: () => void;
}

const stoneBrickPattern =
    "url(\"data:image/svg+xml;utf8,<svg width='60' height='40' viewBox='0 0 60 40' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='40' fill='none'/><line x1='0' y1='20' x2='60' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='40' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='30' y1='0' x2='30' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='20' x2='0' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='60' y1='20' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='1.5' x2='60' y2='1.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='0' y1='21.5' x2='60' y2='21.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='31.5' y1='0.8' x2='31.5' y2='19.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='1.5' y1='20.8' x2='1.5' y2='39.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><path d='M44,3 L40,7 L42,12 L38,15' stroke='rgba(0,0,0,0.45)' stroke-width='0.8' fill='none'/><path d='M45,3.5 L41,7.5 L43,12.5 L39,15.5' stroke='rgba(255,255,255,0.08)' stroke-width='0.8' fill='none'/><line x1='6' y1='8' x2='20' y2='8' stroke='rgba(0,0,0,0.42)' stroke-width='0.8'/><line x1='6' y1='9' x2='20' y2='9' stroke='rgba(255,255,255,0.08)' stroke-width='0.8'/><path d='M10,23 L13,28 L11,34' stroke='rgba(0,0,0,0.48)' stroke-width='0.9' fill='none'/><path d='M11,23.5 L14,28.5 L12,34.5' stroke='rgba(255,255,255,0.09)' stroke-width='0.9' fill='none'/><path d='M35,33 L48,30 L54,32' stroke='rgba(0,0,0,0.42)' stroke-width='0.8' fill='none'/><path d='M35,34 L48,31 L54,33' stroke='rgba(255,255,255,0.07)' stroke-width='0.8' fill='none'/><circle cx='12' cy='14' r='0.8' fill='rgba(0,0,0,0.45)'/><circle cx='12.5' cy='14.5' r='0.4' fill='rgba(255,255,255,0.08)'/><circle cx='48' cy='26' r='1.2' fill='rgba(0,0,0,0.5)'/><circle cx='48.5' cy='26.5' r='0.6' fill='rgba(255,255,255,0.1)'/></svg>\")";

// SVG Icons for each tab
const IconHeroes = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        {/* Helmet dome */}
        <path
            d="M12 2C8 2 6 5 6 10v3c0 2 1 4 3 5l3 2 3-2c2-1 3-3 3-5v-3c0-5-2-8-6-8Z"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.5)'}
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill={active ? 'rgba(240, 192, 64, 0.12)' : 'none'}
        />
        {/* Visor details */}
        <path
            d="M8 11h8M12 2v8M9 14h6"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.5)'}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Left Wing decoration */}
        <path
            d="M5 8c-1.5-1-3-3-2.5-4.5.5-1.5 2 0 3 1.5s1 2.5.5 3Z"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.4)'}
            strokeWidth="1.2"
            fill={active ? 'rgba(240, 192, 64, 0.15)' : 'none'}
        />
        {/* Right Wing decoration */}
        <path
            d="M19 8c1.5-1 3-3 2.5-4.5-.5-1.5-2 0-3 1.5s-1 2.5-.5 3Z"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.4)'}
            strokeWidth="1.2"
            fill={active ? 'rgba(240, 192, 64, 0.15)' : 'none'}
        />
    </svg>
);

const IconEquipment = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        {/* Shield outline */}
        <path
            d="M12 22s8-4.5 8-11.5V5l-8-3-8 3v5.5c0 7 8 11.5 8 11.5Z"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.5)'}
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill={active ? 'rgba(240, 192, 64, 0.12)' : 'none'}
        />
        {/* Sword blade */}
        <path
            d="M12 5v11"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.5)'}
            strokeWidth="1.8"
            strokeLinecap="round"
        />
        {/* Sword guard / hilt */}
        <path
            d="M9.5 7.5h5M11 18.5h2"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.5)'}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Diagonal details */}
        <path
            d="M7.5 9.5l9 5.5M16.5 9.5l-9 5.5"
            stroke={active ? '#f0c040' : 'rgba(255, 254, 250, 0.3)'}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
        />
    </svg>
);

const TAB_CONFIG: { id: SceneTab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
    { id: 'LIST', label: 'ГЕРОИ', Icon: IconHeroes },
    { id: 'HERO', label: 'СНАРЯЖЕНИЕ', Icon: IconEquipment },
];

export const HeroSceneSidebar: React.FC<HeroSceneSidebarProps> = ({ activeTab, setActiveTab }) => {
    const [hoveredId, setHoveredId] = React.useState<SceneTab | null>(null);

    return (
        <div
            style={{
                width: '260px',
                height: '100%',
                background: `${stoneBrickPattern}, linear-gradient(180deg, #1c1612 0%, #120e0b 100%)`,
                borderRight: '1px solid rgba(240, 192, 64, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 18px 20px 18px',
                gap: '0px',
                zIndex: 100,
                boxShadow: '5px 0 25px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box',
                flexShrink: 0,
            }}
        >
            {/* Thin top separator */}
            <div
                style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.25), transparent)',
                    marginBottom: '20px',
                    marginLeft: '-18px',
                    marginRight: '-18px',
                }}
            />

            {/* ── NAV TABS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                {TAB_CONFIG.map(({ id, label, Icon }) => {
                    const isActive = activeTab === id;
                    const isHovered = hoveredId === id;
                    return (
                        <motion.button
                            key={id}
                            whileHover={!isActive ? { x: 4 } : {}}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(id)}
                            onMouseEnter={() => setHoveredId(id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                                width: '100%',
                                padding: '18px 20px',
                                background: isActive
                                    ? 'linear-gradient(135deg, #2c211a 0%, #17120e 100%)'
                                    : isHovered
                                      ? 'linear-gradient(135deg, #1e1814 0%, #110e0c 100%)'
                                      : 'linear-gradient(135deg, #130f0d 0%, #0a0807 100%)',
                                border: isActive
                                    ? '1.5px solid rgba(240, 192, 64, 0.85)'
                                    : isHovered
                                      ? '1px solid rgba(240, 192, 64, 0.45)'
                                      : '1px solid rgba(212, 175, 55, 0.2)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                textAlign: 'left',
                                boxShadow: isActive
                                    ? 'inset 0 0 12px rgba(240,192,64,0.25), 0 4px 15px rgba(0, 0, 0, 0.65)'
                                    : isHovered
                                      ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                                      : 'none',
                                outline: 'none', // removes default browser outline ring on click
                                transition: 'background 0.25s ease, border-color 0.25s, box-shadow 0.25s',
                            }}
                        >
                            {/* Active left stripe */}
                            {isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '20%',
                                        height: '60%',
                                        width: '3px',
                                        background: '#f0c040',
                                        borderRadius: '0 2px 2px 0',
                                        boxShadow: '0 0 8px #f0c040',
                                    }}
                                />
                            )}

                            {/* Icon */}
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    filter: isActive ? 'drop-shadow(0 0 6px rgba(240,192,64,0.5))' : 'none',
                                    transition: 'filter 0.2s ease',
                                }}
                            >
                                <Icon active={isActive} />
                            </div>

                            {/* Label */}
                            <span
                                style={{
                                    color: isActive
                                        ? '#f0c040'
                                        : isHovered
                                          ? 'rgba(255, 254, 250, 0.85)'
                                          : 'rgba(255, 254, 250, 0.6)',
                                    fontSize: '15px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '2px',
                                    textShadow: isActive ? '0 0 8px rgba(240, 192, 64, 0.35)' : 'none',
                                    transition: 'color 0.2s ease',
                                }}
                            >
                                {label}
                            </span>

                            {/* Active glow overlay */}
                            {isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#f0c040',
                                        boxShadow: '0 0 8px #f0c040',
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── BOTTOM DIVIDER ── */}
            <div
                style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                    marginLeft: '-18px',
                    marginRight: '-18px',
                    marginBottom: '14px',
                }}
            />

            {/* ── VERSION LABEL ── */}
            <div
                style={{
                    textAlign: 'center',
                    color: 'rgba(255, 254, 250, 0.3)',
                    fontSize: '10px',
                    fontFamily: "'Nunito', sans-serif",
                    letterSpacing: '1px',
                }}
            >
                MASTERS OF THE WILD
            </div>
        </div>
    );
};
