const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Morningside Nissan - get Soul details and CARFAX
  console.log('=== MORNINGSIDE NISSAN - 2022 Kia Soul EX ===\n');
  try {
    await page.goto('https://www.morningsidenissan.com/en/used-inventory', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Find Soul link
    const soulLink = await page.$('a:has-text("Soul")');
    if (soulLink) {
      const href = await soulLink.getAttribute('href');
      const fullUrl = href?.startsWith('/') ? 'https://www.morningsidenissan.com' + href : href;

      if (fullUrl) {
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);

        console.log('Listing URL:', page.url());

        const text = await page.evaluate(() => document.body.innerText);
        const priceMatch = text.match(/\$[\d,]+/);
        console.log('Price:', priceMatch?.[0]);

        const carfaxUrl = await page.evaluate(() => {
          const link = document.querySelector('a[href*="carfax"]');
          return link?.href;
        });
        console.log('CARFAX URL:', carfaxUrl);

        // Check features
        if (text.includes('accident')) console.log('Accident status mentioned');
        if (text.includes('Certified')) console.log('Vehicle is Certified');
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Stouffville Nissan - get Kicks details and CARFAX
  console.log('\n\n=== STOUFFVILLE NISSAN - 2021 Kicks SV ===\n');
  try {
    await page.goto('https://www.stouffvillenissan.com/en/used-inventory', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('kicks')) {
      console.log('KICKS FOUND!');

      // Find 2021 Kicks SV link
      const kicksLinks = await page.$$('a');
      for (const link of kicksLinks) {
        const linkText = await link.textContent();
        if (linkText && linkText.includes('Kicks') && (linkText.includes('2021') || linkText.includes('SV'))) {
          const href = await link.getAttribute('href');
          console.log('Found link:', linkText.substring(0, 50), '->', href);

          if (href && href.includes('inventory')) {
            const fullUrl = href.startsWith('/') ? 'https://www.stouffvillenissan.com' + href : href;
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(4000);

            console.log('\nListing URL:', page.url());

            const detailText = await page.evaluate(() => document.body.innerText);
            const priceMatch = detailText.match(/\$[\d,]+/);
            const kmMatch = detailText.match(/([\d,]+)\s*km/i);
            console.log('Price:', priceMatch?.[0]);
            console.log('KM:', kmMatch?.[1]);

            const carfaxUrl = await page.evaluate(() => {
              const link = document.querySelector('a[href*="carfax"]');
              return link?.href;
            });
            console.log('CARFAX URL:', carfaxUrl);
            break;
          }
        }
      }
    }

    // Get contact
    const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('Phone:', phone?.[0]);
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Newmarket Nissan - get 2021 Kicks SV
  console.log('\n\n=== NEWMARKET NISSAN - 2021 Kicks SV ===\n');
  try {
    await page.goto('https://www.newmarketnissan.com/en/used-inventory', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('kicks')) {
      console.log('KICKS FOUND!');

      // Find the $17,910 one
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('17,910') || (lines[i].toLowerCase().includes('kicks') && lines[i].includes('2021'))) {
          console.log('\n--- Listing Context ---');
          for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 12); j++) {
            console.log(lines[j].trim());
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
