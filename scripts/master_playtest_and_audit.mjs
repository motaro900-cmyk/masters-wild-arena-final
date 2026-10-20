import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const OUT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\b4081e1a-6d0b-4929-8e99-907ce2b4f2ae\\playtest_shots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const REPORT_FILE = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\b4081e1a-6d0b-4929-8e99-907ce2b4f2ae\\master_playtest_data.json';
const TARGET_URL = 'https://mastersofthewild.ru/?guest=1';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🎮 Launching Masters of the Wild Playtest & In-Depth Audit...');
  console.log(`🌐 Target: ${TARGET_URL}`);
  console.log(`🖥️ Browser: ${BROWSER_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--ignore-gpu-blocklist',
      '--window-size=1440,900'
    ],
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const networkErrors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log(`  [Console Error] ${msg.text()}`);
    }
  });

  page.on('requestfailed', req => {
    networkErrors.push({ url: req.url(), error: req.failure()?.errorText });
  });

  try {
    console.log('⏳ Navigating to game...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    await delay(3000);

    // 1. Initial State Screenshot (Loading / Intro / Main)
    await page.screenshot({ path: path.join(OUT_DIR, '01_initial_landing.png') });
    console.log('📸 01_initial_landing.png captured');

    // Check if Intro Screen or Nickname Screen is visible
    const pageState = await page.evaluate(() => {
      const intro = document.querySelector('[class*="Intro"], [class*="intro"]');
      const nicknameInput = document.querySelector('input[type="text"]');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const store = window.useGameStore ? window.useGameStore.getState() : null;
      return {
        hasIntro: !!intro,
        hasNickname: !!nicknameInput,
        buttonTexts: buttons,
        storeActiveScreen: store ? store.activeScreen : 'UNKNOWN',
        storeData: store ? {
          gold: store.gold,
          crystals: store.crystals,
          energy: store.energy,
          level: store.level,
          name: store.name,
          hero: store.selectedHero || store.currentHeroId
        } : null
      };
    });
    console.log('📊 Page State:', JSON.stringify(pageState, null, 2));

    // If skip intro button exists, click it
    await page.evaluate(() => {
      const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ПРОПУСТИТЬ') || b.textContent.includes('Пропустить'));
      if (skipBtn) skipBtn.click();
    });
    await delay(1500);

    // If on nickname selection, enter name and accept consent
    const enteredName = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = 'Варкрафтер_2026';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Check checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // Click submit / start button
        const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('НАЧАТЬ') || b.textContent.includes('В бой') || b.textContent.includes('ПРОДОЛЖИТЬ') || b.textContent.includes('СОХРАНИТЬ')
        );
        if (startBtn) startBtn.click();
        return true;
      }
      return false;
    });

    if (enteredName) {
      console.log('✍️ Nickname entered and consent checked');
      await delay(3000);
    }

    // 2. Main City Hub Screenshot
    await page.screenshot({ path: path.join(OUT_DIR, '02_city_hub.png') });
    console.log('📸 02_city_hub.png captured');

    // 3. Open Heroes Window (ГЕРОИ)
    await page.evaluate(() => {
      const heroesBtn = Array.from(document.querySelectorAll('button, div')).find(b => b.textContent.trim() === 'ГЕРОИ');
      if (heroesBtn) heroesBtn.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '03_heroes_window.png') });
    console.log('📸 03_heroes_window.png captured');

    // 4. Open Inventory Window (ИНВЕНТАРЬ)
    await page.evaluate(() => {
      const invBtn = Array.from(document.querySelectorAll('button, div')).find(b => b.textContent.trim() === 'ИНВЕНТАРЬ');
      if (invBtn) invBtn.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '04_inventory_window.png') });
    console.log('📸 04_inventory_window.png captured');

    // 5. Open Shop Window (МАГАЗИН)
    await page.evaluate(() => {
      const shopBtn = Array.from(document.querySelectorAll('button, div')).find(b => b.textContent.trim() === 'МАГАЗИН');
      if (shopBtn) shopBtn.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '05_shop_window.png') });
    console.log('📸 05_shop_window.png captured');

    // 6. Close Shop / Return to City Hub
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('В ГОРОД') || b.textContent.includes('В ЛАГЕРЬ') || b.textContent.includes('✕') || b.textContent.includes('НАЗАД')
      );
      if (closeBtn) closeBtn.click();
    });
    await delay(1200);

    // 7. Click on Battle / Arena (РАЗМИНКА or РЕЙТИНГОВЫЙ БОЙ)
    await page.evaluate(() => {
      const battleBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('РАЗМИНКА') || b.textContent.includes('РЕЙТИНГОВЫЙ БОЙ') || b.textContent.includes('В БОЙ')
      );
      if (battleBtn) battleBtn.click();
    });
    await delay(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '06_pre_battle_comparison.png') });
    console.log('📸 06_pre_battle_comparison.png captured');

    // 8. Start Battle
    await page.evaluate(() => {
      const startFightBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('НАЧАТЬ БОЙ') || b.textContent.includes('В БОЙ!')
      );
      if (startFightBtn) startFightBtn.click();
    });
    await delay(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '07_battle_arena_active.png') });
    console.log('📸 07_battle_arena_active.png captured');

    // Wait for battle turns or outcome
    await delay(6000);
    await page.screenshot({ path: path.join(OUT_DIR, '08_battle_result.png') });
    console.log('📸 08_battle_result.png captured');

    // Collect DOM and Performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] || {};
      const fpsEstimate = window.__fps || 60;
      const store = window.useGameStore ? window.useGameStore.getState() : null;
      return {
        loadTimeMs: timing.duration || 0,
        domInteractiveMs: timing.domInteractive || 0,
        fpsEstimate,
        finalStoreState: store ? {
          gold: store.gold,
          crystals: store.crystals,
          energy: store.energy,
          level: store.level,
          name: store.name,
          activeScreen: store.activeScreen
        } : null
      };
    });

    const report = {
      timestamp: new Date().toISOString(),
      targetUrl: TARGET_URL,
      pageState,
      performanceMetrics,
      consoleErrors: consoleMessages.filter(m => m.type === 'error'),
      networkErrors
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
    console.log('✅ Master Playtest execution complete! Report saved.');

  } catch (err) {
    console.error('❌ Playtest error:', err);
  } finally {
    await browser.close();
    console.log('🧹 Browser closed.');
  }
}

main();
