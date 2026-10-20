import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('VK CONSOLE:', msg.text()));
  page.on('request', req => {
    const url = req.url();
    if (url.includes('mastersofthewild') || url.includes('vk-apps') || url.includes('54585995')) {
      console.log('INTERESTING REQ:', req.method(), url.substring(0, 100));
    }
  });

  console.log('Navigating to https://vk.ru/app54585995 ...');
  try {
    await page.goto('https://vk.ru/app54585995', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (e) {
    console.log('Goto notice:', e.message);
  }

  const iframes = await page.$$eval('iframe', frames => frames.map(f => f.src));
  console.log('Found iframes on page:', iframes);

  await browser.close();
})();
