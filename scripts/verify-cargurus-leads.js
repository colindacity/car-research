const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Foster Kia Scarborough - has Soul inventory
  console.log('=== FOSTER KIA SCARBOROUGH ===\n');
  try {
    await page.goto('https://www.fosterkia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    // Find all listings
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/20(17|18|19|20|21|22|23)\s+Kia\s+Soul/i) ||
          (line.includes('Soul') && line.match(/EX|Premium|Plus/i))) {
        console.log('\n--- Listing ---');
        for (let j = i; j < Math.min(lines.length, i + 12); j++) {
          const l = lines[j].trim();
          if (l) console.log('  ' + l);
        }
      }
    }

    // Get prices
    const prices = text.match(/\$[\d,]+/g);
    if (prices) {
      const vehiclePrices = [...new Set(prices)].filter(p => {
        const n = parseInt(p.replace(/[$,]/g, ''));
        return n >= 10000 && n <= 22000;
      });
      console.log('\n\nPrices found:', vehiclePrices.join(', '));
    }

    // KMs
    const kms = text.match(/[\d,]+\s*km/gi);
    if (kms) {
      console.log('KMs found:', [...new Set(kms)].join(', '));
    }

    const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('Phone:', phone?.[0]);

    // Address
    const addr = text.match(/\d+\s+[\w\s]+(?:Rd|Road|Ave|St|Dr|Blvd)[^,]*,?\s*Scarborough/i);
    console.log('Address:', addr?.[0]);

  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Longman's Markham Kia
  console.log('\n\n=== LONGMANS MARKHAM KIA ===\n');
  try {
    await page.goto('https://www.longmansmarkhamkia.ca/en/used-inventory', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/20(17|18|19|20|21|22|23)/)) {
          console.log('\n--- Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 10); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. CarGurus specific listing page
  console.log('\n\n=== CARGURUS - Top Deals ===\n');
  try {
    // Sort by best deal
    await page.goto('https://www.cargurus.ca/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?zip=L4J&showNegotiable=true&sortDir=ASC&sourceContext=carGurusHomePageModel&distance=75&sortType=DEAL_SCORE&entitySelectingHelper.selectedEntity=d2020', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);

    // Find Soul listings
    const lines = text.split('\n');
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/20(17|18|19|20|21|22|23)\s+Kia\s+Soul/i)) {
        count++;
        console.log(`\n[${count}]`, line.trim());
        for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
          const l = lines[j].trim();
          if (l && l.length < 80) console.log('   ', l);
        }
        if (count >= 6) break;
      }
    }

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
