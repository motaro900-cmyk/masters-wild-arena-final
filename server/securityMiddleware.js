/**
 * @owner: @Motaro900 / Backend Security Team
 * @purpose: High-performance security middleware for standalone Russian VPS hosting.
 *           Includes in-memory sliding-window rate limiting, input sanitization,
 *           prototype pollution prevention, and anti-tamper guards.
 */

// In-memory sliding-window rate limiter
const rateLimitMap = new Map();

/**
 * Creates a rate limiter middleware
 * @param {number} maxRequests - Max requests allowed in windowMs
 * @param {number} windowMs - Window duration in milliseconds
 * @param {string} bucketName - Identifying label for logging
 */
export function createRateLimiter(maxRequests = 60, windowMs = 60000, bucketName = 'api') {
    return (req, res, next) => {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
        const key = `${bucketName}:${clientIp}`;
        const now = Date.now();

        let record = rateLimitMap.get(key);
        if (!record || now - record.startTime > windowMs) {
            record = { count: 1, startTime: now };
            rateLimitMap.set(key, record);
        } else {
            record.count++;
        }

        // Periodically cleanup expired entries (every 100 requests)
        if (Math.random() < 0.01) {
            for (const [k, v] of rateLimitMap.entries()) {
                if (now - v.startTime > windowMs * 2) {
                    rateLimitMap.delete(k);
                }
            }
        }

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

        if (record.count > maxRequests) {
            console.warn(`[Security] Rate limit exceeded for ${clientIp} on bucket ${bucketName} (${record.count}/${maxRequests})`);
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Превышен лимит запросов. Пожалуйста, подождите немного.',
                retryAfter: Math.ceil((record.startTime + windowMs - now) / 1000),
            });
        }

        if (next) next();
    };
}

/**
 * Validates and sanitizes document IDs to prevent path traversal
 */
export function sanitizeDocId(docId) {
    if (!docId || typeof docId !== 'string') return null;
    // Reject directory traversal characters explicitly
    if (docId.includes('..') || docId.includes('/') || docId.includes('\\') || docId.includes('%')) {
        return null;
    }
    // Allow only alphanumeric, underscores, hyphens and cyrillic
    const sanitized = docId.replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, '');
    if (sanitized.length === 0 || sanitized.length > 128 || sanitized !== docId) {
        return null;
    }
    return sanitized;
}

/**
 * Checks for Prototype Pollution in incoming JSON payloads
 */
export function hasPrototypePollution(obj) {
    if (!obj || typeof obj !== 'object') return false;
    for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (hasPrototypePollution(obj[key])) return true;
        }
    }
    return false;
}

/**
 * Whitelist of client-writable profile fields
 */
export const CLIENT_WRITABLE_FIELDS = new Set([
    'name',
    'avatar',
    'photo',
    'frame',
    'title',
    'selectedHeroId',
    'hero',
    'favoriteHeroes',
    'settings',
    'uiTheme',
    'language',
    'soundVolume',
    'musicVolume',
    'fpsCap',
    'autoBattleSpeed',
    'autoBattleEnabled',
    'tutorialStep',
    'onboardingCompleted',
    'activeScreen',
    'lastSavedTimestamp',
    'clientVersion',
    'isMobile',
    'vkUser',
]);

/**
 * Server-authoritative fields that client cannot arbitrarily modify in existing profiles
 */
export const SERVER_AUTHORITATIVE_FIELDS = new Set([
    'gold',
    'crystals',
    'energy',
    'maxEnergy',
    'lastEnergyUpdate',
    'exp',
    'level',
    'rating',
    'trophies',
    'inventory',
    'heroEquipment',
    'equipment',
    'shards',
    'vipLevel',
    'vipEndTime',
    'isBanned',
    'isMuted',
    'isAdmin',
    'isDeveloper',
    'purchaseHistory',
    'transactions',
    'revision',
    '_processedOps',
    'lastDailyGiftClaimedTime',
    'loginStreak',
    'lastWheelSpinTime',
    'clanId',
    'clanRole',
    'mail',
    'claimedSocialRewards',
    'claimedGifts',
    'claimedRankRewards',
]);

/**
 * Filters a client sync payload, preserving server-authoritative fields from existing state
 */
export function sanitizeAndReconcileProfile(existingProfile, clientSyncData) {
    if (hasPrototypePollution(clientSyncData)) {
        throw new Error('Security violation: prototype pollution detected in sync payload');
    }

    // If new player (no existing profile), return safe default base
    if (!existingProfile) {
        const safeNewProfile = {
            gold: 500,
            crystals: 10,
            energy: 100,
            maxEnergy: 100,
            level: 1,
            exp: 0,
            rating: 1000,
            vipLevel: 0,
            vipEndTime: 0,
            isBanned: false,
            isMuted: false,
            isAdmin: false,
            isDeveloper: false,
            lastSavedTimestamp: Date.now(),
        };

        // Merge allowed client fields
        for (const [key, value] of Object.entries(clientSyncData)) {
            if (CLIENT_WRITABLE_FIELDS.has(key)) {
                safeNewProfile[key] = value;
            }
        }
        return safeNewProfile;
    }

    // Existing player: preserve server-authoritative fields
    const reconciled = { ...existingProfile };

    // Apply allowed client-writable fields
    for (const [key, value] of Object.entries(clientSyncData)) {
        if (CLIENT_WRITABLE_FIELDS.has(key)) {
            reconciled[key] = value;
        }
    }

    // Ensure server-authoritative fields cannot be tampered with by client
    for (const field of SERVER_AUTHORITATIVE_FIELDS) {
        if (field in existingProfile) {
            reconciled[field] = existingProfile[field];
        }
    }

    reconciled.lastSavedTimestamp = Date.now();
    return reconciled;
}
