const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // 1. Gyro Hyundai - get full details
  console.log('\n=== GYRO HYUNDAI ===');
  try {
    await page.goto('https://gyrohyundai.com/vehicles/used/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(5000);

    // Try to find Venue listings
    const gyroText = await page.evaluate(() => document.body.innerText);
    const venueLines = gyroText.split('\n').filter(l => l.toLowerCase().includes('venue'));
    console.log('Venue mentions:', venueLines.length);
    venueLines.forEach(l => console.log('  ', l.trim().substring(0, 200)));

    // Try clicking on Venue filter or searching
    const venueLinks = await page.$$('a:has-text("Venue")');
    console.log('Venue links found:', venueLinks.length);

    // Get all vehicle cards
    const vehicles = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.vehicle-card, .srp-card, [data-vehicle], .inventory-item').forEach(el => {
        results.push(el.innerText.substring(0, 400));
      });
      return results;
    });
    console.log('Vehicle cards:', vehicles.length);
    vehicles.filter(v => v.toLowerCase().includes('venue')).forEach((v, i) => {
      console.log(`\n--- Venue ${i+1} ---`);
      console.log(v.replace(/\n+/g, ' | '));
    });
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Thornhill Hyundai - specific Venue search
  console.log('\n=== THORNHILL HYUNDAI ===');
  try {
    await page.goto('https://www.thornhillhyundai.com/inventory/used/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(5000);

    const thornhillText = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', thornhillText.length);

    // Look for any vehicle listings
    const allVehicles = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.vehicle-card, .inventory-item, [class*="vehicle"], article, .srp-item').forEach(el => {
        if (el.innerText.length > 50) {
          results.push(el.innerText.substring(0, 300));
        }
      });
      return results;
    });
    console.log('Found', allVehicles.length, 'vehicle elements');
    allVehicles.slice(0, 5).forEach((v, i) => {
      console.log(`\n--- Vehicle ${i+1} ---`);
      console.log(v.replace(/\n+/g, ' | '));
    });

    // Check for Venue specifically
    if (thornhillText.toLowerCase().includes('venue')) {
      console.log('\nVENUE FOUND!');
      const lines = thornhillText.split('\n').filter(l => l.toLowerCase().includes('venue'));
      lines.forEach(l => console.log('  ', l.trim()));
    } else {
      console.log('\nNo Venue found in page text');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Burlington Hyundai
  console.log('\n=== BURLINGTON HYUNDAI ===');
  try {
    await page.goto('https://www.burlingtonhyundai.ca/inventory/used/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(5000);

    const burlingtonText = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', burlingtonText.length);

    if (burlingtonText.toLowerCase().includes('venue')) {
      console.log('VENUE FOUND!');
      const lines = burlingtonText.split('\n').filter(l => l.toLowerCase().includes('venue'));
      lines.forEach(l => console.log('  ', l.trim()));
    } else {
      console.log('No Venue in text, checking all vehicles...');
      const vehicles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.vehicle-card, .inventory-item, [class*="vehicle"]'))
          .map(el => el.innerText.substring(0, 200));
      });
      console.log('Found', vehicles.length, 'vehicle cards');
      vehicles.slice(0, 3).forEach(v => console.log('  ', v.replace(/\n+/g, ' | ')));
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 4. Try direct listing URLs
  console.log('\n=== DIRECT LISTING URLS ===');

  // Thornhill direct
  try {
    console.log('\nTrying Thornhill direct listing...');
    await page.goto('https://www.thornhillhyundai.com/inventory/used/6187/2022/Hyundai/Venue', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.toLowerCase().includes('venue')) {
      console.log('FOUND! Extracting details...');
      const lines = text.split('\n').slice(0, 50);
      lines.forEach(l => {
        if (l.trim() && (l.match(/\$|km|price|stock|vin|venue|preferred|2022/i))) {
          console.log('  ', l.trim());
        }
      });
    } else {
      console.log('Page does not show Venue');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // Burlington direct
  try {
    console.log('\nTrying Burlington direct search...');
    await page.goto('https://www.burlingtonhyundai.ca/inventory/used/?make=hyundai&model=venue', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.toLowerCase().includes('venue')) {
      console.log('FOUND! Extracting details...');
      const lines = text.split('\n');
      lines.forEach(l => {
        if (l.trim() && l.match(/venue|2021|2022|price|\$|km|preferred/i)) {
          console.log('  ', l.trim().substring(0, 150));
        }
      });
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
