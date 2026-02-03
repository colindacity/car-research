const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  const results = [];

  // Search AutoTrader for each model
  const searches = [
    { name: 'Venue 2020', url: 'https://www.autotrader.ca/cars/hyundai/venue/on/?rcp=50&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2020,2020&pRng=10000,19000' },
    { name: 'Venue 2021', url: 'https://www.autotrader.ca/cars/hyundai/venue/on/?rcp=50&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2021,2021&pRng=10000,19000' },
    { name: 'Venue 2022+', url: 'https://www.autotrader.ca/cars/hyundai/venue/on/?rcp=50&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2022,2025&pRng=10000,19000' },
    { name: 'Soul 2019', url: 'https://www.autotrader.ca/cars/kia/soul/on/?rcp=50&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2019,2019&pRng=10000,19000' },
    { name: 'Soul 2022+', url: 'https://www.autotrader.ca/cars/kia/soul/on/?rcp=50&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2022,2025&pRng=10000,19000' },
    { name: 'Kicks 2021+', url: 'https://www.autotrader.ca/cars/nissan/kicks/on/?rcp=50&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2021,2025&pRng=10000,19000' },
  ];

  for (const search of searches) {
    console.log(`\n========== ${search.name} ==========`);
    try {
      await page.goto(search.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);

      // Extract all listings
      const listings = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="result-item"], [class*="listing"], [data-listing-id], .vehicle-card');
        const items = [];

        // Also try getting from the page's visible text
        const allText = document.body.innerText;
        const lines = allText.split('\n');

        let currentCar = {};
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Look for year + model patterns
          const yearMatch = line.match(/^(2019|202[0-5])\s+(Hyundai\s+)?(Venue|Kia\s+Soul|Soul|Nissan\s+Kicks|Kicks)/i);
          if (yearMatch) {
            if (currentCar.title) items.push(currentCar);
            currentCar = { title: line };
            continue;
          }

          // Look for price
          if (line.match(/^\$[\d,]+$/) && currentCar.title && !currentCar.price) {
            currentCar.price = line;
            continue;
          }

          // Look for km
          if (line.match(/^[\d,]+\s*km$/i) && currentCar.title && !currentCar.km) {
            currentCar.km = line;
            continue;
          }

          // Look for dealer
          if (line.match(/(hyundai|kia|nissan|mazda|toyota|honda|ford|chevrolet|gm|volkswagen)/i) &&
              !line.match(/^(2019|202)/)) {
            if (currentCar.title && !currentCar.dealer) {
              currentCar.dealer = line;
            }
          }

          // Look for trim
          if (line.match(/^(Essential|Preferred|Trend|Ultimate|LX|EX|EX\+|EX Premium|GT-Line|S|SV|SR)$/i)) {
            if (currentCar.title && !currentCar.trim) {
              currentCar.trim = line;
            }
          }
        }
        if (currentCar.title) items.push(currentCar);

        return items;
      });

      console.log(`Found ${listings.length} listings`);
      listings.forEach((l, i) => {
        console.log(`\n${i+1}. ${l.title}`);
        if (l.trim) console.log(`   Trim: ${l.trim}`);
        if (l.price) console.log(`   Price: ${l.price}`);
        if (l.km) console.log(`   KM: ${l.km}`);
        if (l.dealer) console.log(`   Dealer: ${l.dealer}`);
      });

      // Also get raw listing links
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/a/hyundai/venue/"], a[href*="/a/kia/soul/"], a[href*="/a/nissan/kicks/"]'))
          .map(a => ({ href: a.href, text: a.innerText.substring(0, 100) }))
          .slice(0, 20);
      });

      if (links.length > 0) {
        console.log(`\nDirect links found: ${links.length}`);
        links.slice(0, 10).forEach(l => console.log(`  ${l.href}`));
      }

    } catch (err) {
      console.log('Error:', err.message);
    }
  }

  await browser.close();
}

main().catch(console.error);
