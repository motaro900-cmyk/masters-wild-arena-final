export const resolveAssetPath = (assetPath: string): string => {
    if (!assetPath || typeof assetPath !== 'string') return assetPath;

    if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('data:')) {
        return assetPath;
    }

    const baseUrl = import.meta.env.BASE_URL || './';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedAsset = assetPath.replace(/^\/+/, '');
    return `${normalizedBase}${normalizedAsset}`;
};

export const resolveAssetObject = <T>(source: T): T => {
    if (typeof source === 'string') {
        return resolveAssetPath(source) as unknown as T;
    }

    if (Array.isArray(source)) {
        return source.map((item) => resolveAssetObject(item)) as unknown as T;
    }

    if (source && typeof source === 'object') {
        return Object.fromEntries(
            Object.entries(source as Record<string, unknown>).map(([key, value]) => [key, resolveAssetObject(value)]),
        ) as T;
    }

    return source;
};
