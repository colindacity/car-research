const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== FOSTER KIA SCARBOROUGH - Full Soul Inventory ===\n');

  try {
    await page.goto('https://www.fosterkia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    // Get all listing links
    const links = await page.$$eval('a[href*="/used/Kia-Soul-"]', els =>
      els.map(el => ({ href: el.href, text: el.textContent?.trim() }))
    );

    console.log('Found', links.length, 'Soul listing links\n');

    // Filter for actual vehicle pages (not filters)
    const vehicleLinks = links.filter(l => l.href.match(/Soul-\d{4}/));
    console.log('Vehicle links:', vehicleLinks.length);

    // Visit each listing
    for (const link of vehicleLinks.slice(0, 8)) {
      console.log('\n--- Checking:', link.href, '---');

      try {
        await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);

        const text = await page.evaluate(() => document.body.innerText);

        // Extract year
        const yearMatch = text.match(/20(19|20|21|22|23|24)\s+Kia\s+Soul/i);
        const year = yearMatch ? yearMatch[0] : 'Unknown year';

        // Extract trim
        const trimMatch = text.match(/Soul\s+(EX\+?|LX|GT-Line|X-Line)/i);
        const trim = trimMatch ? trimMatch[1] : 'Unknown trim';

        // Extract price
        const priceMatch = text.match(/\$[\d,]+/);
        const price = priceMatch ? priceMatch[0] : 'Unknown price';

        // Extract km
        const kmMatch = text.match(/([\d,]+)\s*km/i);
        const km = kmMatch ? kmMatch[1] + ' km' : 'Unknown km';

        // Extract VIN
        const vinMatch = text.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
        const vin = vinMatch ? vinMatch[1] : 'No VIN';

        // Extract stock
        const stockMatch = text.match(/Stock[:\s#]*([A-Z0-9-]+)/i);
        const stock = stockMatch ? stockMatch[1] : 'No stock';

        // Check for CARFAX
        const carfaxUrl = await page.evaluate(() => {
          const link = document.querySelector('a[href*="carfax"]');
          return link?.href;
        });

        console.log('Year/Model:', year);
        console.log('Trim:', trim);
        console.log('Price:', price);
        console.log('KM:', km);
        console.log('VIN:', vin);
        console.log('Stock:', stock);
        console.log('CARFAX:', carfaxUrl || 'Not found');
        console.log('URL:', page.url());

      } catch (err) {
        console.log('Error loading listing:', err.message);
      }
    }

    // Get contact info
    await page.goto('https://www.fosterkia.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const mainText = await page.evaluate(() => document.body.innerText);

    const phone = mainText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const address = mainText.match(/\d+\s+[\w\s]+(?:Rd|Road|Ave|St|Dr|Blvd)[^,]*,?\s*(?:Scarborough|Toronto)[^,]*,?\s*ON/i);

    console.log('\n=== DEALER CONTACT ===');
    console.log('Phone:', phone?.[0]);
    console.log('Address:', address?.[0]);

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
