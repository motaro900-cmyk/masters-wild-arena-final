const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:4173';

async function run() {
  console.log('Launching browser to measure production cold start...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--ignore-gpu-blocklist'
    ]
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('React Cold Start') || text.includes('React Root Render')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message);
  });

  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });
  
  // Wait a little bit to ensure all layout effects have run
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
  console.log('Measurement done.');
}

run().catch(console.error);
