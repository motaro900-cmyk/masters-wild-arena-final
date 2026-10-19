import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\3fa5557d-8dd5-40b9-9646-10f3c7c37e18\\qa_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runScenario(scenarioName, url, customActions = null) {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING SCENARIO: ${scenarioName}`);
  console.log(`🔗 URL: ${url}`);
  console.log(`======================================================`);

  const results = {
    scenario: scenarioName,
    url: url,
    startTime: Date.now(),
    durationMs: 0,
    networkRequests: [],
    networkErrors: [],
    network5xx: [],
    network4xx: [],
    corsErrors: [],
    consoleLogs: [],
    consoleErrors: [],
    pageErrors: [],
    finalTitle: '',
    finalUrl: '',
    domState: {},
    screenshots: []
  };

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
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

  try {
    const page = await browser.newPage();

    // Track requests and responses
    page.on('request', req => {
      // no-op, tracked on response/requestfailed
    });

    page.on('requestfailed', req => {
      const failure = req.failure();
      const errorText = failure?.errorText || 'Unknown';
      const item = {
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        error: errorText
      };
      results.networkErrors.push(item);
      if (errorText.toLowerCase().includes('cors')) {
        results.corsErrors.push(item);
      }
      console.log(`  ❌ [ReqFailed] ${req.method()} ${req.url()} -> ${errorText}`);
    });

    page.on('response', resp => {
      const status = resp.status();
      const url = resp.url();
      results.networkRequests.push({
        url,
        status,
        statusText: resp.statusText(),
        contentType: resp.headers()['content-type'] || '',
        resourceType: resp.request().resourceType()
      });

      if (status >= 500) {
        results.network5xx.push({ url, status, statusText: resp.statusText() });
        console.log(`  🔥 [HTTP ${status}] ${url}`);
      } else if (status >= 400) {
        results.network4xx.push({ url, status, statusText: resp.statusText() });
        console.log(`  ⚠️ [HTTP ${status}] ${url}`);
      }
    });

    page.on('console', msg => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      results.consoleLogs.push(entry);
      if (msg.type() === 'error') {
        results.consoleErrors.push(entry);
        console.log(`  🛑 [Console Error] ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        // console.log(`  ⚠️ [Console Warn] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      results.pageErrors.push(err.message);
      console.log(`  💥 [Page Crash / Error] ${err.message}`);
    });

    const startNav = Date.now();
    console.log(`⏱️ Navigating to ${url}...`);
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 }).catch(e => {
      console.warn(`  ⚠️ Navigation warning: ${e.message}`);
      return null;
    });

    results.durationMs = Date.now() - startNav;
    console.log(`⏱️ Initial navigation settled in ${results.durationMs}ms`);

    if (customActions) {
      await customActions(page, results);
    }

    results.finalTitle = await page.title();
    results.finalUrl = page.url();

    // Check DOM elements
    results.domState = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const hasNotInVk = bodyText.includes('Игра доступна только во ВКонтакте') || bodyText.includes('Вход ограничен');
      const hasGuestBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('ГОСТЬ'));
      const hasVkBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('ИГРАТЬ В ВК'));
      const hasCanvas = !!document.querySelector('canvas');
      const canvasSize = document.querySelector('canvas') ? {
        width: document.querySelector('canvas').width,
        height: document.querySelector('canvas').height
      } : null;
      const loadingBar = !!document.querySelector('.loading-bar, [class*="loading"], [class*="progress"]');
      const townIndicators = ['Казарма', 'Таверна', 'Арена', 'Кузница', 'Город', 'Экспедиция', 'Герои', 'Рюкзак', 'Золото']
        .filter(term => bodyText.includes(term));
      
      return {
        bodyTextSnippet: bodyText.slice(0, 300),
        hasNotInVk,
        hasGuestBtn,
        hasVkBtn,
        hasCanvas,
        canvasSize,
        loadingBar,
        townIndicators,
        allButtons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
      };
    });

  } catch (err) {
    console.error(`💥 Scenario ${scenarioName} encountered exception:`, err);
    results.fatalException = err.message;
  } finally {
    await browser.close();
  }

  return results;
}

async function runAllTests() {
  const allResults = [];

  // ==========================================================
  // SCENARIO 1: Direct navigation to https://mastersofthewild.ru
  // ==========================================================
  const res1 = await runScenario(
    'Scenario 1 - Direct Domain Access (Gatekeeper Screen)',
    'https://mastersofthewild.ru',
    async (page, results) => {
      await delay(3000);
      const ssPath = path.join(SCREENSHOT_DIR, '01_scenario1_gatekeeper.png');
      await page.screenshot({ path: ssPath, fullPage: false });
      results.screenshots.push(ssPath);
      console.log(`📸 Saved screenshot: ${ssPath}`);

      // Inspect elements on page
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.innerText);
      });
      console.log(`📋 Detected Buttons:`, buttons);
    }
  );
  allResults.push(res1);

  // ==========================================================
  // SCENARIO 2: Direct navigation with ?guest=1
  // ==========================================================
  const res2 = await runScenario(
    'Scenario 2 - Guest Mode Direct Launch (?guest=1)',
    'https://mastersofthewild.ru/?guest=1',
    async (page, results) => {
      console.log('⏳ Waiting for boot pipeline and asset preloading...');
      // Snapshot early boot (3 seconds)
      await delay(3000);
      const ssPathEarly = path.join(SCREENSHOT_DIR, '02_scenario2_early_loading.png');
      await page.screenshot({ path: ssPathEarly, fullPage: false });
      results.screenshots.push(ssPathEarly);
      console.log(`📸 Saved early loading screenshot: ${ssPathEarly}`);

      // Wait for game transition (up to 12 more seconds)
      console.log('⏳ Waiting for transition to game town / canvas...');
      let loaded = false;
      for (let i = 0; i < 12; i++) {
        await delay(1000);
        const state = await page.evaluate(() => {
          const text = document.body.innerText || '';
          const hasCanvas = !!document.querySelector('canvas');
          const isNotInTown = text.includes('Загрузка') || text.includes('Loading');
          return { hasCanvas, textLength: text.length, isNotInTown, snippet: text.slice(0, 150) };
        });
        if (state.hasCanvas && !state.isNotInTown) {
          console.log(`🎮 Game canvas detected at ${i + 4}s! DOM snippet: ${state.snippet.replace(/\n/g, ' ')}`);
          loaded = true;
          break;
        }
      }

      // Final settled screenshot
      await delay(2000);
      const ssPathTown = path.join(SCREENSHOT_DIR, '02_scenario2_game_settled.png');
      await page.screenshot({ path: ssPathTown, fullPage: false });
      results.screenshots.push(ssPathTown);
      console.log(`📸 Saved settled game screenshot: ${ssPathTown}`);
    }
  );
  allResults.push(res2);

  // ==========================================================
  // SCENARIO 3: Emulation of VK Launch Parameters
  // ==========================================================
  const res3 = await runScenario(
    'Scenario 3 - VK Launch Emulation (vk_app_id, vk_user_id, vk_platform)',
    'https://mastersofthewild.ru/?vk_app_id=54585995&vk_user_id=212359386&vk_platform=desktop_web',
    async (page, results) => {
      console.log('⏳ Waiting for VK verification and boot handling...');
      await delay(4000);
      const ssPathEarly = path.join(SCREENSHOT_DIR, '03_scenario3_early.png');
      await page.screenshot({ path: ssPathEarly, fullPage: false });
      results.screenshots.push(ssPathEarly);
      console.log(`📸 Saved VK early screenshot: ${ssPathEarly}`);

      // Wait up to 10 more seconds
      await delay(6000);
      const ssPathSettled = path.join(SCREENSHOT_DIR, '03_scenario3_settled.png');
      await page.screenshot({ path: ssPathSettled, fullPage: false });
      results.screenshots.push(ssPathSettled);
      console.log(`📸 Saved VK settled screenshot: ${ssPathSettled}`);
    }
  );
  allResults.push(res3);

  // Save report to JSON file
  const reportPath = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\3fa5557d-8dd5-40b9-9646-10f3c7c37e18\\qa_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2), 'utf8');
  console.log(`\n📄 Complete QA JSON report written to: ${reportPath}`);
}

runAllTests().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
