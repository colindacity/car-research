const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== PETERBOROUGH KIA - Get Price ===\n');

  try {
    await page.goto('https://www.peterboroughkia.ca/used/Kia-Soul-EX.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    console.log('Page text (first 3000 chars):');
    console.log(text.substring(0, 3000));

    // Find all prices
    const prices = text.match(/\$[\d,]+/g);
    if (prices) {
      console.log('\n\nAll prices found:', prices.join(', '));
    }

    // Find km patterns
    const kms = text.match(/[\d,]+\s*km/gi);
    if (kms) {
      console.log('All km found:', kms.join(', '));
    }

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
