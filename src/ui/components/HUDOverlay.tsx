import React from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useUIStore } from '../../store/useUIStore';
import { EditableUIElement } from './EditableUIElement';
import { resolveAssetPath } from '../../utils/assetPath';

export const HUDOverlay: React.FC = () => {
    const updateElementPosition = useUIStore(state => state.updateElementPosition);
    const elements = useUIStore(state => state.elements);

    // Обработка завершения перетаскивания
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        if (active) {
            const id = active.id as string;
            const el = elements[id];
            if (el) {
                let newX = el.x + delta.x;
                let newY = el.y + delta.y;

                const uiStore = useUIStore.getState() as any;
                const isGridEnabled = uiStore.isGridEnabled;
                if (isGridEnabled) {
                    newX = Math.round(newX / 10) * 10;
                    newY = Math.round(newY / 10) * 10;
                }
                
                const dx = newX - el.x;
                const dy = newY - el.y;

                if (dx !== 0 || dy !== 0) {
                    updateElementPosition(id, newX, newY);

                    // Иерархическое перемещение
                    const getChildrenIds = (parentId: string): string[] => {
                        const children = Object.values(elements).filter((e: any) => e.parentId === parentId);
                        let ids = children.map((c: any) => c.id);
                        children.forEach((c: any) => { ids = [...ids, ...getChildrenIds(c.id)]; });
                        return ids;
                    };
                    
                    const childIds = getChildrenIds(id);
                    childIds.forEach(childId => {
                        const childEl = elements[childId];
                        if (childEl) {
                            updateElementPosition(childId, childEl.x + dx, childEl.y + dy);
                        }
                    });
                }
            }
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="absolute inset-0 w-full h-full pointer-events-none z-[10] font-game tracking-wide">
                {/* TOP BAR */}
                <EditableUIElement id="topbar-avatar" bgSrc={resolveAssetPath('/assets/ui/panel_wood.png')} width={300} height={100} />
                <EditableUIElement id="topbar-bp" bgSrc={resolveAssetPath('/assets/ui/panel_dark.png')} width={400} height={80} />
                <EditableUIElement id="topbar-res" bgSrc={resolveAssetPath('/assets/ui/panel_gold.png')} width={350} height={60} />

                {/* LEFT MENU */}
                <EditableUIElement id="left-beasts" bgSrc={resolveAssetPath('/assets/ui/btn_side.png')} width={220} height={70} />
                <EditableUIElement id="left-inv" bgSrc={resolveAssetPath('/assets/ui/btn_side.png')} width={220} height={70} />
                <EditableUIElement id="left-shop" bgSrc={resolveAssetPath('/assets/ui/btn_side.png')} width={220} height={70} />

                {/* RIGHT PANEL */}
                <EditableUIElement id="right-gift" bgSrc={resolveAssetPath('/assets/ui/btn_green.png')} width={320} height={100} />
                <EditableUIElement id="right-quests" bgSrc={resolveAssetPath('/assets/ui/panel_parchment.png')} width={320} height={300} />

                {/* BOTTOM BAR */}
                <EditableUIElement id="bottom-chat" bgSrc={resolveAssetPath('/assets/ui/panel_dark.png')} width={350} height={180} />
                
                {/* MEGA BATTLE BUTTON */}
                <EditableUIElement id="bottom-battle" bgSrc={resolveAssetPath('/assets/ui/btn_mega_gold.png')} width={400} height={120} />
                
                <EditableUIElement id="bottom-social" bgSrc={resolveAssetPath('/assets/ui/btn_icon.png')} width={80} height={80} />
            </div>
        </DndContext>
    );
};
