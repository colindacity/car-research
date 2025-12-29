const { chromium } = require('playwright');

const carfaxUrls = [
  // Plaza Kia - Richmond Hill - 2023 EX 30K km $21,988
  { name: 'Plaza Kia RH', url: 'https://vhr.carfax.ca/?id=UtGW3w8HRx8aIvQswvM/XkEGsHeORrdY' },
  // Airport Kia - Mississauga - 2022 EX+ 67K km $19,888
  { name: 'Airport Kia', url: 'https://vhr.carfax.ca/?id=OQOG6gmVcykHxuFBZb5MCBQPc+kztd7k' },
  // Durham Kia - Oshawa - 2022 EX 23K km $23,888 (LOW KM!)
  { name: 'Durham Kia 23K', url: 'https://vhr.carfax.ca/?id=DfGo7NY3iR1bcex3dFH0dRSPpmskDW9A' },
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

      // Scroll to load all sections
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 800));
      }

      const data = await page.evaluate(() => document.body.innerText);

      // Extract key info
      const lines = data.split('\n').filter(l => l.trim());
      let output = [];
      let inServiceRecords = false;
      let serviceCount = 0;

      for (const line of lines) {
        const l = line.trim();
        // Key indicators
        if (l.includes('Accident') || l.includes('Damage') ||
            l.includes('owner') || l.includes('Owner') ||
            l.includes('Registered') || l.includes('Stolen') ||
            l.includes('Recall') || l.includes('Service Record') ||
            l.includes('Odometer') || l.includes('KM') ||
            l.includes('Ontario') || l.includes('Normal') ||
            l.includes('serviced') || l.includes('Oil') ||
            l.includes('collision') || l.includes('claim')) {
          output.push(l);
        }
      }

      console.log('\n--- KEY FINDINGS ---');
      console.log(output.slice(0, 50).join('\n'));

      console.log('\n--- FULL REPORT (first 2500 chars) ---');
      console.log(data.substring(0, 2500));

    } catch (err) {
      console.log('Error: ' + err.message);
    }
  }

  await browser.close();
})();
