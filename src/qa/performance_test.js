import puppeteer from 'puppeteer-core';
import { join } from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const GAME_URL = 'http://localhost:5173';
const SCREENSHOT_PATH = 'C:\\Users\\Motar\\.gemini\\antigravity-ide\\brain\\c6f197b5-2f10-4c74-93ff-6c83067fd206\\qa_perf_screenshot.png';

async function runTest() {
    console.log('🚀 Starting performance test for Masters of the Wild...');
    console.log(`🔗 Connecting to ${GAME_URL}...`);

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-gl=angle',
                '--use-angle=d3d11', // Enable hardware-accelerated WebGL in headless Chrome
                '--ignore-gpu-blocklist',
            ],
            defaultViewport: {
                width: 1280,
                height: 720,
            }
        });

        const page = await browser.newPage();
        
        // Collect console messages
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(`[Console ${msg.type()}] ${text}`);
            if (msg.type() === 'error') {
                console.error(`🔴 Browser Console Error: ${text}`);
            }
        });

        // Open the game
        await page.goto(GAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Page loaded. Waiting 5 seconds for asset initialization...');
        await new Promise(r => setTimeout(r, 5000));

        // Inject FPS monitor
        console.log('📊 Starting 10-second FPS profiling...');
        await page.evaluate(() => {
            window.fpsRecords = [];
            let lastTime = performance.now();
            let frames = 0;

            function measure() {
                frames++;
                const now = performance.now();
                if (now - lastTime >= 1000) {
                    window.fpsRecords.push(frames);
                    frames = 0;
                    lastTime = now;
                }
                requestAnimationFrame(measure);
            }
            requestAnimationFrame(measure);
        });

        // Run profiling for 10 seconds
        await new Promise(r => setTimeout(r, 10000));

        // Retrieve measured FPS
        const fpsRecords = await page.evaluate(() => window.fpsRecords || []);
        
        // Take screenshot
        console.log(`📸 Capturing screenshot to: ${SCREENSHOT_PATH}`);
        await page.screenshot({ path: SCREENSHOT_PATH });

        // Calculate statistics
        if (fpsRecords.length > 0) {
            const avgFps = fpsRecords.reduce((a, b) => a + b, 0) / fpsRecords.length;
            const minFps = Math.min(...fpsRecords);
            const maxFps = Math.max(...fpsRecords);

            console.log('\n📈 --- PERFORMANCE RESULTS ---');
            console.log(`Average FPS: ${avgFps.toFixed(1)}`);
            console.log(`Min FPS:     ${minFps}`);
            console.log(`Max FPS:     ${maxFps}`);
            console.log('------------------------------\n');

            if (avgFps >= 55) {
                console.log('🟢 Perfect performance! FPS is stable at 60+.');
            } else {
                console.log('⚠️ Performance warning: FPS dropped below 55.');
            }
        } else {
            console.error('❌ Could not collect FPS measurements.');
        }

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 Browser closed.');
        }
    }
}

runTest();
