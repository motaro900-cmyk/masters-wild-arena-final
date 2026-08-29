/**
 * @owner: @Motaro900 / Architecture Team
 * @purpose: Firebase stub layer (Zero external Firebase SDK dependencies in production bundle).
 */

export const db: any = {};
export const auth: any = {};

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.endsWith('.local') ||
        window.location.protocol === 'file:');

export const USERS_COLLECTION = isLocalhost ? 'пользователи_dev' : 'пользователи';
export const CHAT_COLLECTION = isLocalhost ? 'чат_dev' : 'чат';
export const FEEDBACK_COLLECTION = isLocalhost ? 'отзывы_dev' : 'отзывы';
