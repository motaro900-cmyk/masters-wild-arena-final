/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative Master Account Authentication for Masters of the Wild.
 *           Handles registration, password hashing (PBKDF2-SHA512), session token generation,
 *           and seamless profile binding directly to local atomic JSON storage.
 */

import crypto from 'crypto';
import { getLocalDoc, saveLocalDoc, getLocalCollection } from './localStore.js';

const COLLECTION_ACCOUNTS = 'master_accounts';
const COLLECTION_PROFILES = 'пользователи';

function sanitizeUsername(input) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().replace(/[^a-zA-Z0-9_\u0400-\u04FF -]/g, '');
}

function getLoginDocKey(login) {
    const normalized = String(login || '').trim().toLowerCase();
    return 'u_' + Buffer.from(normalized, 'utf-8').toString('hex');
}

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password.trim(), salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken() {
    return 'mow_' + crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/register
 */
export async function handleRegister(req, res) {
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const rawLogin = body.login || body.username || '';
        const rawEmail = body.email || '';
        const rawPass = body.password || '';

        const cleanLogin = sanitizeUsername(rawLogin);
        const cleanEmail = String(rawEmail).trim().toLowerCase();
        const cleanPass = String(rawPass).trim();

        // 1. Validation
        if (!cleanLogin || cleanLogin.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Имя персонажа (логин) должно содержать не менее 3 символов',
            });
        }
        if (cleanLogin.length > 24) {
            return res.status(400).json({
                success: false,
                error: 'Имя персонажа не должно превышать 24 символов',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Введите корректный адрес электронной почты (Email)',
            });
        }

        if (!cleanPass || cleanPass.length < 4) {
            return res.status(400).json({
                success: false,
                error: 'Пароль должен содержать не менее 4 символов',
            });
        }

        // 2. Check if username is already taken
        const loginDocKey = getLoginDocKey(cleanLogin);
        const existingLoginDoc = await getLocalDoc(COLLECTION_ACCOUNTS, loginDocKey);
        if (existingLoginDoc.exists) {
            return res.status(409).json({
                success: false,
                error: `Имя «${cleanLogin}» уже занято другим воином`,
            });
        }

        // 3. Check if email is already registered across existing accounts
        const allAccounts = await getLocalCollection(COLLECTION_ACCOUNTS, 500);
        const emailExists = allAccounts.some(
            (acc) => acc.email && acc.email.toLowerCase() === cleanEmail
        );
        if (emailExists) {
            return res.status(409).json({
                success: false,
                error: 'Мастер-аккаунт с таким Email уже зарегистрирован',
            });
        }

        // 4. Create account with PBKDF2-SHA512 hash + Salt
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(cleanPass, salt);
        const sessionToken = generateToken();
        const accountId = `mow_acc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const now = Date.now();

        const accountData = {
            id: accountId,
            login: cleanLogin,
            email: cleanEmail,
            passwordHash,
            salt,
            token: sessionToken,
            createdAt: now,
            lastLoginAt: now,
        };

        // 5. Create initial canonical starter game profile with weapon "Шест Дзена"
        const initialProfile = {
            id: accountId,
            playerName: cleanLogin,
            selectedHeroId: 'panda',
            level: 1,
            exp: 0,
            gold: 500,
            diamonds: 50,
            energy: 100,
            maxEnergy: 100,
            rating: 1000,
            inventory: [
                {
                    id: 'weapon_zen_staff',
                    name: 'Шест Дзена',
                    slot: 'weapon',
                    rarity: 'rare',
                    level: 1,
                    baseStats: { attack: 28, defense: 6, speed: 5 },
                    isEquipped: true,
                    description: 'Канонический шест мастера Дао Фэн Луна. Наполнен энергией Ци.',
                },
                {
                    id: 'armor_starter_robe',
                    name: 'Одеяние Паломника',
                    slot: 'armor',
                    rarity: 'common',
                    level: 1,
                    baseStats: { defense: 14, hp: 60 },
                    isEquipped: true,
                    description: 'Простая льняная мантия, укрепленная рунами защиты.',
                },
            ],
            equipTiers: {
                weapon: 1,
                armor: 1,
                ring: 1,
                boots: 1,
            },
            stats: {
                wins: 0,
                losses: 0,
                totalBattles: 0,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // 6. Atomically persist to disk
        await saveLocalDoc(COLLECTION_ACCOUNTS, loginDocKey, accountData, false);
        await saveLocalDoc(COLLECTION_PROFILES, loginDocKey, initialProfile, false);

        console.log(`[Auth API] ✅ Registered new master-account: ${cleanLogin} (${cleanEmail})`);

        return res.status(200).json({
            success: true,
            token: sessionToken,
            account: {
                id: accountId,
                login: cleanLogin,
                email: cleanEmail,
                createdAt: now,
            },
            profile: initialProfile,
            message: 'Мастер-аккаунт успешно зарегистрирован',
        });
    } catch (err) {
        console.error('[Auth API] ❌ Register error:', err);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера при регистрации',
        });
    }
}

/**
 * POST /api/auth/login
 */
export async function handleLogin(req, res) {
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const rawIdent = body.identifier || body.login || body.email || '';
        const rawPass = body.password || '';

        const cleanIdent = String(rawIdent).trim();
        const cleanPass = String(rawPass).trim();

        if (!cleanIdent || !cleanPass) {
            return res.status(400).json({
                success: false,
                error: 'Укажите логин/email и пароль',
            });
        }

        // 1. Locate account by login or email
        let account = null;
        let loginDocKey = getLoginDocKey(cleanIdent);
        const directDoc = await getLocalDoc(COLLECTION_ACCOUNTS, loginDocKey);

        if (directDoc.exists) {
            account = directDoc.data;
        } else {
            // Search all accounts by login or email
            const allAccounts = await getLocalCollection(COLLECTION_ACCOUNTS, 500);
            const found = allAccounts.find(
                (acc) =>
                    (acc.login && acc.login.toLowerCase() === cleanIdent.toLowerCase()) ||
                    (acc.email && acc.email.toLowerCase() === cleanIdent.toLowerCase())
            );
            if (found) {
                account = found;
                loginDocKey = getLoginDocKey(account.login);
            }
        }

        if (!account) {
            return res.status(401).json({
                success: false,
                error: 'Аккаунт не найден. Проверьте логин или зарегистрируйтесь.',
            });
        }

        // 2. Verify password
        const checkHash = hashPassword(cleanPass, account.salt);
        if (checkHash !== account.passwordHash) {
            return res.status(401).json({
                success: false,
                error: 'Неверный пароль',
            });
        }

        // 3. Issue fresh session token & update last login
        const sessionToken = generateToken();
        account.token = sessionToken;
        account.lastLoginAt = Date.now();
        await saveLocalDoc(COLLECTION_ACCOUNTS, loginDocKey, account, true);

        // 4. Fetch player profile
        const profileDoc = await getLocalDoc(COLLECTION_PROFILES, loginDocKey);
        const profile = profileDoc.exists ? profileDoc.data : null;

        console.log(`[Auth API] 🔑 User logged in: ${account.login}`);

        return res.status(200).json({
            success: true,
            token: sessionToken,
            account: {
                id: account.id,
                login: account.login,
                email: account.email,
                createdAt: account.createdAt,
            },
            profile,
            message: 'Успешная авторизация',
        });
    } catch (err) {
        console.error('[Auth API] ❌ Login error:', err);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера при входе',
        });
    }
}

/**
 * GET /api/auth/me
 */
export async function handleAuthMe(req, res) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : (req.query.token || '');

        if (!token) {
            return res.status(401).json({ success: false, error: 'Требуется токен авторизации' });
        }

        const allAccounts = await getLocalCollection(COLLECTION_ACCOUNTS, 500);
        const account = allAccounts.find((acc) => acc.token === token);

        if (!account) {
            return res.status(401).json({ success: false, error: 'Недействительный или истекший токен' });
        }

        const loginDocKey = getLoginDocKey(account.login);
        const profileDoc = await getLocalDoc(COLLECTION_PROFILES, loginDocKey);
        const profile = profileDoc.exists ? profileDoc.data : null;

        return res.status(200).json({
            success: true,
            account: {
                id: account.id,
                login: account.login,
                email: account.email,
                createdAt: account.createdAt,
            },
            profile,
        });
    } catch (err) {
        console.error('[Auth API] ❌ AuthMe error:', err);
        return res.status(500).json({ success: false, error: 'Ошибка проверки сессии' });
    }
}
