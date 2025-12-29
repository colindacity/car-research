const { chromium } = require('playwright');

const dealers = [
  { name: 'Plaza Kia Richmond Hill', url: 'https://www.plazakia.com/used/used-vehicle-inventory.htm?search=soul' },
  { name: 'Airport Kia Mississauga', url: 'https://www.airportkia.ca/used/used-vehicle-inventory.htm?search=soul' },
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  for (const dealer of dealers) {
    console.log('\n' + '='.repeat(60));
    console.log('Checking: ' + dealer.name);
    console.log('URL: ' + dealer.url);
    console.log('='.repeat(60));

    try {
      await page.goto(dealer.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(r => setTimeout(r, 5000));

      // Scroll to load
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 1000));
      }

      const text = await page.evaluate(() => document.body.innerText);
      console.log('\n--- Page Content (first 4000 chars) ---');
      console.log(text.substring(0, 4000));

    } catch (err) {
      console.log('Error: ' + err.message);
    }
  }

  await browser.close();
})();
