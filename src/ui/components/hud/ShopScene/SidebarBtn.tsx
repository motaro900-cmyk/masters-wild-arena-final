import React from 'react';
import { motion } from 'framer-motion';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface SidebarBtnProps {
    active: boolean;
    onClick: () => void;
    label: string;
    image: string;
    isMobile?: boolean;
}

export const SidebarBtn: React.FC<SidebarBtnProps> = ({ active, onClick, label, image, isMobile = false }) => (
    <motion.button
        onClick={() => {
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            onClick();
        }}
        whileHover={{ x: 5, color: '#fff' }}
        style={{
            width: '100%',
            height: isMobile ? '50px' : '70px',
            background: active ? 'rgba(240, 192, 64, 0.08)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: isMobile ? '6px' : '10px',
            gap: isMobile ? '8px' : '15px',
            position: 'relative',
            zIndex: 10,
            color: active ? '#ffd700' : '#c8a870',
            fontFamily: "'Cinzel', 'Philosopher', serif",
            fontWeight: 900,
            fontSize: isMobile ? '12.5px' : '16px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            borderLeft: active ? '3px solid #f0c040' : '3px solid transparent',
            transition: 'all 0.3s',
            borderRadius: '0 8px 8px 0',
        }}
    >
        <div
            style={{
                width: isMobile ? '34px' : '45px',
                height: isMobile ? '34px' : '45px',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: active ? '0 0 10px rgba(240,192,64,0.3)' : 'none',
                border: active ? '1px solid #f0c040' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s',
                flexShrink: 0,
            }}
        >
            <img
                src={image}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: active ? 'none' : 'grayscale(0.5) brightness(0.7)',
                }}
                alt=""
            />
        </div>
        {label}
    </motion.button>
);
