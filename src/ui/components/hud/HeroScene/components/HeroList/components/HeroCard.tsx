import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { rarityColors } from '../../../constants/roleIcons';
import { ROLE_ICONS } from '../../../constants/roleIcons';
import { resolveAssetPath } from '../../../../../../../utils/assetPath';
import { RARITY_LABELS, RARITY_GLOWS } from '../utils/heroUtils';

interface HeroCardProps {
    hero: any;
    isOwned: boolean;
    isActive: boolean;
    isSelected: boolean;
    activeSkin: any;
    onClick: () => void;
}

export function HeroCard({ hero, isOwned, isActive, isSelected, activeSkin, onClick }: HeroCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        const rX = -(mouseY / height) * 12; // Max 12 degrees
        const rY = (mouseX / width) * 12;
        setTilt({ x: rX, y: rY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const activeRarity = activeSkin && activeSkin.id !== 'default' ? activeSkin.rarity : hero.rarity;
    const activeName = activeSkin && activeSkin.id !== 'default' ? activeSkin.name : hero.name;
    const activeSkinImage = activeSkin ? activeSkin.image : hero.image;

    const color = rarityColors[activeRarity] || '#fff';
    const glow = RARITY_GLOWS[activeRarity] || 'rgba(0,0,0,0)';
    const roleInfo = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                position: 'relative',
                background: isSelected
                    ? `linear-gradient(180deg, rgba(20, 16, 14, 0.98) 0%, ${color}1e 100%)`
                    : `linear-gradient(180deg, rgba(14, 12, 10, 0.95) 0%, rgba(20, 16, 14, 0.98) 100%)`,
                border: isSelected
                    ? `2px solid ${color}`
                    : isActive
                      ? '2.5px solid #f0c040'
                      : `1px solid rgba(255, 255, 255, 0.08)`,
                borderRadius: '16px',
                cursor: 'pointer',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                boxShadow: isSelected
                    ? `0 0 20px ${glow}, 0 8px 24px rgba(0, 0, 0, 0.8)`
                    : '0 4px 12px rgba(0, 0, 0, 0.6)',
                transformStyle: 'preserve-3d',
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.08s ease-out, box-shadow 0.22s, border-color 0.22s',
                display: 'flex',
                flexDirection: 'column',
                height: '330px',
            }}
        >
            {/* Background Rarity Glow inside Card */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: isSelected
                        ? `radial-gradient(circle at 50% 30%, ${color}1a 0%, transparent 70%)`
                        : 'none',
                    pointerEvents: 'none',
                }}
            />

            {/* Top Border Glow Highlight if active combat hero */}
            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
                        zIndex: 5,
                    }}
                />
            )}

            {/* Character Artwork Frame */}
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at 50% 70%, rgba(0,0,0,0.65) 0%, rgba(10,8,7,0.3) 100%)',
                }}
            >
                <img
                    src={resolveAssetPath(activeSkinImage)}
                    style={{
                        height: '88%',
                        width: 'auto',
                        objectFit: 'contain',
                        zIndex: 2,
                        userSelect: 'none',
                        filter: isOwned ? 'none' : 'grayscale(1) brightness(0.25)',
                    }}
                    alt={activeName}
                    draggable={false}
                />

                {/* Pedestal ring under character */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-10px',
                        width: '120px',
                        height: '30px',
                        borderRadius: '50%',
                        background: `radial-gradient(ellipse, ${color}2a 0%, transparent 70%)`,
                        zIndex: 1,
                    }}
                />
            </div>

            {/* Card Footer */}
            <div
                style={{
                    padding: '12px 14px',
                    background: 'rgba(6,5,4,0.95)',
                    borderTop: `1px solid ${isSelected ? color + '33' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                }}
            >
                {/* 1. Name */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {hero.name}
                    </span>

                    {/* Status Badge */}
                    {isOwned ? (
                        isActive ? (
                            <span
                                style={{
                                    color: '#4ade80',
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    borderRadius: '5px',
                                    padding: '1px 4px',
                                    fontFamily: "'Nunito', sans-serif",
                                    letterSpacing: '0.3px',
                                }}
                            >
                                АКТИВ
                            </span>
                        ) : null
                    ) : (
                        <span style={{ fontSize: '12px', opacity: 0.5 }}>🔒</span>
                    )}
                </div>

                {/* 2. Skin / Appearance name */}
                <div
                    style={{
                        color: activeSkin && activeSkin.id !== 'default' ? activeSkin.color || color : '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: "'Nunito', sans-serif",
                        opacity: activeSkin && activeSkin.id !== 'default' ? 1 : 0.7,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '1px',
                    }}
                >
                    {activeSkin && activeSkin.id !== 'default' ? activeSkin.name : hero.title}
                </div>

                {/* 3. Rarity & Class */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                    }}
                >
                    <span
                        style={{
                            color,
                            fontSize: '9px',
                            fontWeight: 900,
                            fontFamily: "'Nunito', sans-serif",
                            letterSpacing: '1.2px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {RARITY_LABELS[activeRarity]}
                    </span>

                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>·</span>

                    <span
                        style={{
                            color: roleInfo.color,
                            fontSize: '9.5px',
                            fontWeight: 800,
                            fontFamily: "'Nunito', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {roleInfo.icon} {roleInfo.label}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
