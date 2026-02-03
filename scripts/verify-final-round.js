const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Plaza Kia St. Catharines - 2019 Soul EX
  console.log('=== PLAZA KIA ST. CATHARINES - 2019 Kia Soul EX ===\n');
  try {
    await page.goto('https://www.plazakia.ca/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Soul found');
      // Try alternate URL
      console.log('Trying alternate URL...');
      await page.goto('https://www.plazakia.ca/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);
      const altText = await page.evaluate(() => document.body.innerText);
      if (altText.toLowerCase().includes('soul')) {
        console.log('SOUL FOUND via alternate URL!');
        const lines = altText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023/)) {
            console.log('\n--- Soul Listing ---');
            for (let j = i; j < Math.min(lines.length, i + 15); j++) {
              const l = lines[j].trim();
              if (l) console.log('  ' + l);
            }
          }
        }
      } else {
        console.log('No Soul at alternate URL');
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Morningside Nissan - Get full details for the 2022 Soul EX
  console.log('\n\n=== MORNINGSIDE NISSAN - Full Details ===\n');
  try {
    await page.goto('https://www.morningsidenissan.com/en/used-inventory', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Find Soul listing link
    const soulLink = await page.$('a:has-text("Soul")');
    if (soulLink) {
      const href = await soulLink.getAttribute('href');
      console.log('Found listing link:', href);

      if (href) {
        const fullUrl = href.startsWith('/') ? 'https://www.morningsidenissan.com' + href : href;
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);

        const detailText = await page.evaluate(() => document.body.innerText);

        console.log('Full URL:', page.url());

        // Extract all details
        const priceMatch = detailText.match(/\$[\d,]+/);
        const kmMatch = detailText.match(/([\d,]+)\s*km/i);
        const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
        const stockMatch = detailText.match(/Stock[:\s#]*([A-Z0-9]+)/i) || detailText.match(/#([A-Z0-9]+)/);

        console.log('Price:', priceMatch?.[0]);
        console.log('KM:', kmMatch?.[1]);
        console.log('VIN:', vinMatch?.[1]);
        console.log('Stock:', stockMatch?.[1]);

        // Check for CARFAX
        const carfaxUrl = await page.evaluate(() => {
          const link = document.querySelector('a[href*="carfax"]');
          return link?.href;
        });
        console.log('CARFAX:', carfaxUrl);

        // Print preview
        console.log('\nListing preview:');
        console.log(detailText.substring(0, 1500));
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Kijiji search for $18,888 Soul
  console.log('\n\n=== KIJIJI - Searching for Soul listings ===\n');
  try {
    await page.goto('https://www.kijiji.ca/b-cars-trucks/gta-greater-toronto-area/kia-soul/c174l1700272a54a1000054', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);

    console.log('Page loaded, length:', text.length);

    // Search for price patterns
    if (text.includes('18,888') || text.includes('18888')) {
      console.log('FOUND $18,888 listing!');
    }

    // Extract listings
    const lines = text.split('\n');
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      if ((lines[i].match(/soul/i) && lines[i].match(/2019|2022|2023/)) ||
          lines[i].match(/\$1[5-8],\d{3}/)) {
        count++;
        console.log('\n--- Potential Listing', count, '---');
        for (let j = i; j < Math.min(lines.length, i + 6); j++) {
          const l = lines[j].trim();
          if (l) console.log('  ' + l);
        }
        if (count >= 8) break;
      }
    }

    // Find all prices in range
    const prices = text.match(/\$1[4-9],\d{3}/g);
    if (prices) {
      console.log('\nPrices in range found:', [...new Set(prices)].join(', '));
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
