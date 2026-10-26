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
    setLoadingText: (text: string) => void,
): Promise<FirebaseProfileResult | null> => {
    const { syncService, SyncService } = await import('../services/SyncService');
    const { bootController } = await import('./BootController');
    let state = useGameStore.getState();

    if (bootController.getState() !== 'LOAD') {
        console.warn(`[initFirebaseProfile] Aborting load: bootState is ${bootController.getState()}, expected LOAD`);
        return null;
    }

    const searchParamsObj = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const allowGuest = searchParamsObj?.get('guest') === '1' || searchParamsObj?.get('dev') === '1' || searchParamsObj?.get('test') === '1';

    const isLocalhost =
        allowGuest ||
        (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.startsWith('192.168.') ||
                window.location.hostname.startsWith('10.') ||
                window.location.hostname.endsWith('.local') ||
                window.location.protocol === 'file:'));

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
            const { getTelegramUser } = await import('../utils/TelegramBridge');
            const tgUser = getTelegramUser();
            if (tgUser) {
                const adaptedUser = {
                    id: 'tg_' + tgUser.id,
                    firstName: tgUser.first_name || 'Воин',
                    lastName: tgUser.last_name || '',
                    photo: tgUser.photo_url || '/assets/images/avatars/panda.webp',
                    photo200: tgUser.photo_url || '/assets/images/avatars/panda.webp',
                };
                useGameStore.setState({ vkUser: adaptedUser as any });
                console.log('✅ Telegram user initialized into profile:', adaptedUser.firstName);
            } else {
                const guestId = localStorage.getItem('motw_guest_id') || ('guest_' + Math.random().toString(36).slice(2, 10));
                localStorage.setItem('motw_guest_id', guestId);
                const guestUser = {
                    id: guestId,
                    firstName: 'Игрок',
                    lastName: '',
                    photo: '/assets/images/avatars/panda.webp',
                    photo200: '/assets/images/avatars/panda.webp',
                };
                useGameStore.setState({ vkUser: guestUser as any });
                console.log('✅ Standalone guest initialized into profile:', guestUser.id);
            }
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
                const fallbackName1 =
                    (typeof window !== 'undefined' && localStorage.getItem('mow_player_name') && localStorage.getItem('mow_player_name') !== 'Дикий Мастер' && localStorage.getItem('mow_player_name') !== 'Мастер' ? localStorage.getItem('mow_player_name')! : (state.vkUser?.firstName || state.vkUser?.first_name || `Игрок_${userId.slice(-4)}`));
                useGameStore.setState({
                    name: fallbackName1,
                    onboardingCompleted: false,
                    tutorialStep: 0,
                    activeScreen: 'INTRO',
                    isSystemUpdate: true,
                });
                return { userId, isNew: true, data: null };
            }
        }

        const isAdminUser = result.isAdmin || false;
        const userVkId = state.vkUser?.id || state.vkUser?.uid;
        const isHardcodedAdmin = (userVkId && Number(userVkId) === 212359386) || false /* Removed for security */;
        const finalAdminStatus = isAdminUser || isLocalhost || isHardcodedAdmin;

        if (result.isNew) {
            console.log('👶 No remote profile found in Firestore. Resetting store for new player.');
            useGameStore.getState().resetStore();
            const fallbackName2 = (typeof window !== 'undefined' && localStorage.getItem('mow_player_name') && localStorage.getItem('mow_player_name') !== 'Дикий Мастер' && localStorage.getItem('mow_player_name') !== 'Мастер' ? localStorage.getItem('mow_player_name')! : (state.vkUser?.firstName || state.vkUser?.first_name || `Игрок_${userId.slice(-4)}`));
            useGameStore.setState({
                name: fallbackName2,
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
                    '[SyncService] Local offline progress is newer than remote. Keeping local state (will sync to remote post-boot).',
                );
                bootController.setNeedPostBootSync(true);
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

                // Auto-correct default name 'Мастер' using actual VK user profile if available
                let needSync = false;
                if ((!stateToRestore.name || stateToRestore.name === 'Мастер') && state.vkUser) {
                    const realVkName = state.vkUser.firstName || state.vkUser.first_name;
                    if (realVkName && realVkName !== 'Мастер') {
                        console.log('🔄 Autocorrecting default "Мастер" name to VK name:', realVkName);
                        stateToRestore.name = realVkName;
                        needSync = true;
                    }
                }

                // Auto-correct default avatar if we have VK user photo and current is default/missing/sprite
                if (
                    (!stateToRestore.avatar ||
                        stateToRestore.avatar === 'none' ||
                        stateToRestore.avatar === '' ||
                        stateToRestore.avatar.startsWith('sprite:')) &&
                    state.vkUser
                ) {
                    const realVkPhoto = state.vkUser.photo200 || state.vkUser.photo;
                    if (realVkPhoto) {
                        console.log('🔄 Autocorrecting empty/sprite avatar to VK photo:', realVkPhoto);
                        stateToRestore.avatar = realVkPhoto;
                        needSync = true;
                    }
                }

                // Preserve vkUser in the restored state
                if (state.vkUser) {
                    stateToRestore.vkUser = state.vkUser;
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

                stateToRestore.isSystemUpdate = true;
                useGameStore.setState(stateToRestore);
                useGameStore.setState({
                    isAdmin: finalAdminStatus,
                    isDeveloper: finalAdminStatus,
                    isSystemUpdate: true,
                });

                if (needSync) {
                    console.log('💾 Autocorrected profile data (will sync to Firebase post-boot)...');
                    bootController.setNeedPostBootSync(true);
                }
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
            const fallbackName3 = (typeof window !== 'undefined' && localStorage.getItem('mow_player_name') && localStorage.getItem('mow_player_name') !== 'Дикий Мастер' && localStorage.getItem('mow_player_name') !== 'Мастер' ? localStorage.getItem('mow_player_name')! : (state.vkUser?.firstName || state.vkUser?.first_name || `Игрок_${userId.slice(-4)}`));
            useGameStore.setState({
                name: fallbackName3,
                onboardingCompleted: false,
                tutorialStep: 0,
                activeScreen: 'INTRO',
                isSystemUpdate: true,
            });
            return { userId, isNew: true, data: null };
        }
    }
};
