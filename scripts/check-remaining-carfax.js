const { chromium } = require('playwright');

async function findListingAndCarfax(name, inventoryUrl) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===`);

  try {
    await page.goto(inventoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    // Try to find and click on a Soul listing
    const soulLink = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      for (const a of allLinks) {
        const text = (a.textContent + ' ' + a.href).toLowerCase();
        if (text.includes('soul') && (text.includes('2022') || text.includes('2023')) &&
            !text.includes('ev') && !text.includes('electric')) {
          return a.href;
        }
      }
      // Try finding clickable elements near Soul text
      const allEls = Array.from(document.querySelectorAll('[href], [onclick]'));
      for (const el of allEls) {
        const parent = el.closest('.vehicle, .listing, .card, [class*="vehicle"], [class*="listing"], [class*="inventory"]');
        if (parent) {
          const pText = parent.textContent.toLowerCase();
          if (pText.includes('soul') && (pText.includes('2022') || pText.includes('2023')) && !pText.includes('ev')) {
            return el.href || el.getAttribute('onclick');
          }
        }
      }
      return null;
    });

    if (soulLink) {
      console.log(`Found listing link: ${soulLink}`);
      const detailPage = await context.newPage();
      await detailPage.goto(soulLink, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await detailPage.waitForTimeout(5000);

      const text = await detailPage.evaluate(() => document.body.innerText);
      const lines = text.split('\n');
      const flags = ['accident', 'damage', 'commercial', 'rental', 'fleet', 'taxi', 'police',
                     'lien', 'salvage', 'rebuilt', 'total loss', 'fire', 'flood', 'hail',
                     'owner', 'carfax', 'certified', 'history', 'clean', 'claim', 'collision',
                     'vin', 'stock', 'price', 'soul'];

      for (const line of lines) {
        const lower = line.toLowerCase().trim();
        if (lower.length > 3 && lower.length < 300 && flags.some(f => lower.includes(f))) {
          console.log(`  ${line.trim()}`);
        }
      }

      const carfaxLinks = await detailPage.evaluate(() => {
        return Array.from(document.querySelectorAll('a, img, iframe'))
          .filter(el => ((el.href || el.src || '') + (el.alt || '')).toLowerCase().includes('carfax'))
          .map(el => ({ tag: el.tagName, href: el.href || el.src, text: el.textContent?.trim().substring(0, 80) || '', alt: el.alt || '' }));
      });

      if (carfaxLinks.length > 0) {
        console.log('\n  CARFAX elements:');
        carfaxLinks.forEach(l => console.log(`    ${l.tag}: ${l.href} (${l.text || l.alt})`));
      }

      await detailPage.close();
    } else {
      console.log('Could not find clickable Soul listing link');

      // Try a different approach - look at all vehicle card containers
      const vehicleInfo = await page.evaluate(() => {
        const results = [];
        // Common patterns for vehicle cards
        const cards = document.querySelectorAll('.vehicle-card, .listing-card, .inventory-item, [class*="vehicle"], [class*="listing"]');
        for (const card of cards) {
          const text = card.textContent.toLowerCase();
          if (text.includes('soul') && (text.includes('2022') || text.includes('2023')) && !text.includes(' ev')) {
            // Find any links in this card
            const cardLinks = Array.from(card.querySelectorAll('a')).map(a => a.href);
            results.push({
              text: card.textContent.trim().substring(0, 500),
              links: cardLinks.slice(0, 5)
            });
          }
        }
        return results;
      });

      if (vehicleInfo.length > 0) {
        console.log('Found vehicle cards:');
        vehicleInfo.forEach(v => {
          console.log(`  ${v.text.substring(0, 300)}`);
          v.links.forEach(l => console.log(`    Link: ${l}`));
        });
      }
    }
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== CHECKING CARFAX FOR REMAINING LISTINGS ===\n');

  await findListingAndCarfax('Kia of Newmarket', 'https://www.kiaofnewmarket.com/en/used-inventory');
  await findListingAndCarfax('Morningside Nissan', 'https://www.morningsidenissan.com/en/used-inventory');
  await findListingAndCarfax('Bessada Kia (Pickering)', 'https://www.bessadakia.com/en/used-inventory');

  console.log('\n=== DONE ===');
}

main().catch(console.error);
