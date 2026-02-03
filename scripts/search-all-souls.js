const { chromium } = require('playwright');

async function checkDealer(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      // Look for years 2019-2024 only, NO EVs
      const goodYears = ['2019', '2020', '2021', '2022', '2023', '2024'];
      const lines = text.split('\n');
      const listings = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('soul')) {
          for (const year of goodYears) {
            if (line.includes(year)) {
              // Capture context
              let context = [];
              for (let j = i; j < Math.min(lines.length, i + 10); j++) {
                context.push(lines[j].trim());
              }
              listings.push({ year, context: context.join(' | ') });
              break;
            }
          }
        }
      }

      // Filter out EVs
      const nonEVListings = listings.filter(l =>
        !l.context.toLowerCase().includes(' ev') &&
        !l.context.toLowerCase().includes('electric')
      );

      if (nonEVListings.length > 0) {
        console.log(`\n=== ${name} - ${nonEVListings.length} SOUL(S) FOUND (NO EVs) ===`);
        nonEVListings.forEach((l, idx) => {
          console.log(`\n[${idx + 1}] ${l.year} Soul:`);
          console.log(`  ${l.context.substring(0, 300)}`);
        });

        // Extract prices and kms
        const prices = text.match(/\$[\d,]+/g)?.filter(p => {
          const n = parseInt(p.replace(/[$,]/g, ''));
          return n >= 8000 && n <= 22000;
        });
        const kms = text.match(/[\d,]+\s*km/gi);

        if (prices) console.log(`\nPrices: ${[...new Set(prices)].join(', ')}`);
        if (kms) console.log(`KMs: ${[...new Set(kms)].slice(0, 8).join(', ')}`);

        const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phone) console.log(`Phone: ${phone[0]}`);

        return { found: true, count: nonEVListings.length };
      }
    }

    return { found: false };
  } catch (err) {
    return { found: false, error: err.message };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== COMPREHENSIVE SOUL SEARCH (2019-2024, NO EVs) ===\n');
  console.log('Searching official dealerships across GTA for Soul EX/EX+/Premium...\n');

  const dealers = [
    // Kia Dealers
    ['Kia of Newmarket', 'https://www.kiaofnewmarket.com/inventory/used/'],
    ['Pickering Kia', 'https://www.pickeringkia.com/en/used-inventory'],
    ['Ajax Kia', 'https://www.ajaxkia.com/en/used-inventory'],
    ['Whitby Kia', 'https://www.kiaofwhitby.com/en/used-inventory'],
    ['Oshawa Kia', 'https://www.oshawakia.com/en/used-inventory'],
    ['Barrie Kia', 'https://www.kiaofbarrie.com/en/used-inventory'],

    // Hyundai Dealers (trade-ins)
    ['Thornhill Hyundai', 'https://www.thornhillhyundai.com/en/used-inventory'],
    ['Markham Hyundai', 'https://www.markhamhyundai.com/en/used-inventory'],
    ['Pickering Hyundai', 'https://www.pickeringhyundai.ca/en/used-inventory'],

    // Nissan Dealers (trade-ins)
    ['Morningside Nissan', 'https://www.morningsidenissan.com/en/used-inventory'],
    ['Stouffville Nissan', 'https://www.stouffvillenissan.com/en/used-inventory'],
    ['Markham Nissan', 'https://www.markhamnissan.ca/en/used-inventory'],

    // Honda Dealers (trade-ins)
    ['Thornhill Honda', 'https://www.thornhillhonda.com/used/'],
    ['Markham Honda', 'https://www.markhamhonda.com/used/'],
    ['Scarborough Honda', 'https://www.scarboroughhonda.com/used/'],

    // Toyota Dealers (trade-ins)
    ['Scarborough Toyota', 'https://www.scarboroughtoyota.ca/en/used-inventory'],
    ['Markham Toyota', 'https://www.markhamtoyota.ca/en/used-inventory'],

    // Mazda Dealers
    ['Scarborough Mazda', 'https://www.scarboroughmazda.com/en/used-inventory'],
    ['Markham Mazda', 'https://www.markhammazda.ca/en/used-inventory'],
  ];

  let totalFound = 0;

  for (const [name, url] of dealers) {
    const result = await checkDealer(name, url);
    if (result.found) {
      totalFound += result.count;
    }
  }

  console.log(`\n\n=== SEARCH COMPLETE ===`);
  console.log(`Total Soul listings found: ${totalFound}`);
}

main().catch(console.error);
