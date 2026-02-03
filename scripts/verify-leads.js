const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const results = [];

  // 1. Morningside Nissan - 2022 Kia Soul EX
  console.log('=== MORNINGSIDE NISSAN - 2022 Kia Soul EX ===\n');
  try {
    await page.goto('https://www.morningsidenissan.com/en/used-inventory', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul')) {
          console.log('\nContext:');
          for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          break;
        }
      }

      // Get Soul listing link
      const soulLink = await page.$('a:has-text("Soul")');
      if (soulLink) {
        const href = await soulLink.getAttribute('href');
        console.log('\nListing URL:', href);
      }

      // Get contact
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);
    } else {
      console.log('Soul not found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Carpages 2020 Venue Trend listing
  console.log('\n\n=== CARPAGES - 2020 Venue Trend ===\n');
  try {
    await page.goto('https://www.carpages.ca/used-cars/ontario/toronto/2020-hyundai-venue-11843402/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('venue')) {
      console.log('LISTING FOUND!');

      // Extract key details
      const priceMatch = text.match(/\$[\d,]+/);
      const kmMatch = text.match(/([\d,]+)\s*KM/i);
      const vinMatch = text.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);

      console.log('Price:', priceMatch?.[0]);
      console.log('KM:', kmMatch?.[1]);
      console.log('VIN:', vinMatch?.[1]);

      // Find dealer info
      const dealerMatch = text.match(/([A-Za-z\s]+(?:Auto|Motors|Hyundai|Kia|Nissan|Mazda|Honda|Toyota)[A-Za-z\s]*)/i);
      console.log('Dealer:', dealerMatch?.[1]?.trim());

      // Get phone
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      // Get address
      const addressMatch = text.match(/\d+\s+[\w\s]+(?:St|Ave|Rd|Dr|Blvd)[\s,]+[\w\s]+,?\s*ON/i);
      console.log('Address:', addressMatch?.[0]);

      // CARFAX
      const carfaxUrl = await page.evaluate(() => {
        const link = document.querySelector('a[href*="carfax"]');
        return link?.href;
      });
      console.log('CARFAX:', carfaxUrl);

      // Print listing preview
      console.log('\nListing preview:');
      console.log(text.substring(0, 1200));
    } else {
      console.log('Listing not found or sold');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Zanchin Auto - 2022 Kicks SV
  console.log('\n\n=== ZANCHIN AUTO - 2022 Nissan Kicks SV ===\n');
  try {
    await page.goto('https://www.zanchinauto.com/used/Nissan-Kicks.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('kicks')) {
      console.log('KICKS FOUND!');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('kicks') && lines[i].match(/2021|2022/)) {
          console.log('\n--- Kicks Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 15); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }

      // Get phone
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Kicks found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
