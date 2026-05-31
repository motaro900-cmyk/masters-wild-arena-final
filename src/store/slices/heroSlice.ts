import { HEROES_DB } from '../../configs/HeroesConfig';
import { ITEMS_DATABASE, IEquipmentStats } from '../../game/configs/ItemsConfig';

export const createHeroSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ ГЕРОЕВ ---
    selectedHeroId: 'panda',
    selectedEnemyId: 'wolf_scout',
    heroGalleryId: 'panda',
    ownedHeroes: ['panda'],
    heroes: {
        panda: { strength: 52, agility: 20, stamina: 32 },
        wolf_knight: { strength: 65, agility: 25, stamina: 45 },
    } as Record<string, any>,
    heroTalents: {
        panda: {},
        wolf_knight: {},
    } as Record<string, any>,
    ownedSkins: ['default'] as string[],
    equippedSkins: { panda: 'default', wolf_knight: 'default' } as Record<string, string>,

    // --- ЭКШЕНЫ ГЕРОЕВ ---
    setSelectedHeroId: (id: string) => set({ selectedHeroId: id }),
    setHeroGalleryId: (id: string) => set({ heroGalleryId: id }),
    unlockHero: (heroId: string) =>
        set((state: any) => {
            if (state.ownedHeroes.includes(heroId)) return state;
            return { ownedHeroes: [...state.ownedHeroes, heroId] };
        }),
    setTalentPoints: (val: number) =>
        set((state: any) => ({
            heroTalents: {
                ...state.heroTalents,
                panda: { ...state.heroTalents.panda, points: val },
            },
        })),
    upgradeTalent: (heroId: string, talentId: string) =>
        set((state: any) => {
            const currentHeroTalents = state.heroTalents[heroId] || {};
            const currentLevel = currentHeroTalents[talentId] || 0;

            get().updateQuestProgress('UPGRADE', 1);

            return {
                heroTalents: {
                    ...state.heroTalents,
                    [heroId]: {
                        ...currentHeroTalents,
                        [talentId]: currentLevel + 1,
                    },
                },
            };
        }),
    resetTalents: (heroId: string) =>
        set((state: any) => {
            const talents = { ...state.heroTalents };
            talents[heroId] = {};
            return { heroTalents: talents };
        }),
    setEquippedWeapon: (id: string) => {
        get().equipItem(id);
    },
    equipSkin: (heroId: string, skinId: string) => {
        set((state: any) => {
            const equipped = { ...(state.equippedSkins || {}) };
            equipped[heroId] = skinId;
            return { equippedSkins: equipped };
        });
    },
    unequipSkin: (heroId: string) => {
        set((state: any) => {
            const equipped = { ...(state.equippedSkins || {}) };
            equipped[heroId] = 'default';
            return { equippedSkins: equipped };
        });
    },
    getCalculatedStats: (heroId: string) => {
        const state = get() as any;
        const heroData = HEROES_DB.find((h) => h.id === heroId);
        if (!heroData) return null;

        const equipment = state.heroEquipment[heroId] || {};
        const weapon = equipment.WEAPONS ? ITEMS_DATABASE[equipment.WEAPONS] : null;
        const helm = equipment.HELMETS ? ITEMS_DATABASE[equipment.HELMETS] : null;
        const armor = equipment.ARMOR ? ITEMS_DATABASE[equipment.ARMOR] : null;
        const shield = equipment.SHIELDS ? ITEMS_DATABASE[equipment.SHIELDS] : null;
        const shoulders = equipment.SHOULDERS ? ITEMS_DATABASE[equipment.SHOULDERS] : null;
        const boots = equipment.BOOTS ? ITEMS_DATABASE[equipment.BOOTS] : null;
        const pants = equipment.PANTS ? ITEMS_DATABASE[equipment.PANTS] : null;

        const allItems = [weapon, helm, armor, shield, shoulders, boots, pants].filter(Boolean) as IEquipmentStats[];

        const base = {
            hp: heroData.stats.stamina * 10,
            attack: heroData.stats.strength * 2,
            defense: Math.round(heroData.stats.stamina * 0.5),
            speed: 1 + heroData.stats.agility * 0.05, // internal ATB speed multiplier
            critChance: heroData.stats.agility * 0.5, // stored as % (e.g. 6%)
            evasion: heroData.stats.agility * 0.2, // stored as % (e.g. 2.4%)
            resilience: heroData.stats.stamina * 0.1,
            lifesteal: 0,
            penetration: 0,
            accuracy: 100,
            critDamage: 1.5,
        };

        const total = { ...base };

        const talents = state.heroTalents[heroId] || {};
        Object.entries(talents).forEach(([tId, lvl]: [string, any]) => {
            const level = lvl as number;
            if (level <= 0) return;

            // Attack talents
            if (tId === 'atk_base') total.attack = Math.round(total.attack * (1 + level * 0.05));
            if (tId === 'atk_crit') total.critChance += level * 2;

            // Defense talents
            if (tId === 'def_base') total.hp = Math.round(total.hp * (1 + level * 0.05));
            if (tId === 'def_res') total.resilience += level * 5;
            if (tId === 'def_eva') total.evasion += level * 2;

            // Mastery talents
            if (tId === 'mas_base') total.speed += level * 0.1;
            if (tId === 'mas_spd') total.speed = +(total.speed * (1 + level * 0.03)).toFixed(2);
            if (tId === 'mas_ult') total.critDamage += level * 0.1;
            if (tId === 'atk_pen') total.penetration += level * 10;
        });

        allItems.forEach((item) => {
            const invItem = state.inventory.find((i: any) => String(i.id) === item.id);
            const lvl = invItem?.level || 1;
            let mult = 1.0;
            if (lvl === 2) mult = 1.15;
            if (lvl === 3) mult = 1.35;

            if (item.hpBonus) total.hp = Math.round(total.hp + item.hpBonus * mult);
            if (item.attackBonus) total.attack = Math.round(total.attack + item.attackBonus * mult);
            if (item.defenseBonus) total.defense = Math.round(total.defense + item.defenseBonus * mult);

            // critChance stored as 0-100 scale; items may store as 0-1 or 0-100 — normalize
            const rawCrit = item.critChance || item.critBonus || 0;
            if (rawCrit) {
                const critPct = rawCrit <= 1 ? rawCrit * 100 : rawCrit;
                total.critChance += critPct * mult;
            }

            const rawSpeed = item.attackSpeed || item.speedBonus || 0;
            if (rawSpeed) total.speed += rawSpeed * mult;

            if (item.evasion) total.evasion += item.evasion * mult;
            if (item.resilience) total.resilience += item.resilience * mult;
            if (item.lifesteal) total.lifesteal += item.lifesteal * mult;
            if (item.penetration) total.penetration += item.penetration * mult;
            if (item.critDamage) total.critDamage += item.critDamage * mult;
            if (item.accuracy) total.accuracy += item.accuracy * mult;
        });

        // Apply active potion buffs
        const buffs = state.activeBuffs || {};
        const now = Date.now();
        if (buffs.hp_potion_1 && buffs.hp_potion_1 > now) {
            total.hp = Math.round(total.hp * 1.1); // +10% HP
        }
        if (buffs.hp_potion_2 && buffs.hp_potion_2 > now) {
            total.hp = Math.round(total.hp * 1.2); // +20% HP
        }
        if (buffs.hp_potion_3 && buffs.hp_potion_3 > now) {
            total.hp = Math.round(total.hp * 1.35); // +35% HP
        }
        if (buffs.mana_potion_1 && buffs.mana_potion_1 > now) {
            total.speed = +(total.speed * 1.15).toFixed(2); // +15% Speed
        }

        // Cap crit/evasion at sensible max
        total.critChance = Math.min(75, total.critChance);
        total.evasion = Math.min(60, total.evasion);

        return {
            base,
            total,
            weaponTexture: (weapon as IEquipmentStats)?.textureKey || null,
        };
    },
});
