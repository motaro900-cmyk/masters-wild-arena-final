/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Utility script to generate a signed VK launch URL for testing production APIs.
 *
 * Usage:
 *   VK_APP_SECRET="your_secret" node scripts/generate-vk-signature.js <vk_user_id>
 */

import crypto from 'crypto';

const vkUserId = process.argv[2] || '212359386'; // default to a test VK ID
const secretKey = process.env.VK_APP_SECRET;

if (!secretKey) {
    console.error('❌ Error: VK_APP_SECRET environment variable is not set.');
    console.error('Usage: VK_APP_SECRET="your_secret" node scripts/generate-vk-signature.js [vk_user_id]');
    process.exit(1);
}

// Construct standard VK parameters
const queryParams = {
    vk_app_id: '51778945', // example app ID
    vk_user_id: vkUserId,
    vk_locale: 'ru',
    vk_ts: Math.floor(Date.now() / 1000).toString(),
};

// Sort parameters alphabetically
const sortedKeys = Object.keys(queryParams).sort();
const queryString = sortedKeys.map(k => `${k}=${queryParams[k]}`).join('&');

// Compute HMAC-SHA256 signature
const sign = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest()
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=$/, '');

const fullLaunchParams = `${queryString}&sign=${sign}`;

console.log(`\n✅ Signed launch parameters successfully generated for VK ID: ${vkUserId}`);
console.log('\n--- LAUNCH PARAMS (use in query string or Vercel curl) ---');
console.log(fullLaunchParams);

console.log('\n--- EXAMPLE CURL (Verify signature endpoint) ---');
console.log(`curl "http://localhost:5173/api/verify-sign?${fullLaunchParams}"`);

console.log('\n--- EXAMPLE CURL (Load profile endpoint) ---');
console.log(`curl "http://localhost:5173/api/profile-load?userId=VK-${vkUserId}&launchParams=${encodeURIComponent(fullLaunchParams)}"\n`);
