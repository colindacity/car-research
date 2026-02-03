const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== PETERBOROUGH KIA - 2019 Kia Soul EX ===\n');
  console.log('Looking for: $16,998, Stock #2185\n');

  try {
    await page.goto('https://www.peterboroughkia.ca/used/2019-Kia-Soul-id13256753.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    // Extract details
    const priceMatch = text.match(/\$[\d,]+/);
    const kmMatch = text.match(/([\d,]+)\s*km/i);
    const vinMatch = text.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
    const stockMatch = text.match(/Stock[:\s#]*([A-Z0-9]+)/i);
    const colorMatch = text.match(/(?:Colour|Color|Exterior)[:\s]*(\w+(?:\s+\w+)?)/i);

    console.log('Price:', priceMatch?.[0]);
    console.log('KM:', kmMatch?.[1]);
    console.log('VIN:', vinMatch?.[1]);
    console.log('Stock:', stockMatch?.[1]);
    console.log('Color:', colorMatch?.[1]);

    // CARFAX
    const carfaxUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="carfax"]');
      return link?.href;
    });
    console.log('CARFAX:', carfaxUrl);

    // Check for certification
    if (text.toLowerCase().includes('certified')) {
      console.log('Certified: Yes');
    }

    // Check for accident status
    if (text.toLowerCase().includes('no accident')) {
      console.log('Accident Status: No Accidents');
    } else if (text.toLowerCase().includes('accident')) {
      console.log('Accident Status: Has Accident History');
    }

    // Print preview
    console.log('\n--- Listing Preview ---');
    const lines = text.split('\n');
    let count = 0;
    for (const line of lines) {
      const l = line.trim();
      if (l && !l.match(/^[.]{2,}$/) && l.length > 3 && l.length < 100) {
        console.log(l);
        count++;
        if (count > 40) break;
      }
    }

    const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('\nPhone:', phone?.[0]);

    // Calculate distance from Thornhill
    console.log('\nDistance from Thornhill: ~140 km');

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
