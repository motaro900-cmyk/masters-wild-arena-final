# 🚀 VK RELEASE & PRODUCTION OPERATIONS RUNBOOK
**Проект**: «Masters of the Wild» (VK Mini App)  
**Редакция**: 1.2.0-FINAL  
**Дата**: 2026-08-29  

---

## 1. Развёртывание на Production VPS (Deploy)

### Шаг 1: Клонирование / Обновление репозитория
```bash
cd /var/www/masters-of-the-wild
git fetch --tags
git checkout tags/v1.2.0-final
```

### Шаг 2: Установка зависимостей и чистая сборка
```bash
npm ci --production=false
npx tsc --noEmit
npm test
npm run build
```

### Шаг 3: Проверка переменных окружения (.env)
Убедиться, что в `/var/www/masters-of-the-wild/.env` заданы:
```env
PORT=3000
NODE_ENV=production
VK_APP_ID=52297839
VK_APP_SECRET=your_production_vk_app_secret
```

### Шаг 4: Запуск процесса через PM2 (Single Process)
```bash
# ВАЖНО: строго instances=1
pm2 start server/vps-server.js --name "motw-server" --max-memory-restart 500M -i 1
pm2 save
```

---

## 2. Проверка здоровья после развёртывания (Health Check)

```bash
# Локальная проверка
curl -i http://localhost:3000/api/health

# Проверка через публичный HTTPS домен
curl -i https://your-domain.ru/api/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "version": "1.2.0-rc1",
  "storage": "local_json_atomic",
  "vkSecretConfigured": true
}
```

---

## 3. Регламент отката (Rollback Procedure)

В случае обнаружения критической проблемы после деплоя:

```bash
# 1. Откат на предыдущий стабильный релизный тег
git checkout tags/v1.2.0-rc1

# 2. Пересборка клиентского дистрибутива
npm run build

# 3. Перезапуск процесса
pm2 restart motw-server

# 4. Проверка доступности
curl http://localhost:3000/api/health
```

---

## 4. Резервное копирование и восстановление (Backup / Restore)

### Быстрый бэкап данных перед обновлением:
```bash
tar -czf /var/backups/motw_data_pre_deploy_$(date +%Y%m%d_%H%M%S).tar.gz server/data/
```

### Восстановление при повреждении:
```bash
pm2 stop motw-server
tar -xzf /var/backups/motw_data_pre_deploy_TIMESTAMP.tar.gz
pm2 start motw-server
```

---

## 5. Экстренное выключение (Emergency Shutdown / Maintenance)

Если требуется срочно закрыть доступ на технические работы:
```bash
# Включение сервисной заглушки в Nginx
ln -sf /etc/nginx/sites-available/motw-maintenance.conf /etc/nginx/sites-enabled/motw.conf
nginx -s reload
```
