const { chromium } = require('playwright');

// All major Hyundai, Kia, and Nissan dealers within 100km of Thornhill
const DEALERS = [
  // Hyundai dealers
  { name: 'Boyer Hyundai Pickering', url: 'https://www.boyerhyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Thornhill Hyundai', url: 'https://www.thornhillhyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Burlington Hyundai', url: 'https://www.burlingtonhyundai.ca/inventory/used/', brand: 'Hyundai' },
  { name: 'Gyro Hyundai Toronto', url: 'https://gyrohyundai.com/vehicles/used/', brand: 'Hyundai' },
  { name: 'Richmond Hill Hyundai', url: 'https://www.richmondhillhyundai.com/inventory/', brand: 'Hyundai' },
  { name: 'Stouffville Hyundai', url: 'https://www.stouffvillehyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Agincourt Hyundai', url: 'https://www.agincourtmazda.com/en/used-inventory', brand: 'Hyundai' }, // Actually Mazda dealer with Hyundai trades
  { name: 'Queensway Hyundai', url: 'https://www.queenswayhyundai.ca/inventory/used/', brand: 'Hyundai' },
  { name: 'Whitby Hyundai', url: 'https://www.whitbyhyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Barrie Hyundai', url: 'https://www.barriehyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Markville Hyundai', url: 'https://www.markvillehyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Milton Hyundai', url: 'https://www.miltonhyundai.com/inventory/used/', brand: 'Hyundai' },
  { name: 'Performance Hyundai', url: 'https://www.performancehyundai.ca/inventory/used/', brand: 'Hyundai' },
  { name: 'OpenRoad Hyundai', url: 'https://www.openroadhyundai.com/inventory/used/', brand: 'Hyundai' },

  // Kia dealers (may have Soul as trade-ins OR used)
  { name: 'Kia on the Trail', url: 'https://www.kiaonthetrail.com/inventory/used/', brand: 'Kia' },
  { name: 'Oakville Kia', url: 'https://www.oakvillekia.ca/inventory/used/', brand: 'Kia' },
  { name: 'Georgetown Kia', url: 'https://www.georgetownkia.com/inventory/used/', brand: 'Kia' },
  { name: 'Whitby Kia', url: 'https://www.whitbykia.com/inventory/used/', brand: 'Kia' },
  { name: 'Brampton Kia', url: 'https://www.bramptonkia.ca/inventory/used/', brand: 'Kia' },

  // Nissan dealers (for Kicks)
  { name: 'Scarborough Nissan', url: 'https://www.scarboroughnissan.ca/inventory/used/', brand: 'Nissan' },
  { name: 'Ajax Nissan', url: 'https://www.ajaxnissan.com/inventory/used/', brand: 'Nissan' },
  { name: 'Pickering Nissan', url: 'https://www.pickeringnissan.com/inventory/used/', brand: 'Nissan' },
  { name: 'Oakville Nissan', url: 'https://www.oakvillenissan.ca/inventory/used/', brand: 'Nissan' },
];

const SEARCH_TERMS = ['venue', 'soul', 'kicks'];
const MAX_PRICE = 19000;
const MAX_KM = 130000;

async function searchDealer(page, dealer) {
  console.log(`\n=== ${dealer.name} (${dealer.brand}) ===`);
  console.log(`URL: ${dealer.url}`);

  try {
    await page.goto(dealer.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(4000);

    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.length === 0) {
      console.log('Page empty, retrying...');
      await page.waitForTimeout(3000);
    }

    const text = await page.evaluate(() => document.body.innerText);

    const results = [];

    for (const term of SEARCH_TERMS) {
      if (text.toLowerCase().includes(term)) {
        // Found a match - extract details
        const lines = text.split('\n');
        let currentVehicle = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Look for vehicle title
          if (line.toLowerCase().includes(term)) {
            const yearMatch = line.match(/(2019|202[0-5])/);
            if (yearMatch) {
              // Save previous vehicle
              if (currentVehicle && currentVehicle.title) {
                results.push({ ...currentVehicle, dealer: dealer.name });
              }
              currentVehicle = { title: line, rawLines: [] };
            }
          }

          // Collect nearby lines for context
          if (currentVehicle && currentVehicle.rawLines.length < 20) {
            if (line.match(/\$[\d,]+|[\d,]+\s*km|preferred|trend|ultimate|essential|ex|lx|sv|sr/i)) {
              currentVehicle.rawLines.push(line);
            }
          }
        }

        // Save last vehicle
        if (currentVehicle && currentVehicle.title) {
          results.push({ ...currentVehicle, dealer: dealer.name });
        }
      }
    }

    // Filter and display results
    const validResults = results.filter(r => {
      const titleLower = r.title.toLowerCase();
      // Skip Essential trim for Venue
      if (titleLower.includes('venue') && titleLower.includes('essential')) return false;
      // Skip LX trim for Soul
      if (titleLower.includes('soul') && titleLower.includes('lx') && !titleLower.includes('ex')) return false;
      // Skip S trim for Kicks (want SV or SR)
      if (titleLower.includes('kicks') && titleLower.match(/\bs\b/) && !titleLower.match(/sv|sr/i)) return false;
      return true;
    });

    if (validResults.length > 0) {
      console.log(`Found ${validResults.length} matching vehicles:`);
      validResults.forEach(v => {
        console.log(`\n  ${v.title}`);
        v.rawLines.slice(0, 8).forEach(l => console.log(`    ${l}`));
      });
      return validResults;
    } else {
      // Check if any of our terms appear at all
      const hasVenue = text.toLowerCase().includes('venue');
      const hasSoul = text.toLowerCase().includes('soul');
      const hasKicks = text.toLowerCase().includes('kicks');
      if (hasVenue || hasSoul || hasKicks) {
        console.log(`Has mentions: Venue=${hasVenue}, Soul=${hasSoul}, Kicks=${hasKicks}`);
        // Show raw matches
        const lines = text.split('\n').filter(l => {
          const lower = l.toLowerCase();
          return (lower.includes('venue') || lower.includes('soul') || lower.includes('kicks')) &&
                 l.length > 10 && l.length < 200;
        });
        lines.slice(0, 5).forEach(l => console.log(`  ${l.trim()}`));
      } else {
        console.log('No Venue/Soul/Kicks found');
      }
    }

    return [];
  } catch (err) {
    console.log(`Error: ${err.message.substring(0, 100)}`);
    return [];
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  const allResults = [];

  for (const dealer of DEALERS) {
    const results = await searchDealer(page, dealer);
    allResults.push(...results);
  }

  console.log('\n\n========================================');
  console.log('SUMMARY - All Valid Listings Found');
  console.log('========================================\n');

  allResults.forEach((r, i) => {
    console.log(`${i + 1}. ${r.dealer}`);
    console.log(`   ${r.title}`);
    r.rawLines.slice(0, 3).forEach(l => console.log(`   ${l}`));
    console.log('');
  });

  await browser.close();
}

main().catch(console.error);
