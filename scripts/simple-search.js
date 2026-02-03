const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Search for each model on AutoTrader
  const searches = [
    { name: 'Venue 2020-2022 under $19K', url: 'https://www.autotrader.ca/cars/hyundai/venue/on/?rcp=50&srt=35&prx=100&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2020,2022&pRng=,19000' },
    { name: 'Soul 2019 or 2022+ under $19K', url: 'https://www.autotrader.ca/cars/kia/soul/on/?rcp=50&srt=35&prx=100&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2019,2019&pRng=,19000' },
    { name: 'Kicks 2021+ under $19K', url: 'https://www.autotrader.ca/cars/nissan/kicks/on/?rcp=50&srt=35&prx=100&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2021,2025&pRng=,19000' },
  ];

  for (const search of searches) {
    console.log(`\n\n========== ${search.name} ==========`);
    console.log(`URL: ${search.url}\n`);

    try {
      await page.goto(search.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(6000); // Wait for JS to load

      // Just dump raw text
      const text = await page.evaluate(() => document.body.innerText);
      console.log('Page text length:', text.length);

      // Try to find vehicle cards using more flexible selectors
      const html = await page.content();

      // Get listing links and titles
      const listings = await page.evaluate(() => {
        const results = [];

        // Look for result cards
        const cards = document.querySelectorAll('[id^="result-item-"], .result-item, [class*="ResultCard"], [data-testid*="result"]');
        console.log('Cards found:', cards.length);

        cards.forEach(card => {
          const text = card.innerText;
          const link = card.querySelector('a[href*="/a/"]');
          results.push({
            text: text.substring(0, 500),
            url: link ? link.href : null
          });
        });

        // If no cards, try to extract from raw text
        if (results.length === 0) {
          // Look for listing patterns in raw text
          const bodyText = document.body.innerText;
          const lines = bodyText.split('\n');
          let currentListing = null;

          for (const line of lines) {
            const cleaned = line.trim();
            // Start of a new listing
            if (cleaned.match(/^202[0-5]\s+Hyundai\s+Venue/i) ||
                cleaned.match(/^(2019|202[2-5])\s+Kia\s+Soul/i) ||
                cleaned.match(/^202[1-5]\s+Nissan\s+Kicks/i)) {
              if (currentListing) results.push(currentListing);
              currentListing = { title: cleaned, lines: [] };
            } else if (currentListing && cleaned.length > 0 && currentListing.lines.length < 15) {
              currentListing.lines.push(cleaned);
            }
          }
          if (currentListing) results.push(currentListing);
        }

        return results;
      });

      console.log(`Found ${listings.length} potential listings:\n`);

      listings.slice(0, 15).forEach((l, i) => {
        console.log(`--- ${i+1} ---`);
        if (l.title) {
          console.log(`Title: ${l.title}`);
          console.log(`Details: ${l.lines?.slice(0, 5).join(' | ')}`);
        } else {
          console.log(l.text?.replace(/\n+/g, ' | ').substring(0, 400));
        }
        if (l.url) console.log(`URL: ${l.url}`);
        console.log('');
      });

    } catch (err) {
      console.log('Error:', err.message);
    }
  }

  await browser.close();
}

main().catch(console.error);
