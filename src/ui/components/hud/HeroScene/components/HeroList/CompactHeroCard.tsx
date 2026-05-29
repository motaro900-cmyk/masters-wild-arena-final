import React from 'react';
import { motion } from 'framer-motion';
import { ROLE_ICONS } from '../../constants/roleIcons';

interface CompactHeroCardProps {
    hero: any;
    isOwned: boolean;
    isActive: boolean;
    onClick: () => void;
    color: string;
}

export const CompactHeroCard: React.FC<CompactHeroCardProps> = ({ hero, isOwned, isActive, onClick, color }) => {
    const role = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{
                width: '160px',
                height: '210px',
                background: `linear-gradient(180deg, ${color}15 0%, rgba(10,10,15,0.95) 70%, rgba(5,5,8,1) 100%)`,
                borderRadius: '16px',
                border: isActive ? `2px solid #f0c040` : `1.5px solid ${color}33`,
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? `0 0 20px ${color}33, inset 0 0 12px ${color}11` : `0 8px 20px rgba(0,0,0,0.6)`,
                transition: 'border-color 0.2s',
                flexShrink: 0,
            }}
        >
            {/* АКТИВНАЯ КОРЫШКА / КОРОНА */}
            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        right: '8px',
                        fontSize: '12px',
                        filter: 'drop-shadow(0 0 5px gold)',
                        zIndex: 10,
                    }}
                >
                    👑
                </div>
            )}

            {/* ИКОНКА РОЛИ */}
            <div
                style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    zIndex: 10,
                    background: role.bg,
                    border: `1px solid ${role.color}`,
                    borderRadius: '4px',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                title={role.label}
            >
                <span style={{ fontSize: '10px', lineHeight: 1 }}>{role.icon}</span>
            </div>

            {/* КРАСНЫЙ ЗАМОК ДЛЯ ЗАБЛОКИРОВАННЫХ */}
            {!isOwned && (
                <div
                    style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                    }}
                >
                    🔒
                </div>
            )}

            {/* КАРТИНКА ГЕРОЯ */}
            <div style={{ width: '100%', height: '110px', position: 'relative', marginBottom: '8px' }}>
                <img
                    src={hero.image}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, position: 'relative' }}
                    alt=""
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                        opacity: 0.8,
                    }}
                />
            </div>

            {/* ИМЯ ГЕРОЯ */}
            <div style={{ textAlign: 'center', flex: 1, zIndex: 2, width: '100%' }}>
                <h4
                    style={{
                        color: '#ffffff',
                        fontSize: '13px',
                        margin: '0 0 4px 0',
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {hero.name}
                </h4>
                <div
                    style={{
                        color: isOwned ? color : 'rgba(200,200,200,0.4)',
                        fontSize: '8px',
                        fontWeight: 900,
                        background: isOwned ? `${color}15` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isOwned ? color + '44' : 'rgba(255,255,255,0.06)'}`,
                        padding: '2px 8px',
                        borderRadius: '3px',
                        display: 'inline-block',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                    }}
                >
                    {hero.rarity}
                </div>
            </div>

            {/* СТАТУС ВЫБОРА ВНИЗУ */}
            {isActive && (
                <div
                    style={{
                        width: '100%',
                        height: '4px',
                        background: '#f0c040',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        boxShadow: '0 -2px 10px #f0c040',
                    }}
                />
            )}
        </motion.div>
    );
};
