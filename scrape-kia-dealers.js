const { chromium } = require('playwright');

const kiaListings = [
  // Plaza Kia - Richmond Hill (closest!)
  'https://www.autotrader.ca/a/kia/soul/richmond%20hill/ontario/5_68539680_20140418141806717/',
  // Airport Kia - Mississauga
  'https://www.autotrader.ca/a/kia/soul/mississauga/ontario/5_67827191_on20080716100324602/',
  // Kia of Newmarket - multiple
  'https://www.autotrader.ca/a/kia/soul/newmarket/ontario/5_68448217_on20090513104443851/',
  'https://www.autotrader.ca/a/kia/soul/newmarket/ontario/5_68395469_on20090513104443851/',
  // Durham Kia - Oshawa (best priced ones)
  'https://www.autotrader.ca/a/kia/soul/oshawa/ontario/5_68020090_on20080324092133664/',
  'https://www.autotrader.ca/a/kia/soul/oshawa/ontario/5_68878843_on20080324092133664/',
  // Georgetown (CPO)
  'https://www.autotrader.ca/a/kia/soul/georgetown/ontario/5_68330820_on20080206114620836/',
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  for (const url of kiaListings) {
    console.log('\n========================================');
    console.log('Fetching: ' + url);
    console.log('========================================');

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(r => setTimeout(r, 4000));

      // Scroll to load content
      await page.evaluate(() => window.scrollBy(0, 1500));
      await new Promise(r => setTimeout(r, 2000));

      const data = await page.evaluate(() => {
        const getText = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.innerText.trim() : '';
        };

        // Get all text content
        const bodyText = document.body.innerText;

        // Try to find VIN
        const vinMatch = bodyText.match(/VIN[:\s]*([A-Z0-9]{17})/i) ||
                        bodyText.match(/KNDJ[A-Z0-9]{13}/);
        const vin = vinMatch ? (vinMatch[1] || vinMatch[0]) : 'Not found';

        // Try to find CARFAX link
        const carfaxLink = document.querySelector('a[href*="carfax"]');
        const carfaxUrl = carfaxLink ? carfaxLink.href : 'Not found';

        // Get price
        const priceMatch = bodyText.match(/\$[\d,]+/);
        const price = priceMatch ? priceMatch[0] : 'Not found';

        // Get key details
        const kmMatch = bodyText.match(/([\d,]+)\s*KM/i);
        const km = kmMatch ? kmMatch[1] : 'Not found';

        // Get dealer name
        const dealerMatch = bodyText.match(/(?:Dealer|Sold by)[:\s]*([^\n]+)/i);

        return {
          vin,
          carfaxUrl,
          price,
          km,
          bodyText: bodyText.substring(0, 3000)
        };
      });

      console.log('VIN: ' + data.vin);
      console.log('CARFAX: ' + data.carfaxUrl);
      console.log('Price: ' + data.price);
      console.log('KM: ' + data.km);
      console.log('\n--- Page Content ---');
      console.log(data.bodyText);

    } catch (err) {
      console.log('Error: ' + err.message);
    }
  }

  await browser.close();
})();
