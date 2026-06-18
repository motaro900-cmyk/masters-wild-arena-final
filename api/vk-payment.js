import crypto from 'crypto';

const ITEMS = {
    gem_pack_1: { title: 'Горсть Алмазов', price: 20 },
    gem_pack_2: { title: 'Сундук Алмазов', price: 100 },
    gem_pack_3: { title: 'Сокровищница Алмазов', price: 500 },
    starter_pack: { title: 'Стартовый Пакет', price: 20 }
};

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
        const body = req.body || {};
        const secretKey = process.env.VK_APP_SECRET;

        if (!secretKey) {
            console.error('VK_APP_SECRET environment variable is not set');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // 1. Проверяем подпись (sig)
        const sig = body.sig;
        if (!sig) {
            return res.status(400).json({ error: { error_code: 10, error_msg: 'Missing sig parameter', critical: true } });
        }

        // Собираем все параметры кроме sig
        const params = [];
        for (const [key, val] of Object.entries(body)) {
            if (key !== 'sig') {
                params.push({ key, value: String(val) });
            }
        }

        // Сортируем по ключам в алфавитном порядке
        params.sort((a, b) => a.key.localeCompare(b.key));

        // Склеиваем пары key=value
        const signatureString = params.map(p => `${p.key}=${p.value}`).join('') + secretKey;

        // Вычисляем MD5
        const calculatedSig = crypto.createHash('md5').update(signatureString, 'utf-8').digest('hex');

        if (calculatedSig !== sig) {
            console.warn('Signature verification failed', { calculatedSig, sig, signatureString });
            return res.status(400).json({ error: { error_code: 10, error_msg: 'Incorrect signature', critical: true } });
        }

        // 2. Обрабатываем типы уведомлений
        const notificationType = body.notification_type;

        // Запрос информации о товаре (get_item / get_item_test)
        if (notificationType === 'get_item' || notificationType === 'get_item_test') {
            const itemId = body.item;
            const itemData = ITEMS[itemId];

            if (!itemData) {
                return res.status(200).json({
                    error: {
                        error_code: 20,
                        error_msg: 'Товар не найден',
                        critical: true
                    }
                });
            }

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

            if (status === 'chargeable') {
                // Платёж готов к списанию (VK ждет подтверждения от нашего сервера)
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

        return res.status(400).json({ error: { error_code: 100, error_msg: 'Unsupported notification type', critical: true } });
    } catch (err) {
        console.error('VK payment callback error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
