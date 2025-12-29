const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Searching AutoTrader for 2022-23 Kia Souls...');

  // Search for 2022-2023 Kia Soul, 50km from L4J 3W3, dealer only
  const url = 'https://www.autotrader.ca/cars/kia/soul/on/?rcp=100&rcs=0&srt=3&yRng=2022%2C2023&prx=50&loc=L4J%203W3&hprc=True&wcp=True&sts=New-Used&inMarket=advancedSearch';

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 8000));

  // Scroll to load more
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 1500));
  }

  // Get all listing links
  const listings = await page.evaluate(() => {
    const results = [];
    const allLinks = document.querySelectorAll('a[href*="/a/kia/soul/"]');
    const seen = new Set();

    allLinks.forEach(link => {
      const href = link.href;
      if (href && !seen.has(href) && href.includes('/a/kia/soul/')) {
        seen.add(href);
        const card = link.closest('[class*="result"], [class*="listing"], article, [data-testid]') || link.parentElement.parentElement.parentElement;
        const text = card ? card.innerText : link.innerText;
        results.push({
          url: href,
          text: text.substring(0, 600)
        });
      }
    });

    return results;
  });

  console.log('\n=== Found ' + listings.length + ' Soul listings ===\n');

  // Filter for 2022-2023 only and show details
  listings.forEach((l, i) => {
    if (l.text.includes('2022') || l.text.includes('2023') || l.url.includes('2022') || l.url.includes('2023')) {
      console.log('--- Listing ' + (i+1) + ' ---');
      console.log('URL: ' + l.url);
      console.log('Text: ' + l.text.replace(/\n+/g, ' | ').substring(0, 400));
      console.log('');
    }
  });

  // Also get VINs if visible
  const pageContent = await page.content();
  const vinMatches = pageContent.match(/KNDJ[A-Z0-9]{13}/g) || [];
  if (vinMatches.length > 0) {
    console.log('\n=== VINs Found ===');
    [...new Set(vinMatches)].forEach(vin => console.log(vin));
  }

  await browser.close();
})();
