import bridge from '@vkontakte/vk-bridge';

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
    const params = new URLSearchParams(window.location.search);
    return params.has('vk_app_id') || (window as any).isVkMiniApp === true;
};

export const initVK = async (): Promise<boolean> => {
    if (!bridge) return false;

    // [Lead Architect]: Страховка от зависания VK Bridge
    const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
            console.warn('⚠️ VK Bridge Init Timeout (3s). Starting anyway...');
            resolve(false);
        }, 3000);
    });

    const initPromise = (async () => {
        try {
            await bridge.send('VKWebAppInit');
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

    return Promise.race([initPromise, timeoutPromise]);
};

export const getVkUserInfo = async (): Promise<VkUser | null> => {
    if (!bridge) return null;

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
    if (!bridge) return false;
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
    if (!bridge) {
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
        const confirmBuy = window.confirm(`[Mock Payment] Вы хотите приобрести товар "${item}"?`);
        if (confirmBuy) {
            console.log(`Mock Payment: purchase of ${item} completed successfully`);
            return true;
        }
        return false;
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
    if (!bridge) return false;
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
    if (!bridge || window.location.hostname === 'localhost') {
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

    if (!bridge || window.location.hostname === 'localhost') {
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
    if (!bridge || window.location.hostname === 'localhost') return false;
    try {
        const result = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'groups.isMember',
            params: {
                group_id: groupId,
                v: '5.131',
                access_token: '',
            },
        });
        return result.response === 1;
    } catch (error) {
        console.warn('isGroupMember check failed:', error);
        return false;
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
