const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== MISSISSAUGA KIA - Soul EX Details ===\n');

  try {
    // Filter for EX only
    await page.goto('https://www.mississaugakia.com/used/Kia-Soul-EX.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    // Get all links to Soul listings
    const soulLinks = await page.$$eval('a[href*="/used/Kia-Soul"]', els =>
      els.map(el => ({ href: el.href, text: el.textContent?.trim().substring(0, 80) }))
    );

    console.log('Soul links found:', soulLinks.length);
    soulLinks.forEach(l => console.log('  -', l.text, '->', l.href));

    // Find listing link
    const listingLink = soulLinks.find(l =>
      l.href.match(/Soul-\d{4}/) || l.href.includes('Kia-Soul-EX-')
    );

    if (listingLink) {
      console.log('\nNavigating to listing:', listingLink.href);

      await page.goto(listingLink.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const detailText = await page.evaluate(() => document.body.innerText);

      console.log('\n--- LISTING DETAILS ---');
      console.log('URL:', page.url());

      // Extract details
      const priceMatch = detailText.match(/\$[\d,]+/);
      const kmMatch = detailText.match(/([\d,]+)\s*km/i);
      const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
      const stockMatch = detailText.match(/Stock[:\s#]*([A-Z0-9-]+)/i);
      const yearMatch = detailText.match(/20(19|22|23)\s+Kia\s+Soul/i);

      console.log('Year:', yearMatch ? '20' + yearMatch[1] : 'Unknown');
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

      // Print listing preview
      console.log('\nListing preview:');
      console.log(detailText.substring(0, 2000));
    } else {
      console.log('\nNo direct listing link found, printing page context:');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|ex/i)) {
          console.log('\n--- Context ---');
          for (let j = i; j < Math.min(lines.length, i + 20); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          break;
        }
      }
    }

    const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('\nPhone:', phone?.[0]);

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
