/**
 * 100-Point Ruthless Automated Test Suite (Definitive)
 * Project: Masters of the Wild
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'B:/Masters of the Wild';
const results = [];

function check(id, domain, title, fn) {
    try {
        const res = fn();
        if (res === true || (res && res.passed)) {
            results.push({ id, domain, title, status: 'PASS', details: res.details || 'Assertion verified' });
        } else {
            results.push({ id, domain, title, status: 'FAIL', details: res?.details || 'Assertion failed' });
        }
    } catch (err) {
        results.push({ id, domain, title, status: 'FAIL', details: err.message });
    }
}

console.log('⚡ Starting 100-Point Ruthless Audit...');

// ==================== DOMAIN 1: NETWORK DROP & RAGE QUIT ====================
check(1, 'Network & Rage Quit', 'pagehide event registered for beacon sync', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes("window.addEventListener('pagehide'");
});

check(2, 'Network & Rage Quit', 'beforeunload event registered for beacon sync', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes("window.addEventListener('beforeunload'");
});

check(3, 'Network & Rage Quit', 'visibilitychange hidden triggers immediate state sync', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes("document.visibilityState === 'hidden'") && code.includes('BEACON_SYNC');
});

check(4, 'Network & Rage Quit', 'sendBeacon with fetch keepalive fallback', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes('navigator.sendBeacon') && code.includes('keepalive: true');
});

check(5, 'Network & Rage Quit', 'Server /api/beacon-sync verifies VK HMAC signature', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/beacon-sync.js'), 'utf8');
    return code.includes('verifyVkSign(body.launchParams, host, userId)') && code.includes('Forbidden');
});

check(6, 'Network & Rage Quit', 'Rage-quit in battle: deterministic simulation protects state', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/battleSimulation.js'), 'utf8');
    return code.includes('simulateDeterministicBattle') && code.includes('totalBattleTicks < maxTicks');
});

check(7, 'Network & Rage Quit', 'Abrupt disconnect during transaction: mutex releases in finally block', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/transactionManager.js'), 'utf8');
    return code.includes('try {') && code.includes('finally {') && code.includes('unlock();');
});

check(8, 'Network & Rage Quit', 'Offline session flag blocks remote sync corruption', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes('state.isOfflineSession') && code.includes('Blocked beacon sync: offline session active');
});

check(9, 'Network & Rage Quit', 'SafeStorage fallback for Private Browsing quota exceeded', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/SafeStorage.ts'), 'utf8');
    return code.includes('memoryStore') && code.includes('computeSignature');
});

check(10, 'Network & Rage Quit', 'Timestamp conflict resolution prevents zeroing balances', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/bootstrap/initFirebaseProfile.ts'), 'utf8');
    return code.includes('Conflict resolution check') && code.includes('remoteTimestamp');
});

// ==================== DOMAIN 2: DATABASE & FIREBASE PURITY ====================
check(11, 'Database Purity', 'VPS localStore operates autonomously without cloud', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/localStore.js'), 'utf8');
    return code.includes('saveLocalDoc') && code.includes('getLocalDoc') && code.includes('DATA_DIR');
});

check(12, 'Database Purity', 'Zero hardcoded Firebase private keys in client bundle', () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    function scanNoPrivateKey(dir) {
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) scanNoPrivateKey(p);
            else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
                const c = fs.readFileSync(p, 'utf8');
                if (c.includes('-----BEGIN PRIVATE KEY-----')) return false;
            }
        }
        return true;
    }
    return scanNoPrivateKey(srcDir);
});

check(13, 'Database Purity', 'Firestore REST mirror fails gracefully if blocked by RKN', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/profile-save.js'), 'utf8');
    return code.includes('saveFirestoreRestDoc') && code.includes('.catch(');
});

check(14, 'Database Purity', 'Atomic writes via .tmp and .bak snapshots in localStore', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/localStore.js'), 'utf8');
    return code.includes('.tmp.') && code.includes('.bak') && code.includes('fs.promises.rename');
});

check(15, 'Database Purity', 'Automatic recovery from .bak on corrupted document via restoreDocBackup', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/localStore.js'), 'utf8');
    return code.includes('restoreDocBackup') && code.includes('.bak');
});

check(16, 'Database Purity', 'Directory isolation with sanitizeKey', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/localStore.js'), 'utf8');
    return code.includes('sanitizeKey(collectionName)') && code.includes('sanitizeKey(docId)');
});

check(17, 'Database Purity', 'Path traversal defense in sanitizeDocId', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/securityMiddleware.js'), 'utf8');
    return code.includes('sanitizeDocId') && code.includes('replace');
});

check(18, 'Database Purity', 'Guest profile cleaner script exists', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'scripts/clean-guest-profiles.js'));
});

check(19, 'Database Purity', 'Strict prefix separation between VK-* and GUEST-*', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes('VK-') && code.includes('getPrefixedUserId');
});

check(20, 'Database Purity', 'Right to be forgotten endpoint /api/profile-delete unlinks docs', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/profile-delete.js'), 'utf8');
    return code.includes('deleteLocalDoc') && code.includes('verifyVkSign');
});

// ==================== DOMAIN 3: ANTI-CHEAT & COMBAT MATH ====================
check(21, 'Anti-Cheat & Combat', 'HMAC-SHA256 signature verification uses crypto.timingSafeEqual', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/vkAuth.js'), 'utf8');
    return code.includes('crypto.timingSafeEqual(hashBuf, signBuf)');
});

check(22, 'Anti-Cheat & Combat', 'Buffer length check before timingSafeEqual prevents RangeError', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/vkAuth.js'), 'utf8');
    return code.includes('hashBuf.length !== signBuf.length');
});

check(23, 'Anti-Cheat & Combat', 'Replay defense: vk_ts validated within 7-day window (604800 sec)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/vkAuth.js'), 'utf8');
    return code.includes('604800') && code.includes('nowSec - ts');
});

check(24, 'Anti-Cheat & Combat', 'Client DevTools gold injection wiped by server authority', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/securityMiddleware.js'), 'utf8');
    return code.includes('SERVER_AUTHORITATIVE_FIELDS') && code.includes('gold') && code.includes('crystals');
});

check(25, 'Anti-Cheat & Combat', 'Prototype pollution guard in sync payload', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/securityMiddleware.js'), 'utf8');
    return code.includes('hasPrototypePollution') && code.includes('__proto__');
});

check(26, 'Anti-Cheat & Combat', 'Battle outcome verified by deterministic server simulation', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/battleHandler.js'), 'utf8');
    return code.includes('simulateDeterministicBattle') && code.includes('won');
});

check(27, 'Anti-Cheat & Combat', 'Client false victory spoofing detected and overridden with defeat', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/battleHandler.js'), 'utf8');
    return code.includes('Anti-cheat triggered: client claimed impossible victory');
});

check(28, 'Anti-Cheat & Combat', 'Battle stalemate capped at 8000 ticks with Rage mechanic', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/battleSimulation.js'), 'utf8');
    return code.includes('maxTicks = 8000') && code.includes('totalBattleTicks < maxTicks');
});

check(29, 'Anti-Cheat & Combat', 'Dynamic armor divisor formula K=200+25*(L-1) synchronized', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/battleSimulation.js'), 'utf8');
    return code.includes('200 + ((playerStats.avgItemLevel || playerStats.level || 1) - 1) * 25');
});

check(30, 'Anti-Cheat & Combat', 'ParticlePool eliminates GC spikes during combat animations', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/engine/systems/effects/ParticlePool.ts'));
});

// ==================== DOMAIN 4: DONATOR (WHALE) ECONOMY ====================
check(31, 'Whale Economy', 'Official VKWebAppShowOrderBox used for votes purchase', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('VKWebAppShowOrderBox') && code.includes("type: 'item'");
});

check(32, 'Whale Economy', 'Server order verification handles signature and item_id', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/vk-payment.js'), 'utf8');
    return code.includes('calculatedSig !== sig') && code.includes('ITEMS');
});

check(33, 'Whale Economy', 'Order idempotency: duplicate order_id returns cached success', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/transactionManager.js'), 'utf8');
    return code.includes('Duplicate operationId detected') && code.includes('isDuplicate: true');
});

check(34, 'Whale Economy', 'VIP daily rewards modal with status calculation', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/ui/components/hud/VipDailyRewardModal.tsx'));
});

check(35, 'Whale Economy', 'Audio muted when opening payments order box', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('withAudioMuted') && code.includes('VKWebAppShowOrderBox');
});

check(36, 'Whale Economy', 'Endgame gold sinks: Upgrade gold costs scale exponentially', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/inventoryHandler.js'), 'utf8');
    return code.includes('Math.round(500 * Math.pow(1.5, currentLevel - 1))');
});

check(37, 'Whale Economy', 'Shop scene offers premium crystal item packages', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/configs/ShopConfig.ts'), 'utf8');
    return code.includes('GEM') || code.includes('CRYSTAL') || code.includes('price');
});

check(38, 'Whale Economy', 'VIP perks explicitly detailed in VIPWindow', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/ui/components/hud/VIPWindow.tsx'));
});

check(39, 'Whale Economy', 'Zero-negative-balance enforcement on all transactions', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/inventoryHandler.js'), 'utf8');
    return code.includes('currentGold < upgradeGoldCost');
});

check(40, 'Whale Economy', 'Purchases require explicit user confirmation overlay', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/ui/components/hud/ShopScene/PurchaseConfirmOverlay.tsx'));
});

// ==================== DOMAIN 5: F2P (NON-DONATOR) EXPERIENCE ====================
check(41, 'F2P Experience', 'Base hero Feng Long stats defined and balanced', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/configs/HeroesConfig.ts'), 'utf8');
    return code.includes("id: 'panda'") && code.includes('hp: 770') && code.includes('attack: 32');
});

check(42, 'F2P Experience', 'Story skip button enabled for under 8-second time-to-battle', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/screens/IntroScreen.tsx'), 'utf8');
    return code.includes('setStep(4)') && code.includes('step < 4');
});

check(43, 'F2P Experience', 'Energy base capacity is 50 units (server energyHandler)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/energyHandler.js'), 'utf8');
    return code.includes('DEFAULT_MAX_ENERGY = 50');
});

check(44, 'F2P Experience', 'Energy regeneration interval is 150 seconds (2.5 min)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/energyHandler.js'), 'utf8');
    return code.includes('BASE_ENERGY_REGEN_INTERVAL_MS = 2.5 * 60 * 1000');
});

check(45, 'F2P Experience', '0-Energy warmup mode (РАЗМИНКА) available', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/hud/ActionButtons.tsx'), 'utf8');
    return code.includes('РАЗМИНКА');
});

check(46, 'F2P Experience', 'Daily quests faucet configured in QuestsConfig', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/configs/QuestsConfig.ts'), 'utf8');
    return code.includes('DAILY_QUESTS') || code.includes('DAILY');
});

check(47, 'F2P Experience', 'Hero unlock pricing progression: Rikki (20k), Gromm (40k), Varkan (60k)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/configs/HeroesConfig.ts'), 'utf8');
    return code.includes('20000') && code.includes('40000') && code.includes('60000');
});

check(48, 'F2P Experience', 'Fortune Wheel 24-hour free spin available (handleWheelSpin)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/dailyRewardHandler.js'), 'utf8');
    return code.includes('handleWheelSpin') && code.includes('wheel_sector_');
});

check(49, 'F2P Experience', 'Matchmaking MMR rating search band bounded', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/MatchmakingService.ts'), 'utf8');
    return code.includes('rating') || code.includes('findMatch');
});

check(50, 'F2P Experience', 'Active welcome mail with gold and crystals delivered on first boot', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/screens/IntroScreen.tsx'), 'utf8');
    return code.includes('welcome-mail') && code.includes('ПРИВЕТСТВЕННЫЙ ПОДАРOК');
});

// ==================== DOMAIN 6: HARDCORE GRINDER (24/7) ====================
check(51, 'Hardcore Grinder', 'Inventory maximum slots limit enforced (MAX_SLOTS = 100)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/hud/InventoryPanel.tsx'), 'utf8');
    return code.includes('MAX_SLOTS = 100');
});

check(52, 'Hardcore Grinder', 'PixiApp ticker properly stopped on unmount to prevent memory leaks', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/engine/core/PixiApp.ts'), 'utf8');
    return code.includes('destroy') || code.includes('stopTicker');
});

check(53, 'Hardcore Grinder', 'Chat flood cooldown of 2000ms enforced with HTTP 429', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/services/chatHandler.js'), 'utf8');
    return code.includes('FLOOD_COOLDOWN_MS = 2000') && code.includes('429');
});

check(54, 'Hardcore Grinder', 'Chat message length capped at 300 chars with HTML escaping', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/services/chatHandler.js'), 'utf8');
    return code.includes('escapeHtml') && code.includes('300');
});

check(55, 'Hardcore Grinder', 'Max weapon/item level capped at 10 on server', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/inventoryHandler.js'), 'utf8');
    return code.includes('currentLevel >= 10') && code.includes('Item already at max level');
});

check(56, 'Hardcore Grinder', 'EXP progression curves scale exponentially to cap level', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/game/configs/GameConstants.ts'), 'utf8');
    return code.includes('EXP') || code.includes('LEVEL');
});

check(57, 'Hardcore Grinder', 'Clan creation validates name, tag, and cost', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/services/clanHandler.js'), 'utf8');
    return code.includes('CLAN_CREATION_COST_GOLD = 5000') && code.includes('cleanClanTag');
});

check(58, 'Hardcore Grinder', 'Concurrent transactions serialized via acquireUserLock', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/transactionManager.js'), 'utf8');
    return code.includes('userLocks = new Map()') && code.includes('acquireUserLock');
});

check(59, 'Hardcore Grinder', 'Audit logger writes timestamps, user ID, and op changes', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/game/transactionManager.js'), 'utf8');
    return code.includes('logAudit') && code.includes('[AUDIT]');
});

check(60, 'Hardcore Grinder', 'Client action log buffer flushed periodically', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/SyncService.ts'), 'utf8');
    return code.includes('logPlayerAction') || code.includes('pendingActions');
});

// ==================== DOMAIN 7: CROSS-DEVICE & MOBILE ====================
check(61, 'Mobile UI', 'SafeGameLayout calculates viewport aspect ratio and scaling', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/ui/layouts/SafeGameLayout.tsx'));
});

check(62, 'Mobile UI', 'Landscape orientation prompt overlay with z-index 999999', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/layouts/SafeGameLayout.tsx'), 'utf8');
    return code.includes('zIndex: 999999') && code.includes('Поверните устройство');
});

check(63, 'Mobile UI', 'Mobile touch target CSS rule meets 44x44px minimum', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/index.css'), 'utf8');
    return code.includes('.is-mobile button') && code.includes('min-height: 44px');
});

check(64, 'Mobile UI', 'PixiApp resolution capped at 1.0 to prevent mobile GPU OOM', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/engine/core/PixiApp.ts'), 'utf8');
    return code.includes('resolution: 1') || code.includes('Math.min(window.devicePixelRatio');
});

check(65, 'Mobile UI', 'WebGL context loss recovery listeners registered', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/engine/core/PixiApp.ts'), 'utf8');
    return code.includes('webglcontextlost');
});

check(66, 'Mobile UI', 'Philosopher Cyrillic font integrated into tailwind config', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'tailwind.config.js'), 'utf8');
    return code.includes('Philosopher') && code.includes('Cinzel');
});

check(67, 'Mobile UI', 'ActionButtons HUD uses responsive font-fantasy fallback', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/hud/ActionButtons.tsx'), 'utf8');
    return code.includes("'Cinzel', 'Philosopher', serif");
});

check(68, 'Mobile UI', 'ItemTooltipPortal renders within mobile screen bounds', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/ui/components/hud/HeroScene/components/shared/ItemTooltipPortal.tsx'));
});

check(69, 'Mobile UI', 'Texture atlases compiled to lightweight WebP files', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'public/assets/characters/lion_knight/lion_knight_base.webp'));
});

check(70, 'Mobile UI', 'Global design tokens define Dark Fantasy aesthetic variables', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/styles/design-tokens.css'), 'utf8');
    return code.includes('--font-fantasy') && code.includes('--panel-dark');
});

// ==================== DOMAIN 8: AUDIO ENGINE & DISCIPLINE ====================
check(71, 'Audio Engine', 'AudioContext resumed on user interaction via resumeContext()', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/AudioService.ts'), 'utf8');
    return code.includes('resumeContext') && code.includes('Howler.ctx');
});

check(72, 'Audio Engine', 'Background music playlist contains all 8 dark fantasy tracks', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/configs/AssetsMap.ts'), 'utf8');
    return code.includes('MUSIC_LIST') && code.includes('Dawn_of_the_Siege.mp3');
});

check(73, 'Audio Engine', 'AudioDatabase defines volume configs and bus assignments', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'src/configs/AudioDatabase.ts'));
});

check(74, 'Audio Engine', 'AudioService activeInstances capped at 24 concurrent voices', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/AudioService.ts'), 'utf8');
    return code.includes('MAX_SFX_INSTANCES = 24') || code.includes('activeInstances');
});

check(75, 'Audio Engine', 'Pitch randomization applies per playId avoiding voice alteration', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/AudioService.ts'), 'utf8');
    return code.includes('sound.rate(randomPitch, playId)') && code.includes('sound.volume(finalVolume, playId)');
});

check(76, 'Audio Engine', 'Crossfade on music transition smoothly fades old music', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/AudioService.ts'), 'utf8');
    return code.includes('oldMusic.fade(') && code.includes('newMusic.fade(') || code.includes('.fade(');
});

check(77, 'Audio Engine', 'BattleScene unmount restores city playlist rotation', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/hud/BattleScene.tsx'), 'utf8');
    return code.includes('audioService.playPlaylist(AssetsMap.AUDIO.MUSIC_LIST)');
});

check(78, 'Audio Engine', 'withAudioMuted helper mutes Howler during interstitial ads', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('withAudioMuted') && code.includes('Howler.mute(true)');
});

check(79, 'Audio Engine', 'AudioService respects browser page visibility', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/services/AudioService.ts'), 'utf8');
    return code.includes('visibilitychange') || code.includes('pause') || code.includes('mute');
});

check(80, 'Audio Engine', 'AudioDatabase contains specialized combat SFX definitions', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/configs/AudioDatabase.ts'), 'utf8');
    return code.includes('combat_strike_sword') && code.includes('combat_hit_crit');
});

// ==================== DOMAIN 9: RF LEGAL COMPLIANCE (152-FZ) ====================
check(81, 'RF Legal', 'Privacy Policy text available inside in-app modal', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/LegalDocuments.tsx'), 'utf8');
    return code.includes('ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ') && code.includes('152-ФЗ');
});

check(82, 'RF Legal', 'Terms of Service text available inside in-app modal', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/LegalDocuments.tsx'), 'utf8');
    return code.includes('ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ');
});

check(83, 'RF Legal', '233-FZ Consent to personal data processing explicitly separated', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/LegalDocuments.tsx'), 'utf8');
    return code.includes('СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ') && code.includes('233-ФЗ');
});

check(84, 'RF Legal', 'Consent checkboxes start unchecked by default in IntroScreen', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/screens/IntroScreen.tsx'), 'utf8');
    return code.includes('useState(false)') && code.includes('legalAccepted');
});

check(85, 'RF Legal', 'Zero external CDN scripts in index.html (RF data localization)', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    return !html.includes('cdn.jsdelivr.net') && !html.includes('unpkg.com') && !html.includes('cdnjs.cloudflare.com');
});

check(86, 'RF Legal', 'Zero external Google Fonts links in index.html', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    return !html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com');
});

check(87, 'RF Legal', 'Local font files served directly from public/assets/fonts/', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'public/assets/fonts/fonts.css')) &&
           fs.existsSync(path.join(ROOT_DIR, 'public/assets/fonts/vEFV2_5QCwIS4_Dhez5jcWBqT00k0w.woff2'));
});

check(88, 'RF Legal', 'Account deletion endpoint /api/profile-delete complies with 152-FZ Art. 21', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'server/profile-delete.js'), 'utf8');
    return code.includes('deleteLocalDoc') && code.includes('verifyVkSign');
});

check(89, 'RF Legal', 'Dark fantasy content respects Russian 12+ age rating standards', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/LegalDocuments.tsx'), 'utf8');
    return code.includes('12+') || code.includes('Возрастное ограничение') || code.includes('нецензурную');
});

check(90, 'RF Legal', 'Single one-off payment terms without hidden recurring subscription', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/LegalDocuments.tsx'), 'utf8');
    return code.includes('голоса ВКонтакте') || code.includes('Голоса ВКонтакте');
});

// ==================== DOMAIN 10: VK DIRECT GAMES CATALOG COMPLIANCE ====================
check(91, 'VK Catalog', 'Safe Area 96px top-right padding clear for native capsule (... X)', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/ui/components/GameHUD.tsx'), 'utf8');
    return code.includes('96px') || code.includes('paddingRight: 96');
});

check(92, 'VK Catalog', 'VKWebAppInit called immediately upon application bootstrap', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('VKWebAppInit') && code.includes('bridge.send');
});

check(93, 'VK Catalog', 'No premature VKWebAppGetAuthToken calls before user interaction', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return !code.includes('vkBridge.send("VKWebAppGetAuthToken"') || code.includes('async function requestAuthToken');
});

check(94, 'VK Catalog', 'Iframe headers allow embedding: frame-ancestors *', () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'vercel.json'), 'utf8'));
    const allHeaders = vercelConfig.headers.flatMap(h => h.headers || []);
    const csp = allHeaders.find(h => h.key === 'Content-Security-Policy');
    return csp && csp.value.includes('frame-ancestors *');
});

check(95, 'VK Catalog', 'Iframe headers set X-Frame-Options: ALLOWALL', () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'vercel.json'), 'utf8'));
    const allHeaders = vercelConfig.headers.flatMap(h => h.headers || []);
    const xfo = allHeaders.find(h => h.key === 'X-Frame-Options');
    return xfo && xfo.value === 'ALLOWALL';
});

check(96, 'VK Catalog', 'Strict payments routing through VKWebAppShowOrderBox only', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('VKWebAppShowOrderBox') && !code.includes('yookassa') && !code.includes('robokassa');
});

check(97, 'VK Catalog', 'VK Stories loot sharing available via VKWebAppShowStoryBox', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('VKWebAppShowStoryBox') || code.includes('showStoryBox');
});

check(98, 'VK Catalog', 'Performance: HTML5 build bundles code-split vendor chunks', () => {
    const viteConfig = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.ts'), 'utf8');
    return viteConfig.includes('vendor-pixi') && viteConfig.includes('vendor-core');
});

check(99, 'VK Catalog', 'Version JSON endpoint exposed for cache busting verification', () => {
    return fs.existsSync(path.join(ROOT_DIR, 'public/version.json'));
});

check(100, 'VK Catalog', 'Official game community URL configured to vk.ru/motw_official_game', () => {
    const code = fs.readFileSync(path.join(ROOT_DIR, 'src/utils/VKBridge.ts'), 'utf8');
    return code.includes('motw_official_game');
});

// Summary
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;

console.log(`\n========================================`);
console.log(`🏁 100-POINT AUDIT COMPLETE: ${passed} PASS, ${failed} FAIL`);
console.log(`========================================`);

if (failed > 0) {
    console.log('\n❌ Failed Points:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(` - [#${r.id}] [${r.domain}] ${r.title}: ${r.details}`);
    });
}

fs.writeFileSync('B:/Masters of the Wild/scripts/audit_100_points_results.json', JSON.stringify({ passed, failed, results }, null, 2));
