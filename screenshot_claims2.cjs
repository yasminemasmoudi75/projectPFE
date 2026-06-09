const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  const token = "";
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.evaluate((tok) => { localStorage.setItem('accessToken', tok); }, token);
  
  await page.goto('http://localhost:5173/claims/2022');
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: 'claims_top.png', clip: { x: 130, y: 40, width: 1310, height: 510 } });
  await page.screenshot({ path: 'claims_sidebar.png', clip: { x: 960, y: 175, width: 475, height: 700 } });
  
  await browser.close();
  console.log('Done');
})();
