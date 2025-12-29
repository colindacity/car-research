const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Search 1: Hyundai Venue at all dealers within 50km
  console.log('\n' + '='.repeat(60));
  console.log('SEARCHING: Hyundai Venue 2021-2022 within 50km');
  console.log('='.repeat(60));

  const venueUrl = 'https://www.autotrader.ca/cars/hyundai/venue/on/?rcp=100&rcs=0&srt=3&yRng=2021%2C2022&prx=50&pRng=%2C20000&loc=L4J%203W3&hprc=True&wcp=True&sts=New-Used';

  await page.goto(venueUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 6000));

  // Scroll to load
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 1000));
  }

  let listings = await page.evaluate(() => {
    const results = [];
    const allLinks = document.querySelectorAll('a[href*="/a/hyundai/venue/"]');
    const seen = new Set();

    allLinks.forEach(link => {
      const href = link.href;
      if (href && !seen.has(href) && href.includes('/a/hyundai/venue/')) {
        seen.add(href);
        const card = link.closest('[class*="result"], [class*="listing"], article, [data-testid]') || link.parentElement.parentElement.parentElement;
        const text = card ? card.innerText : link.innerText;
        results.push({
          url: href,
          text: text.substring(0, 500)
        });
      }
    });
    return results;
  });

  console.log('Found ' + listings.length + ' Venue listings:\n');
  listings.forEach((l, i) => {
    console.log('--- ' + (i+1) + ' ---');
    console.log('URL: ' + l.url);
    console.log('Text: ' + l.text.replace(/\n+/g, ' | ').substring(0, 350));
    console.log('');
  });

  // Search 2: Kia Soul at all dealers
  console.log('\n' + '='.repeat(60));
  console.log('SEARCHING: Kia Soul 2022-2023 at franchise dealers within 50km');
  console.log('='.repeat(60));

  const soulUrl = 'https://www.autotrader.ca/cars/kia/soul/on/?rcp=100&rcs=0&srt=3&yRng=2022%2C2023&prx=50&pRng=%2C22000&loc=L4J%203W3&hprc=True&wcp=True&sts=New-Used';

  await page.goto(soulUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 6000));

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 1000));
  }

  listings = await page.evaluate(() => {
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
          text: text.substring(0, 500)
        });
      }
    });
    return results;
  });

  console.log('Found ' + listings.length + ' Soul listings:\n');
  listings.forEach((l, i) => {
    // Filter for manufacturer dealers (look for brand names in text)
    const text = l.text.toLowerCase();
    const isFranchise = text.includes('hyundai') || text.includes('nissan') ||
                       text.includes('honda') || text.includes('toyota') ||
                       text.includes('mazda') || text.includes('ford') ||
                       text.includes('mitsubishi') || text.includes('kia') ||
                       text.includes('certified') || text.includes('cpo');

    if (isFranchise || i < 15) {
      console.log('--- ' + (i+1) + ' ---');
      console.log('URL: ' + l.url);
      console.log('Text: ' + l.text.replace(/\n+/g, ' | ').substring(0, 350));
      console.log('');
    }
  });

  await browser.close();
})();
