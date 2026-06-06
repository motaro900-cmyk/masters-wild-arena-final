import { useState } from 'react';
import { ITEMS_DATABASE } from '../../../../../game/configs/ItemsConfig';
import { audioService } from '../../../../../services/AudioService';
import { AssetsMap } from '../../../../../configs/AssetsMap';
import { useGameStore } from '../../../../../store/useGameStore';

export const useHeroActions = (selectedHeroId: string, heroEquipment: any, equipItem: any, unequipItem: any) => {
    const [heroAction, setHeroAction] = useState<'IDLE' | 'VICTORY' | 'ULTIMATE'>('IDLE');
    const [floatingTexts, setFloatingTexts] = useState<any[]>([]);

    const addFloatingText = (text: string, color: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setFloatingTexts((prev) => [...prev, { id, text, color }]);
        setTimeout(() => setFloatingTexts((prev) => prev.filter((t) => t.id !== id)), 2000);
    };

    const triggerVictory = () => {
        setHeroAction('VICTORY');
        setTimeout(() => setHeroAction('IDLE'), 1500);
    };

    const isEquipped = (itemId: string) => {
        const currentHeroGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
        return Object.values(currentHeroGear).includes(itemId);
    };

    const handleItemClick = (itemId: string) => {
        const inventory = useGameStore.getState().inventory || [];
        const invItem = inventory.find(
            (i: any) => String(i.instanceId) === String(itemId) || String(i.id) === String(itemId),
        );
        const templateId = invItem ? invItem.id : itemId;
        const itemData = ITEMS_DATABASE[String(templateId)] as any;
        if (!itemData) return;

        const currentGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
        const isEquippedOnCurrent = Object.values(currentGear).some((id) => String(id) === String(itemId));

        if (isEquippedOnCurrent) {
            unequipItem(itemId);
            addFloatingText('СНЯТО', '#ef4444');
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        } else {
            const existingId = currentGear[itemData.subTab];
            const eqInvItem = existingId
                ? inventory.find(
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
            audioService.playSFX(AssetsMap.AUDIO.SFX_EQUIP);
        }
    };

    return { handleItemClick, isEquipped, addFloatingText, floatingTexts, triggerVictory, heroAction };
};
