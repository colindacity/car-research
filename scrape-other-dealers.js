const { chromium } = require('playwright');

const listings = [
  // Brampton North Nissan - 2023 Soul EX 24K km - VERY LOW KM!
  { name: 'Brampton Nissan Soul 24K', url: 'https://www.autotrader.ca/a/kia/soul/brampton/ontario/5_67844936_on20070924102414963/' },
  // Bolton Nissan - 2021 Venue Essential 54K km
  { name: 'Bolton Nissan Venue', url: 'https://www.autotrader.ca/a/hyundai/venue/bolton/ontario/5_67892660_20110201142314359/' },
  // Georgetown Hyundai - 2022 Venue Ultimate 62K
  { name: 'Georgetown Hyundai Ultimate', url: 'https://www.autotrader.ca/a/hyundai/venue/georgetown/ontario/5_65924347_20201007203356043/' },
  // 401 Dixie Hyundai - 2021 Venue Essential 52K
  { name: '401 Dixie Hyundai Venue', url: 'https://www.autotrader.ca/a/hyundai/venue/mississauga/ontario/5_68696590_20100518061857102/' },
  // Seven View Chrysler - 2022 Soul EX 83K - only 5km away!
  { name: 'Seven View Chrysler Soul', url: 'https://www.autotrader.ca/a/kia/soul/concord/ontario/5_68331978_20150910113150119/' },
  // Ajax Nissan - 2022 Soul EX 86K
  { name: 'Ajax Nissan Soul', url: 'https://www.autotrader.ca/a/kia/soul/ajax/ontario/5_68580986_on20080514103912062/' },
  // Newmarket Hyundai - 2021 Venue Essential 51K
  { name: 'Newmarket Hyundai Venue', url: 'https://www.autotrader.ca/a/hyundai/venue/newmarket/ontario/5_68245529_20150529105935682/' },
  // Morningside Nissan - 2022 Soul EX 88K
  { name: 'Morningside Nissan Soul', url: 'https://www.autotrader.ca/a/kia/soul/toronto/ontario/5_68649253_on20080430102916422/' },
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  for (const item of listings) {
    console.log('\n' + '='.repeat(60));
    console.log('Scraping: ' + item.name);
    console.log('URL: ' + item.url);
    console.log('='.repeat(60));

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(r => setTimeout(r, 4000));

      await page.evaluate(() => window.scrollBy(0, 1500));
      await new Promise(r => setTimeout(r, 2000));

      const data = await page.evaluate(() => {
        const bodyText = document.body.innerText;

        // Find CARFAX link
        const carfaxLink = document.querySelector('a[href*="carfax"]');
        const carfaxUrl = carfaxLink ? carfaxLink.href : 'Not found';

        // Find price
        const priceMatch = bodyText.match(/\$[\d,]+/);

        // Find km
        const kmMatch = bodyText.match(/([\d,]+)\s*km/i);

        return {
          carfaxUrl,
          price: priceMatch ? priceMatch[0] : 'N/A',
          km: kmMatch ? kmMatch[1] : 'N/A',
          text: bodyText.substring(0, 2500)
        };
      });

      console.log('CARFAX: ' + data.carfaxUrl);
      console.log('Price: ' + data.price);
      console.log('KM: ' + data.km);
      console.log('\n--- Content ---');
      console.log(data.text);

    } catch (err) {
      console.log('Error: ' + err.message);
    }
  }

  await browser.close();
})();
