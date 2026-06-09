import { db, USERS_COLLECTION } from '../utils/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { HEROES_DB } from '../configs/HeroesConfig';
import { ITEMS_DATABASE } from '../game/configs/ItemsConfig';
import { getRandomBotName } from '../data/botNames';
import { getRankInfo } from '../configs/RankSystem';
import { useGameStore } from '../store/useGameStore';

const SEARCH_TIMEOUT_MS = 10000; // 10 секунд поиск реального игрока
const ATTACK_COOLDOWN_MS = 60 * 60 * 1000; // 1 час — нельзя атаковать одного игрока

export interface MatchOpponent {
    id: string;
    name: string;
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
    const raritiesOrder = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];

    slots.forEach((slot) => {
        let chosen: any = null;
        const startIndex = raritiesOrder.indexOf(targetRarity);
        const searchList = startIndex !== -1 ? raritiesOrder.slice(startIndex) : raritiesOrder;

        for (const rarity of searchList) {
            const candidates = Object.values(ITEMS_DATABASE).filter(
                (item: any) => item.subTab === slot && item.requiredLevel <= oppLevel && item.rarity === rarity,
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
                (item: any) => item.subTab === slot && item.requiredLevel <= oppLevel,
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

const buildStatsFromEquipment = (heroId: string, level: number, equipment: Record<string, string | null>, avgItemLevel: number = 1) => {
    const heroData = HEROES_DB.find((h) => h.id === heroId) || HEROES_DB[0];
    const levelMult = 1 + (level - 1) * 0.05;
    const total = {
        hp: Math.round(heroData.stats.stamina * 10 * levelMult),
        attack: Math.round(heroData.stats.strength * 2 * levelMult),
        defense: Math.round(heroData.stats.stamina * 0.5 * levelMult),
        speed: 1 + heroData.stats.agility * 0.05,
        critChance: heroData.stats.agility * 0.5,
        evasion: heroData.stats.agility * 0.2,
        avgItemLevel,
    };
    Object.values(equipment).forEach((itemId) => {
        if (!itemId) return;
        const item = ITEMS_DATABASE[itemId] as any;
        if (!item) return;
        if (item.hpBonus) total.hp += item.hpBonus;
        if (item.attackBonus) total.attack += item.attackBonus;
        if (item.defenseBonus) total.defense += item.defenseBonus;
        const rawCrit = item.critChance || item.critBonus || 0;
        if (rawCrit) total.critChance += rawCrit <= 1 ? rawCrit * 100 : rawCrit;
        if (item.attackSpeed || item.speedBonus) total.speed += item.attackSpeed || item.speedBonus;
        if (item.evasion) total.evasion += item.evasion;
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
    return Math.floor(attack * 12 + effectiveEHP * 0.08 + critChance * 800 + speed * 200);
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
    ): Promise<MatchOpponent> {
        // ── TIER 1: 0–700 cups ──────────────────────────────────────────────
        if (myRating < 700) {
            // First 5 consecutive wins are guaranteed (newbie honeymoon)
            const newbieWins = useGameStore.getState().newbieWins || 0;
            const isHoneymoon = newbieWins < 5;
            const botChance = 0.90;
            const forceBot = isHoneymoon || Math.random() < botChance;
            if (forceBot) {
                const bot = this.generateBot(myRating, myLevel, myStats, winStreak, lossStreak);
                // Scale bot 5-10% weaker for easy wins in this tier
                const weakMult = 0.90 + Math.random() * 0.05; // 0.90–0.95
                bot.stats.hp      = Math.round(bot.stats.hp      * weakMult);
                bot.stats.attack  = Math.round(bot.stats.attack  * weakMult);
                bot.stats.defense = Math.round(bot.stats.defense * weakMult);
                return bot;
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
        const ratingVariance = Math.floor(Math.random() * 60) - 30; // Умеренная вариативность рейтинга бота
        const botRating = Math.max(0, myRating + ratingVariance);
        const rankInfo = getRankInfo(botRating);

        const randomHero = HEROES_DB[Math.floor(Math.random() * HEROES_DB.length)] || HEROES_DB[0];

        // Масштабируем уровень в зависимости от уровня игрока и серии побед/поражений
        let botLevel = myLevel;
        if (winStreak >= 3) botLevel += 1;
        if (winStreak >= 6) botLevel += 2;
        if (lossStreak >= 2) botLevel -= 1;
        if (lossStreak >= 4) botLevel -= 2;
        botLevel = Math.max(1, botLevel + Math.floor(Math.random() * 3) - 1);

        // Определяем желаемую редкость экипировки бота
        let targetRarity = 'COMMON';
        if (botRating < 100) {
            targetRarity = 'COMMON';
        } else if (botRating < 250) {
            targetRarity = 'RARE';
        } else if (botRating < 450) {
            targetRarity = 'EPIC';
        } else if (botRating < 600) {
            targetRarity = 'LEGENDARY';
        } else {
            targetRarity = 'MYTHIC';
        }

        // Корректируем редкость на основе серии побед/поражений
        if (winStreak >= 3) {
            if (targetRarity === 'COMMON') targetRarity = 'RARE';
            else if (targetRarity === 'RARE') targetRarity = 'EPIC';
            else if (targetRarity === 'EPIC') targetRarity = 'LEGENDARY';
            else if (targetRarity === 'LEGENDARY') targetRarity = 'MYTHIC';
        }
        if (lossStreak >= 2) {
            if (targetRarity === 'MYTHIC') targetRarity = 'LEGENDARY';
            else if (targetRarity === 'LEGENDARY') targetRarity = 'EPIC';
            else if (targetRarity === 'EPIC') targetRarity = 'RARE';
            else if (targetRarity === 'RARE') targetRarity = 'COMMON';
        }

        // Для совсем новичков делаем бота легким
        if (myRating < 30) {
            targetRarity = 'COMMON';
            botLevel = Math.min(botLevel, 1);
        }

        let avgItemLevel = 1;
        if (targetRarity === 'RARE') avgItemLevel = 3;
        else if (targetRarity === 'EPIC') avgItemLevel = 5;
        else if (targetRarity === 'LEGENDARY') avgItemLevel = 8;
        else if (targetRarity === 'MYTHIC') avgItemLevel = 10;

        const equipment = generateOpponentEquipment(botLevel, targetRarity);

        // Рассчитываем множитель характеристик
        const baseMult = 0.82 + Math.min(0.4, (myRating / 500) * 0.28);

        let winStreakMod = 0;
        if (winStreak > 0) {
            if (winStreak === 1) winStreakMod = 0.02;
            else if (winStreak === 2) winStreakMod = 0.05;
            else if (winStreak === 3) winStreakMod = 0.1;
            else if (winStreak === 4) winStreakMod = 0.15;
            else winStreakMod = 0.2 + (winStreak - 5) * 0.04;
            winStreakMod = Math.min(0.45, winStreakMod);
        }

        let lossStreakMod = 0;
        if (lossStreak > 0) {
            if (lossStreak === 1) lossStreakMod = -0.02;
            else if (lossStreak === 2) lossStreakMod = -0.08;
            else if (lossStreak === 3) lossStreakMod = -0.15;
            else lossStreakMod = -0.22 - (lossStreak - 4) * 0.04;
            lossStreakMod = Math.max(-0.35, lossStreakMod);
        }

        const variance = Math.random() * 0.08 - 0.04;
        let statsMultiplier = baseMult + winStreakMod + lossStreakMod + variance;
        statsMultiplier = Math.max(0.65, Math.min(1.75, statsMultiplier));

        if (myRating < 30) {
            statsMultiplier = 0.7;
        }

        // Рассчитываем характеристики бота на основе сгенерированного снаряжения и уровня
        const rawStats = buildStatsFromEquipment(randomHero.id, botLevel, equipment, avgItemLevel);

        const finalStats = {
            hp: Math.round(rawStats.hp * statsMultiplier),
            attack: Math.round(rawStats.attack * statsMultiplier),
            defense: Math.round(rawStats.defense * statsMultiplier),
            speed: rawStats.speed,
            critChance: Math.min(75, Math.round(rawStats.critChance * statsMultiplier)),
            evasion: Math.min(60, Math.round(rawStats.evasion * statsMultiplier)),
        };

        // Применяем ролевые коэффициенты для разнообразия геймплея
        const role = randomHero.role;
        if (role === 'TANK') {
            finalStats.hp = Math.round(finalStats.hp * 1.2);
            finalStats.defense = Math.round(finalStats.defense * 1.25);
            finalStats.attack = Math.round(finalStats.attack * 0.85);
        } else if (role === 'ASSASSIN') {
            finalStats.hp = Math.round(finalStats.hp * 0.85);
            finalStats.attack = Math.round(finalStats.attack * 1.15);
            finalStats.speed = +(finalStats.speed * 1.08).toFixed(2);
            finalStats.critChance = Math.min(75, finalStats.critChance + 5);
            finalStats.evasion = Math.min(60, finalStats.evasion + 5);
        } else if (role === 'MAGE') {
            finalStats.attack = Math.round(finalStats.attack * 1.1);
            finalStats.defense = Math.round(finalStats.defense * 0.9);
        } else if (role === 'SUPPORT') {
            finalStats.hp = Math.round(finalStats.hp * 1.05);
            finalStats.defense = Math.round(finalStats.defense * 1.1);
            finalStats.attack = Math.round(finalStats.attack * 0.9);
        }

        return {
            id: randomHero.id,
            name: getRandomBotName(), // Реалистичное русское имя
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
                avgItemLevel: rawStats.avgItemLevel,
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
            return Date.now() - lastTime >= ATTACK_COOLDOWN_MS;
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
            localStorage.setItem(localKey, String(Date.now()));

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
