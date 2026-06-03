import { db } from '../utils/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { HEROES_DB } from '../configs/HeroesConfig';
import { ITEMS_DATABASE } from '../game/configs/ItemsConfig';
import { getRandomBotName } from '../data/botNames';
import { getRankInfo } from '../configs/RankSystem';

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
    };
    winRate: number;
    isBot: boolean; // true — бот, false — реальный игрок
    realUserId?: string; // VK ID реального игрока (если не бот)
    vipLevel?: number;
}

const generateOpponentEquipment = (oppLevel: number): Record<string, string | null> => {
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
    slots.forEach((slot) => {
        const candidates = Object.values(ITEMS_DATABASE).filter(
            (item: any) => item.subTab === slot && item.requiredLevel <= oppLevel,
        );
        if (candidates.length > 0) {
            candidates.sort((a: any, b: any) => b.requiredLevel - a.requiredLevel);
            const topSlice = candidates.slice(0, 4);
            const chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
            equip[slot] = (chosen as any).id;
        }
    });
    return equip;
};

const buildStatsFromEquipment = (heroId: string, level: number, equipment: Record<string, string | null>) => {
    const heroData = HEROES_DB.find((h) => h.id === heroId) || HEROES_DB[0];
    const levelMult = 1 + (level - 1) * 0.05;
    const total = {
        hp: Math.round(heroData.stats.stamina * 10 * levelMult),
        attack: Math.round(heroData.stats.strength * 2 * levelMult),
        defense: Math.round(heroData.stats.stamina * 0.5 * levelMult),
        speed: 1 + heroData.stats.agility * 0.05,
        critChance: heroData.stats.agility * 0.5,
        evasion: heroData.stats.agility * 0.2,
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

class MatchmakingServiceClass {
    /**
     * Основной метод поиска противника.
     * Ищет реального игрока 10 секунд, потом генерирует бота.
     */
    public async findOpponent(
        myUserId: string,
        myRating: number,
        myLevel: number,
        myWinRate: number,
    ): Promise<MatchOpponent> {
        const realOpponent = await this.searchRealPlayer(myUserId, myRating, myWinRate);
        if (realOpponent) {
            return realOpponent;
        }
        return this.generateBot(myRating, myLevel);
    }

    /**
     * Ищет реального игрока в Firebase с подходящим рейтингом и винрейтом.
     * Таймаут 10 секунд.
     */
    private async searchRealPlayer(
        myUserId: string,
        myRating: number,
        myWinRate: number,
    ): Promise<MatchOpponent | null> {
        const searchPromise = this.queryFirebase(myUserId, myRating, myWinRate);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), SEARCH_TIMEOUT_MS));
        return Promise.race([searchPromise, timeoutPromise]);
    }

    private async queryFirebase(myUserId: string, myRating: number, myWinRate: number): Promise<MatchOpponent | null> {
        try {
            const playersRef = collection(db, 'пользователи');
            // Ищем игроков в диапазоне ±100 кубков
            const minRating = Math.max(0, myRating - 100);
            const maxRating = myRating + 100;

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
        const equipment = snapshot.equipment || snapshot.снаряжение || {
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
            vipLevel: snapshot.vipLevel !== undefined ? snapshot.vipLevel : (snapshot.vip !== undefined ? (typeof snapshot.vip === 'boolean' ? (snapshot.vip ? 1 : 0) : snapshot.vip) : (Math.random() < 0.15 ? 1 : 0)),
        };
    }

    /**
     * Генерирует замаскированного бота — внешне неотличим от реального игрока.
     */
    public generateBot(myRating: number, myLevel: number): MatchOpponent {
        const ratingVariance = Math.floor(Math.random() * 100) - 50;
        const botRating = Math.max(0, myRating + ratingVariance);
        const rankInfo = getRankInfo(botRating);

        const randomHero = HEROES_DB[Math.floor(Math.random() * HEROES_DB.length)] || HEROES_DB[0];
        const botLevel = Math.max(1, myLevel + Math.floor(Math.random() * 3) - 1);
        const equipment = generateOpponentEquipment(botLevel);
        const stats = buildStatsFromEquipment(randomHero.id, botLevel, equipment);

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
                hp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                speed: stats.speed,
                crit: stats.critChance,
                evasion: stats.evasion,
                critChance: stats.critChance,
            },
            winRate: Math.floor(48 + (botRating % 15)),
            isBot: true,
            vipLevel: Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0,
        };
    }

    /**
     * Проверяет cooldown — можно ли атаковать этого игрока.
     * Кулдаун хранится в localStorage чтобы не делать лишних запросов в Firebase.
     */
    public canAttack(myUserId: string, targetUserId: string): boolean {
        try {
            const key = `atk_cd_${myUserId}_${targetUserId}`;
            const last = localStorage.getItem(key);
            if (!last) return true;
            return Date.now() - Number(last) >= ATTACK_COOLDOWN_MS;
        } catch {
            return true;
        }
    }

    /**
     * Записывает время атаки в localStorage.
     */
    public recordAttack(myUserId: string, targetUserId: string): void {
        try {
            const key = `atk_cd_${myUserId}_${targetUserId}`;
            localStorage.setItem(key, String(Date.now()));
        } catch {
            // ignore
        }
    }
}

export const matchmakingService = new MatchmakingServiceClass();
