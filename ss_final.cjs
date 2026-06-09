const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6IkFkbWluIiwiaWF0IjoxNzgwODQzNTExLCJleHAiOjE3ODA5Mjk5MTF9.krwKynjMQlqvldDGN73xqG4--fPHJAaRLGQPmgGtTT0";
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(800);
  await page.evaluate((tok) => { localStorage.setItem('accessToken', tok); }, token);
  await page.goto('http://localhost:5173/claims/2022');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'ss_top.png', clip: { x: 130, y: 40, width: 1310, height: 530 } });
  await page.screenshot({ path: 'ss_sidebar.png', clip: { x: 955, y: 170, width: 480, height: 740 } });
  await page.screenshot({ path: 'ss_full.png', fullPage: true });
  await browser.close();
  console.log('Done');
})();
