# 🚀 PRODUCTION RUNBOOK: MASTERS OF THE WILD
**Назначение**: Инструкция по эксплуатации, мониторингу и администрированию Node.js VPS сервера игры «Masters of the Wild»  
**Версия**: 1.2.0-RC1  

---

## 1. Базовые операции управления процессом (PM2)

> **ВАЖНОЕ ПРАВИЛО**: Использовать строго `instances: 1` (Single Process). Так как система использует попользовательский in-memory мьютекс и атомарную запись JSON на диск, кластерный режим (`instances: max`) запрещён во избежание межпроцессной конкуренции без внешнего распределённого лока (Redis).

### Запуск приложения:
```bash
pm2 start server/vps-server.js --name "motw-server" --max-memory-restart 500M
```

### Остановка приложения:
```bash
pm2 stop motw-server
```

### Перезапуск приложения:
```bash
pm2 restart motw-server
```

### Просмотр статуса и потребления ресурсов:
```bash
pm2 status
pm2 monit
```

---

## 2. Мониторинг и логирование (Logs & Observability)

### Просмотр логов в реальном времени:
```bash
pm2 logs motw-server --lines 100
```

### Поиск транзакций конкретного игрока в журнале аудита:
```bash
# Все экономические действия игрока VK-123456
pm2 logs motw-server --nostream | grep "VK-123456"
```

### Формат записи журнала аудита:
```
[AUDIT] 2026-08-29T08:25:59.514Z | USER VK-771122 | OP daily_gift.claim | OP_ID gift_claim_1787991959510 | GOLD 1250 -> 1750, CRYSTALS 55 -> 55, ENERGY 100 -> 100 | REASON: daily_gift_day_1_x1
```

---

## 3. Проверка здоровья сервиса (Health Check)

### Проверка статуса доступности API:
```bash
curl -i http://localhost:3000/api/health
```

**Ожидаемый ответ**:
```json
{
  "status": "ok",
  "version": "1.2.0-rc1",
  "uptime": 1420,
  "storage": "local_json_atomic",
  "vkSecretConfigured": true,
  "timestamp": "2026-08-29T08:26:00.000Z"
}
```

---

## 4. Реагирование на инциденты (Incident Response)

| Инцидент | Действие дежурного инженера |
| :--- | :--- |
| **HTTP 502 Bad Gateway в Nginx** | Проверить статус процесса: `pm2 status`. Если процесс упал, перезапустить: `pm2 restart motw-server`. Проверить лог ошибок: `pm2 logs --err`. |
| **Аномальный рост памяти (>450MB)** | `pm2 reload motw-server` (автоматически настроено по `--max-memory-restart 500M`). |
| **Подозрение на накрутку валюты** | Найти записи в логах по `USER VK-[ID]` и `[AUDIT]`. Сверить `operationId` и историю транзакций в файле `server/data/пользователи/VK-[ID].json`. |
| **Жалоба пользователя на сбой после оплаты** | Проверить файл `server/data/покупки/VK-[ID].json`. Если `order_status_change` от VK был доставлен, товар начислен автоматически. |
