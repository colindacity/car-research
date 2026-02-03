const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const results = [];

  // 1. Golden Mile Chrysler - 2022 Soul EX (white)
  console.log('=== GOLDEN MILE CHRYSLER - 2022 Kia Soul EX (white) ===\n');
  try {
    await page.goto('https://www.goldenmilechrysler.ca/inventory/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
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

      // Try to get listing link
      const soulLink = await page.$('a:has-text("Soul")');
      if (soulLink) {
        const href = await soulLink.getAttribute('href');
        console.log('\nListing link:', href);

        if (href) {
          const fullUrl = href.startsWith('/') ? 'https://www.goldenmilechrysler.ca' + href : href;
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(4000);

          const detailText = await page.evaluate(() => document.body.innerText);

          const priceMatch = detailText.match(/\$[\d,]+/);
          const kmMatch = detailText.match(/([\d,]+)\s*km/i);
          const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);

          console.log('\n--- DETAILS ---');
          console.log('URL:', page.url());
          console.log('Price:', priceMatch?.[0]);
          console.log('KM:', kmMatch?.[1]);
          console.log('VIN:', vinMatch?.[1]);

          const carfaxUrl = await page.evaluate(() => {
            const link = document.querySelector('a[href*="carfax"]');
            return link?.href;
          });
          console.log('CARFAX:', carfaxUrl);
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

  // 2. Mississauga Kia
  console.log('\n\n=== MISSISSAUGA KIA - 2022 Kia Soul EX (Cherry Black) ===\n');
  try {
    await page.goto('https://www.mississaugakia.com/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
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
      console.log('Soul not found - trying alternate URL');

      await page.goto('https://www.mississaugakia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const altText = await page.evaluate(() => document.body.innerText);
      if (altText.toLowerCase().includes('soul')) {
        console.log('SOUL FOUND via alternate URL!');
        const lines = altText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023/)) {
            console.log('\n--- Soul Listing ---');
            for (let j = i; j < Math.min(lines.length, i + 12); j++) {
              const l = lines[j].trim();
              if (l) console.log('  ' + l);
            }
          }
        }
      } else {
        console.log('No Soul found');
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Kia of Brampton
  console.log('\n\n=== KIA OF BRAMPTON - 2023 Kia Soul ===\n');
  try {
    await page.goto('https://www.kiaofbrampton.com/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
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

  // 4. QEW Kia (427/QEW Kia)
  console.log('\n\n=== QEW KIA - Kia Soul ===\n');
  try {
    await page.goto('https://www.qewkia.com/vehicles/kia/soul/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL INVENTORY FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }

      const prices = text.match(/\$[\d,]+/g);
      console.log('\nPrices found:', prices?.slice(0, 8).join(', '));

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);
    } else {
      console.log('Soul not found - trying used inventory');
      await page.goto('https://www.qewkia.com/vehicles/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const usedText = await page.evaluate(() => document.body.innerText);
      if (usedText.toLowerCase().includes('soul')) {
        console.log('SOUL FOUND in used inventory!');
        const lines = usedText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes('soul')) {
            console.log('\nContext:');
            for (let j = i; j < Math.min(lines.length, i + 12); j++) {
              const l = lines[j].trim();
              if (l) console.log('  ' + l);
            }
            break;
          }
        }
      } else {
        console.log('No Soul in used inventory');
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 5. Toronto Kia - used inventory
  console.log('\n\n=== TORONTO KIA - Used Soul ===\n');
  try {
    await page.goto('https://www.torontokia.com/vehicles/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
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
      console.log('Soul not found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
