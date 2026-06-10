import React from 'react';
import { motion } from 'framer-motion';
import { EquipmentSlot } from './EquipmentSlot';

interface GearSlotGridProps {
    equippedIds: Record<string, string>;
    activeDraggingId: string | null;
    handleUnequip: (itemId: string) => void;
    setGlobalHoveredItem: (item: any) => void;
}

export const GearSlotGrid: React.FC<GearSlotGridProps> = ({
    equippedIds,
    activeDraggingId,
    handleUnequip,
    setGlobalHoveredItem,
}) => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 110px)',
                gridTemplateRows: 'repeat(4, 110px)',
                gap: '15px',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '450px',
                    height: '450px',
                    marginLeft: '-225px',
                    marginTop: '-225px',
                    border: '1px dashed rgba(240,192,64,0.06)',
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
                    width: '350px',
                    height: '350px',
                    marginLeft: '-175px',
                    marginTop: '-175px',
                    border: '1px solid rgba(160,64,255,0.05)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* Ряд 1: Голова */}
            <div style={{ zIndex: 1 }} />
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="HELMETS"
                    label="ШЛЕМЫ"
                    itemId={equippedIds.HELMETS}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.HELMETS) handleUnequip(equippedIds.HELMETS);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>
            <div style={{ zIndex: 1 }} />

            {/* Ряд 2: Плечи и Доспех */}
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="SHOULDERS"
                    label="НАПЛЕЧНИКИ"
                    itemId={equippedIds.SHOULDERS}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.SHOULDERS) handleUnequip(equippedIds.SHOULDERS);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="ARMOR"
                    label="ДОСПЕХИ"
                    itemId={equippedIds.ARMOR}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.ARMOR) handleUnequip(equippedIds.ARMOR);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>
            <div style={{ zIndex: 1 }} />

            {/* Ряд 3: Оружие, Поножи, Щит */}
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="WEAPONS"
                    label="ОРУЖИЕ"
                    itemId={equippedIds.WEAPONS}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.WEAPONS) handleUnequip(equippedIds.WEAPONS);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="PANTS"
                    label="ПОНОЖИ"
                    itemId={equippedIds.PANTS}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.PANTS) handleUnequip(equippedIds.PANTS);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="SHIELDS"
                    label="ЩИТЫ"
                    itemId={equippedIds.SHIELDS}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.SHIELDS) handleUnequip(equippedIds.SHIELDS);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>

            {/* Ряд 4: Сапоги */}
            <div style={{ zIndex: 1 }} />
            <div style={{ zIndex: 1 }}>
                <EquipmentSlot
                    id="BOOTS"
                    label="САПОГИ"
                    itemId={equippedIds.BOOTS}
                    activeDraggingId={activeDraggingId}
                    onClick={() => {
                        if (equippedIds.BOOTS) handleUnequip(equippedIds.BOOTS);
                    }}
                    setGlobalHoveredItem={setGlobalHoveredItem}
                />
            </div>
            <div style={{ zIndex: 1 }} />
        </div>
    );
};
