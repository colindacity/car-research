const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Foster Kia Scarborough - Official Kia dealer
  console.log('=== FOSTER KIA SCARBOROUGH ===\n');
  try {
    await page.goto('https://www.fosterkia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL LISTINGS FOUND!\n');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/soul/i) && lines[i].match(/2019|2022|2023/)) {
          console.log('--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          console.log('');
        }
      }

      // Get phone
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      // Get address
      const address = text.match(/\d+\s+[\w\s]+(?:Rd|Ave|St|Dr|Blvd)[\s,]+[\w\s]+,?\s*ON/i);
      console.log('Address:', address?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Toronto Kia - Official Kia dealer
  console.log('\n\n=== TORONTO KIA ===\n');
  try {
    await page.goto('https://www.torontokia.com/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL LISTINGS FOUND!\n');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/soul/i) && lines[i].match(/2019|2022|2023/)) {
          console.log('--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          console.log('');
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Kia of Newmarket - search for used Soul
  console.log('\n\n=== KIA OF NEWMARKET ===\n');
  try {
    await page.goto('https://www.kiaofnewmarket.com/inventory/used/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/soul/i)) {
          console.log('--- Context ---');
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 10); j++) {
            console.log('  ' + lines[j].trim());
          }
          break;
        }
      }
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
