export interface IStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    key(index: number): string | null;
    readonly length: number;
}

const memoryStore = new Map<string, string>();

const fallbackStorage: IStorageLike = {
    getItem(key: string) {
        return memoryStore.has(key) ? (memoryStore.get(key) ?? null) : null;
    },
    setItem(key: string, value: string) {
        memoryStore.set(key, String(value));
    },
    removeItem(key: string) {
        memoryStore.delete(key);
    },
    clear() {
        memoryStore.clear();
    },
    key(index: number) {
        return Array.from(memoryStore.keys())[index] ?? null;
    },
    get length() {
        return memoryStore.size;
    },
};

const canUseLocalStorage = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        const storage = window.localStorage;
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
};

const computeSignature = (value: string): string => {
    const salt = 'm0t4r0_w1ld_aReNa_2026_sEcReT_sAlT';
    let hash = 5381;
    const combined = value + salt;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash * 33) ^ combined.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
};

export const getStorage = (): IStorageLike => {
    return canUseLocalStorage() ? window.localStorage : fallbackStorage;
};

export const getSecureStorage = (): IStorageLike => {
    const rawStorage = getStorage();

    return {
        getItem(key: string): string | null {
            const rawValue = rawStorage.getItem(key);
            if (!rawValue) return null;

            try {
                const parsed = JSON.parse(rawValue);
                if (parsed && typeof parsed === 'object' && 'payload' in parsed && 'signature' in parsed) {
                    const expectedSignature = computeSignature(parsed.payload);
                    if (parsed.signature === expectedSignature) {
                        return parsed.payload;
                    }
                    console.warn(
                        `[SecureStorage] Signature verification failed for key: ${key}. Data has been tampered with!`,
                    );
                    rawStorage.removeItem(key);
                    return null;
                }
            } catch (e) {
                // Not a signature JSON wrapper, might be legacy save
            }

            // Backwards compatibility migration
            try {
                const parsedRaw = JSON.parse(rawValue);
                if (parsedRaw && typeof parsedRaw === 'object' && 'state' in parsedRaw) {
                    console.log(`[SecureStorage] Migrating legacy raw storage for key: ${key}`);
                    const signature = computeSignature(rawValue);
                    rawStorage.setItem(key, JSON.stringify({ payload: rawValue, signature }));
                    return rawValue;
                }
            } catch (e) {
                // Invalid JSON
            }

            return null;
        },

        setItem(key: string, value: string): void {
            const signature = computeSignature(value);
            const wrapper = JSON.stringify({ payload: value, signature });
            rawStorage.setItem(key, wrapper);
        },

        removeItem(key: string): void {
            rawStorage.removeItem(key);
        },

        clear(): void {
            rawStorage.clear();
        },

        key(index: number): string | null {
            return rawStorage.key(index);
        },

        get length(): number {
            return rawStorage.length;
        },
    };
};

export const safeGetItem = (key: string): string | null => {
    try {
        return getSecureStorage().getItem(key);
    } catch {
        return null;
    }
};

export const safeSetItem = (key: string, value: string): void => {
    try {
        getSecureStorage().setItem(key, value);
    } catch {
        // ignore storage failures in sandboxed iframes
    }
};

export const safeRemoveItem = (key: string): void => {
    try {
        getSecureStorage().removeItem(key);
    } catch {
        // ignore storage failures
    }
};

export const safeClear = (): void => {
    try {
        getSecureStorage().clear();
    } catch {
        // ignore storage failures
    }
};
