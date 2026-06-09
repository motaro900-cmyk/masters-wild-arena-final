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

export const isVkMiniApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const hasVkQuery =
        params.has('vk_app_id') ||
        params.has('vk_platform') ||
        Array.from(params.keys()).some((k) => k.startsWith('vk_'));
    const hasVkReferrer =
        document.referrer &&
        (document.referrer.includes('vk.com') ||
            document.referrer.includes('vk-apps.com') ||
            document.referrer.includes('vk.ru'));
    const hasVkName = window.name && window.name.includes('fXD');
    return hasVkQuery || hasVkReferrer || hasVkName || (window as any).isVkMiniApp === true;
};

export const initVK = async (): Promise<boolean> => {
    if (!bridge) return false;

    if (!isVkMiniApp()) {
        console.log('Mock VK Bridge Init: successfully initialized mock mini app.');
        (window as any).vkBridgeInitialized = true;
        return true;
    }

    // На мобильных устройствах с 3G инициализация VK Bridge может занять 5-10 сек.
    // Увеличиваем timeout до 12s чтобы дать Bridge время ответить.
    const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
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
            return true;
        } catch (error) {
            console.warn('VKWebAppInit failed:', error);
            return false;
        }
    })();

    const result = await Promise.race([initPromise, timeoutPromise]);
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
 * Вызывает окно оплаты VK Stars
 * @param item Идентификатор товара (например, "gems_pack_1")
 */
export const purchaseStars = async (item: string): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) {
        console.log(`Mock Payment: initiating purchase for: ${item}`);
        return new Promise<boolean>((resolve) => {
            useGameStore.getState().showConfirm(
                `[Mock Payment] Вы хотите приобрести товар "${item}"?`,
                () => {
                    console.log(`Mock Payment: purchase of ${item} completed successfully`);
                    resolve(true);
                },
                () => {
                    console.log(`Mock Payment: purchase of ${item} cancelled`);
                    resolve(false);
                },
            );
        });
    }

    try {
        const result = await bridge.send('VKWebAppShowOrderBox', {
            type: 'item',
            item: item,
        });
        return result.status === 'success';
    } catch (error) {
        console.warn('VKWebAppShowOrderBox failed:', error);
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

/**
 * Проверяет, состоит ли пользователь в группе
 */
export const isGroupMember = async (groupId: number = 238197449): Promise<boolean> => {
    if (!bridge || !isVkMiniApp()) return false;
    try {
        let token = '';
        try {
            const authResult = await bridge.send('VKWebAppGetAuthToken', {
                app_id: Number(import.meta.env.VITE_VK_APP_ID || '52446645'),
                scope: 'groups',
            });
            token = authResult.access_token || '';
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
            const authResult = await bridge.send('VKWebAppGetAuthToken', {
                app_id: Number(import.meta.env.VITE_VK_APP_ID || '52446645'),
                scope: 'friends',
            });
            token = authResult.access_token || '';
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
 * Шаринг результата боя в ВК.
 * На localhost — копирует текст в буфер обмена.
 * В мини-приложении — вызывает VKWebAppShowWallPostBox.
 */
export const shareBattleResult = async (params: {
    playerName: string;
    enemyName: string;
    damageDealt: number;
    trophiesChange: number;
    isVictory: boolean;
}): Promise<'shared' | 'copied' | 'failed'> => {
    const text = params.isVictory
        ? `⚔️ Masters of the Wild\n${params.playerName} победил!\nПротивник: ${params.enemyName}\nНанесено урона: ${params.damageDealt.toLocaleString()}\nКубки: +${params.trophiesChange} ▲\n🎮 Играй: https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '52446645'}`
        : `⚔️ Masters of the Wild\n${params.playerName} против ${params.enemyName}!\nТяжёлый бой... Нанесено урона: ${params.damageDealt.toLocaleString()}\n🎮 Бросишь вызов? https://vk.com/app${import.meta.env.VITE_VK_APP_ID || '52446645'}`;

    // На localhost — просто копируем
    if (!bridge || !isVkMiniApp()) {
        try {
            await navigator.clipboard.writeText(text);
            return 'copied';
        } catch {
            return 'failed';
        }
    }

    try {
        await bridge.send('VKWebAppShowWallPostBox', { message: text });
        return 'shared';
    } catch {
        // Fallback: clipboard
        try {
            await navigator.clipboard.writeText(text);
            return 'copied';
        } catch {
            return 'failed';
        }
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
