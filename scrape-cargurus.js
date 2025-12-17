const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 1000));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-CA'
  });
  const page = await context.newPage();

  console.log('Going to CarGurus.ca...');
  await page.goto('https://www.cargurus.ca/', { waitUntil: 'load', timeout: 60000 });
  await delay(3000);

  // Check what we see
  let pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- Homepage Text ---\n', pageText.substring(0, 2000));

  // Try to search for Kia Soul manually
  console.log('\nSearching for Kia Soul...');

  // Try clicking on the search input
  try {
    // Look for search box
    const searchInput = await page.$('input[placeholder*="Search"], input[type="search"], input[name*="search"]');
    if (searchInput) {
      await searchInput.click();
      await delay(1000);
      await searchInput.type('Kia Soul', { delay: 100 });
      await delay(2000);

      // Press enter or click search
      await page.keyboard.press('Enter');
      await delay(5000);
    } else {
      console.log('No search input found, trying direct URL...');
      await page.goto('https://www.cargurus.ca/Cars/l-Used-Kia-Soul-d295', { waitUntil: 'load', timeout: 60000 });
      await delay(5000);
    }
  } catch (e) {
    console.log('Search error:', e.message);
  }

  // Scroll and get results
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1000);
  }

  pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- Search Results ---\n', pageText.substring(0, 5000));

  // Get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).filter(a =>
      a.href.includes('Soul') || a.href.includes('listing') || a.href.includes('VDP')
    ).map(a => ({ href: a.href, text: a.innerText.substring(0, 100) }));
  });
  console.log('\n--- Relevant Links ---');
  links.slice(0, 20).forEach(l => console.log(l.href, '-', l.text));

  await browser.close();
})();
