const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Loading PRODUCTION site...');
  await page.goto('https://fightingbooks.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  
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
  const overlayVisible = await overlay.isVisible();
  console.log('Overlay visible:', overlayVisible);
  
  if (overlayVisible) {
    // TEST 1: Click backdrop (should close)
    console.log('\nTEST 1: Clicking backdrop...');
    await overlay.click({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(500);
    
    const url1 = page.url();
    const stillVisible = await overlay.isVisible().catch(() => false);
    
    if (url1.includes('/read')) {
      console.log('✗ FAIL: Backdrop click navigated to /read (should close overlay)');
    } else if (stillVisible) {
      console.log('✗ FAIL: Overlay still visible (should have closed)');
    } else {
      console.log('✓ PASS: Backdrop click closed overlay');
    }
  }
  
  await browser.close();
})();
