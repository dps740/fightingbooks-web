const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('=== PRODUCTION TEST ===\n');
  console.log('Loading site...');
  await page.goto('https://fightingbooks.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Select fighters
  console.log('Selecting Lion & Tiger...');
  await page.locator('button').filter({ hasText: /^LION$/i }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button').filter({ hasText: /^TIGER$/i }).first().click();
  await page.waitForTimeout(500);
  
  const overlay = page.locator('.fixed.inset-0.z-50');
  
  // TEST 1: Backdrop closes overlay
  console.log('\nTEST 1: Click backdrop');
  await overlay.click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(500);
  let url = page.url();
  let stillVisible = await overlay.isVisible().catch(() => false);
  
  if (!url.includes('/read') && !stillVisible) {
    console.log('✓ PASS: Backdrop closed overlay, stayed on homepage');
  } else {
    console.log('✗ FAIL: url=' + url + ', overlay=' + stillVisible);
  }
  
  // Re-open overlay by clicking "Ready to Fight" button
  console.log('\nRe-opening overlay...');
  const readyBtn = page.locator('button').filter({ hasText: /READY TO FIGHT/i });
  if (await readyBtn.isVisible()) {
    await readyBtn.click();
    await page.waitForTimeout(500);
    console.log('Overlay re-opened via Ready button');
  } else {
    // Re-select to open overlay
    await page.locator('button').filter({ hasText: /^TIGER$/i }).first().click();
    await page.waitForTimeout(500);
  }
  
  // TEST 2: FIGHT button navigates
  console.log('\nTEST 2: Click FIGHT button');
  const fightBtn = page.locator('.fixed.inset-0.z-50 button').filter({ hasText: /FIGHT/i });
  if (await fightBtn.isVisible()) {
    await fightBtn.click();
    await page.waitForTimeout(2000);
    url = page.url();
    if (url.includes('/read')) {
      console.log('✓ PASS: FIGHT button navigated to /read');
    } else {
      console.log('✗ FAIL: Did not navigate, url=' + url);
    }
  } else {
    console.log('✗ FAIL: FIGHT button not visible');
  }
  
  console.log('\n=== TESTS COMPLETE ===');
  await browser.close();
})();
