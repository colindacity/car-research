const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // Brantford Honda - verify the 2022 Kia Soul EX
  console.log('=== BRANTFORD HONDA ===');
  console.log('Looking for: 2022 Kia Soul EX, $16,999, 71,459 km, VIN: KNDJ33AU9N7173836\n');

  try {
    await page.goto('https://www.brantfordhonda.com/used-vehicles/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page length:', text.length);

    // Search for Soul
    if (text.toLowerCase().includes('soul')) {
      console.log('\nSOUL FOUND! Extracting details...');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul')) {
          // Print context
          console.log('\n--- Soul Context ---');
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 15); j++) {
            console.log(lines[j].trim());
          }
          break;
        }
      }
    } else {
      console.log('Soul not found on main used page');

      // Try search
      console.log('\nTrying search for Kia...');
      await page.goto('https://www.brantfordhonda.com/used-vehicles/?make=Kia', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const searchText = await page.evaluate(() => document.body.innerText);
      if (searchText.toLowerCase().includes('soul')) {
        console.log('SOUL FOUND via search!');
        const lines = searchText.split('\n').filter(l => l.toLowerCase().includes('soul') || l.match(/\$|km|kia/i));
        lines.slice(0, 20).forEach(l => console.log('  ' + l.trim()));
      }
    }

    // Try to find the specific VIN
    const vinSearch = await page.goto('https://www.brantfordhonda.com/used-vehicles/?search=KNDJ33AU9N7173836', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const vinText = await page.evaluate(() => document.body.innerText);
    if (vinText.toLowerCase().includes('soul') || vinText.includes('KNDJ33')) {
      console.log('\n--- FOUND BY VIN ---');
      console.log(vinText.substring(0, 2000));
    }

    // Get contact info
    const contactInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const addressMatch = text.match(/\d+\s+[\w\s]+(?:Rd|St|Ave|Dr|Blvd)[\s,]+[\w\s]+,?\s*ON/i);
      return { phone: phoneMatch?.[0], address: addressMatch?.[0] };
    });

    console.log('\nDealer Contact:');
    console.log('Phone:', contactInfo.phone);
    console.log('Address:', contactInfo.address);

    // Look for CARFAX link
    const carfaxUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="carfax"]');
      return link?.href;
    });
    console.log('CARFAX URL:', carfaxUrl);

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
