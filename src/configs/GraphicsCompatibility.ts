export interface GPURule {
    match?: string;
    contains?: string;
    disable?: string[];
    forceRenderer?: 'webgl' | 'webgpu';
    reason?: string;
}

export interface CompatibilityConfig {
    version: number;
    gpuRules: GPURule[];
}

export const DEFAULT_COMPATIBILITY_RULES: GPURule[] = [
    {
        match: 'xclipse',
        disable: ['webgpu'],
        reason: 'Android WebView rendering issues'
    },
    {
        match: 'mali-g68',
        disable: ['webgpu'],
        reason: 'Unstable WebGPU drivers'
    },
    {
        match: 'mali-g78',
        disable: ['webgpu'],
        reason: 'Unstable WebGPU drivers'
    },
    {
        match: 'mali-g57',
        disable: ['webgpu'],
        reason: 'Unstable WebGPU drivers'
    }
];

let cachedRules: GPURule[] = DEFAULT_COMPATIBILITY_RULES;
let isFetched = false;

/**
 * Загружает динамические правила совместимости с сервера.
 * В случае сбоя сети возвращает встроенные дефолтные правила.
 */
export async function fetchCompatibilityRules(): Promise<GPURule[]> {
    if (isFetched) return cachedRules;

    try {
        const timestamp = Date.now();
        const response = await fetch(`./compatibility.json?t=${timestamp}`);
        if (response.ok) {
            const data: CompatibilityConfig = await response.json();
            if (data && Array.isArray(data.gpuRules)) {
                cachedRules = data.gpuRules;
                isFetched = true;
                console.log(`[Compatibility] Loaded ${cachedRules.length} compatibility rules from server.`);
                return cachedRules;
            }
        }
    } catch (e) {
        console.warn('[Compatibility] Failed to fetch dynamic rules, using defaults:', e);
    }

    // fallback to default
    cachedRules = DEFAULT_COMPATIBILITY_RULES;
    return cachedRules;
}

/**
 * Проверяет, отключен ли WebGPU для данного GPU по правилам совместимости
 */
export function checkWebGPUDisabled(gpuRenderer: string): { disabled: boolean; reason?: string } {
    const cleanGPU = (gpuRenderer || '').toLowerCase();
    
    for (const rule of cachedRules) {
        const matchPattern = (rule.match || rule.contains || '').toLowerCase();
        if (matchPattern && cleanGPU.includes(matchPattern)) {
            const disableWebGPU = rule.disable?.includes('webgpu') || rule.forceRenderer === 'webgl';
            if (disableWebGPU) {
                return {
                    disabled: true,
                    reason: rule.reason || 'Dynamic compatibility rule match'
                };
            }
        }
    }

    return { disabled: false };
}

/**
 * Вычисляет следующую версию для автоотката.
 * Например, "1.1.5" -> "1.2.0".
 */
export function getNextRetryVersion(currentVersion: string): string {
    const parts = (currentVersion || '').split('.');
    if (parts.length >= 2) {
        const major = parseInt(parts[0], 10);
        const minor = parseInt(parts[1], 10);
        if (!isNaN(major) && !isNaN(minor)) {
            return `${major}.${minor + 1}.0`;
        }
    }
    return '1.2.0';
}
