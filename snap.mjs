import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERR', msg.text()); });
page.on('pageerror', err => console.log('PAGE ERROR', err.message));

// Go to login
await page.goto('http://localhost:5174/auth/login');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

// Find inputs
const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id, placeholder: e.placeholder })));
console.log('Inputs:', JSON.stringify(inputs));

// Fill login form
const emailInput = inputs.find(i => i.name === 'EmailPro' || i.type === 'email' || i.name === 'email');
const pwInput    = inputs.find(i => i.type === 'password');
console.log('Email field:', emailInput, 'PW field:', pwInput);

if (emailInput) {
    const sel = emailInput.name ? `input[name="${emailInput.name}"]` : `input[type="email"]`;
    await page.fill(sel, 'ag@gmail.com');
}
if (pwInput) {
    await page.fill('input[type="password"]', 'Screenshot1!');
}

await page.click('button[type="submit"]');
try { await page.waitForURL(u => !u.href.includes('/auth/login'), { timeout: 8000 }); } catch(e) { console.log('nav timeout', e.message); }
console.log('URL after login:', page.url());

// Navigate to product
await page.goto('http://localhost:5174/products/2EA70F3E-416B-4406-9E25-0007EE207F05');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);
await page.screenshot({ path: '../screenshot_product.png', fullPage: true });
console.log('Screenshot saved. URL:', page.url());
await browser.close();
