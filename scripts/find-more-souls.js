const { chromium } = require('playwright');

async function checkSite(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===\n`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');

      const lines = text.split('\n');
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('soul') && lines[i].match(/2019|2022|2023|2024/)) {
          count++;
          console.log('\n--- Listing', count, '---');
          for (let j = i; j < Math.min(lines.length, i + 10); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          if (count >= 3) break;
        }
      }

      // Extract prices
      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const uniquePrices = [...new Set(prices)].filter(p => {
          const num = parseInt(p.replace(/[$,]/g, ''));
          return num >= 10000 && num <= 25000;
        });
        console.log('\nPrices:', uniquePrices.slice(0, 6).join(', '));
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      return true;
    } else {
      console.log('No Soul found');
      return false;
    }
  } catch (err) {
    console.log('Error:', err.message);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  const sites = [
    ['Richmond Hill Hyundai', 'https://www.richmondhillhyundai.com/en/used-inventory'],
    ['Stouffville Hyundai', 'https://www.stouffvillehyundai.com/en/used-inventory'],
    ['Scarborough Hyundai', 'https://www.scarboroughhyundai.com/en/used-inventory'],
    ['Newmarket Nissan', 'https://www.newmarketnissan.com/en/used-inventory'],
    ['Vaughan Chrysler', 'https://www.vaughanchrysler.com/used-inventory/'],
    ['Don Valley Mazda', 'https://www.donvalleymazda.ca/used-inventory/'],
    ['Richmond Hill Mazda', 'https://www.richmondhillmazda.ca/used-inventory/'],
    ['Thornhill Hyundai', 'https://www.thornhillhyundai.com/en/used-inventory'],
  ];

  for (const [name, url] of sites) {
    await checkSite(name, url);
  }
}

main().catch(console.error);
