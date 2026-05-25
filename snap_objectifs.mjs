import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:5174/auth/login');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

await page.fill('input[name="EmailPro"]', 'ag@gmail.com');
await page.fill('input[type="password"]', 'Screenshot1!');
await page.click('button[type="submit"]');
try { await page.waitForURL(u => !u.href.includes('/auth/login'), { timeout: 8000 }); } catch {}

await page.goto('http://localhost:5174/objectifs');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);
await page.screenshot({ path: '../screenshot_objectifs.png', fullPage: true });
console.log('done, url:', page.url());
await browser.close();
