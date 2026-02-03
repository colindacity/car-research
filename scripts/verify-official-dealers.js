const { chromium } = require('playwright');

async function checkDealer(name, url, searchFor) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===`);
  console.log(`Looking for: ${searchFor}\n`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();

        if (lineLower.includes('soul') &&
            line.match(/20(20|21|22|23|24)/) &&
            !lineLower.includes(' ev') &&
            !lineLower.includes('electric')) {
          console.log('\n--- Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l && l.length < 120) console.log('  ' + l);
          }
          console.log('');
        }
      }

      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const validPrices = [...new Set(prices)].filter(p => {
          const n = parseInt(p.replace(/[$,]/g, ''));
          return n >= 12000 && n <= 22000;
        });
        if (validPrices.length) console.log('Prices:', validPrices.join(', '));
      }

      const kms = text.match(/[\d,]+\s*km/gi);
      if (kms) console.log('KMs:', [...new Set(kms)].slice(0, 6).join(', '));

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phone) console.log('Phone:', phone[0]);

      return true;
    } else {
      console.log('No Soul found at this dealer');
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
  console.log('=== VERIFYING OFFICIAL MANUFACTURER DEALERS ===\n');
  console.log('Looking for 2022-2023 Soul EX (NO EVs) with clean history\n');

  // Official Kia Dealers
  await checkDealer(
    'Toronto Kia',
    'https://www.torontokia.com/vehicles/used/?st=price,asc&make=Kia&model=Soul',
    '2022-2023 Soul EX'
  );

  await checkDealer(
    'Kia of Brampton',
    'https://www.kiaofbrampton.ca/en/used-inventory',
    '2023 Soul EX Plus - 96,110 km'
  );

  await checkDealer(
    'Kia of St. Catharines',
    'https://www.kiaofstcatharines.com/vehicles/used/?st=price,asc&make=Kia&model=Soul',
    '2022-2023 Soul EX CPO'
  );

  await checkDealer(
    'Plaza Kia Newmarket',
    'https://www.plazakianewmarket.ca/en/used-inventory',
    '2022-2023 Soul EX'
  );

  // Other brand dealers (trade-ins)
  await checkDealer(
    'Golden Mile Chrysler',
    'https://www.goldenmilechrysler.ca/inventory/?make=kia&model=soul',
    '2022 Soul EX - 95,171 km, white'
  );

  await checkDealer(
    'Morningside Nissan',
    'https://www.morningsidenissan.com/en/used-inventory',
    '2022 Soul EX - 88,451 km (already in DB)'
  );

  console.log('\n=== VERIFICATION COMPLETE ===');
}

main().catch(console.error);
