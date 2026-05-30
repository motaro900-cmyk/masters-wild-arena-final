import React from 'react';
import { motion } from 'framer-motion';
import { SceneTab } from '../types';

interface HeroSceneSidebarProps {
    activeTab: SceneTab;
    setActiveTab: (tab: SceneTab) => void;
    onBack: () => void;
}

// SVG Icons for each tab
const IconHeroes = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
            cx="12"
            cy="7"
            r="4"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const IconEquipment = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
            d="M14.5 2.5L20 8l-2 2-5.5-5.5 2-2Z"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? 'rgba(240,192,64,0.15)' : 'none'}
        />
        <path
            d="M4 20l6.5-6.5"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M9 19l-4 1 1-4"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle
            cx="18"
            cy="6"
            r="2"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="1.5"
            fill={active ? 'rgba(240,192,64,0.15)' : 'none'}
        />
    </svg>
);

const IconTalents = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 2L14.5 9h7L16 13.5l2.5 7L12 16l-6.5 4.5 2.5-7L2.5 9h7L12 2Z"
            stroke={active ? '#f0c040' : 'rgba(255,255,255,0.6)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? 'rgba(240,192,64,0.12)' : 'none'}
        />
    </svg>
);

const TAB_CONFIG: { id: SceneTab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
    { id: 'LIST', label: 'ГЕРОИ', Icon: IconHeroes },
    { id: 'HERO', label: 'СНАРЯЖЕНИЕ', Icon: IconEquipment },
    { id: 'TALENTS', label: 'ТАЛАНТЫ', Icon: IconTalents },
];

export const HeroSceneSidebar: React.FC<HeroSceneSidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div
            style={{
                width: '260px',
                height: '100%',
                background: 'linear-gradient(180deg, rgba(32,24,18,0.97) 0%, rgba(20,15,10,0.97) 100%)',
                borderRight: '1px solid rgba(240,192,64,0.12)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 18px 20px 18px',
                gap: '0px',
                zIndex: 100,
                boxShadow: '4px 0 20px rgba(0,0,0,0.5)',
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
                    return (
                        <motion.button
                            key={id}
                            whileHover={!isActive ? { x: 4, backgroundColor: 'rgba(255,255,255,0.04)' } : {}}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(id)}
                            style={{
                                width: '100%',
                                padding: '18px 20px',
                                background: isActive
                                    ? 'linear-gradient(90deg, rgba(240,192,64,0.14) 0%, rgba(240,192,64,0.03) 100%)'
                                    : 'rgba(255,255,255,0.04)',
                                border: 'none',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                textAlign: 'left',
                                boxShadow: isActive ? 'inset 0 0 12px rgba(240,192,64,0.06)' : 'none',
                                transition: 'background 0.2s ease, box-shadow 0.2s ease',
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
                                        background:
                                            'linear-gradient(180deg, rgba(240,192,64,0.4), #f0c040, rgba(240,192,64,0.4))',
                                        borderRadius: '0 2px 2px 0',
                                        boxShadow: '0 0 8px rgba(240,192,64,0.6)',
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
                                    color: isActive ? '#f0c040' : 'rgba(255,255,255,0.65)',
                                    fontSize: '15px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '2px',
                                    textShadow: isActive ? '0 0 12px rgba(240,192,64,0.3)' : 'none',
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
                    color: 'rgba(255,255,255,0.12)',
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
