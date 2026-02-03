const { chromium } = require('playwright');

async function checkDealer(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);

    // Look for Soul 2022 or 2023 only
    const lines = text.split('\n');
    const found = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      if (lineLower.includes('soul') &&
          (line.includes('2022') || line.includes('2023')) &&
          !lineLower.includes(' ev') &&
          !lineLower.includes('electric')) {

        let context = [];
        for (let j = i; j < Math.min(lines.length, i + 12); j++) {
          const l = lines[j].trim();
          if (l && l.length < 150) context.push(l);
        }
        found.push(context.join(' | '));
      }
    }

    if (found.length > 0) {
      console.log('FOUND 2022/2023 SOUL (non-EV):');
      found.forEach((f, idx) => {
        console.log(`\n[${idx + 1}] ${f.substring(0, 400)}`);
      });

      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const validPrices = [...new Set(prices)].filter(p => {
          const n = parseInt(p.replace(/[$,]/g, ''));
          return n >= 14000 && n <= 20000;
        });
        if (validPrices.length) console.log('\nPrices in range:', validPrices.join(', '));
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phone) console.log('Phone:', phone[0]);

      return true;
    } else {
      console.log('No 2022/2023 Soul (non-EV) found');
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
  console.log('=== SEARCHING FOR 2022-2023 SOUL EX AT GTA DEALERS ===\n');

  // More Kia dealers
  await checkDealer('Pickering Kia', 'https://www.pickeringkia.com/en/used-inventory');
  await checkDealer('Whitby Kia', 'https://www.kiaofwhitby.com/en/used-inventory');
  await checkDealer('Oshawa Kia', 'https://www.oshawakia.com/en/used-inventory');
  await checkDealer('Vaughan Kia', 'https://www.vaughankia.com/en/used-inventory');
  await checkDealer('401 Dixie Kia', 'https://www.401dixiekia.com/en/used-inventory');
  await checkDealer('Kia of Hamilton', 'https://www.kiaofhamilton.com/en/used-inventory');

  // Hyundai dealers (trade-ins)
  await checkDealer('Thornhill Hyundai', 'https://www.thornhillhyundai.com/en/used-inventory');
  await checkDealer('Markham Hyundai', 'https://www.markhamhyundai.com/en/used-inventory');

  // Honda dealers (trade-ins)
  await checkDealer('Scarborough Honda', 'https://www.scarboroughhonda.com/used/');
  await checkDealer('Markham Honda', 'https://www.markhamhonda.com/used/');

  // Toyota dealers (trade-ins)
  await checkDealer('Scarborough Toyota', 'https://www.scarboroughtoyota.ca/en/used-inventory');

  console.log('\n=== SEARCH COMPLETE ===');
}

main().catch(console.error);
