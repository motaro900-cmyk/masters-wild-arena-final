import { useState } from 'react';
import { useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { ITEMS_DATABASE } from '../../../../../game/configs/ItemsConfig';
import { useGameStore } from '../../../../../store/useGameStore';

const getScaleAndOffset = () => {
    const wrapper = document.querySelector('.game-scale-wrapper');
    if (!wrapper) return { scale: 1, left: 0, top: 0, isRotated: false, rect: null as any };
    const rect = wrapper.getBoundingClientRect();
    const isPortraitMobile = useGameStore.getState().isMobile && window.innerWidth < window.innerHeight;
    if (isPortraitMobile) {
        return {
            scale: rect.height / 1920,
            left: rect.left,
            top: rect.top,
            isRotated: true,
            rect,
        };
    }
    return {
        scale: rect.width / 1920,
        left: rect.left,
        top: rect.top,
        isRotated: false,
        rect,
    };
};

// @ts-expect-error - ScaledPointerSensor is a custom sensor extending PointerSensor but doesn't fully match the types
export class ScaledPointerSensor extends PointerSensor {
    // @ts-expect-error - overriding private method attach from PointerSensor
    private attach() {
        const self = this as any;
        const originalAdd = self.listeners.add.bind(self.listeners);
        self.listeners.add = (eventName: string, handler: (...args: any[]) => void, options: any) => {
            const wrappedHandler = (event: any) => {
                const info = getScaleAndOffset();
                const scaledEvent = new Proxy(event, {
                    get(target, prop) {
                        if (prop === 'clientX') {
                            if (info.isRotated && info.rect) {
                                const ny = info.rect.height > 0 ? (target.clientY - info.top) / info.rect.height : 0;
                                return ny * 1920;
                            }
                            return (target.clientX - info.left) / info.scale;
                        }
                        if (prop === 'clientY') {
                            if (info.isRotated && info.rect) {
                                const nx = info.rect.width > 0 ? (target.clientX - info.left) / info.rect.width : 0;
                                return (1 - nx) * 1080;
                            }
                            return (target.clientY - info.top) / info.scale;
                        }
                        if (prop === 'touches') {
                            return Array.from(target.touches || []).map(
                                (touch: any) =>
                                    new Proxy(touch, {
                                        get(t, p) {
                                            if (p === 'clientX') {
                                                if (info.isRotated && info.rect) {
                                                    const ny = info.rect.height > 0 ? (t.clientY - info.top) / info.rect.height : 0;
                                                    return ny * 1920;
                                                }
                                                return (t.clientX - info.left) / info.scale;
                                            }
                                            if (p === 'clientY') {
                                                if (info.isRotated && info.rect) {
                                                    const nx = info.rect.width > 0 ? (t.clientX - info.left) / info.rect.width : 0;
                                                    return (1 - nx) * 1080;
                                                }
                                                return (t.clientY - info.top) / info.scale;
                                            }
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
                                            if (p === 'clientX') {
                                                if (info.isRotated && info.rect) {
                                                    const ny = info.rect.height > 0 ? (t.clientY - info.top) / info.rect.height : 0;
                                                    return ny * 1920;
                                                }
                                                return (t.clientX - info.left) / info.scale;
                                            }
                                            if (p === 'clientY') {
                                                if (info.isRotated && info.rect) {
                                                    const nx = info.rect.width > 0 ? (t.clientX - info.left) / info.rect.width : 0;
                                                    return (1 - nx) * 1080;
                                                }
                                                return (t.clientY - info.top) / info.scale;
                                            }
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
                distance: 15,
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
        const invItem = (inventory || []).find(
            (i: any) => String(i.instanceId) === String(itemId) || String(i.id) === String(itemId),
        );
        const templateId = invItem ? invItem.id : itemId;
        const itemData = ITEMS_DATABASE[String(templateId)] as any;

        if (itemData && (itemData.subTab === slotType || (slotType === 'WEAPONS' && itemData.subTab === 'WEAPONS'))) {
            const currentGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
            const existingId = currentGear[slotType];
            const eqInvItem = existingId
                ? (inventory || []).find(
                      (i: any) => String(i.instanceId) === String(existingId) || String(i.id) === String(existingId),
                  )
                : null;
            const eqTemplateId = eqInvItem ? eqInvItem.id : existingId;
            const existingItem = eqTemplateId ? (ITEMS_DATABASE[String(eqTemplateId)] as any) : null;

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

    const activeItem = activeId
        ? (inventory || []).find(
              (i: any) => String(i.instanceId) === String(activeId) || String(i.id) === String(activeId),
          )
        : null;
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
