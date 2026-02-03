const { chromium } = require('playwright');

async function checkDealer(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===`);
  console.log(`URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);

    // Look for Soul 2022 or 2023 only (NO EVs)
    const lines = text.split('\n');
    const found = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      if (lineLower.includes('soul') &&
          (line.includes('2022') || line.includes('2023')) &&
          !lineLower.includes(' ev') &&
          !lineLower.includes('electric')) {

        let context = [];
        for (let j = i; j < Math.min(lines.length, i + 12); j++) {
          const l = lines[j].trim();
          if (l && l.length < 150) context.push(l);
        }
        found.push(context.join(' | '));
      }
    }

    if (found.length > 0) {
      console.log('*** FOUND 2022/2023 SOUL (non-EV)! ***');
      found.forEach((f, idx) => {
        console.log(`\n[${idx + 1}] ${f.substring(0, 500)}`);
      });

      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const validPrices = [...new Set(prices)].filter(p => {
          const n = parseInt(p.replace(/[$,]/g, ''));
          return n >= 14000 && n <= 22000;
        });
        if (validPrices.length) console.log('\nPrices in budget:', validPrices.join(', '));
      }

      const kms = text.match(/[\d,]+\s*km/gi);
      if (kms) {
        const validKms = [...new Set(kms)].filter(k => {
          const n = parseInt(k.replace(/[,km\s]/gi, ''));
          return n >= 30000 && n <= 120000;
        });
        if (validKms.length) console.log('KMs:', validKms.slice(0, 6).join(', '));
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phone) console.log('Phone:', phone[0]);

      return true;
    } else if (text.toLowerCase().includes('soul')) {
      console.log('Has Soul listings, but not 2022/2023 non-EV');
      return false;
    } else {
      console.log('No Soul listings');
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
  console.log('=== FINAL DEALER VERIFICATION FOR 2022-2023 SOUL EX ===\n');

  // Official Kia dealers
  await checkDealer('427/QEW Kia (Etobicoke)', 'https://www.qewkia.com/vehicles/kia/soul/');
  await checkDealer('Mississauga Kia', 'https://www.mississaugakia.com/vehicles/used/?st=price,asc&make=Kia&model=Soul');
  await checkDealer('Airport Kia', 'https://www.airportkia.ca/used/2022-Kia-Soul.html');

  // Other manufacturer dealers (trade-ins)
  await checkDealer('401 Dixie Hyundai', 'https://www.401dixiehyundai.ca/en/used-inventory');
  await checkDealer('Scarborough Toyota', 'https://www.scarboroughtoyota.ca/en/used-inventory');

  console.log('\n=== VERIFICATION COMPLETE ===');
}

main().catch(console.error);
