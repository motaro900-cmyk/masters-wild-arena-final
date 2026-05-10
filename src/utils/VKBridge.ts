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
