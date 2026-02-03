const { chromium } = require('playwright');

async function readCarfax(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== CARFAX: ${name} ===`);
  console.log(`URL: ${url}\n`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    const text = await page.evaluate(() => document.body.innerText);

    // Print everything relevant
    const lines = text.split('\n');
    const flags = ['accident', 'damage', 'commercial', 'rental', 'fleet', 'taxi', 'police',
                   'lien', 'salvage', 'rebuilt', 'total loss', 'fire', 'flood', 'hail',
                   'owner', 'service', 'odometer', 'km', 'clean', 'no accident',
                   'registered', 'ontario', 'report', 'history', 'warning',
                   'collision', 'claim', 'insurance', 'recall', 'stolen'];

    console.log('--- FULL CARFAX TEXT ---');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 2 && trimmed.length < 300) {
        console.log(trimmed);
      }
    }
    console.log('--- END ---');

  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function getDetailCarfax(name, listingUrl) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== DETAIL PAGE: ${name} ===`);
  console.log(`URL: ${listingUrl}\n`);

  try {
    await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    // Find and click on Soul listing to get detail page
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n');

    const flags = ['accident', 'damage', 'commercial', 'rental', 'fleet', 'taxi', 'police',
                   'lien', 'salvage', 'rebuilt', 'total loss', 'fire', 'flood', 'hail',
                   'owner', 'carfax', 'certified', 'history', 'clean', 'claim', 'collision'];

    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      if (lower.length > 3 && lower.length < 300 && flags.some(f => lower.includes(f))) {
        console.log(`  ${line.trim()}`);
      }
    }

    // Find all links that go to individual listings
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 150)
      }));
    });

    // Find Soul detail page links
    const soulDetailLinks = allLinks.filter(l => {
      const combined = (l.href + ' ' + l.text).toLowerCase();
      return combined.includes('soul') && !combined.includes('ev') &&
             (combined.includes('detail') || combined.includes('view') ||
              l.href.includes('/vehicle/') || l.href.includes('/inventory/'));
    });

    // Also find carfax links
    const carfaxLinks = allLinks.filter(l =>
      l.href.toLowerCase().includes('carfax')
    );

    if (carfaxLinks.length > 0) {
      console.log('\nCARFAX links found:');
      carfaxLinks.forEach(l => console.log(`  ${l.href}`));
    }

    if (soulDetailLinks.length > 0) {
      console.log('\nSoul detail links:');
      for (const link of soulDetailLinks.slice(0, 3)) {
        console.log(`  ${link.text}: ${link.href}`);
      }
    }

  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== READING CARFAX REPORTS FROM DEALER PAGES ===\n');

  // Airport Kia - has direct CARFAX links
  await readCarfax('Airport Kia Soul EX (Orange)', 'https://vhr.carfax.ca/?id=JIMA508iK2bykTqeByBUFuQRi86CHRdQ');
  await readCarfax('Airport Kia Soul EX+ (White)', 'https://vhr.carfax.ca/?id=t+pgVXdGE2uOHTjgnqwnNlx3A3skni7q');

  // Other dealers - check detail pages for CARFAX
  await getDetailCarfax('Kia of Newmarket', 'https://www.kiaofnewmarket.com/en/used-inventory');
  await getDetailCarfax('Morningside Nissan', 'https://www.morningsidenissan.com/en/used-inventory');
  await getDetailCarfax('Bessada Kia', 'https://www.bessadakia.com/en/used-inventory');

  console.log('\n=== DONE ===');
}

main().catch(console.error);
