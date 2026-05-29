import { useState } from 'react';
import { useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { ITEMS_DATABASE } from '../../../../../game/configs/ItemsConfig';

const getScale = () => {
    const wrapper = document.querySelector('.game-scale-wrapper');
    if (!wrapper) return 1;
    const rect = wrapper.getBoundingClientRect();
    return rect.width / 1920;
};

// @ts-expect-error - ScaledPointerSensor is a custom sensor extending PointerSensor but doesn't fully match the types
export class ScaledPointerSensor extends PointerSensor {
    // @ts-expect-error - overriding private method attach from PointerSensor
    private attach() {
        const self = this as any;
        const originalAdd = self.listeners.add.bind(self.listeners);
        self.listeners.add = (eventName: string, handler: (...args: any[]) => void, options: any) => {
            const wrappedHandler = (event: any) => {
                const scale = getScale();
                const scaledEvent = new Proxy(event, {
                    get(target, prop) {
                        if (prop === 'clientX') return target.clientX / scale;
                        if (prop === 'clientY') return target.clientY / scale;
                        if (prop === 'touches') {
                            return Array.from(target.touches || []).map(
                                (touch: any) =>
                                    new Proxy(touch, {
                                        get(t, p) {
                                            if (p === 'clientX') return t.clientX / scale;
                                            if (p === 'clientY') return t.clientY / scale;
                                            return Reflect.get(t, p);
                                        },
                                    }),
                            );
                        }
                        if (prop === 'changedTouches') {
                            return Array.from(target.changedTouches || []).map(
                                (touch: any) =>
                                    new Proxy(touch, {
                                        get(t, p) {
                                            if (p === 'clientX') return t.clientX / scale;
                                            if (p === 'clientY') return t.clientY / scale;
                                            return Reflect.get(t, p);
                                        },
                                    }),
                            );
                        }
                        const value = Reflect.get(target, prop);
                        return typeof value === 'function' ? value.bind(target) : value;
                    },
                });
                handler(scaledEvent);
            };
            return originalAdd(eventName, wrappedHandler, options);
        };
        // @ts-expect-error - calling protected/private super.attach
        super.attach();
    }
}

export const useHeroDnd = (
    selectedHeroId: string,
    heroEquipment: any,
    inventory: any[],
    equipItem: (id: string) => void,
    addFloatingText: (text: string, color: string) => void,
    triggerVictory: () => void,
) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(ScaledPointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
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
            const existingItem = existingId ? (ITEMS_DATABASE[String(existingId)] as any) : null;

            const attackDelta = (itemData.attackBonus || 0) - (existingItem?.attackBonus || 0);
            const hpDelta = (itemData.hpBonus || 0) - (existingItem?.hpBonus || 0);
            const defenseDelta = (itemData.defenseBonus || 0) - (existingItem?.defenseBonus || 0);

            if (attackDelta !== 0)
                addFloatingText(
                    `${attackDelta > 0 ? '+' : ''}${attackDelta} АТАКА`,
                    attackDelta > 0 ? '#22c55e' : '#ef4444',
                );
            if (hpDelta !== 0)
                addFloatingText(`${hpDelta > 0 ? '+' : ''}${hpDelta} ХП`, hpDelta > 0 ? '#22c55e' : '#ef4444');
            if (defenseDelta !== 0)
                addFloatingText(
                    `${defenseDelta > 0 ? '+' : ''}${defenseDelta} ЗАЩИТА`,
                    defenseDelta > 0 ? '#22c55e' : '#ef4444',
                );

            triggerVictory();
            equipItem(itemId);
        }
    };

    const activeItem = activeId ? inventory.find((i: any) => i.id === activeId) : null;
    const activeItemData = activeItem ? (ITEMS_DATABASE[String(activeItem.id)] as any) : null;

    return {
        sensors,
        handleDragStart,
        handleDragEnd,
        activeId,
        activeItemData,
        collisionDetection: closestCenter,
    };
};
