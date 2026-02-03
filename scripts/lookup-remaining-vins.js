const { chromium } = require('playwright');

async function lookupVIN(name, vin) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} - VIN: ${vin} ===`);

  try {
    // Try CARFAX Canada VIN lookup
    await page.goto(`https://www.carfax.ca/vehicle-history-report?vin=${vin}`, {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await page.waitForTimeout(8000);

    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 300);

    const flags = ['accident', 'damage', 'commercial', 'rental', 'fleet', 'taxi', 'police',
                   'lien', 'salvage', 'rebuilt', 'total loss', 'fire', 'flood', 'hail',
                   'owner', 'service', 'odometer', 'km', 'clean', 'no accident',
                   'registered', 'ontario', 'history', 'warning', 'stolen', 'recall',
                   'collision', 'claim', 'insurance', 'record', 'report'];

    let foundRelevant = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (flags.some(f => lower.includes(f))) {
        console.log(`  ${line}`);
        foundRelevant = true;
      }
    }

    if (!foundRelevant) {
      // Print first 30 lines for context
      console.log('  No flagged content found. First 30 lines:');
      lines.slice(0, 30).forEach(l => console.log(`  ${l}`));
    }

    // Check for free report preview or badge
    const carfaxBadges = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).filter(img =>
        (img.src + img.alt).toLowerCase().includes('carfax') ||
        (img.src + img.alt).toLowerCase().includes('badge')
      ).map(img => ({ src: img.src, alt: img.alt }));
    });

    if (carfaxBadges.length > 0) {
      console.log('\n  CARFAX badges/images:');
      carfaxBadges.forEach(b => console.log(`    ${b.alt}: ${b.src}`));
    }

  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== LOOKING UP REMAINING VINs ON CARFAX CANADA ===\n');

  // Morningside Nissan
  await lookupVIN('Morningside Nissan 2022 Soul EX', 'KNDJ33AU5N7833919');

  // Kia of Newmarket EX+
  await lookupVIN('Kia of Newmarket 2022 Soul EX+', 'KNDJ33AU9N7173478');

  // Kia of Newmarket EX
  await lookupVIN('Kia of Newmarket 2022 Soul EX', 'KNDJ33AU0N7176429');

  // Bessada Kia
  await lookupVIN('Bessada Kia 2022 Soul', 'KNDJ33AU8N7815690');

  // 427/QEW Kia (rental)
  await lookupVIN('427/QEW Kia 2022 Soul EX (RENTAL)', 'KNDJ33AU1N7804420');

  console.log('\n=== DONE ===');
}

main().catch(console.error);
