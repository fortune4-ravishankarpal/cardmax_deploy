import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 450, height: 800 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/wallet', { waitUntil: 'networkidle' });
  console.log('Current URL:', page.url());
  
  const addBtn = page.locator('#btn-add-card');
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ 
      path: 'C:\\Users\\Developer\\.gemini\\antigravity-ide\\brain\\c1887adc-cf15-4bce-96d9-04b70cc83ee8\\modal_cross_icon.png' 
    });
    console.log('Modal opened & screenshot captured!');
  } else {
    console.log('Add card button not visible, page URL is:', page.url());
  }

  await browser.close();
})();
