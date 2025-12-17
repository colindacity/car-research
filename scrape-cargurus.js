const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-CA',
    timezoneId: 'America/Toronto'
  });
  const page = await context.newPage();

  // Start from homepage
  console.log('Loading CarGurus.ca homepage...');
  await page.goto('https://www.cargurus.ca/', { waitUntil: 'load', timeout: 60000 });
  await delay(3000);

  // Search for Kia Soul
  const searches = [
    { make: 'Kia', model: 'Soul', years: '2022-2024' },
    { make: 'Hyundai', model: 'Venue', years: '2021-2022' }
  ];

  for (const search of searches) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SEARCHING: ${search.make} ${search.model} ${search.years}`);
    console.log('='.repeat(80));

    try {
      // Use direct search URL with simpler format
      const searchUrl = `https://www.cargurus.ca/Cars/l-Used-${search.make}-${search.model}-d295?sourceContext=usedPaidSearchNopowerful#resultsPage=1&zip=L4J3W3&maxPrice=18000&distance=100`;

      console.log('Navigating to:', searchUrl);
      await page.goto(searchUrl, { waitUntil: 'load', timeout: 60000 });
      await delay(5000);

      // Scroll to load listings
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await delay(800);
      }

      // Get page content
      const pageData = await page.evaluate(() => {
        const text = document.body.innerText;
        const html = document.body.innerHTML;

        // Find all listing links
        const links = Array.from(document.querySelectorAll('a[href*="/listing/"]')).map(a => ({
          href: a.href,
          text: a.innerText.substring(0, 200)
        }));

        return {
          text: text.substring(0, 8000),
          linksCount: links.length,
          links: links.slice(0, 15)
        };
      });

      console.log(`\nFound ${pageData.linksCount} listing links`);
      console.log('\n--- Links ---');
      pageData.links.forEach((l, i) => {
        console.log(`${i + 1}. ${l.href}`);
        console.log(`   ${l.text.substring(0, 100)}`);
      });

      console.log('\n--- Page Text ---\n', pageData.text.substring(0, 4000));

    } catch (err) {
      console.log('Error:', err.message);
    }

    await delay(2000);
  }

  await browser.close();
})();
