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

  // 1. Boyer Hyundai - Get full details
  console.log('=== BOYER HYUNDAI PICKERING ===\n');
  try {
    await page.goto('https://www.boyerhyundai.com/inventory/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Find the 2022 Venue Preferred link and get more info
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Finding 2022 Venue Preferred details...\n');

    // Extract all Venue info
    const lines = text.split('\n');
    let inVenue2022 = false;
    let venue2022Info = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('2022 Hyundai Venue Preferred')) {
        inVenue2022 = true;
        venue2022Info = [trimmed];
      } else if (inVenue2022 && venue2022Info.length < 30) {
        if (trimmed.length > 0) {
          venue2022Info.push(trimmed);
        }
        if (trimmed.includes('Test Drive') || trimmed.includes('Confirm Availability')) {
          inVenue2022 = false;
        }
      }
    }

    console.log('2022 Venue Preferred at Boyer:');
    venue2022Info.forEach(l => console.log('  ' + l));

    // Try to click on the vehicle to get more details
    const venueLink = await page.$('a:has-text("2022 Hyundai Venue Preferred")');
    if (venueLink) {
      const href = await venueLink.getAttribute('href');
      console.log('\nListing URL:', href);

      if (href && href.startsWith('/')) {
        const fullUrl = 'https://www.boyerhyundai.com' + href;
        console.log('\nNavigating to listing page...');
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);

        const detailText = await page.evaluate(() => document.body.innerText);

        // Find key info
        const vinMatch = detailText.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);
        const stockMatch = detailText.match(/Stock[:\s#]*([A-Z0-9-]+)/i);
        const phoneMatch = detailText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const addressMatch = detailText.match(/\d+\s+[\w\s]+,\s*[\w\s]+,\s*ON\s*[A-Z]\d[A-Z]\s*\d[A-Z]\d/i);
        const carfaxMatch = detailText.match(/carfax|accident|clean|owner/gi);

        console.log('\n--- DETAILED INFO ---');
        console.log('VIN:', vinMatch ? vinMatch[1] : 'Not found');
        console.log('Stock:', stockMatch ? stockMatch[1] : 'Not found');
        console.log('Phone:', phoneMatch ? phoneMatch[0] : 'Not found');
        console.log('Address:', addressMatch ? addressMatch[0] : 'Not found');
        console.log('CARFAX mentions:', carfaxMatch ? carfaxMatch.join(', ') : 'None');

        // Find CARFAX link
        const carfaxUrl = await page.evaluate(() => {
          const link = document.querySelector('a[href*="carfax"]');
          return link ? link.href : null;
        });
        console.log('CARFAX URL:', carfaxUrl || 'Not found');

        // Get listing URL
        console.log('Full listing URL:', page.url());
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Thornhill Hyundai - Check for our 2022 Venue
  console.log('\n\n=== THORNHILL HYUNDAI ===\n');
  try {
    await page.goto('https://www.thornhillhyundai.com/inventory/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', text.length);

    if (text.toLowerCase().includes('venue')) {
      console.log('VENUE FOUND!');
      const lines = text.split('\n').filter(l => l.toLowerCase().includes('venue'));
      lines.forEach(l => console.log('  ' + l.trim()));
    } else {
      console.log('No Venue found on main page');

      // Try with filter
      console.log('\nTrying with Venue filter...');
      await page.goto('https://www.thornhillhyundai.com/inventory/used/?model=Venue', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);

      const filteredText = await page.evaluate(() => document.body.innerText);
      console.log('Filtered page length:', filteredText.length);

      if (filteredText.toLowerCase().includes('venue')) {
        console.log('VENUE FOUND with filter!');
        const lines = filteredText.split('\n').filter(l => l.toLowerCase().includes('venue'));
        lines.forEach(l => console.log('  ' + l.trim()));
      } else {
        console.log('Still no Venue - checking all vehicles...');
        // Show first few vehicles
        const vehicles = filteredText.split('\n').filter(l => l.match(/^\d{4}\s+Hyundai/));
        console.log('Vehicles found:', vehicles.slice(0, 10));
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Burlington Hyundai - Check for our 2021 Venue
  console.log('\n\n=== BURLINGTON HYUNDAI ===\n');
  try {
    await page.goto('https://www.burlingtonhyundai.ca/inventory/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', text.length);

    if (text.toLowerCase().includes('venue')) {
      console.log('VENUE FOUND!');
      const lines = text.split('\n').filter(l => l.toLowerCase().includes('venue'));
      lines.forEach(l => console.log('  ' + l.trim()));
    } else {
      console.log('No Venue found on main page');

      // Try search
      console.log('\nTrying with venue search...');
      await page.goto('https://www.burlingtonhyundai.ca/inventory/used/?make=hyundai&model=venue', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);

      const filteredText = await page.evaluate(() => document.body.innerText);
      if (filteredText.toLowerCase().includes('venue')) {
        console.log('VENUE FOUND with filter!');
      } else {
        console.log('No Venue with filter either');
        // Try direct URL we had before
        console.log('\nTrying direct listing URL...');
        await page.goto('https://www.burlingtonhyundai.ca/inventory/used-hyundai-venue-burlington-ontario-c2m3mo799vlp/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);

        const directText = await page.evaluate(() => document.body.innerText);
        if (directText.toLowerCase().includes('venue') || directText.toLowerCase().includes('2021')) {
          console.log('Direct listing found!');
          console.log(directText.substring(0, 1000));
        } else if (directText.toLowerCase().includes('not found') || directText.toLowerCase().includes('sorry')) {
          console.log('Listing no longer exists - likely SOLD');
        }
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 4. Gyro Hyundai - Get full details
  console.log('\n\n=== GYRO HYUNDAI ===\n');
  try {
    await page.goto('https://gyrohyundai.com/vehicles/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', text.length);

    // Find Venue listings
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('venue')) {
        console.log('\nVenue context:');
        for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 10); j++) {
          console.log('  ' + lines[j].trim());
        }
      }
    }

    // Try to find venue links
    const venueLinks = await page.$$('a:has-text("Venue")');
    console.log('\nVenue links found:', venueLinks.length);

    for (const link of venueLinks.slice(0, 3)) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log('  Link:', text?.trim(), '->', href);
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
