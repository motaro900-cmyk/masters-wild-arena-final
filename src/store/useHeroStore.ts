import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { HEROES_DB } from '../configs/HeroesConfig';
import { ITEMS_DATABASE, IEquipmentStats } from '../game/configs/ItemsConfig';
import { useInventoryStore } from './useInventoryStore';

interface IHeroStats {
    strength: number;
    agility: number;
    stamina: number;
}

interface ICalculatedStats {
    hp: number;
    attack: number;
    speed: number;
    critChance: number;
    dodgeChance: number;
    defense: number;
    dodge: number;
    weaponTexture: string | null;
}

interface IHeroState {
    selectedHeroId: string;
    heroGalleryId: string;
    ownedHeroes: string[];
    heroes: Record<string, IHeroStats>;
    
    setSelectedHeroId: (id: string) => void;
    setHeroGalleryId: (id: string) => void;
    getCalculatedStats: (heroId: string) => ICalculatedStats | null;
}

export const useHeroStore = create<IHeroState>()(
    persist(
        (set) => ({
            selectedHeroId: 'panda',
            heroGalleryId: 'panda',
            ownedHeroes: ['panda', 'boar'],
            heroes: {
                'panda': { strength: 52, agility: 20, stamina: 32 },
                'moose': { strength: 30, agility: 15, stamina: 50 },
                'goose': { strength: 45, agility: 40, stamina: 21 },
                'cat': { strength: 48, agility: 35, stamina: 28 },
                'boar': { strength: 68, agility: 18, stamina: 38 }
            },

            setSelectedHeroId: (id) => set({ selectedHeroId: id }),
            setHeroGalleryId: (id) => set({ heroGalleryId: id }),

            getCalculatedStats: (heroId) => {
                const heroData = HEROES_DB.find(h => h.id === heroId);
                if (!heroData) return null;

                const invState = useInventoryStore.getState();
                const weapon = invState.equippedWeaponId ? ITEMS_DATABASE[invState.equippedWeaponId] : null;
                const helm = invState.equippedHelmId ? ITEMS_DATABASE[invState.equippedHelmId] : null;
                const armor = invState.equippedArmorId ? ITEMS_DATABASE[invState.equippedArmorId] : null;
                const shield = invState.equippedShieldId ? ITEMS_DATABASE[invState.equippedShieldId] : null;

                const allItems = [weapon, helm, armor, shield].filter(Boolean) as IEquipmentStats[];

                let hp = heroData.stats.stamina * 10;
                let attack = heroData.stats.strength * 2;
                let speed = 1 + (heroData.stats.agility * 0.05);
                let crit = (heroData.stats.agility * 0.5) / 100;
                let defense = heroData.stats.stamina * 0.5;

                allItems.forEach(item => {
                    if (item.hpBonus) hp += item.hpBonus;
                    if (item.attackBonus) attack += item.attackBonus;
                    if (item.defenseBonus) defense += item.defenseBonus;
                    if (item.critBonus) crit += item.critBonus;
                    if (item.speedBonus) speed += item.speedBonus;
                });

                return {
                    hp,
                    attack,
                    speed: Math.max(0.5, speed),
                    critChance: Math.min(1.0, crit),
                    dodgeChance: 0.1,
                    defense,
                    dodge: 0.1,
                    weaponTexture: (weapon as IEquipmentStats)?.textureKey || null
                };
            }
        }),
        {
            name: 'hero-storage',
            storage: createJSONStorage(() => getStorage()),
        }
    )
);
