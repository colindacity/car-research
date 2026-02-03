const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log("=== LONGMAN'S MARKHAM KIA - Soul Inventory ===\n");

  try {
    await page.goto('https://www.longmansmarkhamkia.ca/en/used/Kia-Soul.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);
    console.log('\n--- Full page text ---');
    console.log(text.substring(0, 4000));

    // Get all prices
    const prices = text.match(/\$[\d,]+/g);
    if (prices) {
      const vehiclePrices = [...new Set(prices)].filter(p => {
        const n = parseInt(p.replace(/[$,]/g, ''));
        return n >= 8000 && n <= 25000;
      });
      console.log('\n\nVehicle prices:', vehiclePrices.join(', '));
    }

    // KMs
    const kms = text.match(/[\d,]+\s*km/gi);
    if (kms) {
      console.log('KMs:', [...new Set(kms)].join(', '));
    }

    const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    console.log('Phone:', phone?.[0]);

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
