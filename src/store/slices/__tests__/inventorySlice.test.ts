// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { createInventorySlice } from '../inventorySlice';

// Mock SyncService
vi.mock('../../../services/SyncService', () => ({
    syncService: {
        debouncedSync: vi.fn(),
        logPlayerAction: vi.fn(),
    },
}));

const createMockStore = (initialState = {}) => {
    let state = {
        inventory: [],
        heroEquipment: {
            panda: {
                WEAPONS: null,
                HELMETS: null,
                ARMOR: null,
                SHIELDS: null,
                SHOULDERS: null,
                BOOTS: null,
                PANTS: null,
            },
        },
        level: 1,
        selectedHeroId: 'panda',
        addGold: vi.fn(),
        showConfirm: vi.fn(),
        getCalculatedStats: vi.fn(() => ({ total: {} })),
        ...initialState,
    } as any;

    const set = (update: any) => {
        if (typeof update === 'function') {
            state = { ...state, ...update(state) };
        } else {
            state = { ...state, ...update };
        }
    };

    const get = () => state;

    const slice = createInventorySlice(set, get);
    Object.assign(state, slice);
    Object.assign(state, initialState);

    return { state, get, set };
};

describe('inventorySlice', () => {
    it('should initialize with default starting equipment', () => {
        const { state } = createMockStore();
        expect(state.inventory).toHaveLength(3);
        expect(state.inventory[0].id).toBe('stick');
        expect(state.inventory[1].id).toBe('bandana');
        expect(state.inventory[2].id).toBe('ragged_tunic');
    });

    describe('sellItem', () => {
        it('should sell unequipped item and add gold', () => {
            const { state, get } = createMockStore();
            // stick is starting, let's make sure it's unequipped first
            state.heroEquipment.panda.WEAPONS = null;

            const initialGoldCount = 0;
            state.addGold.mockImplementation((price: number) => {
                get().gold = (get().gold || 0) + price;
            });

            state.sellItem('stick_starting');

            expect(get().inventory.find((i: any) => i.instanceId === 'stick_starting')).toBeUndefined();
            expect(state.addGold).toHaveBeenCalled();
        });

        it('should block selling equipped items', () => {
            const { state, get } = createMockStore();
            // stick_starting is equipped by default
            const initialInventoryLength = state.inventory.length;

            state.sellItem('stick_starting');

            expect(get().inventory).toHaveLength(initialInventoryLength);
            expect(state.addGold).not.toHaveBeenCalled();
        });
    });

    describe('equipItem', () => {
        it('should allow equipping item when level requirements are met', () => {
            const { state, get } = createMockStore({
                level: 5, // high enough
                inventory: [
                    {
                        id: 'stick', // requires level 1
                        type: 'WEAPONS',
                        rarity: 'COMMON',
                        level: 1,
                        amount: 1,
                        instanceId: 'test_stick',
                    },
                ],
            });

            state.equipItem('test_stick');

            expect(get().heroEquipment.panda.WEAPONS).toBe('test_stick');
            expect(get().equippedWeaponId).toBe('test_stick');
        });

        it('should prevent equipping item when player level is too low', () => {
            const showConfirmSpy = vi.fn();
            const { state, get } = createMockStore({
                level: 1, // too low for starter_armor which requires level 3
                showConfirm: showConfirmSpy,
                inventory: [
                    {
                        id: 'starter_armor',
                        type: 'ARMOR',
                        rarity: 'COMMON',
                        level: 1,
                        amount: 1,
                        instanceId: 'test_armor_low_level',
                    },
                ],
            });

            state.equipItem('test_armor_low_level');

            // The item should NOT be equipped (remains default)
            expect(get().heroEquipment.panda.ARMOR).toBe('tunic_starting');
            // showConfirm should be called to notify the player
            expect(showConfirmSpy).toHaveBeenCalled();
        });

        it('should allow equipping item when player level matches or exceeds requirements', () => {
            const showConfirmSpy = vi.fn();
            const { state, get } = createMockStore({
                level: 3, // exactly requiredLevel for starter_armor
                showConfirm: showConfirmSpy,
                inventory: [
                    {
                        id: 'starter_armor',
                        type: 'ARMOR',
                        rarity: 'COMMON',
                        level: 1,
                        amount: 1,
                        instanceId: 'test_armor_match_level',
                    },
                ],
            });

            state.equipItem('test_armor_match_level');

            // The item should be successfully equipped
            expect(get().heroEquipment.panda.ARMOR).toBe('test_armor_match_level');
            expect(get().equippedArmorId).toBe('test_armor_match_level');
            expect(showConfirmSpy).not.toHaveBeenCalled();
        });
    });
});
