/**
 * SaveCryptoService — Криптографический модуль защиты и верификации сохранений .mow
 *
 * Стандарты Masters of the Wild (2026 Core Loop):
 *  - SHA-256 контрольная сумма через нативный Web Crypto API (SubtleCrypto)
 *  - Детерминированная канонизация JSON (Canonical Sort) для устранения различий порядка ключей
 *  - Anti-Tamper & Anti-Cheat Clamping (проверка лимитов золота, кристаллов и уровней заточки)
 *  - Обратная совместимость с fallback-хешером для неподдерживаемых песочниц
 */

const SECRET_VAULT_PEPPER = 'MOW_2026_STUDIO_ARGON_VAULT_KEY_!#$99zX';

export interface IMowSaveEnvelope<T = any> {
    magic: 'MOW_SAVE_VAULT';
    version: number;
    engineVersion: string;
    exportedAt: string;
    exportedAtMs: number;
    payload: T;
    checksum: string;
}

export interface IMowPlayerPayload {
    guestId: string;
    playerName: string;
    selectedHeroId: string;
    gold: number;
    diamonds: number;
    energy: number;
    rating: number;
    equipTiers: {
        weapon: number;
        armor: number;
        ring: number;
        boots: number;
    };
    checkIn: {
        streak: number;
        lastClaimDate: string;
        claimedToday: boolean;
    };
    isLoggedIn?: boolean;
    accountEmail?: string;
    inventoryCount?: number;
    exportedAt: string;
    nonce: string;
}

/**
 * Детерминированная сортировка ключей объекта для консистентного вычисления хеша
 */
export function canonicalStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalStringify).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map((key) => {
        return JSON.stringify(key) + ':' + canonicalStringify(obj[key]);
    });
    return '{' + parts.join(',') + '}';
}

/**
 * Вычисляет SHA-256 хеш строки через Web Crypto API или Fallback
 */
export async function computeSha256Checksum(canonicalData: string): Promise<string> {
    const rawData = canonicalData + ':' + SECRET_VAULT_PEPPER;

    if (
        typeof window !== 'undefined' &&
        window.crypto &&
        window.crypto.subtle &&
        typeof window.crypto.subtle.digest === 'function'
    ) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(rawData);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('[SaveCryptoService] SubtleCrypto digest failed, using algorithmic fallback:', e);
        }
    }

    // Алгоритмический 64-битный хэш-фоллбек
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < rawData.length; i++) {
        const ch = rawData.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `fallback_${part1}${part2}_sha256`;
}

/**
 * Валидация и ограничение значений (Anti-Cheat Sanitize)
 */
export function sanitizePlayerPayload(raw: any): IMowPlayerPayload {
    const clamp = (val: number, min: number, max: number, def: number) => {
        if (typeof val !== 'number' || isNaN(val)) return def;
        return Math.max(min, Math.min(max, Math.floor(val)));
    };

    const validHeroes = ['panda', 'raccoon', 'minotaur', 'tiger_warrior', 'wolf_knight'];
    const heroId = typeof raw.selectedHeroId === 'string' && (validHeroes.includes(raw.selectedHeroId) || raw.selectedHeroId.length > 0)
        ? raw.selectedHeroId
        : (raw.hero || 'panda');

    const equipTiers = raw.equipTiers && typeof raw.equipTiers === 'object' ? raw.equipTiers : {};

    return {
        guestId: typeof raw.guestId === 'string' && raw.guestId.length > 0 ? raw.guestId : `MOW-${Math.floor(1000 + Math.random() * 9000)}`,
        playerName: typeof raw.playerName === 'string' && raw.playerName.trim().length > 0 ? raw.playerName.slice(0, 24) : 'Дикий Мастер',
        selectedHeroId: heroId,
        gold: clamp(raw.gold, 0, 50_000_000, 2450),
        diamonds: clamp(raw.diamonds ?? raw.crystals, 0, 1_000_000, 120),
        energy: clamp(raw.energy, 0, 150, 50),
        rating: clamp(raw.rating, 0, 10_000, 1480),
        equipTiers: {
            weapon: clamp(equipTiers.weapon, 1, 10, 1),
            armor: clamp(equipTiers.armor, 1, 10, 1),
            ring: clamp(equipTiers.ring, 1, 10, 1),
            boots: clamp(equipTiers.boots, 1, 10, 1),
        },
        checkIn: {
            streak: clamp(raw.checkIn?.streak ?? raw.streak, 1, 7, 1),
            lastClaimDate: typeof raw.checkIn?.lastClaimDate === 'string' ? raw.checkIn.lastClaimDate : (raw.lastCheckInDate || ''),
            claimedToday: !!(raw.checkIn?.claimedToday ?? raw.claimedToday),
        },
        isLoggedIn: !!raw.isLoggedIn,
        accountEmail: typeof raw.accountEmail === 'string' ? raw.accountEmail : '',
        inventoryCount: clamp(raw.inventoryCount, 0, 500, 0),
        exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
        nonce: typeof raw.nonce === 'string' ? raw.nonce : Math.random().toString(36).substring(2, 10),
    };
}

/**
 * Создание подписанного конверта сохранения .mow
 */
export async function createSignedSaveEnvelope(payload: IMowPlayerPayload): Promise<IMowSaveEnvelope<IMowPlayerPayload>> {
    const cleanPayload = sanitizePlayerPayload(payload);
    cleanPayload.nonce = Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    cleanPayload.exportedAt = new Date().toISOString();

    const canonical = canonicalStringify(cleanPayload);
    const checksum = await computeSha256Checksum(canonical);

    return {
        magic: 'MOW_SAVE_VAULT',
        version: 2,
        engineVersion: '2026.1',
        exportedAt: cleanPayload.exportedAt,
        exportedAtMs: Date.now(),
        payload: cleanPayload,
        checksum,
    };
}

/**
 * Проверка подлинности и извлечение данных из сохранения .mow
 */
export async function verifyAndLoadSaveEnvelope(jsonString: string): Promise<{
    success: boolean;
    payload?: IMowPlayerPayload;
    error?: string;
}> {
    try {
        const envelope: any = JSON.parse(jsonString);

        if (!envelope || typeof envelope !== 'object') {
            return { success: false, error: 'Файл поврежден: не является валидным объектом JSON' };
        }

        // Поддержка v2 с контрольной суммой SHA-256
        if (envelope.magic === 'MOW_SAVE_VAULT' && envelope.checksum && envelope.payload) {
            const canonical = canonicalStringify(envelope.payload);
            const expectedChecksum = await computeSha256Checksum(canonical);

            if (envelope.checksum !== expectedChecksum) {
                console.error('[SaveCryptoService] Checksum mismatch!', {
                    got: envelope.checksum,
                    expected: expectedChecksum,
                });
                return {
                    success: false,
                    error: 'Ошибка верификации! Файл сохранения был модифицирован вне игры (Checksum mismatch).',
                };
            }

            const cleanPayload = sanitizePlayerPayload(envelope.payload);
            return { success: true, payload: cleanPayload };
        }

        // Поддержка legacy (v1) сохранений без SHA-256 с автоматической миграцией
        if (envelope.guestId || envelope.gold !== undefined || envelope.playerName) {
            console.warn('[SaveCryptoService] Detected legacy v1 unhashed save file. Migrating with sanitization...');
            const cleanPayload = sanitizePlayerPayload(envelope);
            return { success: true, payload: cleanPayload };
        }

        return { success: false, error: 'Неизвестный формат сохранения Masters of the Wild (.mow)' };
    } catch (err: any) {
        return { success: false, error: `Ошибка синтаксического анализа: ${err.message || err}` };
    }
}
