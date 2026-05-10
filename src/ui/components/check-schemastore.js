const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://json.schemastore.org/partial-eslint-plugins.json';
const settingsPath = path.join(__dirname, '../.vscode/settings.json');
const intervalMs = 5 * 60 * 1000; // 5 минут

console.log(`[SchemaStore Monitor] Запуск мониторинга (${url})...`);
console.log('[SchemaStore Monitor] Проверка будет выполняться каждые 5 минут.');

function checkSchemaStore() {
    console.log(`[${new Date().toLocaleTimeString()}] Проверка доступности...`);
    
    const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        if (res.statusCode === 200) {
            console.log('\n✅ SchemaStore снова доступен! Настройки .vscode восстановлены.');
            restoreSettings();
            process.exit(0);
        } else {
            console.log(`⏳ Сервер недоступен (Статус: ${res.statusCode}). Повторная проверка через 5 минут...`);
        }
    });

    req.on('error', (e) => {
        console.log(`❌ Ошибка соединения: ${e.message}. Повторная проверка через 5 минут...`);
    });
    
    req.on('timeout', () => {
        req.destroy();
        console.log('⏱️ Таймаут ожидания ответа. Повторная проверка через 5 минут...');
    });

    req.end();
}

function restoreSettings() {
    if (fs.existsSync(settingsPath)) {
        try {
            const settingsContent = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsContent);
            
            if (settings['json.schemaDownload.enable'] === false) {
                delete settings['json.schemaDownload.enable']; // Удаляем временный фикс
                fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
            }
        } catch (err) {
            console.error('Ошибка при обновлении .vscode/settings.json:', err.message);
        }
    }
}

// Запускаем первую проверку сразу
checkSchemaStore();
setInterval(checkSchemaStore, intervalMs);
