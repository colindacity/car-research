const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('=== CARFAX: Airport Kia Soul EX+ (White) ===\n');

  try {
    await page.goto('https://vhr.carfax.ca/?id=t+pgVXdGE2uOHTjgnqwnNlx3A3skni7q', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await page.waitForTimeout(15000);

    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 300);
    lines.forEach(l => console.log(l));
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser.close();
  }

  // Also check 427/QEW Kia CARFAX
  const browser2 = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx2 = await browser2.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page2 = await ctx2.newPage();

  console.log('\n\n=== Looking for 427/QEW Kia CARFAX link ===\n');

  try {
    await page2.goto('https://www.qewkia.com/vehicles/2022/kia/soul/toronto/on/69167289/?sale_class=used', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await page2.waitForTimeout(6000);

    // Find any carfax.ca links with actual report IDs
    const links = await page2.evaluate(() => {
      return Array.from(document.querySelectorAll('a, img, iframe')).map(el => {
        return {
          tag: el.tagName,
          href: el.href || el.src || '',
          text: el.textContent?.trim().substring(0, 100) || '',
          alt: el.alt || '',
          onclick: el.getAttribute('onclick') || ''
        };
      }).filter(l => {
        const combined = (l.href + l.text + l.alt + l.onclick).toLowerCase();
        return combined.includes('carfax') || combined.includes('vhr.');
      });
    });

    console.log('CARFAX-related elements:');
    links.forEach(l => {
      console.log(`  ${l.tag}: href=${l.href} text=${l.text} alt=${l.alt}`);
    });

    // Also check for embedded CARFAX badges/images
    const badges = await page2.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).filter(img => {
        return (img.src + img.alt).toLowerCase().includes('carfax');
      }).map(img => ({ src: img.src, alt: img.alt }));
    });

    if (badges.length > 0) {
      console.log('\nCARFAX badges:');
      badges.forEach(b => console.log(`  ${b.alt}: ${b.src}`));
    }
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await browser2.close();
  }
}

main().catch(console.error);
