import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Swords, Skull, Shield, Lock as LockIcon } from 'lucide-react';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { audioService } from '../../../../services/AudioService';

interface MobData {
    id: string;
    name: string;
    image: string;
    icon: string;
    isBoss: boolean;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
}

interface FloorRouteTimelineProps {
    floors: number[];
    selectedFloor: number;
    pveStage: number;
    onSelectFloor: (floor: number) => void;
    getMobDataForFloor: (floor: number) => MobData;
}

export const FloorRouteTimeline: React.FC<FloorRouteTimelineProps> = ({
    floors,
    selectedFloor,
    pveStage,
    onSelectFloor,
    getMobDataForFloor,
}) => {
    const activeRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [pveStage]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <style>{`
                .timeline-scroll-container::-webkit-scrollbar {
                    width: 6px;
                }
                .timeline-scroll-container::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 4px;
                }
                .timeline-scroll-container::-webkit-scrollbar-thumb {
                    background: rgba(196, 139, 59, 0.45);
                    border-radius: 4px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                }
                .timeline-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(196, 139, 59, 0.75);
                }
            `}</style>

            <span
                style={{
                    fontSize: '11px',
                    color: '#888',
                    letterSpacing: '1px',
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    marginBottom: '4px',
                }}
            >
                ПРЕДСТОЯЩИЙ МАРШРУТ
            </span>

            <div
                className="timeline-scroll-container"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '390px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                }}
            >
                {floors.map((floor, idx) => {
                    const isSelected = floor === selectedFloor;
                    const isCurrent = floor === pveStage;
                    const isLocked = floor > pveStage;
                    const fInfo = getMobDataForFloor(floor);

                    return (
                        <motion.div
                            key={floor}
                            ref={isCurrent ? activeRef : null}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={
                                !isLocked
                                    ? {
                                          x: 4,
                                          background: isSelected
                                              ? 'rgba(184, 134, 11, 0.12)'
                                              : 'rgba(255, 255, 255, 0.04)',
                                      }
                                    : {}
                            }
                            transition={{
                                delay: Math.min(idx * 0.03, 0.4),
                            }}
                            style={{
                                background: isSelected
                                    ? 'rgba(184, 134, 11, 0.08)'
                                    : isCurrent
                                      ? 'rgba(196, 139, 59, 0.03)'
                                      : 'rgba(0, 0, 0, 0.45)',
                                border: isSelected
                                    ? '2px solid #b8860b'
                                    : isCurrent
                                      ? '1.5px dashed rgba(196, 139, 59, 0.6)'
                                      : '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                opacity: isLocked ? 0.35 : 1,
                                boxShadow: isCurrent ? '0 0 15px rgba(196, 139, 59, 0.15)' : 'none',
                            }}
                            onClick={() => {
                                if (!isLocked) {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    onSelectFloor(floor);
                                }
                            }}
                        >
                            {/* Аватарка моба */}
                            <div
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: isSelected
                                        ? '1px solid rgba(184, 134, 11, 0.8)'
                                        : '1px solid rgba(255, 255, 255, 0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)',
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={fInfo.image}
                                    style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                                    alt={fInfo.name}
                                />
                            </div>

                            {/* Инфо */}
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        color: isSelected ? '#fbbf24' : isCurrent ? '#fcd34d' : '#fff',
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '0.3px',
                                    }}
                                >
                                    {floor}. {fInfo.name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                    <span
                                        style={{
                                            fontSize: '9px',
                                            color: fInfo.isBoss ? '#f87171' : '#a3a3a3',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                        }}
                                    >
                                        {fInfo.isBoss ? (
                                            <>
                                                <Skull
                                                    size={10}
                                                    color="#f87171"
                                                    fill="#f87171"
                                                    style={{ opacity: 0.8 }}
                                                />
                                                <span>БОСС</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={10} color="#a3a3a3" style={{ opacity: 0.8 }} />
                                                <span>Моб</span>
                                            </>
                                        )}
                                    </span>
                                    <span style={{ fontSize: '9px', color: '#6b7280' }}>|</span>
                                    <span
                                        style={{
                                            fontSize: '9px',
                                            color: '#f87171',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                        }}
                                    >
                                        <Heart
                                            size={10}
                                            color="#f87171"
                                            fill="#f87171"
                                            style={{ filter: 'drop-shadow(0 0 2px rgba(248,113,113,0.4))' }}
                                        />
                                        {fInfo.hp}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '9px',
                                            color: '#fbbf24',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                        }}
                                    >
                                        <Swords
                                            size={10}
                                            color="#fbbf24"
                                            style={{ filter: 'drop-shadow(0 0 2px rgba(251,191,36,0.4))' }}
                                        />
                                        {fInfo.attack}
                                    </span>
                                </div>
                            </div>

                            {/* Замочек или маркер текущего */}
                            {isLocked ? (
                                <LockIcon size={12} color="#fff" style={{ opacity: 0.4, flexShrink: 0 }} />
                            ) : isCurrent ? (
                                <span style={{ fontSize: '12px', color: '#fbbf24' }}>●</span>
                            ) : null}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
