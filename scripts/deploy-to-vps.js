#!/usr/bin/env node
/**
 * @owner: @Motaro900 / DevOps Team
 * @purpose: 1-Click Automated Deployment to VPS for Masters of the Wild
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(ROOT_DIR, 'vps-config.json');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🔍 Проверка конфигурации деплоя...');

  let config = {
    vpsHost: '',
    vpsUser: 'root',
    remotePath: '/var/www/masters-of-the-wild'
  };

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Ошибка чтения vps-config.json, создаем заново...');
    }
  }

  if (!config.vpsHost) {
    console.log('\n⚙️ Первый запуск! Введите данные вашего VPS сервера:');
    config.vpsHost = await prompt('👉 Введите IP адрес вашего VPS: ');
    const user = await prompt('👉 Введите пользователя (по умолчанию root): ');
    if (user) config.vpsUser = user;
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('💾 Настройки сохранены в vps-config.json!\n');
  }

  console.log(`🌐 Целевой сервер: ${config.vpsUser}@${config.vpsHost}`);
  console.log('🏗️  Шаг 1: Сборка production-билда (Vite)...');
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

  console.log('\n📦 Шаг 2: Загрузка обновлений на сервер...');
  
  // Копирование dist
  console.log('📤 Загрузка dist/...');
  execSync(`scp -r dist/* ${config.vpsUser}@${config.vpsHost}:${config.remotePath}/dist/`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });

  // Копирование server и конфига PM2
  console.log('📤 Загрузка backend и ecosystem.config.cjs...');
  execSync(`scp -r server ${config.vpsUser}@${config.vpsHost}:${config.remotePath}/`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  execSync(`scp ecosystem.config.cjs ${config.vpsUser}@${config.vpsHost}:${config.remotePath}/`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });

  console.log('\n🔄 Шаг 3: Перезапуск процессов на сервере...');
  const remoteCmd = `
    cd ${config.remotePath} &&
    npm install --prefix server express cors helmet dotenv &&
    pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs &&
    pm2 save &&
    systemctl reload nginx
  `.replace(/\n/g, ' ');

  execSync(`ssh ${config.vpsUser}@${config.vpsHost} "${remoteCmd}"`, {
    stdio: 'inherit'
  });

  console.log('\n======================================================');
  console.log('🎉 УСПЕХ! Игра успешно обновлена и летает на сервере!');
  console.log(`👉 Доступна по адресу: http://${config.vpsHost}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('\n❌ Ошибка во время деплоя:', err.message);
  process.exit(1);
});
