/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Integration test for verification of VK launch parameters signature algorithm.
 */

import { verifyVkSign } from '../server/vkAuth.js';

// Setup mock VK_APP_SECRET
process.env.VK_APP_SECRET = 'mock_secret_key_12345';

import crypto from 'crypto';

async function runTests() {
    console.log('🧪 Starting VK signature verification tests...');

    // Test case 1: Localhost bypass check
    console.log('\nCase 1: Localhost bypass check...');
    const localResult = verifyVkSign('vk_user_id=8888&vk_app_id=123', 'localhost:5173');
    if (localResult.ok && localResult.vkUserId === '8888') {
        console.log('✅ Localhost bypass test passed.');
    } else {
        console.error('❌ Localhost bypass test failed:', localResult);
        process.exit(1);
    }

    // Test case 2: Production signature verification
    console.log('\nCase 2: Production signature validation...');
    
    // We construct valid VK parameters and sign them using HMAC-SHA256 with 'mock_secret_key_12345'
    // Expected parameters sorted alphabetically:
    // vk_app_id=123&vk_user_id=9999
    // Expected query string: "vk_app_id=123&vk_user_id=9999"
    // HMAC-SHA256("vk_app_id=123&vk_user_id=9999", "mock_secret_key_12345")
    // Let's compute it in JS:
    const queryString = 'vk_app_id=123&vk_user_id=9999';
    const expectedHash = crypto
        .createHmac('sha256', process.env.VK_APP_SECRET)
        .update(queryString)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');

    const validLaunchParams = `?vk_app_id=123&vk_user_id=9999&sign=${expectedHash}`;
    const prodResult = verifyVkSign(validLaunchParams, 'masters-wild-arena-final.vercel.app');
    
    if (prodResult.ok && prodResult.vkUserId === '9999') {
        console.log('✅ Valid signature verification passed.');
    } else {
        console.error('❌ Valid signature verification failed:', prodResult);
        process.exit(1);
    }

    // Test case 3: Invalid signature verification
    console.log('\nCase 3: Invalid signature detection...');
    const invalidLaunchParams = `?vk_app_id=123&vk_user_id=9999&sign=invalid_hash_here`;
    const invalidResult = verifyVkSign(invalidLaunchParams, 'masters-wild-arena-final.vercel.app');

    if (!invalidResult.ok && invalidResult.error.includes('Invalid VK signature')) {
        console.log('✅ Invalid signature detection passed.');
    } else {
        console.error('❌ Invalid signature detection failed:', invalidResult);
        process.exit(1);
    }

    // Test case 4: Missing parameters check
    console.log('\nCase 4: Missing sign parameters detection...');
    const missingResult = verifyVkSign('?vk_user_id=9999', 'masters-wild-arena-final.vercel.app');
    if (!missingResult.ok && missingResult.error.includes('Missing VK signature')) {
        console.log('✅ Missing signature detection passed.');
    } else {
        console.error('❌ Missing signature detection failed:', missingResult);
        process.exit(1);
    }

    console.log('\n🎉 All VK Signature Verification tests passed successfully!');
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
