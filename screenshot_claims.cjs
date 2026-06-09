const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Get token from API
  const resp = await page.request.post('http://localhost:3066/api/auth/login', {
    data: { EmailPro: 'anis', Password: '051634' },
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await resp.json();
  const token = data.data?.token;
  console.log('Got token:', token?.substring(0, 20) + '...');
  
  // Go to app and inject token into localStorage
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.evaluate((tok) => {
    localStorage.setItem('accessToken', tok);
  }, token);
  
  // Navigate to claims page
  await page.goto('http://localhost:5173/claims/2022');
  await page.waitForTimeout(5000);
  console.log('URL:', page.url());
  await page.screenshot({ path: 'claims_logged.png', fullPage: true });
  await browser.close();
  console.log('Screenshot done');
})();
