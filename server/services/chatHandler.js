/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: High-performance, in-memory chat service with strict authentication, clan authorization, XSS escaping, and flood protection.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { sanitizeDocId } from '../securityMiddleware.js';
import { getLocalDoc } from '../localStore.js';

// In-memory room message storage (max 100 recent messages per room)
const MAX_MESSAGES_PER_ROOM = 100;
const ALLOWED_ROOMS = new Set(['global', 'clan', 'trade']);

// 436-FZ and VK Catalog compliance: Russian profanity filter (censor roots)
const PROFANITY_PATTERNS = [
    /х[уy][йяеёюи]/gi,
    /п[иiеe][зz]д/gi,
    /[еeё][бb][аaллыяиеё]/gi,
    /б[лl][яy][дьт]/gi,
    /с[уy]к[аaи]/gi,
    /г[оo]вн/gi,
    /шл[юy]х/gi,
    /мр[аa]з/gi,
    /п[иi][дd][аoо][рr]/gi,
    /чм[оo]/gi,
    /з[аa]л[уy]п/gi,
    /г[аa]нд[оo]н/gi,
];

function censorProfanity(input) {
    if (!input || typeof input !== 'string') return '';
    let result = input;
    for (const pattern of PROFANITY_PATTERNS) {
        result = result.replace(pattern, (match) => '*'.repeat(match.length));
    }
    return result;
}

const chatRooms = {
    global: [
        {
            id: 'msg_init_1',
            senderId: 'SYSTEM',
            senderName: 'Хранитель Леса',
            text: 'Добро пожаловать на Арену Диких Земель! Сражайтесь честно и прославляйте свой клан!',
            timestamp: Date.now() - 60000,
            channel: 'system',
            room: 'global',
        },
    ],
    clan: {}, // clanId -> messages[]
    trade: [],
};

// Anti-flood tracker: Map<userId, lastMessageTimestamp>
const userLastMessageTime = new Map();
const FLOOD_COOLDOWN_MS = 2000; // 2 seconds between messages

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function handleGetMessages(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { room = 'global', clanId, since = '0' } = req.query || {};
    if (!ALLOWED_ROOMS.has(room)) {
        return res.status(400).json({ error: `Invalid chat room: ${room}` });
    }

    const sinceTs = parseInt(since, 10) || 0;
    let messages = [];

    if (room === 'clan') {
        if (!clanId) return res.status(400).json({ error: 'Missing clanId for clan room' });
        messages = chatRooms.clan[clanId] || [];
    } else {
        messages = chatRooms[room] || [];
    }

    const newMessages = messages.filter((m) => m.timestamp > sinceTs);

    return res.status(200).json({
        ok: true,
        room,
        messages: newMessages,
        serverTime: Date.now(),
    });
}

export async function handleSendMessage(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, senderName = 'Игрок', text, room = 'global', channel = 'player', launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host, cleanId);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (cleanId.startsWith('VK-')) {
        if (auth.isUnsigned || !auth.vkUserId || cleanId !== `VK-${auth.vkUserId}`) {
            return res.status(403).json({ error: 'Forbidden: identity mismatch' });
        }
    }

    if (!ALLOWED_ROOMS.has(room)) {
        return res.status(400).json({ error: `Invalid chat room: ${room}` });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Empty message text' });
    }

    if (text.length > 300) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 300 characters' });
    }

    const USERS_COLLECTION = isDev === true ? 'пользователи_dev' : 'пользователи';
    const profileDoc = await getLocalDoc(USERS_COLLECTION, cleanId);
    const profile = profileDoc.exists && profileDoc.data ? profileDoc.data : null;

    if (profile && profile.isMuted) {
        return res.status(403).json({ error: 'Вы временно заглушены модератором' });
    }

    // Clan authorization check
    let targetClanId = null;
    if (room === 'clan') {
        if (!profile || !profile.clanId) {
            return res.status(403).json({ error: 'Вы не состоите в клане' });
        }
        targetClanId = profile.clanId;
    }

    // Anti-flood check
    const now = Date.now();
    const lastTime = userLastMessageTime.get(cleanId) || 0;
    if (now - lastTime < FLOOD_COOLDOWN_MS) {
        return res.status(429).json({ error: 'Слишком частая отправка сообщений. Подождите 2 сек.' });
    }
    userLastMessageTime.set(cleanId, now);

    const censored = censorProfanity(text.trim());
    const safeText = escapeHtml(censored);

    let verifiedChannel = 'player';
    if (channel === 'clan' && room === 'clan') {
        verifiedChannel = 'clan';
    } else if ((channel === 'system' || channel === 'herald') && profile && (profile.isAdmin || profile.isDeveloper)) {
        verifiedChannel = channel;
    }

    const messageObj = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        senderId: cleanId,
        senderName: escapeHtml(String(senderName).slice(0, 30)),
        text: safeText,
        timestamp: now,
        channel: verifiedChannel,
        room,
    };

    if (room === 'clan') {
        if (!chatRooms.clan[targetClanId]) chatRooms.clan[targetClanId] = [];
        chatRooms.clan[targetClanId].push(messageObj);
        if (chatRooms.clan[targetClanId].length > MAX_MESSAGES_PER_ROOM) {
            chatRooms.clan[targetClanId].shift();
        }
    } else {
        if (!chatRooms[room]) chatRooms[room] = [];
        chatRooms[room].push(messageObj);
        if (chatRooms[room].length > MAX_MESSAGES_PER_ROOM) {
            chatRooms[room].shift();
        }
    }

    return res.status(200).json({ ok: true, message: messageObj });
}
