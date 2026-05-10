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
        return memoryStore.has(key) ? memoryStore.get(key) ?? null : null;
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
    }
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

export const getStorage = (): IStorageLike => {
    return canUseLocalStorage() ? window.localStorage : fallbackStorage;
};

export const safeGetItem = (key: string): string | null => {
    try {
        return getStorage().getItem(key);
    } catch {
        return null;
    }
};

export const safeSetItem = (key: string, value: string): void => {
    try {
        getStorage().setItem(key, value);
    } catch {
        // ignore storage failures in sandboxed iframes
    }
};

export const safeRemoveItem = (key: string): void => {
    try {
        getStorage().removeItem(key);
    } catch {
        // ignore storage failures
    }
};

export const safeClear = (): void => {
    try {
        getStorage().clear();
    } catch {
        // ignore storage failures
    }
};
