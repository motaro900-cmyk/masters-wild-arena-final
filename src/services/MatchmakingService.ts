import { db, USERS_COLLECTION } from '../utils/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { HEROES_DB } from '../configs/HeroesConfig';
import { ITEMS_DATABASE } from '../game/configs/ItemsConfig';
import { getRandomBotName } from '../data/botNames';
import { getRankInfo } from '../configs/RankSystem';
import { useGameStore } from '../store/useGameStore';
import { TimeService } from '../utils/TimeService';
import { getLevelMultiplier } from '../features/heroes/leveling/HeroLevelCalculator';
import { AVATARS, AVATAR_FRAMES, TITLES } from '../configs/ProfileCustomization';

const SEARCH_TIMEOUT_MS = 10000; // 10 секунд поиск реального игрока
const ATTACK_COOLDOWN_MS = 60 * 60 * 1000; // 1 час — нельзя атаковать одного игрока

export interface MatchOpponent {
    id: string;
    name: string;
    avatar?: string; // real VK photo or in-game avatar URL
    avatarFrame?: string;
    title?: string;
    rating: number;
    level: number;
    heroId: string;
    heroImage: string;
    rankIcon: string;
    equipment: Record<string, string | null>;
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        crit: number;
        evasion: number;
        critChance: number;
        avgItemLevel?: number;
    };
    winRate: number;
    isBot: boolean; // true — бот, false — реальный игрок
    realUserId?: string; // VK ID реального игрока (если не бот)
    vipLevel?: number;
}

const generateOpponentEquipment = (
    oppLevel: number,
    targetRarity: string = 'COMMON',
    maxEquippedSlots: number = 7,
    maxItemLevel: number = 99,
): Record<string, string | null> => {
    const equip: Record<string, string | null> = {
        WEAPONS: null,
        HELMETS: null,
        ARMOR: null,
        SHIELDS: null,
        SHOULDERS: null,
        PANTS: null,
        BOOTS: null,
    };
    const slots = ['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS'];
    
    let slotsToEquip = [...slots];
    if (maxEquippedSlots < slots.length) {
        // Prioritize WEAPONS, then ARMOR, then other slots
        const prioritySlots = ['WEAPONS', 'ARMOR'];
        const otherSlots = slots.filter((s) => !prioritySlots.includes(s));
        
        const shuffledPriority = prioritySlots.sort(() => Math.random() - 0.5);
        const shuffledOthers = otherSlots.sort(() => Math.random() - 0.5);
        
        const orderedSlots = [...shuffledPriority, ...shuffledOthers];
        slotsToEquip = orderedSlots.slice(0, maxEquippedSlots);
    }

    const raritiesOrder = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
    const allowedLevel = Math.min(oppLevel, maxItemLevel);

    slots.forEach((slot) => {
        if (!slotsToEquip.includes(slot)) {
            return;
        }
        let chosen: any = null;
        const startIndex = raritiesOrder.indexOf(targetRarity);
        const searchList = startIndex !== -1 ? raritiesOrder.slice(startIndex) : raritiesOrder;

        for (const rarity of searchList) {
            const candidates = Object.values(ITEMS_DATABASE).filter(
                (item: any) => item.subTab === slot && item.requiredLevel <= allowedLevel && item.rarity === rarity,
            );
            if (candidates.length > 0) {
                candidates.sort((a: any, b: any) => b.requiredLevel - a.requiredLevel);
                const topSlice = candidates.slice(0, 4);
                chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
                break;
            }
        }

        if (!chosen) {
            const candidates = Object.values(ITEMS_DATABASE).filter(
                (item: any) => item.subTab === slot && item.requiredLevel <= allowedLevel,
            );
            if (candidates.length > 0) {
                candidates.sort((a: any, b: any) => b.requiredLevel - a.requiredLevel);
                const topSlice = candidates.slice(0, 4);
                chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
            }
        }

        if (chosen) {
            equip[slot] = chosen.id;
        }
    });
    return equip;
};

const getTemplateId = (id: string): string => {
    if (!id) return '';
    if (ITEMS_DATABASE[id]) return id;
    const match = Object.keys(ITEMS_DATABASE)
        .filter((key) => id.startsWith(key + '_'))
        .sort((a, b) => b.length - a.length)[0];
    return match || id;
};

export const buildStatsFromEquipment = (
    heroId: string,
    level: number,
    equipment: Record<string, string | null>,
    avgItemLevel: number = 1,
    inventory: any[] = [],
    talents: Record<string, number> = {}
) => {
    const heroData = HEROES_DB.find((h) => h.id === heroId) || HEROES_DB[0];
    const levelMult = getLevelMultiplier(level);
    const total = {
        hp: Math.round(heroData.stats.stamina * 10 * levelMult),
        attack: Math.round(heroData.stats.strength * 2 * levelMult),
        defense: Math.round(heroData.stats.stamina * 0.5 * levelMult),
        speed: 1 + heroData.stats.agility * 0.05,
        critChance: heroData.stats.agility * 0.5,
        evasion: heroData.stats.agility * 0.2,
        avgItemLevel,
    };

    // Apply talents
    Object.entries(talents).forEach(([tId, lvl]) => {
        const tLevel = lvl as number;
        if (tLevel <= 0) return;
        if (tId === 'atk_base') total.attack = Math.round(total.attack * (1 + tLevel * 0.05));
        if (tId === 'atk_crit') total.critChance += tLevel * 2;
        if (tId === 'def_base') total.hp = Math.round(total.hp * (1 + tLevel * 0.05));
        if (tId === 'def_eva') total.evasion += tLevel * 2;
        if (tId === 'def_ult') total.defense = Math.round(total.defense * (1 + tLevel * 0.2));
        if (tId === 'mas_base') total.speed += tLevel * 0.1;
        if (tId === 'mas_spd') total.speed = +(total.speed * (1 + tLevel * 0.03)).toFixed(2);
    });

    const getEquippedItemInfo = (equippedId: string | null) => {
        if (!equippedId) return null;
        const invItem = inventory.find((i: any) => i.instanceId === equippedId || i.id === equippedId);
        const resolvedId = getTemplateId(String(equippedId));
        const itemTemplate = ITEMS_DATABASE[resolvedId];
        if (!itemTemplate) return null;
        return { template: itemTemplate, level: invItem?.level || 1 };
    };

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

    Object.values(equipment).forEach((equippedId) => {
        if (!equippedId) return;
        const itemInfo = getEquippedItemInfo(equippedId);
        if (!itemInfo) return;

        const item = itemInfo.template as any;
        const lvl = itemInfo.level;
        const mult = multTable[lvl] ?? 1.0;

        if (item.hpBonus) total.hp = Math.round(total.hp + item.hpBonus * mult);
        if (item.attackBonus) total.attack = Math.round(total.attack + item.attackBonus * mult);
        if (item.defenseBonus) total.defense = Math.round(total.defense + item.defenseBonus * mult);

        const rawCrit = item.critChance || item.critBonus || 0;
        if (rawCrit) {
            const critPct = rawCrit <= 1 ? rawCrit * 100 : rawCrit;
            total.critChance += critPct * mult;
        }

        const rawSpeed = item.attackSpeed || item.speedBonus || 0;
        if (rawSpeed) total.speed += rawSpeed * mult;
        
        if (item.evasion) total.evasion += item.evasion * mult;
    });

    total.critChance = Math.min(75, total.critChance);
    total.evasion = Math.min(60, total.evasion);
    return total;
};

export const calculateCombatPower = (
    stats: { attack?: number; hp?: number; defense?: number; critChance?: number; speed?: number; avgItemLevel?: number } | undefined | null,
): number => {
    if (!stats) return 1000;
    const attack = stats.attack ?? 10;
    const hp = stats.hp ?? 100;
    const defense = stats.defense ?? 5;
    const critChance = stats.critChance ?? 0;
    const speed = stats.speed ?? 1;
    const avgItemLevel = stats.avgItemLevel ?? 1;
    // EHP-based formula: mirrors actual battle mitigation (diminishing returns)
    const divisor = 200 + (avgItemLevel - 1) * 25;
    const defMitigation = defense / (defense + divisor);
    const effectiveEHP = hp / Math.max(0.01, 1 - defMitigation);
    return Math.floor(attack * 12 + effectiveEHP * 0.08 + critChance * 8 + speed * 200);
};

class MatchmakingServiceClass {
    /**
     * Tiered matchmaking:
     *   0–700  cups → 90% bots, bots 5-10% weaker, first 5-10 wins guaranteed
     *   700–1200     → 70% bots, bots ≈ player ±10%
     *   1200–1500    → 50/50, honest matchmaking begins
     *   1500+        → real players first, bots after 10s timeout
     */
    public async findOpponent(
        myUserId: string,
        myRating: number,
        myLevel: number,
        myWinRate: number,
        myStats?: any,
        winStreak = 0,
        lossStreak = 0,
        forceBot = false,
    ): Promise<MatchOpponent> {
        if (forceBot) {
            return this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
        }

        // ── TIER 1: 0–700 cups ──────────────────────────────────────────────
        if (myRating < 700) {
            // First 5 consecutive wins are guaranteed (newbie honeymoon)
            const newbieWins = useGameStore.getState().newbieWins || 0;
            const isHoneymoon = newbieWins < 5;
            const botChance = 0.90;
            const forceBot = isHoneymoon || Math.random() < botChance;
            if (forceBot) {
                return this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
            }
            // 10% chance: try real player with 5s timeout
            const real = await this.searchRealPlayer(myUserId, myRating, myWinRate, myLevel, myStats, 5000);
            return real ?? this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
        }

        // ── TIER 2: 700–1200 cups ───────────────────────────────────────────
        if (myRating < 1200) {
            if (Math.random() < 0.70) {
                return this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
            }
            const real = await this.searchRealPlayer(myUserId, myRating, myWinRate, myLevel, myStats, 7000);
            return real ?? this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
        }

        // ── TIER 3: 1200–1500 cups ──────────────────────────────────────────
        if (myRating < 1500) {
            if (Math.random() < 0.50) {
                return this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
            }
            const real = await this.searchRealPlayer(myUserId, myRating, myWinRate, myLevel, myStats, 8000);
            return real ?? this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
        }

        // ── TIER 4: 1500+ cups — real players prioritized ───────────────────
        const real = await this.searchRealPlayer(myUserId, myRating, myWinRate, myLevel, myStats, 10000);
        return real ?? this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
    }

    /** Called by the game after each battle result to update the honeymoon counter */
    public recordBattleResult(won: boolean): void {
        const store = useGameStore.getState();
        const currentWins = store.newbieWins || 0;
        if (won && currentWins < 10) {
            useGameStore.setState({ newbieWins: currentWins + 1 });
        }
    }

    /**
     * Searches for a real player in Firebase.
     * @param timeoutMs Dynamic timeout per tier (5 000 – 10 000 ms)
     */
    private async searchRealPlayer(
        myUserId: string,
        myRating: number,
        myWinRate: number,
        myLevel: number,
        myStats?: any,
        timeoutMs = SEARCH_TIMEOUT_MS,
    ): Promise<MatchOpponent | null> {
        const searchPromise = this.queryFirebase(myUserId, myRating, myWinRate, myLevel, myStats);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        return Promise.race([searchPromise, timeoutPromise]);
    }

    private async queryFirebase(
        myUserId: string,
        myRating: number,
        myWinRate: number,
        myLevel: number,
        myStats?: any,
    ): Promise<MatchOpponent | null> {
        try {
            const playersRef = collection(db, USERS_COLLECTION);
            // Ищем игроков в динамическом диапазоне кубков в зависимости от текущего рейтинга игрока
            let range = 100;
            if (myRating < 100) range = 30;
            else if (myRating < 300) range = 60;
            else if (myRating < 600) range = 100;
            else range = 150;

            const minRating = Math.max(0, myRating - range);
            const maxRating = myRating + range;

            const q = query(
                playersRef,
                where('rating', '>=', minRating),
                where('rating', '<=', maxRating),
                orderBy('rating'),
                limit(20),
            );

            let snapshot = await getDocs(q);
            if (snapshot.empty) {
                const qLegacy = query(
                    playersRef,
                    where('рейтинг', '>=', minRating),
                    where('рейтинг', '<=', maxRating),
                    orderBy('рейтинг'),
                    limit(20),
                );
                snapshot = await getDocs(qLegacy);
            }

            if (snapshot.empty) return null;

            const candidates = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }) as any)
                .filter((p) => {
                    // Исключаем себя (сравнение с учетом префиксов и без)
                    const cleanPId = p.id.replace('VK-', '').replace('GUEST-', '');
                    const cleanMyId = myUserId.replace('VK-', '').replace('GUEST-', '');
                    if (p.id === myUserId || cleanPId === cleanMyId) return false;
                    // Проверяем кулдаун атаки (не атаковали ли мы его недавно)
                    if (!this.canAttack(myUserId, p.id)) return false;

                    // Исключаем тестовые имена
                    const name = p.name || p.имя || '';
                    const lowerName = name.toLowerCase();
                    if (['мастер', 'разработчик', 'test'].some((w) => lowerName.includes(w))) {
                        return false;
                    }

                    if (p.isTestPlayer || p.isDeveloper || p.тестовый || p.разработчик) {
                        return false;
                    }

                    // Проверяем наличие выбранного героя
                    const heroId = p.hero || p.герой || p.heroId;
                    if (!heroId) return false;

                    const rating = p.rating ?? p.рейтинг ?? 0;
                    const equipment = p.equipment || p.снаряжение || p.геройСнаряжение;

                    // Если рейтинг > 50, требуем оружие и броню (защита от голых)
                    if (rating > 50) {
                        if (!equipment) return false;
                        const weapon = equipment.WEAPONS || equipment.weapon;
                        const armor = equipment.ARMOR || equipment.armor;
                        if (!weapon || !armor) return false;
                    }

                    // Проверяем winrate ±15%
                    const pWinRate = p.winRate ?? 50;
                    if (Math.abs(pWinRate - myWinRate) > 15) return false;

                    // Защита новичков (newbie protection) при рейтинге < 150
                    if (myRating < 150) {
                        // Ограничение по уровню героя: в пределах ±2 уровней
                        const pLevel = p.level || p.уровень || p.level || 1;
                        if (Math.abs(pLevel - myLevel) > 2) return false;

                        // Ограничение по Combat Power (CP): боевая сила оппонента не должна превышать силу игрока более чем на 30%
                        const pHeroId = p.hero || p.герой || p.heroId || 'panda';
                        const pEquipment = p.equipment ||
                            p.снаряжение || {
                                WEAPONS: p.геройСнаряжение?.weapon || null,
                                HELMETS: p.геройСнаряжение?.helm || null,
                                ARMOR: p.геройСнаряжение?.armor || null,
                                SHIELDS: p.геройСнаряжение?.shield || null,
                                SHOULDERS: null,
                                PANTS: null,
                                BOOTS: null,
                            };
                        const pStats = buildStatsFromEquipment(pHeroId, pLevel, pEquipment);
                        const pCP = calculateCombatPower(pStats);
                        const myCP = calculateCombatPower(myStats);

                        if (pCP > myCP * 1.2) return false;
                    }

                    return true;
                });

            if (candidates.length === 0) return null;

            // Выбираем случайного из подходящих
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            return this.buildOpponentFromSnapshot(chosen);
        } catch (error) {
            console.warn('[MatchmakingService] Firebase query failed, using bot:', error);
            return null;
        }
    }

    private buildOpponentFromSnapshot(snapshot: any): MatchOpponent {
        const heroId = snapshot.hero || snapshot.герой || snapshot.heroId || 'panda';
        const heroData = HEROES_DB.find((h) => h.id === heroId) || HEROES_DB[0];
        const rating = snapshot.rating ?? snapshot.рейтинг ?? 0;
        const rankInfo = getRankInfo(rating);

        // Если в snapshot есть снаряжение — используем его, иначе генерируем
        const equipment = snapshot.equipment ||
            snapshot.снаряжение || {
                WEAPONS: snapshot.геройСнаряжение?.weapon || null,
                HELMETS: snapshot.геройСнаряжение?.helm || null,
                ARMOR: snapshot.геройСнаряжение?.armor || null,
                SHIELDS: snapshot.геройСнаряжение?.shield || null,
                SHOULDERS: null,
                PANTS: null,
                BOOTS: null,
            };

        const level = snapshot.level || snapshot.уровень || snapshot.level || 1;
        const stats = buildStatsFromEquipment(heroId, level, equipment);

        return {
            id: heroId,
            name: snapshot.name || snapshot.имя || 'Игрок',
            avatar: snapshot.avatar || snapshot.фото || snapshot.photo || snapshot.photo_200 || '',
            avatarFrame: snapshot.frame || 'none',
            title: snapshot.title || 'Странник',
            rating,
            level,
            heroId,
            heroImage: snapshot.heroImage || heroData.image,
            rankIcon: rankInfo.icon,
            equipment,
            stats: {
                hp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                speed: stats.speed,
                crit: stats.critChance,
                evasion: stats.evasion,
                critChance: stats.critChance,
            },
            winRate: snapshot.winRate || 50,
            isBot: false,
            realUserId: snapshot.id,
            vipLevel:
                snapshot.vipLevel !== undefined
                    ? snapshot.vipLevel
                    : snapshot.vip !== undefined
                      ? typeof snapshot.vip === 'boolean'
                          ? snapshot.vip
                              ? 1
                              : 0
                          : snapshot.vip
                      : Math.random() < 0.15
                        ? 1
                        : 0,
        };
    }

    private getAllowedBotHeroes(myRating: number): string[] {
        const allowed = ['panda']; // Фэн Лун всегда доступен
        if (myRating >= 400) allowed.push('raccoon');
        if (myRating >= 1000) allowed.push('minotaur');
        if (myRating >= 2000) allowed.push('tiger_warrior');
        if (myRating >= 3000) allowed.push('lion_knight');

        // Моделируем раннюю покупку персонажей (за золото/кристаллы)
        // Если игрок прошел хотя бы 50% пути до разблокировки следующего героя,
        // даем 15% шанс, что бот может использовать этого персонажа.
        const nextHeroMap = [
            { threshold: 400, id: 'raccoon' },
            { threshold: 1000, id: 'minotaur' },
            { threshold: 2000, id: 'tiger_warrior' },
            { threshold: 3000, id: 'lion_knight' },
        ];

        for (const nextHero of nextHeroMap) {
            if (myRating < nextHero.threshold && myRating >= nextHero.threshold * 0.5) {
                if (Math.random() < 0.15) {
                    if (!allowed.includes(nextHero.id)) {
                        allowed.push(nextHero.id);
                    }
                }
            }
        }

        return allowed;
    }

    /**
     * Генерирует замаскированного бота — внешне неотличим от реального игрока.
     */
    public generateBot(
        myRating: number,
        myLevel: number,
        _myStats?: any,
        winStreak = 0,
        lossStreak = 0,
    ): MatchOpponent {
        // 1. Определение рейтинга и вилки кубков противника на основе серии побед/поражений
        let ratingVariance = 0;
        
        if (winStreak > 0) {
            if (winStreak === 1) {
                ratingVariance = Math.floor(Math.random() * 30); // [0, 30]
            } else if (winStreak === 2) {
                ratingVariance = Math.floor(Math.random() * 40) + 15; // [15, 55]
            } else { // winStreak >= 3 (Босс-волна для проверки сил)
                ratingVariance = Math.floor(Math.random() * 60) + 50; // [50, 110]
            }
        } else if (lossStreak > 0) {
            ratingVariance = -Math.floor(Math.random() * 40) - 20 * lossStreak; // Ослабляем соперника при поражениях
        } else {
            // Обычный подбор без серий
            ratingVariance = Math.floor(Math.random() * 40) - 20; // [-20, 20]
        }

        const botRating = Math.max(0, myRating + ratingVariance);
        const rankInfo = getRankInfo(botRating);

        // 2. Подбор героя из разрешенного для этого рейтинга пула
        const allowedHeroes = this.getAllowedBotHeroes(myRating);
        const randomHeroId = allowedHeroes[Math.floor(Math.random() * allowedHeroes.length)];
        const randomHero = HEROES_DB.find((h) => h.id === randomHeroId) || HEROES_DB[0];

        // Масштабируем уровень в зависимости от уровня игрока и серии побед/поражений (честное масштабирование)
        let botLevel = myLevel;
        if (winStreak > 0) {
            if (winStreak === 1) {
                botLevel = myLevel + Math.floor(Math.random() * 2); // level +0 to +1
            } else if (winStreak === 2) {
                botLevel = myLevel + 1 + Math.floor(Math.random() * 2); // level +1 to +2
            } else { // winStreak >= 3
                botLevel = myLevel + 2 + Math.floor(Math.random() * 3); // level +2 to +4
            }
        } else if (lossStreak > 0) {
            botLevel = Math.max(1, myLevel - (1 + Math.floor(lossStreak / 2)));
        } else {
            // Обычный подбор без серий
            botLevel = Math.max(1, myLevel + Math.floor(Math.random() * 3) - 1); // level -1, +0, or +1
        }
        botLevel = Math.min(80, botLevel);

        // 3. Определяем желаемую редкость экипировки и максимальный уровень предметов для бота в зависимости от кубков
        let targetRarity = 'COMMON';
        let maxItemLevel = 1;

        if (botRating < 300) {
            targetRarity = 'COMMON';
            maxItemLevel = 2;
        } else if (botRating < 800) {
            targetRarity = Math.random() < 0.4 ? 'COMMON' : 'RARE';
            maxItemLevel = 4;
        } else if (botRating < 1600) {
            const r = Math.random();
            targetRarity = r < 0.2 ? 'RARE' : r < 0.7 ? 'EPIC' : 'COMMON';
            maxItemLevel = 6;
        } else if (botRating < 2800) {
            const r = Math.random();
            targetRarity = r < 0.2 ? 'EPIC' : r < 0.8 ? 'LEGENDARY' : 'RARE';
            maxItemLevel = 8;
        } else {
            const r = Math.random();
            targetRarity = r < 0.3 ? 'LEGENDARY' : 'MYTHIC';
            maxItemLevel = 10;
        }

        // Корректируем редкость и лимит уровня на основе серии побед/поражений (уровень botLevel уже рассчитан выше)
        if (winStreak >= 2) {
            maxItemLevel = Math.min(10, maxItemLevel + 1);
            if (targetRarity === 'COMMON') targetRarity = 'RARE';
            else if (targetRarity === 'RARE') targetRarity = 'EPIC';
            else if (targetRarity === 'EPIC') targetRarity = 'LEGENDARY';
            else if (targetRarity === 'LEGENDARY') targetRarity = 'MYTHIC';
        }
        if (winStreak >= 3) {
            maxItemLevel = Math.min(10, maxItemLevel + 1);
            if (targetRarity === 'COMMON') targetRarity = 'EPIC';
            else if (targetRarity === 'RARE') targetRarity = 'LEGENDARY';
            else if (targetRarity === 'EPIC') targetRarity = 'MYTHIC';
            else if (targetRarity === 'LEGENDARY') targetRarity = 'MYTHIC';
        }

        if (lossStreak >= 2) {
            maxItemLevel = Math.max(1, maxItemLevel - 1);
            if (targetRarity === 'MYTHIC') targetRarity = 'LEGENDARY';
            else if (targetRarity === 'LEGENDARY') targetRarity = 'EPIC';
            else if (targetRarity === 'EPIC') targetRarity = 'RARE';
            else if (targetRarity === 'RARE') targetRarity = 'COMMON';
        }
        if (lossStreak >= 4) {
            maxItemLevel = Math.max(1, maxItemLevel - 1);
            if (targetRarity === 'MYTHIC') targetRarity = 'EPIC';
            else if (targetRarity === 'LEGENDARY') targetRarity = 'RARE';
            else if (targetRarity === 'EPIC') targetRarity = 'COMMON';
            else if (targetRarity === 'RARE') targetRarity = 'COMMON';
        }

        // Для совсем новичков делаем бота легким
        if (myRating < 30) {
            targetRarity = 'COMMON';
            botLevel = Math.min(botLevel, 1);
            maxItemLevel = 1;
        }

        let avgItemLevel = 1;
        if (targetRarity === 'RARE') avgItemLevel = 3;
        else if (targetRarity === 'EPIC') avgItemLevel = 5;
        else if (targetRarity === 'LEGENDARY') avgItemLevel = 8;
        else if (targetRarity === 'MYTHIC') avgItemLevel = 10;

        // Count how many items the player has equipped on their selected hero
        const storeState = useGameStore.getState();
        const selectedHeroId = storeState.selectedHeroId || 'panda';
        const playerEq = storeState.heroEquipment?.[selectedHeroId] || {};
        const playerEquippedCount = Object.values(playerEq).filter(Boolean).length;

        // Определяем максимальное число слотов снаряжения для бота в зависимости от рейтинга игрока
        let maxEquippedSlots = 7;
        if (myRating < 30) {
            maxEquippedSlots = playerEquippedCount;
        } else if (myRating < 100) {
            maxEquippedSlots = Math.min(7, playerEquippedCount + 1);
        } else if (myRating < 200) {
            maxEquippedSlots = Math.min(7, playerEquippedCount + 2);
        } else if (myRating < 300) {
            maxEquippedSlots = Math.min(7, playerEquippedCount + 3);
        }

        // Корректируем число слотов на основе серий побед/поражений
        if (winStreak === 2) {
            maxEquippedSlots = Math.min(7, maxEquippedSlots + 1);
        } else if (winStreak >= 3) {
            maxEquippedSlots = Math.min(7, maxEquippedSlots + 2);
        }
        if (lossStreak >= 2) {
            maxEquippedSlots = Math.max(0, maxEquippedSlots - 1);
        } else if (lossStreak >= 4) {
            maxEquippedSlots = Math.max(0, maxEquippedSlots - 2);
        }

        // Генерируем экипировку с учетом максимального уровня предметов
        const equipment = generateOpponentEquipment(botLevel, targetRarity, maxEquippedSlots, maxItemLevel);

        // Рассчитываем характеристики бота на основе сгенерированного снаряжения и уровня (честно, без искусственных множителей)
        const finalStats = buildStatsFromEquipment(randomHero.id, botLevel, equipment, avgItemLevel);

        // Случайный аватар из доступных в игре
        const randomAvatarObj = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        const avatar = randomAvatarObj.path;

        // Случайная рамка (исключая разработчика, с 30% шансом на отсутствие рамки)
        const allowedFrames = AVATAR_FRAMES.filter(f => f.id !== 'storm_lightning_frame.webp');
        const randomFrameObj = Math.random() < 0.3
            ? (AVATAR_FRAMES.find(f => f.id === 'none') || AVATAR_FRAMES[0])
            : allowedFrames[Math.floor(Math.random() * allowedFrames.length)];
        const avatarFrame = randomFrameObj.id;

        // Случайный титул (исключая разработчика)
        const allowedTitles = TITLES.filter(t => t.name !== 'Разработчик');
        const randomTitleObj = allowedTitles[Math.floor(Math.random() * allowedTitles.length)];
        const title = randomTitleObj.name;

        return {
            id: randomHero.id,
            name: getRandomBotName(), // Реалистичное русское имя
            avatar,
            avatarFrame,
            title,
            rating: botRating,
            level: botLevel,
            heroId: randomHero.id,
            heroImage: randomHero.image,
            rankIcon: rankInfo.icon,
            equipment,
            stats: {
                hp: finalStats.hp,
                attack: finalStats.attack,
                defense: finalStats.defense,
                speed: finalStats.speed,
                crit: finalStats.critChance,
                evasion: finalStats.evasion,
                critChance: finalStats.critChance,
                avgItemLevel: finalStats.avgItemLevel,
            },
            winRate: Math.max(30, Math.min(75, Math.floor(48 + (botRating % 15) + winStreak * 2 - lossStreak * 2))),
            isBot: true,
            vipLevel: Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0,
        };
    }

    public canAttack(myUserId: string, targetUserId: string): boolean {
        try {
            const state = useGameStore.getState();
            const pvpCooldowns = state.pvpCooldowns || {};
            const last = pvpCooldowns[targetUserId];

            const localKey = `atk_cd_${myUserId}_${targetUserId}`;
            const localLast = localStorage.getItem(localKey);

            const lastTime = last || (localLast ? Number(localLast) : 0);
            if (!lastTime) return true;
            return TimeService.now() - lastTime >= ATTACK_COOLDOWN_MS;
        } catch {
            return true;
        }
    }

    /**
     * Записывает время атаки в localStorage и Zustand.
     */
    public recordAttack(myUserId: string, targetUserId: string): void {
        try {
            const localKey = `atk_cd_${myUserId}_${targetUserId}`;
            localStorage.setItem(localKey, String(TimeService.now()));

            const state = useGameStore.getState();
            if (state.recordAttack) {
                state.recordAttack(targetUserId);
            }
        } catch {
            // ignore
        }
    }
}

export const matchmakingService = new MatchmakingServiceClass();
