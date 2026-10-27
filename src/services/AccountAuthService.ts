/**
 * AccountAuthService — Полноценный сервис аутентификации и управления мастер-аккаунтами.
 *
 * Архитектура:
 *  - Хранение зарегистрированных пользователей с криптографическим хешированием паролей (SHA-256 + Salt).
 *  - Поддержка нескольких аккаунтов (переключение, логаут, сохранение независимого прогресса).
 *  - Валидация логина, email и пароля с понятными русскоязычными ошибками.
 *  - Интеграция с PortalSyncBridge и useGameStore для сквозной синхронизации прогресса.
 *  - Синхронизация профиля с серверным API (/api/profile-save).
 */

import { computeSha256Checksum } from './SaveCryptoService';
import { portalSyncBridge } from './PortalSyncBridge';

export interface IUserAccount {
    id: string;
    login: string;
    email: string;
    passwordHash: string;
    salt: string;
    createdAt: number;
    lastLoginAt: number;
    profile: {
        playerName: string;
        selectedHeroId: string;
        level: number;
        exp: number;
        gold: number;
        diamonds: number;
        energy: number;
        rating: number;
        equipTiers: {
            weapon: number;
            armor: number;
            ring: number;
            boots: number;
        };
    };
}

const STORAGE_KEY_ACCOUNTS = 'mow_master_accounts';
const STORAGE_KEY_ACTIVE_ID = 'mow_active_account_id';

class AccountAuthService {
    private static instance: AccountAuthService;

    private constructor() {
        this.ensureDefaultAccount();
    }

    public static getInstance(): AccountAuthService {
        if (!AccountAuthService.instance) {
            AccountAuthService.instance = new AccountAuthService();
        }
        return AccountAuthService.instance;
    }

    /**
     * Создает начальный аккаунт admin / admin, если база аккаунтов пуста
     */
    private async ensureDefaultAccount(): Promise<void> {
        if (typeof window === 'undefined') return;
        const accounts = this.getAllAccounts();
        if (accounts.length === 0) {
            const salt = 'mow_seed_salt_2026';
            const hash = await computeSha256Checksum(`admin:${salt}`);
            const defaultAcc: IUserAccount = {
                id: 'mow_acc_admin',
                login: 'admin',
                email: 'admin@mastersofthewild.ru',
                passwordHash: hash,
                salt,
                createdAt: Date.now(),
                lastLoginAt: Date.now(),
                profile: {
                    playerName: 'admin',
                    selectedHeroId: 'panda',
                    level: 1,
                    exp: 0,
                    gold: 500,
                    diamonds: 50,
                    energy: 100,
                    rating: 1000,
                    equipTiers: {
                        weapon: 1,
                        armor: 1,
                        ring: 1,
                        boots: 1,
                    },
                },
            };
            this.saveAccounts([defaultAcc]);
        }
    }

    /**
     * Получить список всех локально сохраненных мастер-аккаунтов
     */
    public getAllAccounts(): IUserAccount[] {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('[AccountAuthService] Failed to parse accounts:', e);
            return [];
        }
    }

    /**
     * Сохранить список аккаунтов
     */
    private saveAccounts(accounts: IUserAccount[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
        } catch (e) {
            console.error('[AccountAuthService] Failed to save accounts:', e);
        }
    }

    /**
     * Получить активный залогиненный аккаунт
     */
    public getCurrentAccount(): IUserAccount | null {
        if (typeof window === 'undefined') return null;
        const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
        if (!activeId) return null;

        const accounts = this.getAllAccounts();
        const found = accounts.find((acc) => acc.id === activeId);
        return found || null;
    }

    /**
     * Генерация криптографической соли
     */
    private generateSalt(): string {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            const bytes = new Uint8Array(16);
            window.crypto.getRandomValues(bytes);
            return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        }
        return 'salt_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Хеширование пароля с солью
     */
    private async hashPassword(password: string, salt: string): Promise<string> {
        return computeSha256Checksum(`${password.trim()}:${salt}`);
    }

    /**
     * Регистрация нового аккаунта
     */
    public async register(params: {
        login: string;
        email: string;
        password: string;
    }): Promise<{ success: boolean; error?: string; account?: IUserAccount }> {
        const cleanLogin = params.login.trim();
        const cleanEmail = params.email.trim().toLowerCase();
        const cleanPass = params.password.trim();

        // 1. Валидация логина
        if (!cleanLogin || cleanLogin.length < 3) {
            return { success: false, error: 'Имя персонажа (логин) должно содержать не менее 3 символов' };
        }
        if (cleanLogin.length > 24) {
            return { success: false, error: 'Имя персонажа не должно превышать 24 символов' };
        }

        // 2. Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            return { success: false, error: 'Введите корректный адрес электронной почты (Email)' };
        }

        // 3. Валидация пароля
        if (!cleanPass || cleanPass.length < 4) {
            return { success: false, error: 'Пароль должен содержать минимум 4 символа' };
        }

        // 4. Проверка на уникальность
        const accounts = this.getAllAccounts();
        const existsLogin = accounts.some(
            (acc) => acc.login.toLowerCase() === cleanLogin.toLowerCase()
        );
        if (existsLogin) {
            return { success: false, error: `Имя «${cleanLogin}» уже занято другим воином` };
        }

        const existsEmail = accounts.some(
            (acc) => acc.email.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (existsEmail) {
            return { success: false, error: 'Аккаунт с таким Email уже зарегистрирован' };
        }

        // 5. Создание записи аккаунта
        const salt = this.generateSalt();
        const passwordHash = await this.hashPassword(cleanPass, salt);
        const newAccount: IUserAccount = {
            id: `mow_acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            login: cleanLogin,
            email: cleanEmail,
            passwordHash,
            salt,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            profile: {
                playerName: cleanLogin,
                selectedHeroId: 'panda',
                level: 1,
                exp: 0,
                gold: 500,
                diamonds: 50,
                energy: 100,
                rating: 1000,
                equipTiers: {
                    weapon: 1,
                    armor: 1,
                    ring: 1,
                    boots: 1,
                },
            },
        };

        accounts.push(newAccount);
        this.saveAccounts(accounts);

        // 6. Установка активной сессии
        this.setActiveSession(newAccount);

        return { success: true, account: newAccount };
    }

    /**
     * Авторизация существующего аккаунта
     */
    public async login(params: {
        identifier: string; // login or email
        password: string;
    }): Promise<{ success: boolean; error?: string; account?: IUserAccount }> {
        const cleanIdent = params.identifier.trim().toLowerCase();
        const cleanPass = params.password.trim();

        if (!cleanIdent) {
            return { success: false, error: 'Введите имя персонажа или Email' };
        }
        if (!cleanPass) {
            return { success: false, error: 'Введите пароль' };
        }

        const accounts = this.getAllAccounts();
        const account = accounts.find(
            (acc) =>
                acc.login.toLowerCase() === cleanIdent ||
                acc.email.toLowerCase() === cleanIdent
        );

        if (!account) {
            return { success: false, error: 'Аккаунт с таким логином или Email не найден' };
        }

        const computedHash = await this.hashPassword(cleanPass, account.salt);
        if (computedHash !== account.passwordHash) {
            return { success: false, error: 'Неверный пароль. Попробуйте снова' };
        }

        // Обновляем время входа
        account.lastLoginAt = Date.now();
        this.saveAccounts(accounts);

        // Устанавливаем активную сессию
        this.setActiveSession(account);

        return { success: true, account };
    }

    /**
     * Привязка активной сессии к браузеру и порталу
     */
    private setActiveSession(account: IUserAccount): void {
        if (typeof window === 'undefined') return;

        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, account.id);
        localStorage.setItem('mow_player_name', account.login);
        localStorage.setItem('mow_master_nick', account.login);
        localStorage.setItem('mow_auth_email', account.email);
        localStorage.setItem('mow_auth_token', `mow_sess_${account.id}_${Date.now()}`);

        // Синхронизируем состояние с PortalSyncBridge
        portalSyncBridge.commitMutation({
            playerName: account.login,
            accountEmail: account.email,
            isLoggedIn: true,
            gold: account.profile.gold,
            diamonds: account.profile.diamonds,
            energy: account.profile.energy,
        });

        // Уведомляем систему
        window.dispatchEvent(
            new CustomEvent('mow:auth_state_changed', { detail: { account, isLoggedIn: true } })
        );

        // Фоновый запрос на сервер для сохранения аккаунта
        this.syncWithServer(account).catch(() => {});
    }

    /**
     * Выход из аккаунта
     */
    public logout(): void {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
        localStorage.removeItem('mow_auth_token');
        localStorage.removeItem('mow_auth_email');

        portalSyncBridge.commitMutation({
            isLoggedIn: false,
        });

        window.dispatchEvent(
            new CustomEvent('mow:auth_state_changed', { detail: { account: null, isLoggedIn: false } })
        );
    }

    /**
     * Обновить профиль текущего пользователя
     */
    public updateCurrentAccountProfile(changes: Partial<IUserAccount['profile']>): void {
        const current = this.getCurrentAccount();
        if (!current) return;

        const accounts = this.getAllAccounts();
        const idx = accounts.findIndex((a) => a.id === current.id);
        if (idx !== -1) {
            accounts[idx].profile = { ...accounts[idx].profile, ...changes };
            this.saveAccounts(accounts);
            this.syncWithServer(accounts[idx]).catch(() => {});
        }
    }

    /**
     * Фоновая синхронизация с API
     */
    private async syncWithServer(account: IUserAccount): Promise<void> {
        try {
            await fetch('/api/profile-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: account.id,
                    playerName: account.login,
                    email: account.email,
                    profile: account.profile,
                    lastSavedAt: Date.now(),
                }),
            });
        } catch {
            // Офлайн режим: данные уже надежно сохранены в локальном реестре
        }
    }
}

export const accountAuthService = AccountAuthService.getInstance();
