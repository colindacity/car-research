const { chromium } = require('playwright');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';
const BASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co/rest/v1';

async function checkDealer(browser, name, url, address, distance, coords) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    console.log(`\nChecking ${name}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    if (text.toLowerCase().includes('soul')) {
      const validYears = ['2019', '2020', '2021', '2022', '2023', '2024'];
      const lines = text.split('\n');
      const listings = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('soul') && !line.includes(' ev') && !line.includes('electric')) {
          for (const year of validYears) {
            if (lines[i].includes(year)) {
              // Extract details
              let context = [];
              for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 15); j++) {
                const l = lines[j].trim();
                if (l) context.push(l);
              }
              const contextStr = context.join(' | ');

              // Extract price
              const priceMatch = contextStr.match(/\$\s*([0-9,]+)/);
              const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

              // Extract km
              const kmMatch = contextStr.match(/([0-9,]+)\s*km/i);
              const km = kmMatch ? parseInt(kmMatch[1].replace(/,/g, '')) : null;

              // Extract trim
              const trimMatch = contextStr.match(/Soul\s+(EX\+?|Premium|GT[-\s]?Line)/i);
              const trim = trimMatch ? trimMatch[1] : 'EX';

              if (price && price >= 8000 && price <= 22000 && km && km < 200000) {
                listings.push({
                  year: parseInt(year),
                  model: `Soul ${trim}`,
                  color: 'Unknown',
                  km,
                  price,
                  dealer: name,
                  distance,
                  coords,
                  address,
                  listing_url: url,
                  dealer_url: url.split('/inventory')[0] || url.split('/used')[0] || url,
                  official: true,
                  availability: 'available'
                });
              }
              break;
            }
          }
        }
      }

      if (listings.length > 0) {
        console.log(`✓ FOUND ${listings.length} SOUL(S)!`);
        for (const listing of listings) {
          console.log(`  ${listing.year} ${listing.model} - $${listing.price} | ${listing.km} km`);
        }
        return listings;
      }
    }

    console.log('  No Souls found');
    return [];
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    return [];
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('=== QUICK DEALER SEARCH (2019-2024 Soul EX/EX+/Premium) ===\n');

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  // High-priority dealers in GTA
  const dealers = [
    ['Morningside Nissan', 'https://www.morningsidenissan.com/en/used-inventory', '3050 Morningside Ave, Scarborough, ON', 22, [43.7853, -79.2308]],
    ['Peterborough Kia', 'https://www.peterboroughkia.com/en/used-inventory', '1140 Chemong Rd, Peterborough, ON', 140, [44.3099, -78.2881]],
    ['Pickering Kia', 'https://www.pickeringkia.com/en/used-inventory', '1899 Brock Rd, Pickering, ON', 35, [43.8384, -79.0868]],
    ['Ajax Kia', 'https://www.ajaxkia.com/en/used-inventory', '680 Kingston Rd, Ajax, ON', 40, [43.8509, -79.0204]],
    ['Whitby Kia', 'https://www.kiaofwhitby.com/en/used-inventory', '1320 Dundas St E, Whitby, ON', 45, [43.8755, -78.9428]],
    ['Burlington Kia', 'https://www.burlingtonkia.com/used/Kia-Soul.html', '3155 Mainway, Burlington, ON', 60, [43.3616, -79.8240]],
    ['Oakville Kia', 'https://www.oakvillekia.ca/en/used-inventory', '2555 Royal Windsor Dr, Oakville, ON', 45, [43.4643, -79.6880]],
    ['Brampton Kia', 'https://www.bramptonkia.com/en/used-inventory', '88 Vodden St E, Brampton, ON', 30, [43.6832, -79.7583]],
  ];

  const allListings = [];

  for (const [name, url, address, distance, coords] of dealers) {
    const listings = await checkDealer(browser, name, url, address, distance, coords);
    allListings.push(...listings);
  }

  await browser.close();

  console.log(`\n\n=== FOUND ${allListings.length} NEW LISTINGS ===\n`);

  if (allListings.length > 0) {
    console.log('Adding to database...\n');

    for (const listing of allListings) {
      const res = await fetch(`${BASE_URL}/cars`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(listing)
      });

      if (res.ok) {
        console.log(`✓ Added: ${listing.year} ${listing.model} @ ${listing.dealer} - $${listing.price}`);
      } else {
        const error = await res.json();
        console.log(`✗ Error adding ${listing.year} ${listing.model}: ${error.message || 'Unknown error'}`);
      }
    }
  } else {
    console.log('No new listings found');
  }
}

main().catch(console.error);
