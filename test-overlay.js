const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
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
  
  // Check if overlay is visible
  const overlay = page.locator('.fixed.inset-0.z-50');
  const overlayVisible = await overlay.isVisible();
  console.log('Overlay visible:', overlayVisible);
  
  if (overlayVisible) {
    console.log('✓ Overlay appeared');
    
    // Click on the top-left corner of the overlay (definitely backdrop area)
    console.log('Clicking backdrop (top-left corner)...');
    await overlay.click({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(500);
    
    // Check current URL
    const url = page.url();
    console.log('URL after click:', url);
    
    // Check if overlay is still visible
    const stillVisible = await overlay.isVisible().catch(() => false);
    console.log('Overlay still visible:', stillVisible);
    
    if (url.includes('/read')) {
      console.log('✗ FAIL: Navigated to /read when clicking backdrop');
    } else if (stillVisible) {
      console.log('✗ FAIL: Overlay still visible (should have closed)');
    } else {
      console.log('✓ SUCCESS: Overlay closed, stayed on homepage');
    }
  } else {
    console.log('✗ Overlay did not appear');
  }
  
  await browser.close();
})();
