const { chromium } = require('playwright');

async function checkSite(name, url) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log(`\n=== ${name} ===\n`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('Page loaded, length:', text.length);

    if (text.toLowerCase().includes('soul')) {
      console.log('SOUL FOUND!');

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('soul') && lines[i].match(/2019|2020|2021|2022|2023|2024/) &&
            !line.includes(' ev') && !line.includes('electric')) {
          console.log('\n--- Context ---');
          for (let j = i; j < Math.min(lines.length, i + 12); j++) {
            const l = lines[j].trim();
            if (l) console.log('  ' + l);
          }
          break;
        }
      }

      // Find prices
      const prices = text.match(/\$[\d,]+/g);
      if (prices) {
        const validPrices = [...new Set(prices)].filter(p => {
          const num = parseInt(p.replace(/[$,]/g, ''));
          return num >= 10000 && num <= 25000;
        });
        console.log('\nPrices:', validPrices.join(', '));
      }

      // Find km
      const kms = text.match(/[\d,]+\s*km/gi);
      if (kms) {
        console.log('KMs:', [...new Set(kms)].join(', '));
      }

      const phone = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      console.log('Phone:', phone?.[0]);

      return { found: true, text };
    } else {
      console.log('No Soul found');
      return { found: false };
    }
  } catch (err) {
    console.log('Error:', err.message);
    return { found: false, error: err.message };
  } finally {
    await browser.close();
  }
}

async function main() {
  // Try Golden Mile Chrysler with different URL
  await checkSite('Golden Mile Chrysler', 'https://www.goldenmilechrysler.ca/inventory/?make=kia&model=soul');

  // Markville Motors
  await checkSite('Markville Motors (Richmond Hill)', 'https://www.markvillemotors.com/inventory/?make=kia');

  // Plaza Kia Richmond Hill
  await checkSite('Plaza Kia Richmond Hill', 'https://www.plazakia.com/en/used-inventory');

  // Woodbine Nissan
  await checkSite('Woodbine Nissan', 'https://www.woodbinenissan.com/en/used-inventory');

  // Agincourt Mazda
  await checkSite('Agincourt Mazda', 'https://www.agincourtmazda.com/en/used-inventory');
}

main().catch(console.error);
