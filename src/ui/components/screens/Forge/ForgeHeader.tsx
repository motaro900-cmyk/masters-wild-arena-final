import React from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { ResourceBar } from '../../hud/ResourceBar';
import { styles } from './ForgeStyles';

interface ForgeHeaderProps {
    goToCity: () => void;
}

export const ForgeHeader: React.FC<ForgeHeaderProps> = ({ goToCity }) => {
    return (
        <div style={styles.header}>
            <button
                onClick={goToCity}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'linear-gradient(180deg, rgba(185, 28, 28, 0.4) 0%, rgba(127, 29, 29, 0.6) 100%)',
                    border: '1.5px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '8px 16px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <div
                    style={{
                        width: '18px',
                        height: '18px',
                        backgroundImage: `url(${AssetsMap.UI.ICON_EXIT})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                    }}
                />
                <span>ВЫХОД [ESC]</span>
            </button>
            <div style={styles.headerTitleGroup}>
                <h1 style={styles.mainTitle}>КОРОЛЕВСКАЯ КУЗНИЦА</h1>
                <span style={styles.subTitle}>Улучшай снаряжение и раскрывай его истинную мощь</span>
            </div>
            <ResourceBar
                onOpenShop={(tab) => {
                    if (tab === 'GOLD' || tab === 'GEMS' || tab === 'ENERGY') {
                        useGameStore.getState().goToShop('BANK', tab);
                    } else {
                        useGameStore.getState().goToShop('ARSENAL');
                    }
                }}
            />
        </div>
    );
};
