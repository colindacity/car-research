const { chromium } = require('playwright');

const LISTINGS = [
  // 2020 Venue listings from AutoTrader
  'https://www.autotrader.ca/a/hyundai/venue/toronto/ontario/5_68799325_20130829130517456/', // Gyro?
  'https://www.autotrader.ca/a/hyundai/venue/scarborough/ontario/5_68472233_on20080103120547992/', // Agincourt
  'https://www.autotrader.ca/a/hyundai/venue/etobicoke/ontario/5_68866862_20190822151050437/', // Queensway
  'https://www.autotrader.ca/a/hyundai/venue/brampton/ontario/5_67645341_20140729155225432/', //
  'https://www.autotrader.ca/a/hyundai/venue/st%20catharines/ontario/5_68746127_20250827184224570/',
];

// Also search for other years
const SEARCH_URLS = [
  'https://www.autotrader.ca/cars/hyundai/venue/2021/on/?rcp=25&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&pRng=10000,19000',
  'https://www.autotrader.ca/cars/hyundai/venue/2022/on/?rcp=25&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&pRng=10000,19000',
  'https://www.autotrader.ca/cars/kia/soul/2019/on/?rcp=25&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&pRng=10000,19000',
  'https://www.autotrader.ca/cars/kia/soul/2022/on/?rcp=25&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&pRng=10000,19000',
  'https://www.autotrader.ca/cars/nissan/kicks/2021/on/?rcp=25&rcs=0&srt=35&prx=100&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&pRng=10000,19000',
];

async function getListingDetails(page, url) {
  console.log(`\n--- Fetching: ${url.substring(0, 80)}... ---`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const details = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);

      // Extract key info
      const result = {
        title: '',
        price: '',
        km: '',
        dealer: '',
        address: '',
        phone: '',
        trim: '',
        color: '',
        vin: '',
        stock: '',
        carfax: '',
        carfaxUrl: '',
        features: []
      };

      // Find title (year + make + model)
      for (const line of lines) {
        if (line.match(/^202[0-5]\s+Hyundai\s+Venue/i) ||
            line.match(/^(2019|202[2-5])\s+Kia\s+Soul/i) ||
            line.match(/^202[1-5]\s+Nissan\s+Kicks/i)) {
          result.title = line;
          break;
        }
      }

      // Find price
      for (const line of lines) {
        const priceMatch = line.match(/^\$?([\d,]+)$/);
        if (priceMatch && parseInt(priceMatch[1].replace(/,/g, '')) > 10000 &&
            parseInt(priceMatch[1].replace(/,/g, '')) < 50000) {
          result.price = '$' + priceMatch[1];
          break;
        }
      }

      // Find km
      for (const line of lines) {
        if (line.match(/^[\d,]+\s*km$/i)) {
          result.km = line;
          break;
        }
      }

      // Find trim
      for (const line of lines) {
        if (line.match(/^(Essential|Preferred|Trend|Ultimate|LX|EX|EX\+|EX Premium|GT-Line|S|SV|SR)$/i)) {
          result.trim = line;
          break;
        }
      }

      // Find dealer (usually has Hyundai/Kia/Nissan in name or is an obvious dealer name)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/(Hyundai|Kia|Nissan|Mazda|Toyota|Honda|Ford|Chevrolet|Auto|Motors|Cars)/i) &&
            !line.match(/^202/) && !line.match(/venue|soul|kicks/i) &&
            line.length < 60 && line.length > 5) {
          if (!result.dealer) result.dealer = line;
        }
      }

      // Find address (city, ON pattern)
      for (const line of lines) {
        if (line.match(/,\s*(ON|Ontario)\b/i) && line.length < 100) {
          result.address = line;
          break;
        }
      }

      // Find phone
      for (const line of lines) {
        const phoneMatch = line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
          result.phone = phoneMatch[0];
          break;
        }
      }

      // Find VIN
      for (const line of lines) {
        if (line.match(/^[A-HJ-NPR-Z0-9]{17}$/i)) {
          result.vin = line;
          break;
        }
      }

      // Find stock number
      for (const line of lines) {
        if (line.match(/stock.*?:?\s*([A-Z0-9-]+)/i)) {
          result.stock = line;
          break;
        }
      }

      // Find CARFAX info
      for (const line of lines) {
        if (line.toLowerCase().includes('carfax') || line.toLowerCase().includes('accident')) {
          if (!result.carfax) result.carfax = line;
        }
      }

      // Get CARFAX link
      const carfaxLink = document.querySelector('a[href*="carfax.ca"]');
      if (carfaxLink) result.carfaxUrl = carfaxLink.href;

      // Get dealer website link
      const dealerLink = document.querySelector('a[href*="dealer"]');
      if (dealerLink) result.dealerUrl = dealerLink.href;

      return result;
    });

    console.log(JSON.stringify(details, null, 2));
    return details;
  } catch (err) {
    console.log('Error:', err.message);
    return null;
  }
}

async function searchAndExtractLinks(page, url) {
  console.log(`\n=== Searching: ${url.substring(0, 60)}... ===`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/a/hyundai/venue/"], a[href*="/a/kia/soul/"], a[href*="/a/nissan/kicks/"]'))
        .map(a => a.href)
        .filter((href, i, arr) => arr.indexOf(href) === i);
    });

    console.log(`Found ${links.length} listing links`);
    return links;
  } catch (err) {
    console.log('Error:', err.message);
    return [];
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // First, search to get more listing URLs
  let allListingUrls = [...LISTINGS];
  for (const searchUrl of SEARCH_URLS) {
    const links = await searchAndExtractLinks(page, searchUrl);
    allListingUrls = [...allListingUrls, ...links];
  }

  // Dedupe
  allListingUrls = [...new Set(allListingUrls)];
  console.log(`\nTotal unique listing URLs: ${allListingUrls.length}`);

  // Get details from each listing
  const allDetails = [];
  for (const url of allListingUrls.slice(0, 30)) { // Limit to 30
    const details = await getListingDetails(page, url);
    if (details && details.title) {
      allDetails.push({ ...details, autotraderUrl: url });
    }
  }

  console.log('\n\n========== SUMMARY ==========');
  console.log(`Found ${allDetails.length} valid listings:\n`);

  // Filter out Essential trim and sort by price
  const filtered = allDetails
    .filter(d => !d.trim?.toLowerCase().includes('essential'))
    .filter(d => !d.title?.toLowerCase().includes('essential'));

  filtered.forEach((d, i) => {
    console.log(`${i+1}. ${d.title} ${d.trim || ''}`);
    console.log(`   Price: ${d.price}, KM: ${d.km}`);
    console.log(`   Dealer: ${d.dealer}`);
    console.log(`   Phone: ${d.phone}`);
    console.log(`   CARFAX: ${d.carfax}`);
    console.log(`   URL: ${d.autotraderUrl}`);
    console.log('');
  });

  await browser.close();
}

main().catch(console.error);
