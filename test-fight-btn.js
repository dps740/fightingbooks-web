const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  console.log('Loading page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Select Lion
  console.log('Selecting Lion...');
  const lionBtn = await page.locator('button').filter({ hasText: /^LION$/i }).first();
  await lionBtn.click();
  await page.waitForTimeout(300);
  
  // Select Tiger  
  console.log('Selecting Tiger...');
  const tigerBtn = await page.locator('button').filter({ hasText: /^TIGER$/i }).first();
  await tigerBtn.click();
  await page.waitForTimeout(500);
  
  // Check overlay is there
  const overlay = page.locator('.fixed.inset-0.z-50');
  console.log('Overlay visible:', await overlay.isVisible());
  
  // Find FIGHT button specifically in the overlay
  const fightBtn = overlay.locator('button').filter({ hasText: /FIGHT/i });
  const btnCount = await fightBtn.count();
  console.log('FIGHT buttons in overlay:', btnCount);
  
  if (btnCount > 0) {
    const btnText = await fightBtn.first().textContent();
    console.log('Button text:', btnText);
    
    // Click it
    console.log('Clicking FIGHT button...');
    await fightBtn.first().click();
    await page.waitForTimeout(2000);
  }
  
  // Check URL
  const url = page.url();
  console.log('URL after FIGHT click:', url);
  
  if (url.includes('/read')) {
    console.log('✓ SUCCESS: Navigated to /read as expected');
  } else {
    console.log('✗ FAIL: Did NOT navigate to /read');
    // Check if overlay closed
    const overlayStillThere = await overlay.isVisible().catch(() => false);
    console.log('Overlay still visible:', overlayStillThere);
  }
  
  await browser.close();
})();
