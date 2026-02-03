const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== NEWROADS MAZDA ===');
  console.log('Looking for: 2020 Kia Soul EX+, $15,488, One Owner, Accident-Free\n');

  try {
    await page.goto('https://www.newroadsmazda.ca/used-vehicles/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', text.length);

    if (text.toLowerCase().includes('soul')) {
      console.log('\nSOUL FOUND!');
      const lines = text.split('\n');
      let inSoul = false;
      let soulLines = [];

      for (const line of lines) {
        if (line.toLowerCase().includes('soul')) {
          inSoul = true;
          soulLines = [line];
        } else if (inSoul && soulLines.length < 20) {
          soulLines.push(line);
        }
      }

      console.log('Details:');
      soulLines.forEach(l => console.log('  ' + l.trim()));

      // Get listing link
      const soulLink = await page.$('a:has-text("Soul")');
      if (soulLink) {
        const href = await soulLink.getAttribute('href');
        console.log('\nListing URL:', href);

        if (href) {
          const fullUrl = href.startsWith('/') ? 'https://www.newroadsmazda.ca' + href : href;
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(4000);

          const detailText = await page.evaluate(() => document.body.innerText);

          // Extract details
          const priceMatch = detailText.match(/\$[\d,]+/);
          const kmMatch = detailText.match(/[\d,]+\s*km/i);
          const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
          const stockMatch = detailText.match(/Stock[:\s#]*([A-Z0-9-]+)/i);

          console.log('\n--- LISTING DETAILS ---');
          console.log('Full URL:', page.url());
          console.log('Price:', priceMatch ? priceMatch[0] : 'Not found');
          console.log('KM:', kmMatch ? kmMatch[0] : 'Not found');
          console.log('VIN:', vinMatch ? vinMatch[1] : 'Not found');
          console.log('Stock:', stockMatch ? stockMatch[1] : 'Not found');

          // CARFAX
          const carfaxUrl = await page.evaluate(() => {
            const link = document.querySelector('a[href*="carfax"]');
            return link?.href;
          });
          console.log('CARFAX:', carfaxUrl);

          // Print some detail text
          console.log('\nListing text preview:');
          console.log(detailText.substring(0, 1500));
        }
      }
    } else {
      console.log('Soul not found on main page');

      // Try search
      await page.goto('https://www.newroadsmazda.ca/used-vehicles/?make=Kia', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const searchText = await page.evaluate(() => document.body.innerText);
      console.log('Search for Kia - page length:', searchText.length);

      if (searchText.toLowerCase().includes('soul')) {
        console.log('SOUL FOUND via search!');
      } else {
        console.log('No Soul found even with Kia filter');
      }
    }

    // Get contact info
    const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('\nPhone:', phoneMatch ? phoneMatch[0] : 'Not found');

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
