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
  console.log('=== VERIFYING NEW SOUL LEADS (2020-2024, NO EVs) ===\n');

  await checkDealer(
    'NewRoads Mazda (Newmarket)',
    'https://www.newroadsmazda.ca/en/used-inventory',
    '2020 Soul EX+ - $15,488, One Owner, Accident-Free'
  );

  await checkDealer(
    'Plaza Kia St. Catharines',
    'https://www.plazakiastcatharines.ca/en/used-inventory',
    '2023 Soul EX - CPO, Clean Carfax'
  );

  await checkDealer(
    'Kia of Brampton',
    'https://www.kiaofbrampton.ca/en/used-inventory',
    '2023 Soul EX Plus'
  );

  await checkDealer(
    'Stouffville Kia',
    'https://www.stouffvillekia.com/en/used-inventory',
    'Any 2020-2024 Soul EX'
  );

  await checkDealer(
    'Newmarket Kia',
    'https://www.newmarketkia.com/en/used-inventory',
    'Any 2020-2024 Soul EX'
  );

  console.log('\n=== VERIFICATION COMPLETE ===');
}

main().catch(console.error);
