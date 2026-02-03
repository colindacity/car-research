const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Brantford Honda - 2022 Kia Soul EX @ $16,999
  console.log('=== BRANTFORD HONDA - 2022 Kia Soul EX ===');
  console.log('Looking for: $16,999, 71,459 km, VIN: KNDJ33AU9N7173836\n');
  try {
    await page.goto('https://www.brantfordhonda.com/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul')) {
          console.log('\nContext:');
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          break;
        }
      }

      // Get phone
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);

      // Get CARFAX
      const carfaxUrl = await page.evaluate(() => {
        const link = document.querySelector('a[href*="carfax"]');
        return link?.href;
      });
      console.log('CARFAX:', carfaxUrl);
    } else {
      console.log('Soul not found on main page, trying search...');
      await page.goto('https://www.brantfordhonda.com/used/?make=Kia&model=Soul', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const searchText = await page.evaluate(() => document.body.innerText);
      if (searchText.toLowerCase().includes('soul')) {
        console.log('FOUND via filter!');
        const lines = searchText.split('\n').filter(l =>
          l.toLowerCase().includes('soul') || l.match(/\$|km|kia|2022/i)
        );
        lines.slice(0, 15).forEach(l => console.log('  ' + l.trim()));
      } else {
        console.log('Not found - may be sold');
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Golden Mile Chrysler - 2022 Kia Soul EX
  console.log('\n\n=== GOLDEN MILE CHRYSLER - 2022 Kia Soul EX ===');
  console.log('Looking for: $18,879, 95,171 km, White\n');
  try {
    await page.goto('https://www.goldenmilechrysler.ca/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul')) {
          console.log('\nContext:');
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          break;
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('Soul not found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Check Carpages 2019 Soul EX+ in Windsor area
  console.log('\n\n=== CARPAGES - 2019 Kia Soul EX+ Windsor ===');
  try {
    await page.goto('https://www.carpages.ca/used-cars/ontario/windsor/2019-kia-soul-12198946/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('LISTING FOUND!');

      const priceMatch = text.match(/\$[\d,]+/);
      const kmMatch = text.match(/([\d,]+)\s*KM/i);

      console.log('Price:', priceMatch?.[0]);
      console.log('KM:', kmMatch?.[1]);

      // Find dealer
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.match(/(motors|auto|dealer|honda|kia|hyundai|nissan|ford|toyota|chrysler)/i) &&
            line.length < 60 && !line.match(/Soul|2019/)) {
          console.log('Dealer:', line.trim());
          break;
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      // Distance from Thornhill (43.8108, -79.4250) to Windsor (42.3149, -83.0364)
      console.log('Distance: ~370 km from Thornhill (too far?)');
    } else {
      console.log('Listing not found or sold');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
