const { chromium } = require('playwright');

async function checkDealer(name, url, searchTerm) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===\n`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/20(17|18|19|20|21|22|23)/)) {
          console.log('\n--- Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          console.log('');
        }
      }

      // Extract prices
      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const validPrices = [...new Set(prices)].filter(p => {
          const n = parseInt(p.replace(/[$,]/g, ''));
          return n >= 8000 && n <= 22000;
        });
        console.log('Prices in range:', validPrices.join(', '));
      }

      // KMs
      const kms = text.match(/[\d,]+\s*km/gi);
      if (kms) {
        console.log('KMs:', [...new Set(kms)].slice(0, 10).join(', '));
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      return true;
    } else {
      console.log('No Soul found');
      return false;
    }
  } catch (err) {
    console.log('Error:', err.message);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  // 1. Barek Automotive - 2018 Soul EX
  await checkDealer(
    'Barek Automotive - 2018 Soul EX',
    'https://www.barekautomotive.com/inventory/?make=kia&model=soul',
    'soul'
  );

  // 2. St. Catharines Kia dealers
  await checkDealer(
    'Performance Kia St. Catharines',
    'https://www.performancekia.ca/used-inventory/',
    'soul'
  );

  // 3. Oakville dealers
  await checkDealer(
    'Oakville Kia',
    'https://www.oakvillekia.ca/en/used-inventory',
    'soul'
  );

  // 4. Burlington area
  await checkDealer(
    'Burlington Kia',
    'https://www.burlingtonkia.com/used/Kia-Soul.html',
    'soul'
  );

  // 5. Brampton dealers
  await checkDealer(
    'Brampton Kia',
    'https://www.bramptonkia.com/en/used-inventory',
    'soul'
  );

  // 6. Oshawa area
  await checkDealer(
    'Oshawa Kia',
    'https://www.oshawakia.com/en/used-inventory',
    'soul'
  );
}

main().catch(console.error);
