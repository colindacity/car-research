const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  // 1. Boyer - Get the 2022 Venue at $16,350
  console.log('=== BOYER HYUNDAI - 2022 Venue @ $16,350 ===\n');
  try {
    await page.goto('https://www.boyerhyundai.com/inventory/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Find the $16,350 Venue
    const venueCards = await page.$$eval('[class*="vehicle"], [class*="inventory-item"], article', cards => {
      return cards.map(card => ({
        text: card.innerText,
        link: card.querySelector('a')?.href
      })).filter(c => c.text.toLowerCase().includes('venue') && c.text.includes('16,350'));
    });

    console.log('Found cards matching $16,350:', venueCards.length);
    if (venueCards.length > 0) {
      console.log('Card text:', venueCards[0].text.substring(0, 500));
      if (venueCards[0].link) {
        console.log('Link:', venueCards[0].link);
        // Navigate to the listing
        await page.goto(venueCards[0].link, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);
      }
    }

    // Search for the 100K km Venue
    const links = await page.$$('a');
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && text.includes('100,325 km')) {
        console.log('Found 100K km link:', href);
        if (href) {
          const fullUrl = href.startsWith('/') ? 'https://www.boyerhyundai.com' + href : href;
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(4000);
          break;
        }
      }
    }

    // Get page details
    const pageText = await page.evaluate(() => document.body.innerText);
    const carfaxUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="carfax"]');
      return link ? link.href : null;
    });

    // Extract details
    const vinMatch = pageText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
    const stockMatch = pageText.match(/Stock[:\s#]*([A-Z0-9-]+)/i);
    const priceMatch = pageText.match(/\$16,350/);
    const kmMatch = pageText.match(/100,325\s*km/i);

    console.log('\n--- Boyer 2022 Venue Details ---');
    console.log('URL:', page.url());
    console.log('VIN:', vinMatch ? vinMatch[1] : 'Not found');
    console.log('Stock:', stockMatch ? stockMatch[1] : 'Not found');
    console.log('Price:', priceMatch ? '$16,350' : 'Not found');
    console.log('KM:', kmMatch ? '100,325 km' : 'Not found');
    console.log('CARFAX:', carfaxUrl);
    console.log('Phone: (905) 420-3727');

  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Thornhill - Get 2022 Venue details
  console.log('\n\n=== THORNHILL HYUNDAI - 2022 Venue ===\n');
  try {
    await page.goto('https://www.thornhillhyundai.com/inventory/used/?model=Venue', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page preview:', text.substring(0, 1500));

    // Find the Venue listing link
    const venueLink = await page.$('a:has-text("Venue")');
    if (venueLink) {
      const href = await venueLink.getAttribute('href');
      console.log('\nVenue link:', href);

      if (href) {
        const fullUrl = href.startsWith('/') ? 'https://www.thornhillhyundai.com' + href : href;
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);

        const detailText = await page.evaluate(() => document.body.innerText);
        const carfaxUrl = await page.evaluate(() => {
          const link = document.querySelector('a[href*="carfax"]');
          return link ? link.href : null;
        });

        // Parse details
        const yearMatch = detailText.match(/(2020|2021|2022|2023)\s*Hyundai\s*Venue/i);
        const trimMatch = detailText.match(/(Essential|Preferred|Trend|Ultimate)/i);
        const priceMatch = detailText.match(/\$[\d,]+/);
        const kmMatch = detailText.match(/[\d,]+\s*km/i);
        const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
        const stockMatch = detailText.match(/Stock[:\s#]*([A-Z0-9-]+)/i);
        const colorMatch = detailText.match(/(Black|White|Blue|Red|Grey|Gray|Silver|Green|Yellow)/i);

        console.log('\n--- Thornhill Venue Details ---');
        console.log('URL:', page.url());
        console.log('Year/Model:', yearMatch ? yearMatch[0] : 'Not found');
        console.log('Trim:', trimMatch ? trimMatch[1] : 'Not found');
        console.log('Price:', priceMatch ? priceMatch[0] : 'Not found');
        console.log('KM:', kmMatch ? kmMatch[0] : 'Not found');
        console.log('VIN:', vinMatch ? vinMatch[1] : 'Not found');
        console.log('Stock:', stockMatch ? stockMatch[1] : 'Not found');
        console.log('Color:', colorMatch ? colorMatch[1] : 'Not found');
        console.log('CARFAX:', carfaxUrl);

        // Get phone
        const phoneMatch = detailText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        console.log('Phone:', phoneMatch ? phoneMatch[0] : 'Check website');
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Burlington - Check venue listing
  console.log('\n\n=== BURLINGTON HYUNDAI ===\n');
  try {
    await page.goto('https://www.burlingtonhyundai.ca/inventory/used/?make=hyundai&model=venue', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page preview:', text.substring(0, 1500));

    // Find Venue link
    const venueLink = await page.$('a:has-text("Venue")');
    if (venueLink) {
      const href = await venueLink.getAttribute('href');
      console.log('\nVenue link:', href);

      if (href) {
        const fullUrl = href.startsWith('/') ? 'https://www.burlingtonhyundai.ca' + href : href;
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);

        const detailText = await page.evaluate(() => document.body.innerText);
        const carfaxUrl = await page.evaluate(() => {
          const link = document.querySelector('a[href*="carfax"]');
          return link ? link.href : null;
        });

        // Parse details
        const yearMatch = detailText.match(/(2020|2021|2022|2023)\s*Hyundai\s*Venue/i);
        const trimMatch = detailText.match(/(Essential|Preferred|Trend|Ultimate)/i);
        const priceMatch = detailText.match(/\$[\d,]+/);
        const kmMatch = detailText.match(/[\d,]+\s*km/i);
        const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);

        console.log('\n--- Burlington Venue Details ---');
        console.log('URL:', page.url());
        console.log('Year/Model:', yearMatch ? yearMatch[0] : 'Not found');
        console.log('Trim:', trimMatch ? trimMatch[1] : 'Not found');
        console.log('Price:', priceMatch ? priceMatch[0] : 'Not found');
        console.log('KM:', kmMatch ? kmMatch[0] : 'Not found');
        console.log('VIN:', vinMatch ? vinMatch[1] : 'Not found');
        console.log('CARFAX:', carfaxUrl);
      }
    } else {
      console.log('No Venue link found - listing may be sold');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
