const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== BURLINGTON HYUNDAI - All Venues ===\n');

  await page.goto('https://www.burlingtonhyundai.ca/inventory/used/?make=hyundai&model=venue', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  // Get all the page content
  const text = await page.evaluate(() => document.body.innerText);

  // Find all Venue mentions
  const lines = text.split('\n');
  let inVenue = false;
  let currentVenue = [];
  const venues = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^\d{4}\s+Hyundai\s+Venue/i)) {
      if (currentVenue.length > 0) venues.push(currentVenue);
      currentVenue = [trimmed];
      inVenue = true;
    } else if (inVenue && trimmed.length > 0) {
      currentVenue.push(trimmed);
      if (currentVenue.length > 15) inVenue = false;
    }
  }
  if (currentVenue.length > 0) venues.push(currentVenue);

  console.log(`Found ${venues.length} Venues:\n`);
  venues.forEach((v, i) => {
    console.log(`--- Venue ${i + 1} ---`);
    v.slice(0, 12).forEach(l => console.log('  ' + l));
    console.log('');
  });

  // Get all venue listing links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="venue"]'))
      .filter(a => a.href.includes('inventory'))
      .map(a => a.href);
  });

  console.log('Venue links found:', links.length);
  const uniqueLinks = [...new Set(links)].filter(l => l.includes('venue') && !l.includes('modelId'));
  console.log('Unique listing links:', uniqueLinks);

  await browser.close();
}

main().catch(console.error);
