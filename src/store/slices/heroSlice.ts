import { HEROES_DB } from '../../configs/HeroesConfig';
import { ITEMS_DATABASE, IEquipmentStats } from '../../game/configs/ItemsConfig';
import { HeroLevelService } from '../../features/heroes/leveling/HeroLevelService';
import { getLevelMultiplier } from '../../features/heroes/leveling/HeroLevelCalculator';
import { syncService } from '../../services/SyncService';

export const createHeroSlice = (set: any, get: any) => {
    const statsCache: Record<string, { key: string; result: any }> = {};

    return {
        // --- СОСТОЯНИЕ ГЕРОЕВ ---
        selectedHeroId: 'panda',
        selectedEnemyId: 'wolf_scout',
        heroGalleryId: 'panda',
        ownedHeroes: ['panda'],
        heroes: {
            panda: { level: 1, exp: 0, strength: 52, agility: 20, stamina: 32 },
            wolf_knight: { level: 1, exp: 0, strength: 65, agility: 25, stamina: 45 },
            shadow_dancer: { level: 1, exp: 0, strength: 16, agility: 28, stamina: 14 },
            crystal_guardian: { level: 1, exp: 0, strength: 14, agility: 10, stamina: 30 },
            storm_caller: { level: 1, exp: 0, strength: 12, agility: 18, stamina: 16 },
            nature_warden: { level: 1, exp: 0, strength: 10, agility: 16, stamina: 22 },
            void_walker: { level: 1, exp: 0, strength: 20, agility: 26, stamina: 18 },
        } as Record<string, any>,
        heroTalents: {
            panda: {},
            wolf_knight: {},
            shadow_dancer: {},
            crystal_guardian: {},
            storm_caller: {},
            nature_warden: {},
            void_walker: {},
        } as Record<string, any>,
        ownedSkins: ['default'] as string[],
        equippedSkins: { panda: 'default', wolf_knight: 'default' } as Record<string, string>,
        latestLevelUp: null as any,

        // --- ЭКШЕНЫ ГЕРОЕВ ---
        setSelectedHeroId: (id: string) => {
            set({ selectedHeroId: id });
            syncService.debouncedSync();
        },
        setHeroGalleryId: (id: string) => set({ heroGalleryId: id }),
        setLatestLevelUp: (val: any) => set({ latestLevelUp: val }),
        unlockHero: (heroId: string) => {
            set((state: any) => {
                if (state.ownedHeroes.includes(heroId)) return state;
                // Initialize default stats, level 1, exp 0 when unlocking a hero
                const heroData = HEROES_DB.find((h) => h.id === heroId);
                const initialHeroStats = heroData
                    ? {
                          level: 1,
                          exp: 0,
                          strength: heroData.stats.strength,
                          agility: heroData.stats.agility,
                          stamina: heroData.stats.stamina,
                      }
                    : { level: 1, exp: 0, strength: 50, agility: 20, stamina: 30 };
                return {
                    ownedHeroes: [...state.ownedHeroes, heroId],
                    heroes: {
                        ...state.heroes,
                        [heroId]: initialHeroStats,
                    },
                };
            });
            syncService.debouncedSync();
        },
        addHeroExp: (heroId: string, amount: number) => {
            set((state: any) => {
                const hero = state.heroes[heroId] || { level: 1, exp: 0, strength: 50, agility: 20, stamina: 30 };
                const heroData = HEROES_DB.find((h) => h.id === heroId);
                const baseStats = heroData
                    ? { strength: heroData.stats.strength, stamina: heroData.stats.stamina }
                    : { strength: 50, stamina: 30 };

                const { updatedProgress, delta } = HeroLevelService.addExp(heroId, hero, amount, baseStats);

                if (delta) {
                    console.log(`[heroSlice] Hero ${heroId} leveled up to ${delta.newLevel}!`);
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
                            ...updatedProgress,
                        },
                    },
                    latestLevelUp: delta ? delta : state.latestLevelUp,
                };
            });
            syncService.debouncedSync();
        },
        setTalentPoints: (val: number) => {
            set((state: any) => ({
                heroTalents: {
                    ...state.heroTalents,
                    panda: { ...state.heroTalents.panda, points: val },
                },
            }));
            syncService.debouncedSync();
        },
        upgradeTalent: (heroId: string, talentId: string) => {
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
            });
            syncService.debouncedSync();
        },
        resetTalents: (heroId: string) => {
            set((state: any) => {
                const talents = { ...state.heroTalents };
                talents[heroId] = {};
                return { heroTalents: talents };
            });
            syncService.debouncedSync();
        },
        setEquippedWeapon: (id: string) => {
            get().equipItem(id);
        },
        equipSkin: (heroId: string, skinId: string) => {
            set((state: any) => {
                const equipped = { ...(state.equippedSkins || {}) };
                equipped[heroId] = skinId;
                return { equippedSkins: equipped };
            });
            syncService.debouncedSync();
        },
        unequipSkin: (heroId: string) => {
            set((state: any) => {
                const equipped = { ...(state.equippedSkins || {}) };
                equipped[heroId] = 'default';
                return { equippedSkins: equipped };
            });
            syncService.debouncedSync();
        },
        clearLatestLevelUp: () => set({ latestLevelUp: null }),
        getCalculatedStats: (heroId: string) => {
            const state = get() as any;
            const heroData = HEROES_DB.find((h) => h.id === heroId);
            if (!heroData) return null;

            const heroState = state.heroes[heroId] || {};
            const heroLevel = heroState.level || 1;

            const equipment = state.heroEquipment[heroId] || {};

            const eqLevels = Object.entries(equipment)
                .map(([slot, eqId]) => {
                    if (!eqId) return `${slot}:none`;
                    const invItem = state.inventory.find((i: any) => i.instanceId === eqId || i.id === eqId);
                    return invItem ? `${slot}:${invItem.id}-${invItem.level}` : `${slot}:none`;
                })
                .join(',');

            const talentsData = JSON.stringify(state.heroTalents[heroId] || {});
            const buffsData = JSON.stringify(state.activeBuffs || {});
            const cacheKey = `${heroId}_lvl:${heroLevel}_eq:${eqLevels}_tal:${talentsData}_buf:${buffsData}`;

            if (statsCache[heroId] && statsCache[heroId].key === cacheKey) {
                return statsCache[heroId].result;
            }

            const levelMultiplier = getLevelMultiplier(heroLevel);

            const getEquippedItemInfo = (equippedId: string | null) => {
                if (!equippedId) return null;
                const invItem = state.inventory.find((i: any) => i.instanceId === equippedId || i.id === equippedId);
                if (!invItem) return null;
                const itemTemplate = ITEMS_DATABASE[invItem.id];
                if (!itemTemplate) return null;
                return { template: itemTemplate, level: invItem.level || 1 };
            };

            const weaponInfo = getEquippedItemInfo(equipment.WEAPONS);
            const helmInfo = getEquippedItemInfo(equipment.HELMETS);
            const armorInfo = getEquippedItemInfo(equipment.ARMOR);
            const shieldInfo = getEquippedItemInfo(equipment.SHIELDS);
            const shouldersInfo = getEquippedItemInfo(equipment.SHOULDERS);
            const bootsInfo = getEquippedItemInfo(equipment.BOOTS);
            const pantsInfo = getEquippedItemInfo(equipment.PANTS);

            const allItemsInfo = [
                weaponInfo,
                helmInfo,
                armorInfo,
                shieldInfo,
                shouldersInfo,
                bootsInfo,
                pantsInfo,
            ].filter(Boolean) as { template: IEquipmentStats; level: number }[];

            const base = {
                hp: Math.round(heroData.stats.stamina * 10 * levelMultiplier),
                attack: Math.round(heroData.stats.strength * 2 * levelMultiplier),
                defense: Math.round(heroData.stats.stamina * 0.5 * levelMultiplier),
                speed: 1 + heroData.stats.agility * 0.05, // internal ATB speed multiplier
                critChance: heroData.stats.agility * 0.5, // stored as % (e.g. 6%)
                evasion: heroData.stats.agility * 0.2, // stored as % (e.g. 2.4%)
                lifesteal: 0,
                penetration: 0,
                accuracy: 100,
                critDamage: 1.5,
            };

            const totalItemLevel = allItemsInfo.reduce((sum, item) => sum + item.level, 0);
            const avgItemLevel = allItemsInfo.length > 0 ? totalItemLevel / allItemsInfo.length : 1;

            const total = {
                ...base,
                avgItemLevel,
            };

            const talents = state.heroTalents[heroId] || {};
            Object.entries(talents).forEach(([tId, lvl]: [string, any]) => {
                const level = lvl as number;
                if (level <= 0) return;

                // Attack talents
                if (tId === 'atk_base') total.attack = Math.round(total.attack * (1 + level * 0.05));
                if (tId === 'atk_crit') total.critChance += level * 2;

                // Defense talents
                if (tId === 'def_base') total.hp = Math.round(total.hp * (1 + level * 0.05));
                if (tId === 'def_eva') total.evasion += level * 2;
                if (tId === 'def_ult') total.defense = Math.round(total.defense * (1 + level * 0.2)); // «Весь урон снижен на 20%» — работает через defense

                // Mastery talents
                if (tId === 'mas_base') total.speed += level * 0.1;
                if (tId === 'mas_spd') total.speed = +(total.speed * (1 + level * 0.03)).toFixed(2);
                if (tId === 'mas_ult') total.critDamage += level * 0.1;
                if (tId === 'atk_pen') total.penetration += level * 10;
            });

            allItemsInfo.forEach((itemInfo) => {
                const item = itemInfo.template;
                const lvl = itemInfo.level;
                // Multipliers table for item levels 1 to 10 as per game design balance
                const multTable: Record<number, number> = {
                    1: 1.0,
                    2: 1.15,
                    3: 1.35,
                    4: 1.5,
                    5: 1.65,
                    6: 1.8,
                    7: 2.0,
                    8: 2.2,
                    9: 2.45,
                    10: 2.75,
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

            // Cap crit/evasion/critDamage at sensible max
            total.critChance = Math.min(75, total.critChance);
            total.evasion = Math.min(60, total.evasion);
            if (total.critDamage) {
                total.critDamage = Math.min(3.0, total.critDamage);
            }

            const result = {
                base,
                total,
                weaponTexture: weaponInfo?.template?.textureKey || null,
            };

            statsCache[heroId] = { key: cacheKey, result };
            return result;
        },
    };
};
