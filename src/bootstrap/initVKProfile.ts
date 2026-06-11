import { initVK, getVkUserInfo, isVkMiniApp } from '../utils/VKBridge';
import { useGameStore } from '../store/useGameStore';

export const initVKProfile = async (): Promise<void> => {
    // 1. VK Bridge
    // На localhost — пропускаем VK полностью (нет смысла ждать 12s при разработке)
    const isLocalhostEarly =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.endsWith('.local') ||
        window.location.protocol === 'file:';

    if (!isLocalhostEarly) {
        // 🔒 Проверка подписи параметров запуска через Vercel Serverless Function
        try {
            const searchParams = window.location.search;
            if (searchParams) {
                const response = await fetch(`/api/verify-sign${searchParams}`);
                if (!response.ok) {
                    throw new Error(`Server returned status ${response.status}`);
                }
                const data = await response.json();
                if (data && data.valid === false) {
                    throw new Error('Invalid signature');
                }
            } else if (isVkMiniApp()) {
                throw new Error('Launch parameters are missing');
            }
        } catch (err) {
            console.error('🔒 Security verification failed:', err);
            throw new Error(
                'Ошибка безопасности: проверка подписи параметров запуска не удалась. Пожалуйста, перезапустите игру из официального приложения ВКонтакте.'
            );
        }

        try {
            const vkAvailable = await initVK();
            console.log('📡 VK Status:', vkAvailable ? 'Connected' : 'Standalone');

            // Даже если initVK вернул false (таймаут на мобильной сети),
            // VK Bridge уже может быть доступен. Пытаемся получить данные.
            const user = await getVkUserInfo();
            if (user) {
                const store = useGameStore.getState();
                store.setVkUser(user);
                if (user.photo200 || user.photo) {
                    store.updateProfile({ avatar: user.photo200 || user.photo });
                }
                console.log('✅ VK User loaded:', user.firstName);
            } else if (isVkMiniApp()) {
                console.warn('🔄 VK User Info retry in 2s...');
                await new Promise((r) => setTimeout(r, 2000));
                const retryUser = await getVkUserInfo();
                if (retryUser) {
                    const store = useGameStore.getState();
                    store.setVkUser(retryUser);
                    if (retryUser.photo200 || retryUser.photo) {
                        store.updateProfile({ avatar: retryUser.photo200 || retryUser.photo });
                    }
                    console.log('✅ VK User loaded (retry):', retryUser.firstName);
                }
            }
        } catch (vkErr) {
            console.warn('⚠️ VK Bridge failed to init, continuing in standalone mode', vkErr);
        }
    } else {
        console.log('🛠️ Localhost detected — skipping VK Bridge init and signature verification');
    }
};

