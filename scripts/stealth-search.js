const { chromium } = require('playwright');

async function main() {
  // Use new headless mode which is more stealth
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome', // Use system Chrome if available
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    javaScriptEnabled: true,
  });

  // Stealth mode
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-CA', 'en'] });
    window.chrome = { runtime: {} };
  });

  const page = await context.newPage();

  // First test with a simple dealer page that worked before
  console.log('Testing Boyer Hyundai first (this worked before)...');
  await page.goto('https://www.boyerhyundai.com/inventory/used/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(5000);

  const boyerText = await page.evaluate(() => document.body.innerText);
  console.log('Boyer page length:', boyerText.length);

  if (boyerText.toLowerCase().includes('venue')) {
    console.log('SUCCESS - Boyer has Venue listings');
    const lines = boyerText.split('\n').filter(l => l.toLowerCase().includes('venue'));
    lines.slice(0, 10).forEach(l => console.log('  ', l.trim().substring(0, 100)));
  }

  // Now try AutoTrader with cookies and more wait time
  console.log('\n\nNow trying AutoTrader...');

  // First visit the homepage to get cookies
  await page.goto('https://www.autotrader.ca', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Then search
  await page.goto('https://www.autotrader.ca/cars/hyundai/venue/on/?rcp=25&srt=35&prx=100&loc=L4J3W3&hprc=True&wcp=True&sts=Used&yRng=2020,2022&pRng=,19000', {
    waitUntil: 'load',
    timeout: 45000
  });

  // Wait longer
  await page.waitForTimeout(8000);

  // Check what we got
  const atText = await page.evaluate(() => document.body.innerText);
  console.log('AutoTrader page length:', atText.length);

  if (atText.length > 0) {
    console.log('\nPage content preview:');
    console.log(atText.substring(0, 1500));
  } else {
    console.log('Page is empty - checking if there is an iframe or shadow DOM...');
    const iframes = await page.frames();
    console.log('Frames:', iframes.length);
    for (const frame of iframes) {
      try {
        const frameText = await frame.evaluate(() => document.body?.innerText || '');
        if (frameText.length > 100) {
          console.log('Frame content:', frameText.substring(0, 500));
        }
      } catch(e) {}
    }
  }

  await browser.close();
}

main().catch(console.error);
