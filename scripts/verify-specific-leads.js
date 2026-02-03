const { chromium } = require('playwright');

async function checkSite(name, url, searchText) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===\n`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    if (text.toLowerCase().includes(searchText.toLowerCase())) {
      console.log(`${searchText} FOUND!`);

      const lines = text.split('\n');
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(searchText.toLowerCase())) {
          count++;
          console.log('\n--- Context', count, '---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          if (count >= 3) break;
        }
      }

      // Extract all details
      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const uniquePrices = [...new Set(prices)].filter(p => {
          const num = parseInt(p.replace(/[$,]/g, ''));
          return num >= 10000 && num <= 25000;
        });
        console.log('\nPrices found:', uniquePrices.join(', '));
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      // Get address
      const address = text.match(/\d+\s+[\w\s]+(?:Rd|Road|Ave|St|Dr|Blvd|Way)[^,]*,?\s*(?:Toronto|Scarborough|Mississauga|Brampton|Richmond|Markham|Vaughan|North York)[^,]*,?\s*ON/i);
      console.log('Address:', address?.[0]);

      return true;
    } else {
      console.log(`${searchText} not found`);
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
  // Check Mississauga Kia for 2022 Soul Cherry Black
  await checkSite(
    'Mississauga Kia - 2022 Soul EX',
    'https://www.mississaugakia.com/used/Kia-Soul.html',
    'Soul'
  );

  // Check Brampton North Nissan for Soul trade-in
  await checkSite(
    'Brampton North Nissan',
    'https://www.bramptonmitsubishi.com/used/',
    'Soul'
  );

  // Check Oakville Nissan
  await checkSite(
    'Oakville Nissan',
    'https://www.oakvillenissan.com/en/used-inventory',
    'Soul'
  );

  // Check Burlington Hyundai
  await checkSite(
    'Burlington Hyundai',
    'https://www.burlingtonhyundai.com/en/used-inventory',
    'Soul'
  );

  // Check Ajax Hyundai
  await checkSite(
    'Ajax Hyundai',
    'https://www.ajaxhyundai.com/en/used-inventory',
    'Soul'
  );
}

main().catch(console.error);
