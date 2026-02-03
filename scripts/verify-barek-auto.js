const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Barek Automotive - 2022 Soul EX $16,999
  console.log('=== BAREK AUTOMOTIVE - 2022 Kia Soul EX ===');
  console.log('Looking for: $16,999, 71,459 km, VIN: KNDJ33AU9N7173836\n');

  try {
    // Try main site
    await page.goto('https://www.barekautomotive.com/used-vehicles/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    let text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND ON MAIN PAGE!');
    } else {
      console.log('Trying alternate URL...');
      await page.goto('https://www.barekautomotive.com/inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);
      text = await page.evaluate(() => document.body.innerText);
    }

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

      // Get listing link
      const soulLink = await page.$('a:has-text("Soul")');
      if (soulLink) {
        const href = await soulLink.getAttribute('href');
        console.log('\nListing link:', href);

        if (href) {
          const fullUrl = href.startsWith('/') ? 'https://www.barekautomotive.com' + href : href;
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(4000);

          const detailText = await page.evaluate(() => document.body.innerText);

          // Extract details
          const priceMatch = detailText.match(/\$[\d,]+/);
          const kmMatch = detailText.match(/([\d,]+)\s*km/i);
          const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
          const stockMatch = detailText.match(/Stock[:\s#]*([A-Z0-9-]+)/i);

          console.log('\n--- LISTING DETAILS ---');
          console.log('Full URL:', page.url());
          console.log('Price:', priceMatch ? priceMatch[0] : 'Not found');
          console.log('KM:', kmMatch ? kmMatch[1] + ' km' : 'Not found');
          console.log('VIN:', vinMatch ? vinMatch[1] : 'Not found');
          console.log('Stock:', stockMatch ? stockMatch[1] : 'Not found');

          // CARFAX
          const carfaxUrl = await page.evaluate(() => {
            const link = document.querySelector('a[href*="carfax"]');
            return link?.href;
          });
          console.log('CARFAX:', carfaxUrl || 'Not found');
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('Soul not found at Barek Automotive');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Try CarGurus for the same listing
  console.log('\n\n=== CARGURUS - 2022 Kia Soul EX ===\n');
  try {
    await page.goto('https://www.cargurus.ca/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?zip=L4J&showNegotiable=true&sortDir=ASC&sourceContext=carGurusHomePageModel&distance=75&sortType=DEAL_SCORE&entitySelectingHelper.selectedEntity=d2020', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND ON CARGURUS!');

      const lines = text.split('\n');
      let soulCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023/)) {
          soulCount++;
          console.log('\n--- Soul Listing', soulCount, '---');
          for (let j = i; j < Math.min(lines.length, i + 8); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          if (soulCount >= 5) break;
        }
      }
    } else {
      console.log('No Soul found on CarGurus');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Carpages for more listings
  console.log('\n\n=== CARPAGES - Kia Soul GTA ===\n');
  try {
    await page.goto('https://www.carpages.ca/used-cars/ontario/toronto/kia/soul/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL LISTINGS ON CARPAGES!');

      const lines = text.split('\n');
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/20(19|22|23|24)\s+Kia\s+Soul/i)) {
          count++;
          console.log('\n--- Listing', count, '---');
          for (let j = i; j < Math.min(lines.length, i + 10); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          if (count >= 6) break;
        }
      }
    } else {
      console.log('No Soul found on Carpages');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
