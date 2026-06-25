/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Verification suite to test proxying from /api/ endpoints to /server/ handlers.
 */

import crypto from 'crypto';
import timeHandler from '../api/time.js';
import verifySignHandler from '../api/verify-sign.js';

// Setup environment variables for test
process.env.VK_APP_SECRET = 'my_test_app_secret_123';

const makeMockResponse = () => {
    const headers = {};
    let statusCode = 200;
    let responseBody = null;
    let ended = false;
    return {
        setHeader(name, value) {
            headers[name.toLowerCase()] = value;
        },
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseBody = data;
            ended = true;
            return this;
        },
        end() {
            ended = true;
        },
        getHeaders() { return headers; },
        getStatusCode() { return statusCode; },
        getBody() { return responseBody; },
        isEnded() { return ended; }
    };
};

async function testTimeEndpoint() {
    console.log('🧪 Testing /api/time...');
    const req = { method: 'GET' };
    const res = makeMockResponse();

    await timeHandler(req, res);

    if (res.getStatusCode() !== 200) {
        throw new Error(`Time endpoint failed with status code ${res.getStatusCode()}`);
    }
    const body = res.getBody();
    if (!body || typeof body.serverTime !== 'number' || !body.iso) {
        throw new Error(`Time endpoint returned invalid payload: ${JSON.stringify(body)}`);
    }
    if (res.getHeaders()['cache-control'] !== 'no-store, no-cache') {
        throw new Error(`Time endpoint did not set proper headers`);
    }
    console.log('✅ /api/time works successfully!');
}

async function testVerifySignEndpoint() {
    console.log('🧪 Testing /api/verify-sign...');
    
    // Test case 1: Missing signature
    {
        const req = { method: 'GET', query: { vk_user_id: '123' } };
        const res = makeMockResponse();
        await verifySignHandler(req, res);
        if (res.getStatusCode() !== 400 || res.getBody().valid !== false) {
            throw new Error('Expected 400 Bad Request for missing sign');
        }
    }

    // Test case 2: Valid signature
    {
        // Reconstruct sorted query string: "vk_app_id=123&vk_user_id=456"
        const queryParams = [
            { key: 'vk_app_id', value: '123' },
            { key: 'vk_user_id', value: '456' }
        ];
        const queryString = 'vk_app_id=123&vk_user_id=456';
        
        // Compute signature
        const sign = crypto
            .createHmac('sha256', process.env.VK_APP_SECRET)
            .update(queryString)
            .digest()
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=$/, '');

        const req = {
            method: 'GET',
            query: {
                vk_app_id: '123',
                vk_user_id: '456',
                sign: sign
            }
        };
        const res = makeMockResponse();
        await verifySignHandler(req, res);

        if (res.getStatusCode() !== 200 || res.getBody().valid !== true) {
            throw new Error(`Verify-sign failed for valid parameters. Response: ${JSON.stringify(res.getBody())}`);
        }
    }

    // Test case 3: Invalid signature
    {
        const req = {
            method: 'GET',
            query: {
                vk_app_id: '123',
                vk_user_id: '456',
                sign: 'invalid_sig_here'
            }
        };
        const res = makeMockResponse();
        await verifySignHandler(req, res);

        if (res.getStatusCode() !== 200 || res.getBody().valid !== false) {
            throw new Error('Expected valid: false for invalid signature');
        }
    }

    console.log('✅ /api/verify-sign works successfully!');
}

async function run() {
    try {
        console.log('🚀 Running Proxy Endpoints Verification Suite...');
        await testTimeEndpoint();
        await testVerifySignEndpoint();
        console.log('🎉 All proxy endpoint tests passed successfully!');
    } catch (err) {
        console.error('❌ Proxy verification suite failed:', err);
        process.exit(1);
    }
}

run();
