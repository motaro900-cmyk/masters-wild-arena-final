import { useState } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    closestCenter
} from '@dnd-kit/core';
import { ITEMS_DATABASE } from '../../../../../game/configs/ItemsConfig';

export const useHeroDnd = (
    selectedHeroId: string,
    heroEquipment: any,
    inventory: any[],
    equipItem: (id: string) => void,
    addFloatingText: (text: string, color: string) => void,
    triggerVictory: () => void
) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const itemId = active.id;
        const slotType = over.id;
        const itemData = ITEMS_DATABASE[String(itemId)] as any;

        if (itemData && (itemData.subTab === slotType || (slotType === 'WEAPONS' && itemData.subTab === 'WEAPONS'))) {
            const currentGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
            const existingId = currentGear[slotType];
            const existingItem = existingId ? ITEMS_DATABASE[String(existingId)] as any : null;

            const attackDelta = (itemData.attackBonus || 0) - (existingItem?.attackBonus || 0);
            const hpDelta = (itemData.hpBonus || 0) - (existingItem?.hpBonus || 0);
            const defenseDelta = (itemData.defenseBonus || 0) - (existingItem?.defenseBonus || 0);

            if (attackDelta !== 0) addFloatingText(`${attackDelta > 0 ? '+' : ''}${attackDelta} АТАКА`, attackDelta > 0 ? '#22c55e' : '#ef4444');
            if (hpDelta !== 0) addFloatingText(`${hpDelta > 0 ? '+' : ''}${hpDelta} ХП`, hpDelta > 0 ? '#22c55e' : '#ef4444');
            if (defenseDelta !== 0) addFloatingText(`${defenseDelta > 0 ? '+' : ''}${defenseDelta} ЗАЩИТА`, defenseDelta > 0 ? '#22c55e' : '#ef4444');

            triggerVictory();
            equipItem(itemId);
        }
    };

    const activeItem = activeId ? inventory.find((i: any) => i.id === activeId) : null;
    const activeItemData = activeItem ? ITEMS_DATABASE[String(activeItem.id)] as any : null;

    return {
        sensors,
        handleDragStart,
        handleDragEnd,
        activeId,
        activeItemData,
        collisionDetection: closestCenter
    };
};
