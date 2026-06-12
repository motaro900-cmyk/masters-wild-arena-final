import { useGameStore } from '../store/useGameStore';
import { isVkMiniApp } from '../utils/VKBridge';
import { getVkUserInfo } from '../utils/VKBridge';

interface FirebaseProfileResult {
    userId: string;
    isNew: boolean;
    data: any | null;
}

export const initFirebaseProfile = async (
    timeoutId: any,
    setInitError: (err: string) => void,
    setNotInVk: (val: boolean) => void,
    setLoadingText: (text: string) => void
): Promise<FirebaseProfileResult | null> => {
    const { syncService, SyncService } = await import('../services/SyncService');
    let state = useGameStore.getState();

    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.endsWith('.local') ||
            window.location.protocol === 'file:');

    const isVk = isVkMiniApp();
    if (!isLocalhost) {
        if (isVk && !state.vkUser) {
            console.warn('🔄 Final VK user retry before abort...');
            setLoadingText('Загрузка профиля (повторная попытка)...');
            await new Promise((r) => setTimeout(r, 3000));
            const finalUser = await getVkUserInfo();
            if (finalUser) {
                const store = useGameStore.getState();
                store.setVkUser(finalUser);
                if (finalUser.photo200 || finalUser.photo) {
                    store.updateProfile({ avatar: finalUser.photo200 || finalUser.photo });
                }
                state = useGameStore.getState();
                console.log('✅ VK User loaded (final retry):', finalUser.firstName);
            }
        }

        if (isVk && !state.vkUser) {
            console.error('❌ VK User Info not loaded after all retries. Showing error.');
            setInitError(
                'Не удалось загрузить ваш профиль ВКонтакте. Пожалуйста, перезапустите игру или проверьте соединение.',
            );
            clearTimeout(timeoutId);
            return null;
        }
        if (!isVk && !state.vkUser) {
            console.warn('❌ Blocked access: Guest access is forbidden in production.');
            clearTimeout(timeoutId);
            setNotInVk(true);
            return null;
        }
    }

    const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
    console.log('🔍 Checking Firebase profile for:', userId);
    try {
        const result = await syncService.loadPlayerData(userId);
        
        if (result === null) {
            console.warn('⚠️ Failed to load remote profile. Falling back to local cache/offline mode.');
            const localState = useGameStore.getState();
            if (localState && (localState.lastSavedTimestamp ?? 0) > 0) {
                console.log('💾 Restored from local cache, offline mode active.');
                useGameStore.setState({
                    isSystemUpdate: true,
                });
                return { userId, isNew: false, data: localState };
            } else {
                console.log('👶 No local state found. Initializing new player offline.');
                useGameStore.getState().resetStore();
                useGameStore.setState({
                    name: state.vkUser ? state.vkUser.first_name || 'Мастер' : 'Мастер',
                    onboardingCompleted: false,
                    tutorialStep: 0,
                    activeScreen: 'INTRO',
                    isSystemUpdate: true,
                });
                return { userId, isNew: true, data: null };
            }
        }

        let isAdminUser = false;
        try {
            const { db } = await import('../utils/firebase');
            const { doc, getDoc } = await import('firebase/firestore');
            const adminDocRef = doc(db, 'system', 'admins');
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists()) {
                const adminData = adminDocSnap.data();
                const vkIds = adminData?.vkIds || [];
                const userVkId = state.vkUser?.id || state.vkUser?.uid;
                if (userVkId && vkIds.map(Number).includes(Number(userVkId))) {
                    isAdminUser = true;
                }
            }
        } catch (err) {
            console.error('Failed to load admin whitelist from Firestore:', err);
        }

        const finalAdminStatus = isAdminUser || isLocalhost;

        if (result.isNew) {
            console.log('👶 No remote profile found in Firestore. Resetting store for new player.');
            useGameStore.getState().resetStore();
            useGameStore.setState({
                name: 'Мастер',
                onboardingCompleted: false,
                tutorialStep: 0,
                activeScreen: 'INTRO',
                isAdmin: finalAdminStatus,
                isDeveloper: finalAdminStatus,
                isSystemUpdate: true,
            });
            return { userId, isNew: true, data: null };
        } else {
            const fbProfile = result.data;
            if (!fbProfile) {
                console.error('❌ Remote profile is null for an existing player (suspicious isNew blocked).');
                setInitError(
                    'Не удалось загрузить данные вашего профиля. Пожалуйста, проверьте интернет-соединение и попробуйте снова.',
                );
                useGameStore.setState({ profileStatus: 'error', isSystemUpdate: true });
                clearTimeout(timeoutId);
                return null;
            }
            const localState = useGameStore.getState();
            const localTimestamp = localState.lastSavedTimestamp || 0;
            const remoteTimestamp = fbProfile.lastSavedTimestamp || fbProfile.wasOnlineMs || 0;

            console.log(
                `[SyncService] Conflict resolution check: Local timestamp = ${localTimestamp}, Remote timestamp = ${remoteTimestamp}`,
            );

            if (localTimestamp > remoteTimestamp && localState.name && localState.name !== 'Мастер') {
                console.log(
                    '[SyncService] Local offline progress is newer than remote. Keeping local state and syncing to remote.',
                );
                syncService.syncPlayerData();
                useGameStore.setState({
                    isAdmin: finalAdminStatus,
                    isDeveloper: finalAdminStatus,
                    isSystemUpdate: true,
                });
            } else {
                console.log('💾 Found remote profile, restoring state...', fbProfile.name);
                const stateToRestore = { ...fbProfile };
                stateToRestore.lastSavedTimestamp = remoteTimestamp;
                if (stateToRestore.status === 'BANNED') {
                    stateToRestore.isBanned = true;
                }

                // Проверяем флаг isNewPlayer
                const isNewPlayer = fbProfile.isNewPlayer === true;
                if (isNewPlayer) {
                    console.log('👶 Remote profile has isNewPlayer: true — triggering onboarding.');
                    stateToRestore.onboardingCompleted = false;
                    stateToRestore.activeScreen = 'INTRO';
                } else {
                    console.log('👤 Existing player (isNewPlayer is false/absent) — skipping onboarding.');
                    stateToRestore.onboardingCompleted = true;
                    stateToRestore.activeScreen = 'MAIN_MENU';
                }

                useGameStore.setState(stateToRestore);
                useGameStore.setState({
                    isAdmin: finalAdminStatus,
                    isDeveloper: finalAdminStatus,
                    isSystemUpdate: true,
                });
            }
            return { userId, isNew: false, data: fbProfile };
        }
    } catch (loadErr: any) {
        console.error('❌ Failed to load remote profile:', loadErr);
        console.warn('⚠️ Exception during loading remote profile. Falling back to local cache/offline mode.');
        const localState = useGameStore.getState();
        if (localState && (localState.lastSavedTimestamp ?? 0) > 0) {
            console.log('💾 Restored from local cache, offline mode active.');
            useGameStore.setState({
                isSystemUpdate: true,
            });
            return { userId, isNew: false, data: localState };
        } else {
            console.log('👶 No local state found. Initializing new player offline.');
            useGameStore.getState().resetStore();
            useGameStore.setState({
                name: state.vkUser ? state.vkUser.first_name || 'Мастер' : 'Мастер',
                onboardingCompleted: false,
                tutorialStep: 0,
                activeScreen: 'INTRO',
                isSystemUpdate: true,
            });
            return { userId, isNew: true, data: null };
        }
    }
};
