import React from 'react';
import { motion } from 'framer-motion';
import { EquipmentSlotItem } from './EquipmentSlotItem';

const slots = [
    { id: 'HELMETS', label: 'ШЛЕМ', gridArea: '1 / 2' },
    { id: 'SHOULDERS', label: 'ПЛЕЧИ', gridArea: '2 / 1' },
    { id: 'ARMOR', label: 'ДОСПЕХ', gridArea: '2 / 2' },
    { id: 'WEAPONS', label: 'ОРУЖИЕ', gridArea: '3 / 1' },
    { id: 'PANTS', label: 'ПОНОЖИ', gridArea: '3 / 2' },
    { id: 'SHIELDS', label: 'ЩИТ', gridArea: '3 / 3' },
    { id: 'BOOTS', label: 'САПОГИ', gridArea: '4 / 2' },
] as const;

interface CircularGearLayoutProps {
    equipment: Record<string, string | null>;
    style?: React.CSSProperties;
    isMirrored?: boolean;
}

export const CircularGearLayout: React.FC<CircularGearLayoutProps> = ({ equipment, style, isMirrored }) => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 92px)',
                gridTemplateRows: 'repeat(4, 92px)',
                gap: '8px',
                justifyContent: 'center',
                position: 'relative',
                width: '292px',
                height: '392px',
                transform: isMirrored ? 'scaleX(-1)' : 'none',
                pointerEvents: 'auto',
                ...style,
            }}
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '240px',
                    height: '240px',
                    marginLeft: '-120px',
                    marginTop: '-120px',
                    border: '1.5px dashed rgba(240,192,64,0.12)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '180px',
                    height: '180px',
                    marginLeft: '-90px',
                    marginTop: '-90px',
                    border: '1.5px solid rgba(160,64,255,0.09)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {slots.map((s) => (
                <EquipmentSlotItem
                    key={s.id}
                    slotId={s.id}
                    slotLabel={s.label}
                    gridArea={s.gridArea}
                    equipment={equipment}
                    isMirrored={isMirrored}
                />
            ))}
        </div>
    );
};
