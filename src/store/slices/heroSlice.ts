import { HEROES_DB } from '../../configs/HeroesConfig';
import { ITEMS_DATABASE, IEquipmentStats } from '../../game/configs/ItemsConfig';

export const getHeroExpNeeded = (level: number): number => {
    if (level <= 1) return 100;
    if (level === 2) return 200;
    return (level - 1) * 200;
};

export const createHeroSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ ГЕРОЕВ ---
    selectedHeroId: 'panda',
    selectedEnemyId: 'wolf_scout',
    heroGalleryId: 'panda',
    ownedHeroes: ['panda'],
    heroes: {
        panda: { level: 1, exp: 0, strength: 52, agility: 20, stamina: 32 },
        wolf_knight: { level: 1, exp: 0, strength: 65, agility: 25, stamina: 45 },
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
            // Initialize default stats, level 1, exp 0 when unlocking a hero
            const heroData = HEROES_DB.find((h) => h.id === heroId);
            const initialHeroStats = heroData
                ? { level: 1, exp: 0, strength: heroData.stats.strength, agility: heroData.stats.agility, stamina: heroData.stats.stamina }
                : { level: 1, exp: 0, strength: 50, agility: 20, stamina: 30 };
            return {
                ownedHeroes: [...state.ownedHeroes, heroId],
                heroes: {
                    ...state.heroes,
                    [heroId]: initialHeroStats,
                },
            };
        }),
    addHeroExp: (heroId: string, amount: number) =>
        set((state: any) => {
            const hero = state.heroes[heroId] || { level: 1, exp: 0, strength: 50, agility: 20, stamina: 30 };
            let level = hero.level || 1;
            let exp = (hero.exp || 0) + amount;

            if (level >= 10) {
                return state;
            }

            let leveledUp = false;
            while (level < 10) {
                const needed = getHeroExpNeeded(level);
                if (exp >= needed) {
                    exp -= needed;
                    level += 1;
                    leveledUp = true;
                } else {
                    break;
                }
            }

            if (leveledUp) {
                console.log(`[heroSlice] Hero ${heroId} leveled up to ${level}!`);
                setTimeout(() => {
                    if (get().updateQuestProgress) {
                        get().updateQuestProgress('UPGRADE', 1);
                    }
                }, 0);
            }

            return {
                heroes: {
                    ...state.heroes,
                    [heroId]: {
                        ...hero,
                        level,
                        exp,
                    },
                },
            };
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

            const getTalentUpgradeCost = (tId: string): number => {
                if (['atk_base', 'def_base', 'mas_base'].includes(tId)) return 1;
                if (['atk_crit', 'atk_pen', 'def_res', 'def_eva', 'mas_spd', 'mas_focus'].includes(tId)) return 2;
                if (['atk_ult', 'def_ult', 'mas_ult'].includes(tId)) return 3;
                return 1;
            };

            const cost = getTalentUpgradeCost(talentId);
            const availablePoints = get().talentPoints;
            if (availablePoints < cost) {
                console.warn('upgradeTalent: недостаточно очков талантов');
                return state;
            }

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

        const heroState = state.heroes[heroId] || {};
        const heroLevel = heroState.level || 1;
        const levelMultiplier = 1 + (heroLevel - 1) * 0.05;

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
            hp: Math.round(heroData.stats.stamina * 10 * levelMultiplier),
            attack: Math.round(heroData.stats.strength * 2 * levelMultiplier),
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
            // Multipliers table for item levels 1 to 10 as per game design balance
            const multTable: Record<number, number> = {
                1: 1.0, 2: 1.15, 3: 1.35, 4: 1.50, 5: 1.65,
                6: 1.80, 7: 2.00, 8: 2.20, 9: 2.45, 10: 2.75,
            };
            const mult = multTable[lvl] ?? 1.0;

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
