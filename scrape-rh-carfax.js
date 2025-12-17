const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Fetching Richmond Hill CARFAX...');
  await page.goto('https://vhr.carfax.ca/?id=IKWqPEOcwApJJAlao/VmNquDP2t54I3U', {
    waitUntil: 'load',
    timeout: 60000
  });

  // Wait for content to load
  console.log('Waiting for content...');
  await new Promise(r => setTimeout(r, 10000));

  // Scroll down to load all sections
  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise(r => setTimeout(r, 2000));

  const data = await page.evaluate(() => document.body.innerText);
  console.log('\n--- CARFAX Report ---\n');
  console.log(data);

  await browser.close();
})();
