import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\d8c21881-0852-4cd7-b2a3-ed9ce83e6efc\\qa_deep_dive';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const REPORT_PATH = path.join(OUT_DIR, 'adversarial_report.json');
const TARGET_URL = 'http://localhost:5173/?guest=1';

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runAdversarialAudit() {
  console.log('🧪 Starting Adversarial QA Deep Dive Audit on Masters of the Wild...');

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const findings = {
    test1_boot_and_ready: false,
    test2_error_boundary_behavior: {},
    test3_sentry_presence: {},
    test4_network_drop_handling: {},
    test5_pixi_ticker_and_fps: {},
    test6_webgl_context_loss: {},
    uncaughtExceptions: []
  };

  try {
    const page = await browser.newPage();

    page.on('pageerror', err => {
      console.log('  💥 [PageError caught]', err.message);
      findings.uncaughtExceptions.push({ type: 'pageerror', message: err.message });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        findings.uncaughtExceptions.push({ type: 'console.error', text: msg.text() });
      }
    });

    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      if (url.includes('telegram.org')) {
        console.log('  ⚠️ Intercepted and blocked hanging external script:', url);
        req.abort();
      } else {
        req.continue();
      }
    });

    // 1. Boot to Ready
    console.log('1. Loading game at', TARGET_URL);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('  Page loaded (domcontentloaded). Waiting for BootController / DOM...');
    await delay(5000);

    // Check BootController status
    const bootReady = await page.evaluate(async () => {
      if (window.bootController) {
        return window.bootController.getState() === 'READY';
      }
      return false;
    });
    findings.test1_boot_and_ready = bootReady;
    console.log('  ✅ BootController status READY:', bootReady);

    const ssBoot = path.join(OUT_DIR, '01_game_ready.png');
    await page.screenshot({ path: ssBoot });

    // 2. Pixi Ticker & FPS Stability
    console.log('2. Checking Pixi Ticker and FPS stability...');
    const fpsStats = await page.evaluate(async () => {
      return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        function count() {
          frames++;
          if (performance.now() - start < 1000) {
            requestAnimationFrame(count);
          } else {
            const duration = (performance.now() - start) / 1000;
            const canvas = document.querySelector('canvas');
            resolve({
              measuredFps: Math.round(frames / duration),
              canvasPresent: !!canvas,
              canvasWidth: canvas?.width,
              canvasHeight: canvas?.height
            });
          }
        }
        requestAnimationFrame(count);
      });
    });
    findings.test5_pixi_ticker_and_fps = fpsStats;
    console.log('  📊 Pixi Canvas & FPS:', fpsStats);

    // 3. Sentry Presence & Telemetry
    console.log('3. Checking Sentry / Telemetry...');
    const sentryInfo = await page.evaluate(() => {
      const g = window;
      return {
        hasSentryGlobal: !!g.__SENTRY__,
        sentryScope: !!g.__SENTRY__?.hub || !!g.__SENTRY__?.getCurrentScope,
        isSentryLoaded: !!g.__SENTRY_RELEASE__ || !!g.__SENTRY__
      };
    });
    findings.test3_sentry_presence = sentryInfo;
    console.log('  🛡️ Sentry status:', sentryInfo);

    // 4. Network Drop Simulation
    console.log('4. Simulating abrupt offline network drop (page.setOfflineMode(true))...');
    await page.setOfflineMode(true);
    await delay(2000);

    // Attempt actions while completely offline
    const offlineActionResults = await page.evaluate(async () => {
      try {
        const store = window.useGameStore?.getState();
        if (!store) return { error: 'No useGameStore' };

        // Test store operation while offline
        const prevScreen = store.activeScreen;
        store.setActiveScreen('HEROES');
        const newScreen = window.useGameStore?.getState()?.activeScreen;

        return {
          prevScreen,
          newScreen,
          offlineHandledCleanly: newScreen === 'HEROES'
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    findings.test4_network_drop_handling = offlineActionResults;
    console.log('  🔌 Offline actions result:', offlineActionResults);

    const ssOffline = path.join(OUT_DIR, '02_offline_heroes.png');
    await page.screenshot({ path: ssOffline });

    // Restore network
    await page.setOfflineMode(false);
    await delay(1000);

    // 5. WebGL Context Loss Recovery
    console.log('5. Testing WebGL Context Loss Simulation...');
    const contextLossTest = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { error: 'No WebGL context' };

      const ext = gl.getExtension('WEBGL_lose_context');
      if (!ext) {
        return { note: 'WEBGL_lose_context extension not available in headless' };
      }

      ext.loseContext();
      return { triggered: true };
    });
    findings.test6_webgl_context_loss = contextLossTest;
    console.log('  ⚡ WebGL loseContext trigger:', contextLossTest);
    await delay(2000);

    const ssContextLoss = path.join(OUT_DIR, '03_after_context_loss.png');
    await page.screenshot({ path: ssContextLoss });

    // 6. Test ErrorBoundary Fallback UI
    console.log('6. Testing ErrorBoundary catch and recovery UI...');
    const errorBoundaryTrigger = await page.evaluate(() => {
      try {
        // Intentionally trigger a React rendering crash inside SafeGameLayout
        if (window.useGameStore) {
          // Setting an invalid activeScreen or corrupted property that causes a render fault
          window.useGameStore.setState({ activeScreen: '__CORRUPTED_CRASH_TEST__' });
          return { status: 'triggered' };
        }
        return { status: 'store_unavailable' };
      } catch (e) {
        return { status: 'threw_early', error: e.message };
      }
    });
    await delay(1500);

    const domAfterCrash = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return {
        hasCrashMessage: text.includes('критическая ошибка') || text.includes('Перезагрузить'),
        hasReloadButton: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Перезагрузить')),
        bodyTextSnippet: text.slice(0, 200)
      };
    });
    findings.test2_error_boundary_behavior = {
      trigger: errorBoundaryTrigger,
      domAfterCrash
    };
    console.log('  🚨 ErrorBoundary DOM response:', domAfterCrash);

    const ssCrash = path.join(OUT_DIR, '04_error_boundary.png');
    await page.screenshot({ path: ssCrash });

  } catch (err) {
    console.error('Fatal in adversarial test:', err);
    findings.fatal = err.message;
  } finally {
    await browser.close();
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(findings, null, 2), 'utf8');
  console.log('📄 Adversarial Audit Report saved to:', REPORT_PATH);
}

runAdversarialAudit().catch(console.error);
