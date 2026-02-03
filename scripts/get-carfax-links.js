const { chromium } = require('playwright');

async function getCarfaxFromDealer(name, url, searchTerm) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===`);
  console.log(`URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    // Get all links on the page
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100)
      }));
    });

    // Find CARFAX links
    const carfaxLinks = links.filter(l =>
      l.href.toLowerCase().includes('carfax') ||
      l.text.toLowerCase().includes('carfax')
    );

    if (carfaxLinks.length > 0) {
      console.log(`Found ${carfaxLinks.length} CARFAX link(s):`);
      carfaxLinks.forEach(l => {
        console.log(`  ${l.text}: ${l.href}`);
      });
    } else {
      console.log('No CARFAX links found on page');
    }

    // Also look for individual listing links that might have CARFAX
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n');

    // Find Soul listing lines and nearby CARFAX mentions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('soul') && (line.includes('2022') || line.includes('2023') || line.includes('2019'))) {
        // Check nearby lines for carfax info
        for (let j = Math.max(0, i-2); j < Math.min(lines.length, i + 20); j++) {
          const nearby = lines[j];
          if (nearby.toLowerCase().includes('carfax') ||
              nearby.toLowerCase().includes('accident') ||
              nearby.toLowerCase().includes('certified') ||
              nearby.toLowerCase().includes('history') ||
              nearby.toLowerCase().includes('clean') ||
              nearby.toLowerCase().includes('commercial') ||
              nearby.toLowerCase().includes('rental') ||
              nearby.toLowerCase().includes('fleet') ||
              nearby.toLowerCase().includes('taxi') ||
              nearby.toLowerCase().includes('police') ||
              nearby.toLowerCase().includes('lien') ||
              nearby.toLowerCase().includes('salvage') ||
              nearby.toLowerCase().includes('rebuilt') ||
              nearby.toLowerCase().includes('damage')) {
            console.log(`  [line ${j}] ${nearby.trim()}`);
          }
        }
      }
    }

    // Try clicking into individual Soul listings to find CARFAX
    const soulLinks = links.filter(l => {
      const t = (l.text + l.href).toLowerCase();
      return t.includes('soul') && (t.includes('2022') || t.includes('2023') || t.includes('2019')) &&
             !t.includes(' ev') && !t.includes('electric');
    });

    if (soulLinks.length > 0) {
      console.log(`\nFound ${soulLinks.length} Soul listing link(s) to check:`);
      for (const link of soulLinks.slice(0, 3)) {
        console.log(`\n  Checking: ${link.href}`);
        try {
          const detailPage = await context.newPage();
          await detailPage.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await detailPage.waitForTimeout(4000);

          const detailLinks = await detailPage.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
              href: a.href,
              text: a.textContent.trim().substring(0, 100)
            })).filter(l => l.href.toLowerCase().includes('carfax') || l.text.toLowerCase().includes('carfax'));
          });

          if (detailLinks.length > 0) {
            console.log(`  CARFAX links on detail page:`);
            detailLinks.forEach(l => console.log(`    ${l.href}`));
          }

          const detailText = await detailPage.evaluate(() => document.body.innerText);
          const flags = ['carfax', 'accident', 'commercial', 'rental', 'fleet', 'taxi', 'police', 'lien', 'salvage', 'rebuilt', 'damage', 'clean', 'one owner', '1 owner', 'certified'];
          const detailLines = detailText.split('\n');
          for (const dl of detailLines) {
            const lower = dl.toLowerCase();
            if (flags.some(f => lower.includes(f)) && dl.trim().length > 3 && dl.trim().length < 200) {
              console.log(`  >> ${dl.trim()}`);
            }
          }

          await detailPage.close();
        } catch (e) {
          console.log(`  Error loading detail: ${e.message}`);
        }
      }
    }

    return true;
  } catch (err) {
    console.log('Error:', err.message);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== CHECKING CARFAX ON DEALER LISTING PAGES ===\n');

  await getCarfaxFromDealer(
    'Airport Kia (2022 Soul EX - Orange)',
    'https://www.airportkia.ca/used/2022-Kia-Soul.html',
    'soul 2022'
  );

  await getCarfaxFromDealer(
    'Kia of Newmarket',
    'https://www.kiaofnewmarket.com/en/used-inventory',
    'soul 2022'
  );

  await getCarfaxFromDealer(
    'Morningside Nissan',
    'https://www.morningsidenissan.com/en/used-inventory',
    'soul 2022'
  );

  await getCarfaxFromDealer(
    'Bessada Kia (Pickering)',
    'https://www.bessadakia.com/en/used-inventory',
    'soul 2022'
  );

  await getCarfaxFromDealer(
    '427/QEW Kia',
    'https://www.qewkia.com/vehicles/kia/soul/',
    'soul 2022'
  );

  await getCarfaxFromDealer(
    'Clarington Kia',
    'https://www.claringtonkia.ca/en/used-inventory',
    'soul 2023'
  );

  console.log('\n=== DONE ===');
}

main().catch(console.error);
