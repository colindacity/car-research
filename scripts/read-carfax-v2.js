const { chromium } = require('playwright');

async function readCarfax(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== CARFAX: ${name} ===`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(12000); // Long wait for JS to render

    const text = await page.evaluate(() => document.body.innerText);

    if (text.length < 100) {
      console.log('Page still loading or empty, trying longer wait...');
      await page.waitForTimeout(8000);
      const text2 = await page.evaluate(() => document.body.innerText);
      console.log(`Text length: ${text2.length}`);
      if (text2.length > 100) {
        const lines = text2.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 300);
        lines.forEach(l => console.log(l));
      }
    } else {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 300);
      lines.forEach(l => console.log(l));
    }
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function checkDetailPage(name, inventoryUrl, searchYear) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} - Finding Soul ${searchYear} detail page ===`);

  try {
    await page.goto(inventoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    // Find links to individual Soul listings
    const links = await page.evaluate((yr) => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        href: a.href,
        text: (a.textContent || '').trim().substring(0, 200)
      })).filter(l => {
        const combined = (l.href + ' ' + l.text).toLowerCase();
        return combined.includes('soul') && combined.includes(yr) && !combined.includes('ev');
      });
    }, String(searchYear));

    if (links.length === 0) {
      // Try finding any link with the VIN or stock number patterns
      const allLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .filter(a => a.href.includes('/vehicle/') || a.href.includes('/inventory/') || a.href.includes('detail'))
          .map(a => ({ href: a.href, text: (a.textContent || '').trim().substring(0, 200) }));
      });
      console.log(`No direct Soul links. Found ${allLinks.length} vehicle detail links total.`);

      // Try clicking on Soul listing area
      const soulElement = await page.evaluate((yr) => {
        const els = Array.from(document.querySelectorAll('*'));
        for (const el of els) {
          const t = el.textContent.toLowerCase();
          if (t.includes('soul') && t.includes(yr) && !t.includes('ev') && el.closest('a')) {
            return el.closest('a').href;
          }
        }
        return null;
      }, String(searchYear));

      if (soulElement) {
        links.push({ href: soulElement, text: 'Soul listing' });
      }
    }

    for (const link of links.slice(0, 2)) {
      console.log(`\nChecking detail: ${link.href}`);
      const detailPage = await context.newPage();
      try {
        await detailPage.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await detailPage.waitForTimeout(5000);

        const detailText = await detailPage.evaluate(() => document.body.innerText);
        const lines = detailText.split('\n');

        // Print all relevant info
        const flags = ['accident', 'damage', 'commercial', 'rental', 'fleet', 'taxi', 'police',
                       'lien', 'salvage', 'rebuilt', 'total loss', 'fire', 'flood', 'hail',
                       'owner', 'carfax', 'certified', 'history', 'clean', 'claim', 'collision',
                       'vin', 'stock', 'mileage', 'km', 'price', 'soul'];

        for (const line of lines) {
          const lower = line.toLowerCase().trim();
          if (lower.length > 3 && lower.length < 300 && flags.some(f => lower.includes(f))) {
            console.log(`  ${line.trim()}`);
          }
        }

        // Find CARFAX links
        const carfaxLinks = await detailPage.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).filter(a =>
            a.href.toLowerCase().includes('carfax')
          ).map(a => a.href);
        });

        if (carfaxLinks.length > 0) {
          console.log('\n  CARFAX LINKS:');
          [...new Set(carfaxLinks)].forEach(l => console.log(`    ${l}`));
        }
      } catch (e) {
        console.log(`  Error: ${e.message}`);
      } finally {
        await detailPage.close();
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== READING CARFAX FROM INDIVIDUAL LISTING PAGES ===\n');

  // Airport Kia direct CARFAX links
  await readCarfax('Airport Kia Soul EX (Orange)', 'https://vhr.carfax.ca/?id=JIMA508iK2bykTqeByBUFuQRi86CHRdQ');

  // Check detail pages for each dealer
  await checkDetailPage('Airport Kia', 'https://www.airportkia.ca/used/2022-Kia-Soul.html', 2022);
  await checkDetailPage('Kia of Newmarket', 'https://www.kiaofnewmarket.com/en/used-inventory', 2022);
  await checkDetailPage('Morningside Nissan', 'https://www.morningsidenissan.com/en/used-inventory', 2022);
  await checkDetailPage('Bessada Kia', 'https://www.bessadakia.com/en/used-inventory', 2022);
  await checkDetailPage('427/QEW Kia', 'https://www.qewkia.com/vehicles/kia/soul/', 2022);

  console.log('\n=== DONE ===');
}

main().catch(console.error);
