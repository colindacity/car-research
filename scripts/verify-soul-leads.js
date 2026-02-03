const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Lebada Motors Superstore Inc - 2019 Soul EX $14,995
  console.log('=== LEBADA MOTORS - 2019 Kia Soul EX ===');
  console.log('Looking for: $14,995, 77,647 km, Stratford ON\n');
  try {
    await page.goto('https://www.lebadamotors.ca/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul')) {
          console.log('\nContext:');
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          break;
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('Soul not found on main page');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Golden Mile Chrysler - 2022 Kia Soul EX (white, 95k km)
  console.log('\n\n=== GOLDEN MILE CHRYSLER - 2022 Kia Soul EX ===');
  console.log('Looking for: 95,171 km, White\n');
  try {
    await page.goto('https://www.goldenmilechrysler.ca/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2022/)) {
          console.log('\n--- 2022 Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
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

  // 3. Foster Kia Scarborough - Kia Soul inventory
  console.log('\n\n=== FOSTER KIA SCARBOROUGH - Kia Soul ===\n');
  try {
    await page.goto('https://www.fosterkia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL LISTINGS FOUND!\n');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/soul/i) && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          console.log('');
        }
      }

      // Get price patterns
      const prices = text.match(/\$[\d,]+/g);
      console.log('Prices found:', prices?.slice(0, 10).join(', '));

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      const address = text.match(/\d+\s+[\w\s]+(?:Rd|Ave|St|Dr|Blvd)[\s,]+[\w\s]+,?\s*ON/i);
      console.log('Address:', address?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 4. Toronto Kia - Soul inventory
  console.log('\n\n=== TORONTO KIA - Kia Soul ===\n');
  try {
    await page.goto('https://www.torontokia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL LISTINGS FOUND!\n');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/soul/i) && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          console.log('');
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 5. 401 Dixie Kia - mentioned in search results
  console.log('\n\n=== 401 DIXIE KIA - Kia Soul ===\n');
  try {
    await page.goto('https://www.401dixiekia.ca/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL LISTINGS FOUND!\n');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/soul/i) && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          console.log('');
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
