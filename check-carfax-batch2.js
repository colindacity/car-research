const { chromium } = require('playwright');

const carfaxUrls = [
  { name: 'Brampton Nissan Soul 24K', url: 'https://vhr.carfax.ca/?id=PqhbAilweFnO4ydrtMQd9wVK5ghA315i' },
  { name: 'Bolton Nissan Venue', url: 'https://vhr.carfax.ca/?id=YzXO6p0R+MafomMPzPYpp+cRPa1weBcl' },
  { name: 'Morningside Nissan Soul', url: 'https://vhr.carfax.ca/?id=RvM7pZoKrvnvdV20qzp2M5wolnQ8tTI3' },
  { name: 'Newmarket Hyundai Venue', url: 'https://vhr.carfax.ca/?id=Chm1oIJZ+IVuGvGZANTHKLURaiG/X485' },
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  for (const item of carfaxUrls) {
    console.log('\n' + '='.repeat(60));
    console.log('CARFAX: ' + item.name);
    console.log('URL: ' + item.url);
    console.log('='.repeat(60));

    try {
      await page.goto(item.url, { waitUntil: 'load', timeout: 60000 });
      await new Promise(r => setTimeout(r, 6000));

      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, 700));
        await new Promise(r => setTimeout(r, 700));
      }

      const data = await page.evaluate(() => document.body.innerText);

      // Extract key info
      const lines = data.split('\n');
      let summary = [];

      for (const line of lines) {
        const l = line.trim();
        if (l.includes('Accident') || l.includes('Damage') ||
            l.includes('owner') || l.includes('Owner') ||
            l.includes('Registered') || l.includes('Recall') ||
            l.includes('Service Record') || l.includes('Odometer') ||
            l.includes('Ontario') || l.includes('Normal') ||
            l.includes('collision') || l.includes('claim') ||
            l.includes('KM') || l.includes('serviced')) {
          summary.push(l);
        }
      }

      console.log('\n--- KEY FINDINGS ---');
      console.log(summary.slice(0, 40).join('\n'));

    } catch (err) {
      console.log('Error: ' + err.message);
    }
  }

  await browser.close();
})();
