import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

(async () => {
  console.log('Launching browser with binary:', BROWSER_PATH);
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('[CONSOLE]', msg.text()));
  page.on('request', req => console.log('[REQ]', req.method(), req.url().substring(0, 60)));
  page.on('requestfinished', req => console.log('[DONE]', req.url().substring(0, 60)));
  page.on('requestfailed', req => console.log('[FAIL]', req.url().substring(0, 60), req.failure()?.errorText));

  console.log('Navigating to https://mastersofthewild.ru ...');
  try {
    await page.goto('https://mastersofthewild.ru', {
      waitUntil: 'domcontentloaded',
      timeout: 8000
    });
    console.log('domcontentloaded succeeded!');
  } catch (e) {
    console.log('domcontentloaded notice:', e.message);
  }

  console.log('Waiting 6 seconds for scripts/DOM...');
  await new Promise(r => setTimeout(r, 6000));

  const screenshotPath = 'C:\\Users\\Motar\\.gemini\\antigravity\\brain\\b4081e1a-6d0b-4929-8e99-907ce2b4f2ae\\cf_live_dom.png';
  try {
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot captured:', screenshotPath);
  } catch (e) {
    console.log('Screenshot error:', e.message);
  }

  const content = await page.content();
  console.log('Page content length:', content.length);
  console.log('Root div:', await page.$eval('#root', el => el.innerHTML).catch(() => 'no root innerHTML'));

  await browser.close();
  console.log('Browser closed.');
})();
