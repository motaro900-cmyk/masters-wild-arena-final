/**
 * @owner: Masters of the Wild / DevOps & Deployment
 * @purpose: Официальный деплой на бесплатный статический хостинг ВКонтакте (VK Mini Apps Static Hosting CDN).
 * Использует нативные Go-эндпоинты VK API, автоматическую авторизацию и обходит ограничения российских сертификатов Node.js.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'vk-hosting-config.json');
const ZIP_PATH = path.join(ROOT_DIR, 'dist-vk.zip');

const API_HOST = 'https://api.vk.ru/method/';
const API_VERSION = '5.131';
const CLIENT_VERSION = 2;

// Read config
if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ Config file vk-hosting-config.json not found!');
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Read token
const tokenStorePath = path.join(
    process.env.USERPROFILE || process.env.HOME,
    '.config',
    'configstore',
    '@vkontakte',
    'vk-miniapps-deploy.json'
);

let accessToken = process.env.MINI_APPS_ACCESS_TOKEN;
if (!accessToken && fs.existsSync(tokenStorePath)) {
    try {
        const store = JSON.parse(fs.readFileSync(tokenStorePath, 'utf-8'));
        accessToken = store.access_token;
    } catch (e) {}
}

if (!accessToken) {
    console.error('❌ Access token not found. Please set MINI_APPS_ACCESS_TOKEN or run npx @vkontakte/vk-miniapps-deploy once to authenticate.');
    process.exit(1);
}

if (!fs.existsSync(ZIP_PATH)) {
    console.error('❌ dist-vk.zip not found! Run "npm run package:vk" first.');
    process.exit(1);
}

async function api(method, params = {}) {
    const p = {
        ...params,
        v: API_VERSION,
        access_token: accessToken,
        cli_version: CLIENT_VERSION,
    };
    const query = Object.keys(p)
        .map((k) => `${k}=${encodeURIComponent(p[k])}`)
        .join('&');
    const res = await fetch(`${API_HOST}${method}?${query}`);
    const data = await res.json();
    if (data.error) {
        throw new Error(`VK API Error [${data.error.error_code}]: ${data.error.error_msg}`);
    }
    return data.response;
}

async function handleQueue(userId, baseUrl, key, ts, version) {
    const queueUrl = `${baseUrl}?act=a_check&key=${key}&ts=${ts}&id=${userId}&wait=5`;
    const res = await fetch(queueUrl);
    const data = await res.json();

    if (data.events && data.events.length) {
        for (const ev of data.events) {
            const event = ev.data;
            if (event.type === 'error') {
                console.error('❌ Deploy failed in queue:', event.message || event.code);
                return false;
            }
            if (event.type === 'success') {
                if (event.code === 201 && event.message && event.message.urls) {
                    console.log('\n======================================================');
                    console.log('🎉 DEPLOY TO VK MINI APPS CDN COMPLETED SUCCESSFULLY!');
                    console.log('======================================================');
                    console.log('🌐 Production URLs generated and active on VK:');
                    for (const [key, val] of Object.entries(event.message.urls)) {
                        console.log(`   👉 ${key}: ${val}`);
                    }
                    console.log('======================================================');
                    return true;
                }
            }
        }
    }
    // Continue polling queue if not finished
    return handleQueue(userId, baseUrl, key, data.ts, version);
}

async function deploy() {
    console.log('🚀 [VK Deploy] Deploying Masters of the Wild to VK Hosting CDN...');
    const zipStats = fs.statSync(ZIP_PATH);
    console.log(`📦 Bundle: dist-vk.zip (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`);

    const params = {
        app_id: config.app_id,
        environment: 3, // DEV (1) + PROD (2) = 3
        update_prod: 1,
        update_dev: 1,
        endpoint_mvk: config.endpoints.mvk,
        endpoint_web: config.endpoints.web,
        endpoint_mobile: config.endpoints.mobile,
    };

    console.log('📡 1/4 Requesting upload server from VK Go Hosting...');
    const uploadServer = await api('apps.getGoHostingUploadServer', params);
    if (!uploadServer || !uploadServer.upload_url) {
        throw new Error('Failed to obtain upload_url from VK API');
    }

    console.log('📤 2/4 Uploading bundle to VK CDN storage (pu.vk.ru)...');
    const fd = new FormData();
    fd.append('file', fs.createReadStream(ZIP_PATH), {
        contentType: 'application/zip',
        knownLength: zipStats.size,
    });

    const startTime = Date.now();
    const upRes = await fetch(uploadServer.upload_url, {
        method: 'POST',
        headers: fd.getHeaders(),
        body: fd,
    });

    if (!upRes.ok) {
        throw new Error(`Upload server responded with HTTP ${upRes.status}`);
    }
    const uploadResponse = await upRes.json();
    console.log(`✅ Upload finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);

    console.log('⚙️ 3/4 Registering new Go Hosting task with VK...');
    const taskData = await api('apps.createGoHostingTask', {
        ...params,
        upload_response: Buffer.from(JSON.stringify(uploadResponse)).toString('base64'),
    });

    console.log(`📋 Version registered: ${taskData.version}`);

    console.log('⏳ 4/4 Subscribing to deploy queue and activating CDN routes...');
    const queueInfo = await api('apps.subscribeToHostingQueue', {
        app_id: config.app_id,
        version: taskData.version,
    });

    await handleQueue(queueInfo.app_id, queueInfo.base_url, queueInfo.key, queueInfo.ts, taskData.version);
}

deploy().catch((err) => {
    console.error('❌ [VK Deploy] Deploy failed:', err);
    process.exit(1);
});
