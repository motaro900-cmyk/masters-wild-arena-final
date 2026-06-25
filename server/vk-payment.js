/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Handles VK payments callback notifications, verifying signature and items status.
 */

import crypto from 'crypto';

const ITEMS = {
    gem_pack_1: { title: 'Горсть Алмазов', price: 20 },
    gem_pack_2: { title: 'Сундук Алмазов', price: 100 },
    gem_pack_3: { title: 'Сокровищница Алмазов', price: 500 },
    starter_pack: { title: 'Стартовый Пакет', price: 20 }
};

// Robust function to parse the body in serverless environments
async function getParsedBody(req) {
    if (!req.body) {
        // Fallback: read stream manually if body parser is disabled
        try {
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString('utf-8');
            if (!rawBody) return {};
            try {
                return JSON.parse(rawBody);
            } catch {
                return Object.fromEntries(new URLSearchParams(rawBody));
            }
        } catch (e) {
            console.error('Failed to read request body stream:', e);
            return {};
        }
    }

    if (Buffer.isBuffer(req.body)) {
        const str = req.body.toString('utf-8');
        try {
            return JSON.parse(str);
        } catch {
            return Object.fromEntries(new URLSearchParams(str));
        }
    }

    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return Object.fromEntries(new URLSearchParams(req.body));
        }
    }

    if (typeof req.body === 'object') {
        return req.body;
    }

    return {};
}

export default async function handler(req, res) {
    // Enable CORS for VK servers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = await getParsedBody(req);
        console.log('Received VK payment notification:', JSON.stringify(body));

        const secretKey = process.env.VK_APP_SECRET;
        if (!secretKey) {
            console.error('VK_APP_SECRET environment variable is not set in Vercel dashboard!');
            return res.status(200).json({
                error: {
                    error_code: 1,
                    error_msg: 'Server environment configuration error',
                    critical: true
                }
            });
        }

        // 1. Проверяем подпись (sig)
        const sig = body.sig;
        if (!sig) {
            console.warn('Missing sig parameter in VK payment notification');
            return res.status(200).json({
                error: {
                    error_code: 10,
                    error_msg: 'Missing sig parameter',
                    critical: true
                }
            });
        }

        // Вычисляем подпись:
        // Все параметры, кроме 'sig', сортируются в алфавитном порядке ключей.
        // Склеиваются в формате 'имя=значение' и в конце добавляется secretKey.
        const keys = Object.keys(body).filter(k => k !== 'sig').sort();
        const signatureString = keys.map(k => `${k}=${body[k]}`).join('') + secretKey;
        const calculatedSig = crypto.createHash('md5').update(signatureString, 'utf-8').digest('hex');

        if (calculatedSig !== sig) {
            console.warn('VK Payment signature verification failed!', {
                receivedSig: sig,
                calculatedSig,
                signatureStringRule: signatureString.replace(secretKey, '***' + secretKey.slice(-4))
            });
            return res.status(200).json({
                error: {
                    error_code: 10,
                    error_msg: 'Incorrect signature',
                    critical: true
                }
            });
        }

        // 2. Обрабатываем типы уведомлений
        const notificationType = body.notification_type;

        // Запрос информации о товаре (get_item / get_item_test)
        if (notificationType === 'get_item' || notificationType === 'get_item_test') {
            const itemId = body.item;
            const itemData = ITEMS[itemId];

            if (!itemData) {
                console.warn(`Item not found in database: ${itemId}`);
                return res.status(200).json({
                    error: {
                        error_code: 20,
                        error_msg: 'Товар не найден',
                        critical: true
                    }
                });
            }

            console.log(`Fulfilling get_item info request for: ${itemId}`, itemData);
            return res.status(200).json({
                response: {
                    item_id: itemId,
                    title: itemData.title,
                    price: Number(itemData.price)
                }
            });
        }

        // Изменение статуса заказа (order_status_change / order_status_change_test)
        if (notificationType === 'order_status_change' || notificationType === 'order_status_change_test') {
            const status = body.status;
            const orderId = body.order_id;
            console.log(`Order status change notification received. OrderId: ${orderId}, Status: ${status}`);

            if (status === 'chargeable') {
                // Платёж готов к списанию (VK ждет подтверждения от нашего сервера)
                console.log(`Order ${orderId} is chargeable. Confirming order to VK.`);
                return res.status(200).json({
                    response: {
                        order_id: Number(orderId),
                        app_order_id: Number(orderId)
                    }
                });
            }

            // Для других статусов (charged, refund) просто подтверждаем получение
            return res.status(200).json({
                response: {
                    order_id: Number(orderId),
                    app_order_id: Number(orderId)
                }
            });
        }

        console.warn(`Unsupported notification type: ${notificationType}`);
        return res.status(200).json({
            error: {
                error_code: 100,
                error_msg: 'Unsupported notification type',
                critical: true
            }
        });
    } catch (err) {
        console.error('VK payment callback error:', err);
        return res.status(200).json({
            error: {
                error_code: 1000,
                error_msg: 'Internal server error',
                critical: true
            }
        });
    }
}
