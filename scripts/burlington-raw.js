const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('Loading Burlington Venue filter page...\n');

  await page.goto('https://www.burlingtonhyundai.ca/inventory/used/?modelId[]=jLUJADG2Q26zR5bs-IM1Fw', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page length:', text.length);
  console.log('\nFull content:\n');
  console.log(text);

  await browser.close();
}

main().catch(console.error);
