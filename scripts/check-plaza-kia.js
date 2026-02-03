const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== PLAZA KIA RICHMOND HILL - Soul Details ===\n');

  try {
    await page.goto('https://www.plazakia.com/en/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    // Print full listing text
    const lines = text.split('\n');
    let inSoul = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/Soul/i) && lines[i].match(/2019|2020|2021|2022|2023/)) {
        inSoul = true;
        console.log('\n--- Soul Listing ---');
      }

      if (inSoul) {
        const l = lines[i].trim();
        if (l) console.log('  ' + l);
        if (l.match(/^\d+\s*km/i) || l.match(/^(Auto|Manual)/i)) {
          // End of this listing
          console.log('');
          inSoul = false;
        }
      }
    }

    // Find all prices in vehicle range
    const prices = text.match(/\$[\d,]+/g);
    if (prices) {
      const vehiclePrices = [...new Set(prices)].filter(p => {
        const num = parseInt(p.replace(/[$,]/g, ''));
        return num >= 10000 && num <= 30000;
      });
      console.log('\n\nVehicle prices found:', vehiclePrices.join(', '));
    }

    const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('Phone:', phone?.[0]);

    // Get address
    const address = text.match(/\d+\s+[\w\s]+(?:Ave|St|Dr|Blvd|Rd)[^,]*,?\s*Richmond\s*Hill/i);
    console.log('Address:', address?.[0]);

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
