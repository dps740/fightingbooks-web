const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Loading production site...');
  await page.goto('https://fightingbooks.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Select Lion & Tiger
  console.log('Selecting Lion & Tiger...');
  await page.locator('button').filter({ hasText: /^LION$/i }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button').filter({ hasText: /^TIGER$/i }).first().click();
  await page.waitForTimeout(500);
  
  // Click backdrop to dismiss
  console.log('Clicking backdrop to dismiss...');
  const overlay = page.locator('.fixed.inset-0.z-50');
  await overlay.click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(500);
  
  // Check if fighters are cleared - look for "CLICK TO SELECT" text in the corners
  const redCorner = page.locator('button:has-text("RED CORNER")');
  const redCornerText = await redCorner.textContent();
  
  // Check if there's still a selected fighter shown
  const lionSelected = await page.locator('button:has(img[alt="Lion"])').count() > 0;
  const tigerSelected = await page.locator('button:has(img[alt="Tiger"])').count() > 0;
  
  // Check for "CLICK TO SELECT" in corners
  const clickToSelect = await page.locator('text=CLICK TO SELECT').count();
  
  console.log('Click to select prompts:', clickToSelect);
  
  if (clickToSelect >= 2) {
    console.log('✓ PASS: Both fighters cleared, showing "CLICK TO SELECT"');
  } else {
    console.log('✗ FAIL: Fighters not fully cleared');
  }
  
  await browser.close();
})();
