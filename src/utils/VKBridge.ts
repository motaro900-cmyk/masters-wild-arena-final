type VkUser = {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
    photo100?: string;
};

declare global {
    interface Window {
        vkBridge?: {
            send: (event: string, params?: any) => Promise<any>;
        };
    }
}

const getVkBridge = () => typeof window !== 'undefined' ? window.vkBridge : undefined;

export const isVkMiniApp = (): boolean => Boolean(getVkBridge());

export const initVK = async (): Promise<boolean> => {
    const bridge = getVkBridge();
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
                await bridge.send('VKWebAppResizeTo', {
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
    const bridge = getVkBridge();
    if (!bridge) return null;

    try {
        const user = await bridge.send('VKWebAppGetUserInfo');
        return {
            id: String(user.id),
            firstName: user.first_name || user.firstName || 'Игрок',
            lastName: user.last_name || user.lastName || '',
            photo: user.photo_100 || user.photo_200 || user.photo || '',
            photo100: user.photo_100 || user.photo_200 || user.photo || ''
        };
    } catch (error) {
        console.warn('VKWebAppGetUserInfo failed:', error);
        return null;
    }
};
