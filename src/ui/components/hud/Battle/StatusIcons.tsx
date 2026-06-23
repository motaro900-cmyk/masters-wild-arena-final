import React from 'react';
import { motion } from 'framer-motion';

interface StatusIconsProps {
    statuses?: Array<{ type: string; stacks: number; duration: number }>;
    isEnemy?: boolean;
}

/** Панель отображения активных дебаффов/эффектов под HP-баром */
export const StatusIcons = React.memo<StatusIconsProps>(({ statuses = [], isEnemy = false }) => {
    if (!statuses || statuses.length === 0) return null;

    return (
        <div
            style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                justifyContent: isEnemy ? 'flex-end' : 'flex-start',
                position: 'absolute',
                left: isEnemy ? 'auto' : '130px',
                right: isEnemy ? '130px' : 'auto',
                bottom: '-28px', // Positioned below the HP bar
                width: '280px',
                pointerEvents: 'none',
                zIndex: 150,
            }}
        >
            {statuses.map((status, idx) => {
                let emoji = '💫';
                let color = '#FFD700'; // STUN
                let label = 'Оглушение';
                if (status.type === 'BURN') {
                    emoji = '🔥';
                    color = '#FF4500';
                    label = 'Горение';
                } else if (status.type === 'FREEZE') {
                    emoji = '❄️';
                    color = '#00BFFF';
                    label = 'Заморозка';
                } else if (status.type === 'POISON') {
                    emoji = '☠️';
                    color = '#32CD32';
                    label = 'Яд';
                }

                return (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.08 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(15, 8, 4, 0.65)',
                            backdropFilter: 'blur(8px)',
                            border: `1.5px solid ${color}`,
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontFamily: 'Outfit, Inter, sans-serif',
                            boxShadow: `0 0 8px ${color}66, inset 0 0 10px rgba(0,0,0,0.5)`,
                            textShadow: '1px 1px 2px #000',
                            cursor: 'help',
                            transition: 'box-shadow 0.3s',
                        }}
                        title={`${label}: ${status.duration} ход.`}
                    >
                        <span style={{ fontSize: '13px' }}>{emoji}</span>
                        <span style={{ fontSize: '11px' }}>{label}</span>
                        {status.stacks > 1 && (
                            <span style={{ color: '#FFD700', fontSize: '11px', fontWeight: '900' }}>
                                x{status.stacks}
                            </span>
                        )}
                        <span style={{ opacity: 0.7, fontSize: '10px', marginLeft: '2px' }}>({status.duration}х)</span>
                    </motion.div>
                );
            })}
        </div>
    );
});
