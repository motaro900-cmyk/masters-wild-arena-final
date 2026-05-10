import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { ITEMS_DATABASE } from '../game/configs/ItemsConfig';

export interface IInventoryItem {
    id: string;
    type: 'weapon' | 'armor' | 'accessory';
    rarity: string;
    level: number;
}

interface IInventoryState {
    inventory: IInventoryItem[];
    equippedWeaponId: string | null;
    equippedHelmId: string | null;
    equippedArmorId: string | null;
    equippedShieldId: string | null;

    addItemToInventory: (item: any) => void;
    equipWeapon: (id: string | null) => void;
    equipHelm: (id: string | null) => void;
    equipArmor: (id: string | null) => void;
    equipShield: (id: string | null) => void;
}

export const useInventoryStore = create<IInventoryState>()(
    persist(
        (set) => ({
            inventory: [
                { id: 'pan', type: 'weapon', rarity: 'EPIC', level: 1 },
                { id: 'stick', type: 'weapon', rarity: 'COMMON', level: 1 },
                { id: 'starter_helm', type: 'armor', rarity: 'COMMON', level: 1 },
                { id: 'starter_armor', type: 'armor', rarity: 'COMMON', level: 1 },
                { id: 'starter_shield', type: 'armor', rarity: 'COMMON', level: 1 },
                { id: 'potion_hp_small', type: 'weapon', rarity: 'COMMON', level: 1 },
            ],
            equippedWeaponId: 'pan',
            equippedHelmId: null,
            equippedArmorId: null,
            equippedShieldId: null,

            addItemToInventory: (item) => set((state) => {
                const itemObj = typeof item === 'string' ? { id: item } : item;
                const itemId = String(itemObj.id);
                if (!ITEMS_DATABASE[itemId]) return state;
                if (state.inventory.some(i => String(i.id) === itemId)) return state;
                return { inventory: [...state.inventory, itemObj] };
            }),
            equipWeapon: (id) => set({ equippedWeaponId: id }),
            equipHelm: (id) => set({ equippedHelmId: id }),
            equipArmor: (id) => set({ equippedArmorId: id }),
            equipShield: (id) => set({ equippedShieldId: id }),
        }),
        {
            name: 'inventory-storage',
            storage: createJSONStorage(() => getStorage()),
        }
    )
);
