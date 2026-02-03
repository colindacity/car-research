const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // 1. Carpages specific 2022 Soul EX listing
  console.log('=== CARPAGES - 2022 Kia Soul EX Specific Listing ===\n');
  try {
    await page.goto('https://www.carpages.ca/used-cars/ontario/toronto/2022-kia-soul-13093922/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('LISTING FOUND!');

      const priceMatch = text.match(/\$[\d,]+/);
      const kmMatch = text.match(/([\d,]+)\s*KM/i);
      const vinMatch = text.match(/VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/i);

      console.log('Price:', priceMatch?.[0]);
      console.log('KM:', kmMatch?.[1]);
      console.log('VIN:', vinMatch?.[1]);

      // Find dealer name
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.match(/(motors|auto|honda|kia|hyundai|nissan|mazda|chrysler|chevrolet)/i) &&
            line.length < 50 && !line.match(/Soul|2022/)) {
          console.log('Dealer:', line.trim());
          break;
        }
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      // CARFAX link
      const carfaxUrl = await page.evaluate(() => {
        const link = document.querySelector('a[href*="carfax"]');
        return link?.href;
      });
      console.log('CARFAX:', carfaxUrl);

      console.log('\nListing preview:');
      console.log(text.substring(0, 1000));
    } else {
      console.log('Listing not found or sold');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 2. Kia of Mississauga
  console.log('\n\n=== KIA OF MISSISSAUGA - Used Soul ===\n');
  try {
    await page.goto('https://www.kiaofmississauga.ca/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 3. 401 Dixie Kia (alternate URL)
  console.log('\n\n=== 401 DIXIE KIA - Used Soul ===\n');
  try {
    await page.goto('https://401dixiekia.com/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 4. Kia Erin Mills
  console.log('\n\n=== KIA ERIN MILLS - Used Soul ===\n');
  try {
    await page.goto('https://www.kiaerinmills.com/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 5. Markham Kia
  console.log('\n\n=== MARKHAM KIA - Used Soul ===\n');
  try {
    await page.goto('https://www.markhamkia.ca/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  // 6. Richmond Hill Kia
  console.log('\n\n=== RICHMOND HILL KIA - Used Soul ===\n');
  try {
    await page.goto('https://www.richmondhillkia.ca/used-inventory/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          console.log('\n--- Soul Listing ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
        }
      }
      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('\nPhone:', phone?.[0]);
    } else {
      console.log('No Soul found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
