const { chromium } = require('playwright');

const DEALERS = [
  // Hyundai dealers near Thornhill
  { name: 'Thornhill Hyundai', url: 'https://www.thornhillhyundai.com/inventory/used/', type: 'hyundai' },
  { name: 'Boyer Hyundai Pickering', url: 'https://www.boyerhyundai.com/inventory/used/', type: 'hyundai' },
  { name: 'Burlington Hyundai', url: 'https://www.burlingtonhyundai.ca/inventory/used/', type: 'hyundai' },
  { name: 'Gyro Hyundai', url: 'https://gyrohyundai.com/vehicles/used/', type: 'hyundai' },
  { name: 'Stouffville Hyundai', url: 'https://www.stouffvillehyundai.com/inventory/used/', type: 'hyundai' },
  { name: 'Richmond Hill Hyundai', url: 'https://www.richmondhillhyundai.com/inventory/', type: 'hyundai' },
  { name: 'Newmarket Hyundai', url: 'https://www.newmarkethyundai.ca/inventory/used/', type: 'hyundai' },
  { name: '401 Dixie Hyundai', url: 'https://www.401dixiehyundai.ca/inventory/used/', type: 'hyundai' },
  { name: 'Orangeville Hyundai', url: 'https://www.orangevillehyundai.ca/inventory/used/', type: 'hyundai' },
  // Kia dealers
  { name: '401 Dixie Kia', url: 'https://www.401dixiekia.ca/inventory/used/', type: 'kia' },
  { name: 'Kia of Hamilton', url: 'https://www.kiaofhamilton.com/inventory/used/', type: 'kia' },
  { name: 'Markham Kia', url: 'https://www.markhamkia.com/inventory/used/', type: 'kia' },
  // Nissan dealers
  { name: 'Woodbine Nissan', url: 'https://www.woodbinenissan.com/inventory/used/', type: 'nissan' },
  { name: 'Thornhill Infiniti Nissan', url: 'https://www.thornhillinfiniti.com/inventory/used/', type: 'nissan' },
];

async function searchDealer(page, dealer) {
  console.log(`\n=== ${dealer.name} ===`);
  console.log(`URL: ${dealer.url}`);

  try {
    await page.goto(dealer.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for dynamic content

    const content = await page.content();
    const text = await page.evaluate(() => document.body.innerText);

    // Search for Venue, Soul, or Kicks
    const venueMatches = text.match(/202[0-5]\s*(Hyundai\s*)?Venue\s*(Essential|Preferred|Trend|Ultimate)?[^]*?(\$[\d,]+|\d{2,3},?\d{3}\s*km)/gi) || [];
    const soulMatches = text.match(/(2019|202[2-5])\s*(Kia\s*)?Soul\s*(LX|EX|EX\+|EX Premium|GT-Line)?[^]*?(\$[\d,]+|\d{2,3},?\d{3}\s*km)/gi) || [];
    const kicksMatches = text.match(/202[1-5]\s*(Nissan\s*)?Kicks\s*(S|SV|SR)?[^]*?(\$[\d,]+|\d{2,3},?\d{3}\s*km)/gi) || [];

    // Get all vehicle cards/listings
    const vehicles = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="vehicle"], [class*="inventory"], [class*="listing"], [class*="car-card"], article');
      const results = [];
      cards.forEach(card => {
        const text = card.innerText;
        if (text.match(/venue|soul|kicks/i)) {
          results.push(text.substring(0, 500));
        }
      });
      return results;
    });

    if (vehicles.length > 0) {
      console.log(`Found ${vehicles.length} matching vehicles:`);
      vehicles.forEach((v, i) => {
        console.log(`\n--- Vehicle ${i+1} ---`);
        console.log(v.replace(/\n+/g, ' | ').substring(0, 300));
      });
    } else {
      // Try to find any mention of our target models
      if (text.toLowerCase().includes('venue')) {
        console.log('Page mentions "Venue" - extracting details...');
        const lines = text.split('\n').filter(l => l.toLowerCase().includes('venue'));
        lines.slice(0, 5).forEach(l => console.log('  ' + l.trim().substring(0, 150)));
      }
      if (text.toLowerCase().includes('soul')) {
        console.log('Page mentions "Soul" - extracting details...');
        const lines = text.split('\n').filter(l => l.toLowerCase().includes('soul'));
        lines.slice(0, 5).forEach(l => console.log('  ' + l.trim().substring(0, 150)));
      }
      if (text.toLowerCase().includes('kicks')) {
        console.log('Page mentions "Kicks" - extracting details...');
        const lines = text.split('\n').filter(l => l.toLowerCase().includes('kicks'));
        lines.slice(0, 5).forEach(l => console.log('  ' + l.trim().substring(0, 150)));
      }
      if (!text.toLowerCase().match(/venue|soul|kicks/)) {
        console.log('No Venue/Soul/Kicks found on this page');
      }
    }

    return { dealer: dealer.name, success: true };
  } catch (err) {
    console.log(`Error: ${err.message}`);
    return { dealer: dealer.name, success: false, error: err.message };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  for (const dealer of DEALERS) {
    await searchDealer(page, dealer);
  }

  await browser.close();
}

main().catch(console.error);
