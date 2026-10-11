#!/usr/bin/env bash
# ==============================================================================
# Masters of the Wild - Automated VPS Deployment & Setup Script
# Target OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 Начинаем автоматическую настройку сервера для Masters of the Wild..."
echo "=========================================================="

# 1. Обновление пакетов
echo "📦 Шаг 1/6: Обновление системы и установка базовых утилит..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git unzip ufw nginx certbot python3-certbot-nginx

# 2. Установка Node.js 22 LTS
echo "📦 Шаг 2/6: Установка Node.js 22 LTS и PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js версия: $(node -v)"
echo "NPM версия: $(npm -v)"

npm install -g pm2

# 3. Создание структуры папок
echo "📁 Шаг 3/6: Создание директорий приложения..."
APP_DIR="/var/www/masters-of-the-wild"
mkdir -p "$APP_DIR/dist"
mkdir -p "$APP_DIR/server/data"

# 4. Настройка Nginx
echo "⚙️ Шаг 4/6: Конфигурация Nginx..."
cat << 'EOF' > /etc/nginx/sites-available/masters-wild
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/masters-of-the-wild/dist;
    index index.html;

    # Заголовки для интеграции в iframe ВКонтакте
    add_header X-Frame-Options "ALLOWALL" always;
    add_header Content-Security-Policy "frame-ancestors *" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Сжатие Gzip для максимальной скорости
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript image/svg+xml;

    # Статика и SPA роутинг
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование ассетов (WebP, звуки, шрифты)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Проксирование API на бэкенд Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/masters-wild /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 5. Настройка брандмауэра UFW
echo "🛡️ Шаг 5/6: Настройка безопасности и файрвола..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 6. Настройка прав
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

echo "=========================================================="
echo "✅ Сервер успешно настроен и готов принимать файлы игры!"
echo "📍 Директория для загрузки dist/: $APP_DIR/dist"
echo "📍 Директория бэкенда: $APP_DIR/server"
echo "🌐 Проверь работу, открыв в браузере: http://$(curl -s ifconfig.me)"
echo "=========================================================="
