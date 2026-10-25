/**
 * @owner: Masters of the Wild Team
 * @purpose: Telegram WebApp (Mini Apps 2.0) Bridge integration.
 *           Handles fullscreen, landscape lock, anti-swipe gestures,
 *           and user profile synchronization via Telegram.WebApp.
 */

export interface TelegramUser {
    id: number | string;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
    }
}

export const isTelegramMiniApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    const tg = window.Telegram?.WebApp;
    if (!tg) return false;
    // tg.initData contains auth string when launched inside Telegram client
    return Boolean(tg.initData && tg.initData.length > 0) || Boolean(tg.initDataUnsafe?.user);
};

export const getTelegramUser = (): TelegramUser | null => {
    if (typeof window === 'undefined') return null;
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initDataUnsafe?.user) return null;
    return tg.initDataUnsafe.user;
};

export const initTelegramWebApp = (): void => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
        // 1. Tell Telegram client that web app is ready
        tg.ready();

        // 2. Expand to full viewport
        tg.expand();

        // 3. Disable pull-to-close gesture on mobile devices so combat swipes don't close the game
        if (typeof tg.disableVerticalSwipes === 'function') {
            tg.disableVerticalSwipes();
        }

        // 4. Request native fullscreen (Telegram Bot API 8.0+)
        if (typeof tg.requestFullscreen === 'function') {
            tg.requestFullscreen();
        }

        // 5. Lock orientation to landscape for native auto-battler experience (Telegram Bot API 8.0+)
        if (typeof tg.lockOrientation === 'function') {
            tg.lockOrientation();
        }

        // 6. Match Telegram header and background colors to game aesthetic
        if (typeof tg.setHeaderColor === 'function') {
            tg.setHeaderColor('#0a0a1a');
        }
        if (typeof tg.setBackgroundColor === 'function') {
            tg.setBackgroundColor('#05050a');
        }

        console.log(' Telegram Mini App initialized successfully', {
            platform: tg.platform,
            version: tg.version,
            user: tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.id
        });
    } catch (err) {
        console.warn('⚠️ Telegram WebApp initialization warning:', err);
    }
};
