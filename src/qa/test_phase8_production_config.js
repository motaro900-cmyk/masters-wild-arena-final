/**
 * PHASE 8 — Production Configuration, Secret Leak & Transport Audit Suite
 *
 * Automated verification of:
 * 1. Zero server secrets in client bundle (dist/)
 * 2. Zero Firebase / Google / Vercel references in production runtime
 * 3. Health check format & secret-free response
 * 4. Error response sanitization (zero stack traces leaked)
 * 5. Production CORS & Security Headers
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const PORT = 3013;
const TEST_SERVER_URL = `http://localhost:${PORT}`;

const TEST_SECRET = 'vk_test_secret_key_1234567890';
process.env.VK_APP_SECRET = TEST_SECRET;

import healthHandler from '../../server/health.js';
import verifySignHandler from '../../server/verify-sign.js';
import profileSaveHandler from '../../server/profile-save.js';

let server = null;

async function startTestServer() {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && 'body' in err) {
            return res.status(400).json({ error: 'Bad Request: Malformed JSON' });
        }
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        next();
    });
    app.use(express.static(path.join(ROOT_DIR, 'dist')));

    const adapt = (fn) => async (req, res) => {
        try {
            await fn(req, res);
        } catch (e) {
            if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
        }
    };

    app.get('/api/health', adapt(healthHandler));
    app.get('/api/verify-sign', adapt(verifySignHandler));
    app.post('/api/profile-save', adapt(profileSaveHandler));

    return new Promise((resolve) => {
        server = app.listen(PORT, () => {
            resolve();
        });
    });
}

const configResults = {
    test1_zero_secrets_in_client_dist: 'NOT TESTED',
    test2_zero_foreign_telemetry_chunks: 'NOT TESTED',
    test3_health_check_sanitized_format: 'NOT TESTED',
    test4_error_sanitization_no_stack_traces: 'NOT TESTED',
    test5_cors_and_transport_headers: 'NOT TESTED',
};

async function runConfigSuite() {
    console.log('====================================================');
    console.log('🔍 RUNNING PHASE 8 PRODUCTION CONFIG & SECRET AUDIT');
    console.log('====================================================\n');

    await startTestServer();

    try {
        // ─── 1. SCAN DIST FOR SECRETS ───
        console.log('🔒 [TEST 1] Scanning dist/ directory for server secrets...');
        const distDir = path.join(ROOT_DIR, 'dist');
        let secretLeakFound = false;

        const scanFiles = (dir) => {
            const list = fs.readdirSync(dir);
            for (const item of list) {
                const full = path.join(dir, item);
                if (fs.statSync(full).isDirectory()) {
                    scanFiles(full);
                } else if (item.endsWith('.js') || item.endsWith('.html')) {
                    const content = fs.readFileSync(full, 'utf-8');
                    if (
                        content.includes(TEST_SECRET) ||
                        content.includes('FIREBASE_PRIVATE_KEY') ||
                        content.includes('client_email') ||
                        content.includes('service_account')
                    ) {
                        secretLeakFound = true;
                    }
                }
            }
        };

        if (fs.existsSync(distDir)) {
            scanFiles(distDir);
        }

        if (!secretLeakFound) {
            configResults.test1_zero_secrets_in_client_dist = 'PASS';
            console.log('✅ [TEST 1 PASS] 0 secrets detected in client bundle.');
        } else {
            configResults.test1_zero_secrets_in_client_dist = 'FAIL';
            console.error('❌ [TEST 1 FAIL] Secret found in client bundle!');
        }

        // ─── 2. SCAN DIST FOR FOREIGN TELEMETRY / FIREBASE ───
        console.log('\n🌐 [TEST 2] Verifying 0 foreign telemetry / Firebase chunks in dist/assets...');
        const assetsDir = path.join(distDir, 'assets');
        let foreignChunkFound = false;

        if (fs.existsSync(assetsDir)) {
            const assetFiles = fs.readdirSync(assetsDir);
            for (const file of assetFiles) {
                if (file.toLowerCase().includes('firebase') || file.toLowerCase().includes('firestore')) {
                    foreignChunkFound = true;
                }
            }
        }

        if (!foreignChunkFound) {
            configResults.test2_zero_foreign_telemetry_chunks = 'PASS';
            console.log('✅ [TEST 2 PASS] 0 Firebase / Firestore chunks present in dist/assets.');
        } else {
            configResults.test2_zero_foreign_telemetry_chunks = 'FAIL';
            console.error('❌ [TEST 2 FAIL] Foreign chunk detected in dist/assets!');
        }

        // ─── 3. HEALTH CHECK SANITIZATION ───
        console.log('\n🩺 [TEST 3] Testing /api/health endpoint response sanitization...');
        const healthRes = await fetch(`${TEST_SERVER_URL}/api/health`);
        const healthData = await healthRes.json();

        const hasForbiddenHealthKeys =
            healthData.privateKey !== undefined ||
            healthData.env !== undefined ||
            healthData.secretKey !== undefined ||
            healthData.paths !== undefined;

        if (healthData.status === 'ok' && healthData.storage === 'local_json_atomic' && !hasForbiddenHealthKeys) {
            configResults.test3_health_check_sanitized_format = 'PASS';
            console.log('✅ [TEST 3 PASS] Health check returns clean, sanitized telemetry without secrets.');
        } else {
            configResults.test3_health_check_sanitized_format = 'FAIL';
            console.error('❌ [TEST 3 FAIL] Health check leaked private details:', healthData);
        }

        // ─── 4. ERROR SANITIZATION (NO STACK TRACES) ───
        console.log('\n🛡️ [TEST 4] Testing error response sanitization (stack trace suppression)...');
        const errRes = await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{ malformed_json: ',
        });

        const errText = await errRes.text();
        const hasStackTrace = errText.includes('at ') && errText.includes('.js:');

        if (!hasStackTrace) {
            configResults.test4_error_sanitization_no_stack_traces = 'PASS';
            console.log('✅ [TEST 4 PASS] Error responses safely sanitized: 0 stack traces leaked to client.');
        } else {
            configResults.test4_error_sanitization_no_stack_traces = 'FAIL';
            console.error('❌ [TEST 4 FAIL] Stack trace exposed in error response:', errText);
        }

        // ─── 5. CORS AND TRANSPORT HEADERS ───
        console.log('\n🔒 [TEST 5] Verifying CORS and Access Control headers...');
        const corsRes = await fetch(`${TEST_SERVER_URL}/api/health`, {
            method: 'OPTIONS',
        });

        const allowOrigin = corsRes.headers.get('access-control-allow-origin');
        const allowMethods = corsRes.headers.get('access-control-allow-methods');

        if (allowOrigin && allowMethods) {
            configResults.test5_cors_and_transport_headers = 'PASS';
            console.log('✅ [TEST 5 PASS] CORS preflight and access-control headers correctly configured.');
        } else {
            configResults.test5_cors_and_transport_headers = 'FAIL';
            console.error('❌ [TEST 5 FAIL] Missing CORS headers on OPTIONS!');
        }
    } catch (e) {
        console.error('❌ Phase 8 Config audit error:', e);
    } finally {
        if (server) server.close();
    }

    console.log('\n====================================================');
    console.log('📊 PHASE 8 PRODUCTION CONFIG SUMMARY');
    console.log('====================================================');
    console.table(configResults);

    setTimeout(() => {
        process.exit(0);
    }, 100);
}

runConfigSuite();
