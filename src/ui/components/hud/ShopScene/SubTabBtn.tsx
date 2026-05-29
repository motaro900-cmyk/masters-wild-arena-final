import React from 'react';
import { motion } from 'framer-motion';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface SubTabBtnProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const SubTabBtn: React.FC<SubTabBtnProps> = ({ label, isActive, onClick }) => {
    return (
        <button
            onClick={() => {
                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                onClick();
            }}
            style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? '#ffd700' : '#c8a870',
                fontFamily: "'Cinzel', 'Philosopher', serif",
                fontWeight: 900,
                fontSize: '16px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '5px 15px',
                position: 'relative',
                transition: 'all 0.3s',
            }}
        >
            {label}
            {isActive && (
                <motion.div
                    layoutId="subTabMarker"
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #ef4444, 0 0 5px #ef4444',
                    }}
                />
            )}
        </button>
    );
};
