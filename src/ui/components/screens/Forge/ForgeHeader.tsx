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
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#fff',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '14px',
                    fontWeight: 700,
                }}
            >
                <div
                    style={{
                        width: '28px',
                        height: '28px',
                        backgroundImage: `url(${AssetsMap.UI.ICON_EXIT})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
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
                        useGameStore.getState().goToShop('ALCHEMY');
                    }
                }}
            />
        </div>
    );
};
