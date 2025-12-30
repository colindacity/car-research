const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Desktop view
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-desktop.png', fullPage: false });
    
    // Mobile view
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-mobile.png', fullPage: false });
    
    await browser.close();
    console.log('Screenshots saved');
})();
