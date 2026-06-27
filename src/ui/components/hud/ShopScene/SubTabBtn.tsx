import React from 'react';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface SubTabBtnProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    isMobile?: boolean;
}

export const SubTabBtn: React.FC<SubTabBtnProps> = ({ label, isActive, onClick, isMobile = false }) => {
    return (
        <button
            className={isMobile ? 'nav-tab-mobile' : ''}
            onClick={() => {
                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                onClick();
            }}
            style={{
                background: isActive ? 'rgba(240, 192, 64, 0.15)' : 'rgba(10, 8, 8, 0.75)',
                border: isActive ? '2px solid #f0c040' : '1px solid rgba(240, 192, 64, 0.25)',
                borderRadius: '8px',
                color: isActive ? '#ffd700' : '#c8a870',
                fontFamily: "'Cinzel', 'Philosopher', serif",
                fontWeight: 900,
                fontSize: isMobile ? '15px' : '17px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: isMobile ? '16px 30px' : '15px 30px',
                position: 'relative',
                transition: 'all 0.3s',
                minWidth: 'unset',
                minHeight: 'unset',
                flexShrink: 0,
                boxShadow: isActive ? '0 0 10px rgba(240, 192, 64, 0.2)' : 'none',
            }}
        >
            {label}
        </button>
    );
};
