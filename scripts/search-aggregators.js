const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. CarGurus - Kia Soul near Toronto
  console.log('=== CARGURUS - Kia Soul Toronto ===\n');
  try {
    await page.goto('https://www.cargurus.ca/Cars/l-Used-Kia-Soul-Toronto-d2020_L414276', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    // Find Soul listings with good years
    const lines = text.split('\n');
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match pattern: 2017-2023 Soul or Kia Soul
      if (line.match(/20(17|18|19|20|21|22|23)\s+(Kia\s+)?Soul/i)) {
        count++;
        console.log(`\n[${count}] ${line.trim()}`);
        // Get next few lines for context
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          const l = lines[j].trim();
          if (l && l.length < 100) console.log(`   ${l}`);
        }
        if (count >= 10) break;
      }
    }

    // Extract prices
    const prices = text.match(/\$[\d,]+/g);
    if (prices) {
      const vehiclePrices = [...new Set(prices)].filter(p => {
        const n = parseInt(p.replace(/[$,]/g, ''));
        return n >= 10000 && n <= 20000;
      });
      console.log('\n\nPrices in range:', vehiclePrices.join(', '));
    }

  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Clutch.ca - Kia Soul
  console.log('\n\n=== CLUTCH.CA - Kia Soul ===\n');
  try {
    await page.goto('https://www.clutch.ca/cars/kia-soul', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    const lines = text.split('\n');
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/20(17|18|19|20|21|22|23)\s+(Kia\s+)?Soul/i)) {
        count++;
        console.log(`\n[${count}] ${line.trim()}`);
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          const l = lines[j].trim();
          if (l && l.length < 100) console.log(`   ${l}`);
        }
        if (count >= 8) break;
      }
    }

  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. Canada Drives
  console.log('\n\n=== CANADA DRIVES - Kia Soul ===\n');
  try {
    await page.goto('https://www.canadadrives.ca/cars/kia/soul', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    const lines = text.split('\n');
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/20(17|18|19|20|21|22|23)\s+(Kia\s+)?Soul/i) ||
          (line.includes('Soul') && lines[i-1]?.match(/20(17|18|19|20|21|22|23)/))) {
        count++;
        console.log(`\n[${count}] ${line.trim()}`);
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          const l = lines[j].trim();
          if (l && l.length < 100) console.log(`   ${l}`);
        }
        if (count >= 8) break;
      }
    }

    // Prices
    const prices = text.match(/\$[\d,]+/g);
    if (prices) {
      const vehiclePrices = [...new Set(prices)].filter(p => {
        const n = parseInt(p.replace(/[$,]/g, ''));
        return n >= 10000 && n <= 20000;
      });
      console.log('\nPrices in range:', vehiclePrices.join(', '));
    }

  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
