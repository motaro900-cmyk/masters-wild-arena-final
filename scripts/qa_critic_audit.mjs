import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const SCREENSHOT_DIR = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\43c7d10a-fc8d-4e6d-a743-fc41f539933e\\qa_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const REPORT_PATH = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\43c7d10a-fc8d-4e6d-a743-fc41f539933e\\qa_critic_results.json';
const GAME_URL = 'http://localhost:5173';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function inspectPageDOM(page, contextName) {
  return await page.evaluate((context) => {
    const issues = [];
    const allElements = Array.from(document.querySelectorAll('*'));

    // 1. Check for NaN, undefined, 0/0, null, [object Object]
    const suspiciousRegex = /(\bNaN\b|\bundefined\b|\bnull\b|\b0\/0\b|\[object\s+Object\])/i;
    for (const el of allElements) {
      if (el.children.length === 0 && el.textContent) {
        const text = el.textContent.trim();
        if (suspiciousRegex.test(text)) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            issues.push({
              type: 'DATA_GLITCH',
              context,
              text,
              tag: el.tagName,
              className: el.className,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            });
          }
        }
      }
    }

    // 2. Check for empty badges / stat labels where numbers are expected
    const statLabels = Array.from(document.querySelectorAll('[class*="badge"], [class*="stat"], [class*="count"], [class*="val"]'));
    for (const el of statLabels) {
      const text = el.textContent ? el.textContent.trim() : '';
      if (!text && el.offsetWidth > 0 && el.offsetHeight > 0) {
        issues.push({
          type: 'EMPTY_VALUE_LABEL',
          context,
          tag: el.tagName,
          className: el.className,
          rect: el.getBoundingClientRect()
        });
      }
    }

    // 3. Check for text truncation / overflow without ellipsis or overflowing containers
    for (const el of allElements) {
      if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 3) {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'hidden' && style.textOverflow !== 'ellipsis') {
          if (el.scrollWidth > el.clientWidth + 2) {
            issues.push({
              type: 'CLIPPED_TEXT_NO_ELLIPSIS',
              context,
              text: el.textContent.trim(),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              className: el.className
            });
          }
        }
      }
    }

    // 4. Check for overlapping interactive elements (buttons)
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input, select, a'));
    const visibleButtons = buttons.filter(b => {
      const rect = b.getBoundingClientRect();
      const style = window.getComputedStyle(b);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    });

    for (let i = 0; i < visibleButtons.length; i++) {
      for (let j = i + 1; j < visibleButtons.length; j++) {
        const b1 = visibleButtons[i];
        const b2 = visibleButtons[j];
        if (b1.contains(b2) || b2.contains(b1)) continue;

        const r1 = b1.getBoundingClientRect();
        const r2 = b2.getBoundingClientRect();

        const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
        const overlapArea = overlapX * overlapY;

        if (overlapArea > 100) { // More than 100 sq pixels overlapping
          issues.push({
            type: 'BUTTON_OVERLAP',
            context,
            btn1: { text: b1.innerText.trim().slice(0, 30), className: b1.className, rect: r1 },
            btn2: { text: b2.innerText.trim().slice(0, 30), className: b2.className, rect: r2 },
            overlapArea
          });
        }
      }
    }

    // 5. Check Touch Targets for mobile
    const smallTouchTargets = [];
    visibleButtons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      if ((rect.width < 32 || rect.height < 32) && !btn.closest('.debug, .fps-counter, .no-min-touch')) {
        smallTouchTargets.push({
          text: btn.innerText.trim().slice(0, 30),
          className: btn.className,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });

    // 6. Font audit (Check font family and if Russian text uses Latin-only font fallback)
    const fontIssues = [];
    const russianRegex = /[А-Яа-яЁё]/;
    const textElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, p, button, div')).filter(el => {
      return el.children.length === 0 && el.textContent && russianRegex.test(el.textContent);
    });

    for (const el of textElements.slice(0, 50)) { // Sample 50 text elements
      const style = window.getComputedStyle(el);
      const ff = style.fontFamily;
      // If font specifies Cinzel or Outfit without Cyrillic support and falls back to Times New Roman / Arial
      if (ff.includes('Cinzel') && !ff.includes('Philosopher') && !ff.includes('sans-serif')) {
        fontIssues.push({
          type: 'POSSIBLE_LATIN_ONLY_FONT',
          fontFamily: ff,
          sampleText: el.textContent.trim().slice(0, 30)
        });
      }
    }

    return {
      issues,
      smallTouchTargets: smallTouchTargets.slice(0, 10),
      fontIssues: fontIssues.slice(0, 5)
    };
  }, contextName);
}

async function runSession(viewportMode) {
  const isMobile = viewportMode === 'mobile';
  const width = isMobile ? 390 : 1440;
  const height = isMobile ? 844 : 900;

  console.log(`\n======================================================`);
  console.log(`🌐 STARTING AUDIT PASS: ${viewportMode.toUpperCase()} (${width}x${height})`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--ignore-gpu-blocklist',
      `--window-size=${width},${height}`
    ],
    defaultViewport: {
      width,
      height,
      isMobile,
      hasTouch: isMobile
    }
  });

  const sessionResults = {
    mode: viewportMode,
    width,
    height,
    consoleErrors: [],
    consoleWarns: [],
    pageErrors: [],
    domAudits: {},
    screenshots: {}
  };

  try {
    const page = await browser.newPage();

    if (isMobile) {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    }

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const loc = msg.location();
      if (type === 'error') {
        sessionResults.consoleErrors.push({ text, loc });
        console.log(`  ❌ [Console Error] ${text}`);
      } else if (type === 'warning') {
        sessionResults.consoleWarns.push({ text, loc });
      }
    });

    page.on('pageerror', err => {
      sessionResults.pageErrors.push(err.message);
      console.log(`  💥 [Page Error] ${err.message}`);
    });

    // 1. Initial Load
    console.log(`Connecting to ${GAME_URL}...`);
    await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 35000 });
    console.log(`Initial page loaded.`);

    // Wait for store
    await page.waitForFunction(() => typeof window.useGameStore !== 'undefined', { timeout: 25000 });
    await page.waitForFunction(() => window.bootController && window.bootController.getState() === 'READY', { timeout: 35000 });

    // Set stable QA state
    await page.evaluate(() => {
      window.useGameStore.setState({
        onboardingCompleted: true,
        activeScreen: 'MAIN_MENU',
        name: 'QA_Critic_Auditor',
        gold: 15420,
        crystals: 450,
        energy: 85,
        rating: 1250,
        trophies: 1250,
        level: 15,
        xp: 4500,
        maxXp: 10000,
        isMobile: false, // will adjust per run
      });
    });

    if (isMobile) {
      await page.evaluate(() => {
        window.useGameStore.setState({ isMobile: true });
        // Dismiss rotation overlay if present
        const buttons = Array.from(document.querySelectorAll('button'));
        const dismissBtn = buttons.find(b => b.textContent && b.textContent.includes('Играть в портретном'));
        if (dismissBtn) dismissBtn.click();
      });
    }

    await delay(2000);

    // SCREEN 1: MAIN MENU / CITY
    console.log('📸 1. Capturing MAIN SCREEN...');
    const mainSS = path.join(SCREENSHOT_DIR, `${viewportMode}_01_main_menu.png`);
    await page.screenshot({ path: mainSS, fullPage: false });
    sessionResults.screenshots.main_menu = mainSS;
    sessionResults.domAudits.main_menu = await inspectPageDOM(page, 'MAIN_MENU');

    // Specific check for mobile: Check if "В бой" button is visible and not occluded
    if (isMobile) {
      const battleBtnInfo = await page.evaluate(() => {
        const battleBtn = document.querySelector('.tutorial-battle-btn, [class*="ActionButtons"]');
        if (!battleBtn) return { found: false };
        const rect = battleBtn.getBoundingClientRect();
        return {
          found: true,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom },
          viewportHeight: window.innerHeight,
          isWithinViewport: rect.bottom <= window.innerHeight && rect.top >= 0
        };
      });
      sessionResults.mobileBattleBtnCheck = battleBtnInfo;
    }

    // SCREEN 2: SHOP
    console.log('📸 2. Navigating to SHOP...');
    await page.evaluate(() => {
      window.useGameStore.getState().goToShop();
    });
    await delay(2500);
    const shopSS = path.join(SCREENSHOT_DIR, `${viewportMode}_02_shop.png`);
    await page.screenshot({ path: shopSS, fullPage: false });
    sessionResults.screenshots.shop = shopSS;
    sessionResults.domAudits.shop = await inspectPageDOM(page, 'SHOP');

    // SCREEN 3: HEROES
    console.log('📸 3. Navigating to HEROES...');
    await page.evaluate(() => {
      window.useGameStore.getState().goToHeroes();
    });
    await delay(2500);
    const heroesSS = path.join(SCREENSHOT_DIR, `${viewportMode}_03_heroes.png`);
    await page.screenshot({ path: heroesSS, fullPage: false });
    sessionResults.screenshots.heroes = heroesSS;
    sessionResults.domAudits.heroes = await inspectPageDOM(page, 'HEROES');

    // SCREEN 4: INVENTORY
    console.log('📸 4. Navigating to INVENTORY...');
    // Return to main menu then open inventory
    await page.evaluate(() => {
      window.useGameStore.getState().setActiveScreen('MAIN_MENU');
    });
    await delay(1000);

    // Click inventory in sidebar
    await page.evaluate(() => {
      const invBtn = document.querySelector('.tutorial-inventory-btn');
      if (invBtn) invBtn.click();
    });
    await delay(2500);
    const invSS = path.join(SCREENSHOT_DIR, `${viewportMode}_04_inventory.png`);
    await page.screenshot({ path: invSS, fullPage: false });
    sessionResults.screenshots.inventory = invSS;
    sessionResults.domAudits.inventory = await inspectPageDOM(page, 'INVENTORY');

    // Close Inventory
    await page.evaluate(() => {
      // Find close button on window
      const closeBtn = document.querySelector('[class*="close"], [aria-label*="закрыть"], [aria-label*="Close"], button:has(svg)');
      if (closeBtn) closeBtn.click();
      else window.history.back();
    });
    await delay(1000);

    // SCREEN 5: CLAN WINDOW
    console.log('📸 5. Navigating to CLAN...');
    await page.evaluate(() => {
      const clanBtn = document.querySelector('.tutorial-clan-btn');
      if (clanBtn) clanBtn.click();
    });
    await delay(2500);
    const clanSS = path.join(SCREENSHOT_DIR, `${viewportMode}_05_clan.png`);
    await page.screenshot({ path: clanSS, fullPage: false });
    sessionResults.screenshots.clan = clanSS;
    sessionResults.domAudits.clan = await inspectPageDOM(page, 'CLAN');

    // Close Clan
    await page.evaluate(() => {
      window.history.back();
    });
    await delay(1000);

    // SCREEN 6: RANKING WINDOW
    console.log('📸 6. Navigating to RANKING...');
    await page.evaluate(() => {
      const rankBtn = document.querySelector('.tutorial-ranking-btn');
      if (rankBtn) rankBtn.click();
    });
    await delay(2500);
    const rankSS = path.join(SCREENSHOT_DIR, `${viewportMode}_06_ranking.png`);
    await page.screenshot({ path: rankSS, fullPage: false });
    sessionResults.screenshots.ranking = rankSS;
    sessionResults.domAudits.ranking = await inspectPageDOM(page, 'RANKING');

    // Close Ranking
    await page.evaluate(() => {
      window.history.back();
    });
    await delay(1000);

    // SCREEN 7: CHAT
    console.log('📸 7. Interacting with CHAT...');
    const chatInput = await page.$('input[placeholder*="сообщение"], [class*="Chat"] input');
    if (chatInput) {
      await chatInput.focus();
      await page.keyboard.type('QA Critic Verification Text');
      await delay(1000);
    }
    const chatSS = path.join(SCREENSHOT_DIR, `${viewportMode}_07_chat.png`);
    await page.screenshot({ path: chatSS, fullPage: false });
    sessionResults.screenshots.chat = chatSS;
    sessionResults.domAudits.chat = await inspectPageDOM(page, 'CHAT');

    // SCREEN 8: BATTLE
    console.log('📸 8. Navigating to BATTLE...');
    await page.evaluate(() => {
      window.useGameStore.getState().startPveBattle(1);
    });
    await delay(2000);

    // Click "НАЧАТЬ БОЙ" in PreBattle if present
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent && b.textContent.includes('НАЧАТЬ БОЙ'));
      if (startBtn) startBtn.click();
    });
    await delay(4000); // Wait for battle scene to load and render canvas
    const battleSS = path.join(SCREENSHOT_DIR, `${viewportMode}_08_battle.png`);
    await page.screenshot({ path: battleSS, fullPage: false });
    sessionResults.screenshots.battle = battleSS;
    sessionResults.domAudits.battle = await inspectPageDOM(page, 'BATTLE');

  } catch (err) {
    console.error(`💥 Session error in ${viewportMode}:`, err);
    sessionResults.fatalError = err.message;
  } finally {
    await browser.close();
  }

  return sessionResults;
}

async function main() {
  console.log('🚀 QA-CRITIC INDEPENDENT AUDIT STARTING...');
  const desktopResults = await runSession('desktop');
  const mobileResults = await runSession('mobile');

  const combinedReport = {
    auditTimestamp: new Date().toISOString(),
    desktop: desktopResults,
    mobile: mobileResults
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(combinedReport, null, 2), 'utf8');
  console.log(`\n🎉 Audit finished! JSON report saved to: ${REPORT_PATH}`);
}

main().catch(e => {
  console.error('Fatal audit failure:', e);
  process.exit(1);
});
