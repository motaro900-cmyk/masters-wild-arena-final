import bridge from '@vkontakte/vk-bridge';
import { useGameStore } from '../store/useGameStore';

type VkUser = {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
    photo100?: string;
    photo200?: string;
};

const isMobileVKApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    const hasMobileUA =
        ua.includes('vkapp') ||
        ua.includes('vkwebview') ||
        ua.includes('vkontakte') ||
        ua.includes('com.vkontakte') ||
        ua.includes('messenger');
    const hasMobileBridge =
        (window as any).AndroidBridge !== undefined ||
        ((window as any).webkit &&
            (window as any).webkit.messageHandlers &&
            (window as any).webkit.messageHandlers.VKWebAppAPI !== undefined);
    return hasMobileUA || hasMobileBridge;
};

export const isVkMiniApp = (): boolean => {
    if (typeof window === 'undefined') return false;

    // ── 1. URL-параметры — самый надёжный признак VK Mini App (десктоп и мобильный).
    //    VK платформа ВСЕГДА добавляет vk_app_id / vk_user_id / vk_platform в URL.
    //    Проверяем первыми, до iframe/webview, чтобы не зависеть от race condition
    //    при инициализации AndroidBridge / webkit на медленных устройствах.
    const params = new URLSearchParams(window.location.search);
    const hasVkParams =
        params.has('vk_app_id') ||
        params.has('vk_user_id') ||
        params.has('vk_platform') ||
        Array.from(params.keys()).some((k) => k.startsWith('vk_'));
    if (hasVkParams) return true;

    // ── 2. Десктоп VK — страница внутри iframe
    if (window.self !== window.top) return true;

    // ── 3. Мобильный VK webview — AndroidBridge / webkit или UA-сигнатуры
    if (isMobileVKApp()) return true;

    // ── 4. Реферер из домена VK (только в контексте фрейма или WebView)
    const hasVkReferrer =
        !!document.referrer &&
        (document.referrer.includes('vk.com') ||
            document.referrer.includes('vk-apps.com') ||
            document.referrer.includes('vk.ru'));
    if (hasVkReferrer && (window.self !== window.top || isMobileVKApp())) return true;

    // ── 5. Прочие маркеры
    const hasVkName = !!(window.name && window.name.includes('fXD'));
    return hasVkName || (window as any).isVkMiniApp === true;
};

export const initVK = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).vkBridgeInitialized) {
        return true;
    }
    if (!bridge) return false;

    if (!isVkMiniApp()) {
        console.log('Mock VK Bridge Init: successfully initialized mock mini app.');
        (window as any).vkBridgeInitialized = true;
        return true;
    }

    // На мобильных устройствах с 3G инициализация VK Bridge может занять 5-10 сек.
    // Увеличиваем timeout до 12s чтобы дать Bridge время ответить.
    let timeoutId: any;
    const timeoutPromise = new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => {
            console.warn('⚠️ VK Bridge Init Timeout (12s). Starting anyway...');
            resolve(false);
        }, 12000);
    });

    const initPromise = (async () => {
        try {
            await bridge.send('VKWebAppInit');
            (window as any).vkBridgeInitialized = true;
            // Запрашиваем полный экран сразу после инициализации
            try {
                await bridge.send('VKWebAppResizeTo' as any, {
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            } catch {
                // Игнорируем если платформа не поддерживает
            }
            // Запрашиваем ландшафтную ориентацию на мобильных
            try {
                if ((bridge.supports as any)('VKWebAppLockOrientation')) {
                    await bridge.send('VKWebAppLockOrientation' as any, {
                        orientation: 'landscape',
                    });
                    console.log('[VK Bridge] Orientation locked to landscape');
                }
            } catch (err) {
                console.warn('[VK Bridge] Failed to lock orientation:', err);
            }
            return true;
        } catch (error) {
            console.warn('VKWebAppInit failed:', error);
            return false;
        }
    })();

    let result = false;
    try {
        result = await Promise.race([initPromise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
    if (result) {
        (window as any).vkBridgeInitialized = true;
    }
    return result;
};

export const getVkUserInfo = async (): Promise<VkUser | null> => {
    if (!bridge) return null;

    if (!isVkMiniApp()) {
        console.log('Mock VK: getVkUserInfo returning Guest / Null in non-VK environment.');
        return null;
    }

    try {
        const user = await bridge.send('VKWebAppGetUserInfo');
        return {
            id: String(user.id),
            firstName: user.first_name || 'Игрок',
            lastName: user.last_name || '',
            photo: user.photo_200 || user.photo_100 || '',
            photo100: user.photo_100 || '',
            photo200: user.photo_200 || '',
        };
    } catch (error) {
        console.warn('VKWebAppGetUserInfo failed:', error);
        return null;
    }
};

/**
 * Запрашивает разрешение на отправку уведомлений
 */
export const requestNotifications = async (): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) return false;
    try {
        const result = await bridge.send('VKWebAppAllowNotifications');
        return result.result === true;
    } catch (error) {
        console.warn('VKWebAppAllowNotifications failed:', error);
        return false;
    }
};

/**
 * Вызывает окно приглашения друзей в игру
 */
export const showInviteBox = async (): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) {
        console.warn('VK Bridge not available. Invite box skipped.');
        return false;
    }
    try {
        const result = await bridge.send('VKWebAppShowInviteBox');
        console.log('VKWebAppShowInviteBox result:', result);
        return true;
    } catch (error) {
        console.warn('VKWebAppShowInviteBox failed:', error);
        return false;
    }
};

/**
 * Показывает вознаграждаемую рекламу
 * @returns true если реклама была просмотрена до конца
 */
export const showRewardedVideo = async (): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) {
        console.log('Mock Ads: showing rewarded video...');
        // Симулируем просмотр рекламы 1.2 секунды
        await new Promise((resolve) => setTimeout(resolve, 1200));
        console.log('Mock Ads: rewarded video watched successfully');
        return true;
    }

    try {
        const result = await bridge.send('VKWebAppShowNativeAds', {
            ad_format: 'reward',
        });
        return result.result === true;
    } catch (error) {
        console.warn('VKWebAppShowNativeAds failed:', error);
        return false;
    }
};

/**
 * Вызывает окно оплаты голосами ВК
 * @param item Идентификатор товара (например, "gems_pack_1")
 * @returns orderId если покупка успешна, null если отменена или ошибка
 */
export const purchaseVotes = async (item: string): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) {
        // Мок-среда (localhost/dev). PurchaseConfirmOverlay уже запросил подтверждение у пользователя,
        // поэтому не показываем второй диалог — просто симулируем успешный платёж.
        console.log(`[Mock Payment] Simulating successful VK Votes purchase for: "${item}"`);
        await new Promise((resolve) => setTimeout(resolve, 850)); // имитация задержки сети
        console.log(`[Mock Payment] Purchase "${item}" completed (mock).`);
        return true;
    }

    try {
        // VKWebAppShowOrderBox возвращает { success: boolean, order_id: string }
        // Документация: https://dev.vk.com/ru/bridge/VKWebAppShowOrderBox
        const orderResult = await bridge.send('VKWebAppShowOrderBox', {
            type: 'item',
            item: item,
        });

        // VK может возвращать success как boolean, status как 'success' или просто order_id при успехе
        const isSuccess =
            (orderResult as any).success === true ||
            (orderResult as any).status === 'success' ||
            !!(orderResult as any).order_id;

        if (!isSuccess) {
            console.warn('VKWebAppShowOrderBox: check failed', orderResult);
            return false;
        }

        const orderId = (orderResult as any).order_id;
        console.log(`VKWebAppShowOrderBox: purchase successful, order_id=${orderId}`);
        // order_id есть — платёж прошёл, начисляем кристаллы
        return true;
    } catch (error: any) {
        console.warn('VKWebAppShowOrderBox failed:', error);

        // Для администраторов и разработчиков предлагаем зачислить товар бесплатно при сбоях API (только на localhost и в режиме DEV)
        const state = useGameStore.getState();
        const isLocalhost =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.startsWith('192.168.'));

        // Разрешаем bypass только авторизованным администраторам на localhost или разработчикам из вайтлиста
        const isAuthorizedTester =
            state.isAdmin || state.isDeveloper || (state.vkUser && Number(state.vkUser.id) === 212359386);
        const isDevMode = import.meta.env.DEV === true;

        if (isDevMode && isAuthorizedTester && isLocalhost) {
            return new Promise<boolean>((resolve) => {
                state.showConfirm(
                    `[Тестовый режим] Платёж через VK Bridge не удался. Зачислить товар бесплатно для тестирования?`,
                    () => {
                        console.log('Sandbox Bypass: admin/tester chose to simulate success');
                        resolve(true);
                    },
                    () => {
                        console.log('Sandbox Bypass: admin/tester declined');
                        resolve(false);
                    },
                );
            });
        }

        return false;
    }
};

/**
 * Отправляет игровой запрос другу (сообщение в ЛС ВК)
 * @param uid ID друга в ВК (если пусто - откроет список выбора)
 * @param message Сообщение для друга
 */
export const sendGameRequest = async (uid?: string, message: string = 'Прими мой подарок!'): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) return false;
    try {
        const params: any = {
            type: 'request',
            message: message,
        };
        if (uid) params.uid = Number(uid);

        const result = await bridge.send('VKWebAppShowRequestBox', params);
        return !!result.requestKey;
    } catch (error) {
        console.warn('VKWebAppShowRequestBox failed:', error);
        return false;
    }
};

/**
 * Вызывает окно добавления игры в "Избранное" ВК
 */
export const addToFavorites = async (): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) {
        console.log('Mock: Add to Favorites');
        return true;
    }
    try {
        const result = await bridge.send('VKWebAppAddToFavorites');
        return result.result === true;
    } catch (error) {
        console.warn('VKWebAppAddToFavorites failed:', error);
        return false;
    }
};

/**
 * Вызывает окно подписки на официальную группу игры
 * @param groupId ID группы ВК (числовой)
 */
export const joinGroup = async (groupId: number = 238197449): Promise<boolean> => {
    const groupUrl = `https://vk.com/beasts_arena`;

    if (!bridge || !isVkMiniApp()) {
        window.open(groupUrl, '_blank');
        return true;
    }

    try {
        const result = await bridge.send('VKWebAppJoinGroup', { group_id: groupId });
        return result.result === true;
    } catch {
        // Если нативный метод не сработал (например, десктопная версия ВК), открываем ссылку
        window.open(groupUrl, '_blank');
        console.warn('VKWebAppJoinGroup failed, falling back to window.open');
        return true; // Лояльный фоллбек: выдаем награду за сам факт перехода
    }
};

let _cachedToken: string | null = null;
let _tokenScope: string | null = null;

const getToken = async (scope: string): Promise<string | null> => {
    if (_cachedToken && _tokenScope === scope) {
        return _cachedToken;
    }
    try {
        const appId = Number(import.meta.env.VITE_VK_APP_ID || '54585995');
        const result = await bridge.send('VKWebAppGetAuthToken', {
            app_id: appId,
            scope,
        });
        _cachedToken = result.access_token;
        _tokenScope = scope;
        return _cachedToken;
    } catch {
        return null;
    }
};

/**
 * Проверяет, состоит ли пользователь в группе
 */
export const isGroupMember = async (groupId: number = 238197449): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) return false;
    try {
        let token = '';
        try {
            const cachedToken = await getToken('groups');
            token = cachedToken || '';
        } catch (tokenError) {
            console.warn('VKWebAppGetAuthToken failed, attempting call anyway:', tokenError);
        }

        const result = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'groups.isMember',
            params: {
                group_id: groupId,
                v: '5.131',
                access_token: token,
            },
        });
        return result.response === 1;
    } catch (error) {
        console.warn('isGroupMember check failed:', error);
        return false;
    }
};

/**
 * Получает список VK ID друзей, которые установили приложение
 */
export const getVkFriendsWhoPlay = async (): Promise<number[]> => {
    if (!bridge || !isVkMiniApp()) {
        console.log('Mock VK: getVkFriendsWhoPlay returning mock VK friend IDs.');
        return [212359386, 12345678];
    }
    try {
        let token = '';
        try {
            const cachedToken = await getToken('friends');
            token = cachedToken || '';
        } catch (tokenError) {
            console.warn('VKWebAppGetAuthToken for friends failed:', tokenError);
            return [];
        }

        if (!token) return [];

        const result = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'friends.getAppUsers',
            params: {
                v: '5.131',
                access_token: token,
            },
        });
        return result.response || [];
    } catch (error) {
        console.warn('friends.getAppUsers call failed:', error);
        return [];
    }
};

/**
 * Надежная функция копирования в буфер обмена с фоллбеком для iframe (VK Mini Apps)
 */
export const copyToClipboard = (text: string): boolean => {
    if (typeof window === 'undefined') return false;

    // 1. Попытка через современный Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            navigator.clipboard.writeText(text).catch((err) => {
                console.warn('Modern clipboard writeText promise rejected:', err);
            });
            return true;
        } catch (err) {
            console.warn('Modern clipboard API failed, trying fallback:', err);
        }
    }

    // 2. Старый надежный fallback через создание textarea и execCommand('copy')
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
        return false;
    }
};

/**
 * Шаринг результата боя в ВК.
 * На localhost — копирует текст в буфер обмена.
 * В мини-приложении — открывает редактор историй (VKWebAppShowStoryBox) на мобильных
 * или стандартное окно шаринга ВК (VKWebAppShare) на десктопе.
 */
export const shareBattleResult = async (params: {
    playerName: string;
    enemyName: string;
    damageDealt: number;
    trophiesChange: number;
    isVictory: boolean;
    goldEarned: number;
    xpEarned: number;
    crystalsEarned?: number;
    battleDurationSeconds?: number;
}): Promise<'shared' | 'posted' | 'copied' | 'failed'> => {
    const durationText = params.battleDurationSeconds ? ` за ${params.battleDurationSeconds} сек.` : '';
    const crystalsText =
        params.crystalsEarned && params.crystalsEarned > 0 ? `+${params.crystalsEarned} Кристалла 💎\n` : '';
    const trophiesText =
        params.trophiesChange > 0
            ? `+${params.trophiesChange} Кубков 🏆\n`
            : params.trophiesChange < 0
              ? `${params.trophiesChange} Кубков 📉\n`
              : '';

    const text = params.isVictory
        ? `⚔️ Я победил в Masters of the Wild!\n\n🏆 Результат боя:\n${params.playerName} vs ${params.enemyName}\nПобеда${durationText}\n\n+${params.xpEarned} XP 🛡️\n+${params.goldEarned} Золота 💰\n${crystalsText}${trophiesText}\nСыграть: https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '54585995'}`
        : `⚔️ Masters of the Wild\nБой с ${params.enemyName} оказался тяжелым испытанием...\n\n🛡️ Результат боя:\n${params.playerName} vs ${params.enemyName}\nНанесено урона: ${params.damageDealt.toLocaleString()} ед. 💥\n${trophiesText}\n🎮 Бросить вызов: https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '54585995'}`;

    // На localhost — просто копируем
    if (!bridge || !isVkMiniApp()) {
        const copied = copyToClipboard(text);
        return copied ? 'copied' : 'failed';
    }

    // Если не мобильный — сразу переходим к шарингу ссылки на стену (десктопный вариант)
    if (!isMobilePlatform()) {
        let shareSuccess = false;
        try {
            await bridge.send('VKWebAppShare', {
                link: `https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '54585995'}`,
            });
            shareSuccess = true;
        } catch (shareErr) {
            console.warn('VKWebAppShare failed:', shareErr);
        }
        const copied = copyToClipboard(text);
        return shareSuccess ? 'posted' : (copied ? 'copied' : 'failed');
    }

    try {
        // Попытка открыть редактор историй на мобильных устройствах
        const bgPath = params.isVictory
            ? 'assets/images/sharing/share_victory.png'
            : 'assets/images/sharing/share_defeat.png';
        const bgUrl = `${window.location.origin}/${bgPath}`;
        await bridge.send('VKWebAppShowStoryBox', {
            background_type: 'image',
            url: bgUrl,
            attachment: {
                text: 'open',
                type: 'url',
                url: `https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '54585995'}`,
            },
        });
        copyToClipboard(text);
        return 'shared';
    } catch (storyErr: any) {
        console.warn('VKWebAppShowStoryBox failed:', storyErr);

        // Если пользователь явно отменил (User denied / закрыл редактор), не спамим его вторым окном
        const isUserDenied =
            storyErr?.error_data?.error_code === 4 ||
            (storyErr?.error_data?.error_msg &&
                typeof storyErr.error_data.error_msg === 'string' &&
                storyErr.error_data.error_msg.toLowerCase().includes('user denied')) ||
            (storyErr?.message &&
                typeof storyErr.message === 'string' &&
                storyErr.message.toLowerCase().includes('user denied'));

        if (isUserDenied) {
            const copied = copyToClipboard(text);
            return copied ? 'copied' : 'failed';
        }

        // Пытаемся открыть стандартный шаринг ссылки ВК в качестве запасного варианта
        let shareSuccess = false;
        try {
            await bridge.send('VKWebAppShare', {
                link: `https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '54585995'}`,
            });
            shareSuccess = true;
        } catch (shareErr) {
            console.warn('VKWebAppShare failed:', shareErr);
        }

        // Копируем текст результата боя
        const copied = copyToClipboard(text);

        if (shareSuccess) {
            return 'posted';
        }
        if (copied) {
            return 'copied';
        }
        return 'failed';
    }
};

let lastInterstitialTime = 0;
const INTERSTITIAL_COOLDOWN = 180 * 1000; // 3 минуты кулдаун в миллисекундах

/**
 * Показывает межстраничную рекламу (Interstitial) с кулдауном.
 */
export const showInterstitialAd = async (force: boolean = false): Promise<boolean> => {
    const now = Date.now();
    if (!force && now - lastInterstitialTime < INTERSTITIAL_COOLDOWN) {
        console.log(
            `[VK Bridge] Interstitial on cooldown. Remaining: ${Math.round(
                (INTERSTITIAL_COOLDOWN - (now - lastInterstitialTime)) / 1000,
            )}s`,
        );
        return false;
    }

    if (!bridge || !isVkMiniApp()) {
        console.log('Mock Ads: showing interstitial...');
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log('Mock Ads: interstitial closed');
        lastInterstitialTime = now;
        return true;
    }

    try {
        const result = await bridge.send('VKWebAppShowNativeAds', {
            ad_format: 'interstitial',
        });
        lastInterstitialTime = now;
        return result.result === true;
    } catch (error) {
        console.warn('VKWebAppShowNativeAds (interstitial) failed:', error);
        return false;
    }
};

/**
 * Открывает внешнюю ссылку через VK Bridge или window.open
 */
export const openExternalUrl = async (url: string): Promise<boolean> => {
    // ВКонтакте требует открывать все внешние ссылки через редирект vk.com/away.php?to=
    const redirectPrefix = 'https://vk.com/away.php?to=';
    const finalUrl =
        url.startsWith(redirectPrefix) || url.includes('vk.com') || url.includes('vk.ru')
            ? url
            : `${redirectPrefix}${encodeURIComponent(url)}`;

    if (!bridge || !isVkMiniApp()) {
        window.open(finalUrl, '_blank');
        return true;
    }
    try {
        await bridge.send('VKWebAppOpenURL' as any, { url: finalUrl });
        return true;
    } catch (error) {
        console.warn('VKWebAppOpenURL failed, falling back to window.open:', error);
        window.open(finalUrl, '_blank');
        return true;
    }
};

export const isMobilePlatform = (): boolean => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const vkPlatform = params.get('vk_platform');
    
    // Если vk_platform передан, проверяем начинается ли он с mobile_
    if (vkPlatform) {
        return vkPlatform.startsWith('mobile_');
    }
    
    // Вспомогательный чекер по User Agent
    const ua = navigator.userAgent.toLowerCase();
    return /mobile|android|iphone|ipad|phone/i.test(ua);
};

/**
 * Открывает редактор историй ВК с фоном игры.
 * Использует разные изображения для победы и поражения.
 */
export const openStoryBox = async (isVictory?: boolean): Promise<'shared' | 'cancelled' | 'failed'> => {
    if (!bridge || !isVkMiniApp()) {
        console.log('[Mock] VKWebAppShowStoryBox вызван (localhost)');
        const mockBgName = isVictory === true ? 'share_victory.png' : isVictory === false ? 'share_defeat.png' : 'bg_main_mobile.webp';
        alert(
            `[Тест] VKWebAppShowStoryBox вызван на localhost с фоном: ${mockBgName}! Симулируем успешную публикацию Истории.`,
        );
        return 'shared';
    }
    try {
        const bgPath = isVictory === true
            ? 'assets/images/sharing/share_victory.png'
            : isVictory === false
              ? 'assets/images/sharing/share_defeat.png'
              : 'assets/images/backgrounds/bg_main_mobile.webp';
        const bgUrl = `${window.location.origin}/${bgPath}`;
        await bridge.send('VKWebAppShowStoryBox', {
            background_type: 'image',
            url: bgUrl,
            attachment: {
                text: 'open',
                type: 'url',
                url: `https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '54585995'}`,
            },
        });
        return 'shared';
    } catch (err: any) {
        const isCancel =
            err?.error_data?.error_code === 4 ||
            (err?.error_data?.error_msg &&
                typeof err.error_data.error_msg === 'string' &&
                err.error_data.error_msg.toLowerCase().includes('user denied')) ||
            (err?.message && typeof err.message === 'string' && err.message.toLowerCase().includes('user denied'));
        return isCancel ? 'cancelled' : 'failed';
    }
};

/**
 * Открывает стандартное окно шаринга ВК (ЛС, группы, история).
 * Используется кнопкой "Отправить друзьям" внутри SharePreviewModal.
 */
export const openShareLink = async (): Promise<boolean> => {
    const appId = import.meta.env.VITE_VK_APP_ID || '54585995';
    const link = `https://vk.com/app${appId}`;
    if (!bridge || !isVkMiniApp()) {
        console.log('[Mock] VKWebAppShare вызван (localhost)');
        copyToClipboard(link);
        alert(`[Тест] VKWebAppShare вызван на localhost для ссылки: ${link}. Ссылка скопирована в буфер обмена!`);
        return true;
    }
    try {
        await bridge.send('VKWebAppShare', {
            link: link,
        });
        return true;
    } catch (err) {
        console.warn('VKWebAppShare failed:', err);
        return false;
    }
};
