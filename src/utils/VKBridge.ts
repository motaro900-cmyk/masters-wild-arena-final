import bridge from '@vkontakte/vk-bridge';

type VkUser = {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
    photo100?: string;
};

export const isVkMiniApp = (): boolean => {
    // В десктопном браузере вне VK это вернет false или не сработает
    return typeof window !== 'undefined' && (window as any).isVkMiniApp === true;
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
                // @ts-ignore - Некоторых методов может не быть в типах, но они работают
                await bridge.send('VKWebAppResizeTo' as any, {
                    width: window.innerWidth,
                    height: window.innerHeight
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
            photo: user.photo_100 || user.photo_200 || '',
            photo100: user.photo_100 || user.photo_200 || ''
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
    if (!bridge) {
        console.warn('VK Bridge not available for Ads');
        return false;
    }
    
    try {
        const result = await bridge.send('VKWebAppShowNativeAds', {
            ad_format: 'reward'
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
    if (!bridge) {
        console.warn('VK Bridge not available for Payments');
        return false;
    }

    try {
        const result = await bridge.send('VKWebAppShowOrderBox', {
            type: 'item',
            item: item
        });
        return result.status === 'success';
    } catch (error) {
        console.warn('VKWebAppShowOrderBox failed:', error);
        return false;
    }
};

