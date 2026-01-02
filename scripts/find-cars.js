#!/usr/bin/env node
/**
 * Daily car finder script - v2
 *
 * Strategy:
 * 1. Search AutoTrader.ca and CarGurus.ca for Soul, Venue, Kicks
 * 2. For each listing found, try to verify on dealer's website
 * 3. Get dealer's direct URL and extra details
 * 4. Add to database if passes criteria
 *
 * Criteria: Clean CARFAX, within 75km of Thornhill, no base trims, under $21K all-in
 */

const https = require('https');
const http = require('http');

// Config
const SUPABASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';

const HOME_COORDS = [43.8108, -79.4250]; // 299 Mullen Dr, Thornhill
const HOME_POSTAL = 'L4J3W3';
const MAX_DISTANCE_KM = 75;
const MAX_PRICE_PRETAX = 18584; // ~$21K all-in

// Aggregator search URLs
const SEARCHES = [
  // AutoTrader - Kia Soul
  {
    name: 'AutoTrader - Kia Soul',
    url: `https://www.autotrader.ca/cars/kia/soul/on/thornhill/?rcp=15&rcs=0&srt=35&prx=${MAX_DISTANCE_KM}&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&inMarket=adv498`,
    brand: 'Kia',
    model: 'Soul'
  },
  // AutoTrader - Hyundai Venue
  {
    name: 'AutoTrader - Hyundai Venue',
    url: `https://www.autotrader.ca/cars/hyundai/venue/on/thornhill/?rcp=15&rcs=0&srt=35&prx=${MAX_DISTANCE_KM}&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&inMarket=adv498`,
    brand: 'Hyundai',
    model: 'Venue'
  },
  // AutoTrader - Nissan Kicks
  {
    name: 'AutoTrader - Nissan Kicks',
    url: `https://www.autotrader.ca/cars/nissan/kicks/on/thornhill/?rcp=15&rcs=0&srt=35&prx=${MAX_DISTANCE_KM}&prv=Ontario&loc=L4J3W3&hprc=True&wcp=True&sts=Used&inMarket=adv498`,
    brand: 'Nissan',
    model: 'Kicks'
  },
  // CarGurus - Kia Soul
  {
    name: 'CarGurus - Kia Soul',
    url: 'https://www.cargurus.ca/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?sourceContext=carGurusHomePageModel&entitySelectingHelper.selectedEntity=d295&zip=L4J3W3&distance=75&searchChanged=true&sortDir=ASC&sortType=DEAL_SCORE&inventorySearchWidgetType=AUTO',
    brand: 'Kia',
    model: 'Soul'
  },
  // CarGurus - Hyundai Venue
  {
    name: 'CarGurus - Hyundai Venue',
    url: 'https://www.cargurus.ca/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?sourceContext=carGurusHomePageModel&entitySelectingHelper.selectedEntity=d2517&zip=L4J3W3&distance=75&searchChanged=true&sortDir=ASC&sortType=DEAL_SCORE',
    brand: 'Hyundai',
    model: 'Venue'
  },
  // CarGurus - Nissan Kicks
  {
    name: 'CarGurus - Nissan Kicks',
    url: 'https://www.cargurus.ca/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?sourceContext=carGurusHomePageModel&entitySelectingHelper.selectedEntity=d2660&zip=L4J3W3&distance=75&searchChanged=true&sortDir=ASC&sortType=DEAL_SCORE',
    brand: 'Nissan',
    model: 'Kicks'
  }
];

// Trims to exclude (base trims)
const EXCLUDED_TRIMS = ['essential', 's fwd', 'kicks s', 'venue s'];

// Known dealer coordinates (for when we can identify the dealer)
const DEALER_COORDS = {
  'thornhill hyundai': { coords: [43.8108, -79.42], address: '7200 Yonge St, Thornhill ON', distance: 2 },
  'richmond hill hyundai': { coords: [43.8828, -79.4383], address: '11188 Yonge St, Richmond Hill ON', distance: 10 },
  'stouffville hyundai': { coords: [43.9701, -79.2503], address: '67 Automall Blvd, Stouffville ON', distance: 20 },
  'durham kia': { coords: [43.9026, -78.8658], address: '550 Taunton Rd W, Oshawa ON', distance: 47 },
  'plaza kia': { coords: [43.8025, -79.4142], address: '8250 Yonge St, Thornhill ON', distance: 6 },
  'airport kia': { coords: [43.7165, -79.6115], address: '6701 Hurontario St, Mississauga ON', distance: 18 },
  'morningside nissan': { coords: [43.7577, -79.1868], address: '4900 Sheppard Ave E, Scarborough ON', distance: 21 },
  'scarborough nissan': { coords: [43.7281, -79.2748], address: '1941 Eglinton Ave E, Scarborough ON', distance: 25 },
  'markham kia': { coords: [43.8567, -79.3372], address: '3883 Hwy 7, Markham ON', distance: 15 },
  'newmarket hyundai': { coords: [44.0592, -79.4613], address: '17415 Yonge St, Newmarket ON', distance: 30 },
  'burlington hyundai': { coords: [43.3557, -79.7925], address: '1420 Walker Line, Burlington ON', distance: 55 },
  'ajax hyundai': { coords: [43.8509, -79.0342], address: '400 Bayly St W, Ajax ON', distance: 35 },
  'pickering hyundai': { coords: [43.8358, -79.0867], address: '575 Kingston Rd, Pickering ON', distance: 30 },
  'whitby kia': { coords: [43.8975, -78.9428], address: '400 Taunton Rd E, Whitby ON', distance: 40 },
  'oshawa kia': { coords: [43.9026, -78.8658], address: '699 King St W, Oshawa ON', distance: 50 },
  'vaughan hyundai': { coords: [43.7877, -79.5277], address: '7601 Weston Rd, Vaughan ON', distance: 15 },
  'north york hyundai': { coords: [43.7615, -79.4111], address: '789 Sheppard Ave E, North York ON', distance: 10 },
  'scarborough hyundai': { coords: [43.7577, -79.2314], address: '2350 Lawrence Ave E, Scarborough ON', distance: 22 },
  'mississauga hyundai': { coords: [43.5890, -79.6441], address: '3145 Mavis Rd, Mississauga ON', distance: 30 },
  'brampton kia': { coords: [43.7315, -79.7624], address: '195 Canam Cres, Brampton ON', distance: 35 },
  'clutch': { coords: [43.6532, -79.3832], address: 'Online Dealer', distance: 20 },
  'autorama': { coords: [43.7647, -79.4858], address: '1205 Finch Ave W, Toronto ON', distance: 18 }
};

// Helper: fetch URL with retries
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-CA,en;q=0.9',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      timeout: 20000
    };

    const req = client.request(reqOptions, res => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`;
        }
        return fetch(redirectUrl, options).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// Parse year from text
function parseYear(text) {
  const match = text.match(/20(19|2[0-6])/);
  return match ? parseInt(match[0]) : null;
}

// Parse price from text
function parsePrice(text) {
  // Look for price patterns like $17,999 or 17999
  const matches = text.match(/\$?\s*([\d]{1,2}[,\s]?[\d]{3})/g) || [];
  for (const m of matches) {
    const price = parseInt(m.replace(/[$,\s]/g, ''));
    if (price >= 10000 && price <= 25000) return price;
  }
  return null;
}

// Parse mileage from text
function parseKm(text) {
  const match = text.match(/([\d,]+)\s*km/i);
  if (match) {
    const km = parseInt(match[1].replace(/,/g, ''));
    if (km >= 1000 && km <= 200000) return km;
  }
  return null;
}

// Extract trim from model text
function extractTrim(text, brand) {
  const t = text.toLowerCase();
  if (brand === 'Kia') {
    if (/ex\s*\+|ex\s*plus|ex\+/i.test(t)) return 'EX+';
    if (/\bex\b/i.test(t)) return 'EX';
    if (/gt[- ]?line/i.test(t)) return 'GT-Line';
    if (/\blx\b/i.test(t)) return 'LX';
  } else if (brand === 'Hyundai') {
    if (/ultimate/i.test(t)) return 'Ultimate';
    if (/preferred/i.test(t)) return 'Preferred';
    if (/trend/i.test(t)) return 'Trend';
    if (/essential/i.test(t)) return 'Essential';
    if (/\bse\b/i.test(t)) return 'SE';
  } else if (brand === 'Nissan') {
    if (/\bsr\b/i.test(t)) return 'SR';
    if (/\bsv\b/i.test(t)) return 'SV';
    if (/\bs\b/i.test(t) && !/\bsv\b|\bsr\b/i.test(t)) return 'S';
  }
  return '';
}

// Check if trim is excluded
function isExcludedTrim(modelText) {
  const lower = modelText.toLowerCase();
  return EXCLUDED_TRIMS.some(t => lower.includes(t));
}

// Extract features from text
function extractFeatures(text) {
  const features = [];
  const t = text.toLowerCase();
  if (/heated\s*seat/i.test(t)) features.push('htd-seats');
  if (/heated\s*(steering|wheel)/i.test(t)) features.push('htd-wheel');
  if (/backup\s*cam|rear\s*cam|reverse\s*cam|rearview\s*cam/i.test(t)) features.push('camera');
  if (/blind\s*spot/i.test(t)) features.push('blind-spot');
  if (/lane\s*(assist|depart|keep)/i.test(t)) features.push('lane');
  if (/auto(matic)?\s*(emergency\s*)?brak|forward\s*collision/i.test(t)) features.push('auto-brake');
  return features;
}

// Find dealer info from name
function findDealerInfo(dealerName) {
  const lower = dealerName.toLowerCase();
  for (const [key, info] of Object.entries(DEALER_COORDS)) {
    if (lower.includes(key) || key.includes(lower.split(' ')[0])) {
      return { ...info, official: key.includes('hyundai') || key.includes('kia') || key.includes('nissan') };
    }
  }
  return null;
}

// Extract color from text
function extractColor(text) {
  const colors = ['white', 'black', 'grey', 'gray', 'silver', 'blue', 'red', 'orange', 'green', 'brown', 'beige'];
  const lower = text.toLowerCase();
  for (const c of colors) {
    if (lower.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return 'Unknown';
}

// Parse AutoTrader listings from HTML
function parseAutoTrader(html, brand, model) {
  const listings = [];

  // AutoTrader uses JSON-LD or specific data attributes
  // Try to find listing data in the HTML
  const listingBlocks = html.split(/data-listing-id|class="listing-/i);

  for (const block of listingBlocks.slice(1)) {
    try {
      const year = parseYear(block);
      const price = parsePrice(block);
      const km = parseKm(block);

      if (!year || year < 2019) continue;
      if (!price || price > MAX_PRICE_PRETAX) continue;

      // Extract dealer name - try multiple patterns
      let dealer = '';

      // Pattern 1: data-dealer-name attribute
      const p1 = block.match(/data-dealer-name=["']([^"']+)["']/i);
      if (p1) dealer = p1[1].trim();

      // Pattern 2: dealer class content
      if (!dealer) {
        const p2 = block.match(/class="[^"]*dealer[^"]*"[^>]*>([A-Za-z0-9\s&'-]+(?:Hyundai|Kia|Nissan|Honda|Toyota|Ford|Auto|Motors|Cars|Sales)[A-Za-z\s]*)/i);
        if (p2) dealer = p2[1].trim();
      }

      // Pattern 3: "at DealerName" or "by DealerName"
      if (!dealer) {
        const p3 = block.match(/(?:sold\s+)?(?:at|by)\s+([A-Z][A-Za-z0-9\s&'-]+(?:Hyundai|Kia|Nissan|Honda|Toyota|Ford|Chrysler|Auto|Motors|Cars|Sales))/);
        if (p3) dealer = p3[1].trim();
      }

      // Pattern 4: dealership name in link text
      if (!dealer) {
        const p4 = block.match(/>([A-Z][A-Za-z0-9\s&'-]{5,}(?:Hyundai|Kia|Nissan|Honda|Toyota|Ford|Chrysler|Auto|Motors|Cars|Sales))</);
        if (p4) dealer = p4[1].trim();
      }

      // Pattern 5: Known dealer names from our list
      if (!dealer) {
        const blockLower = block.toLowerCase();
        for (const [key] of Object.entries(DEALER_COORDS)) {
          if (blockLower.includes(key)) {
            dealer = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }

      // Skip if no valid dealer found (prevents garbage data)
      if (!dealer || dealer.length < 3 || dealer.length > 50) continue;

      // Clean up dealer name - remove common noise
      dealer = dealer.replace(/\s+/g, ' ')
                     .replace(/^[^A-Za-z]+/, '')
                     .replace(/[^A-Za-z\s&'-]+$/, '')
                     .trim();

      if (!dealer || dealer.toLowerCase() === 'unknown') continue;

      // Extract listing URL
      let listingUrl = '';
      const urlMatch = block.match(/href="(\/a\/[^"]+)"/i);
      if (urlMatch) listingUrl = 'https://www.autotrader.ca' + urlMatch[1];

      const trim = extractTrim(block, brand);
      const modelName = `${model} ${trim}`.trim();

      if (isExcludedTrim(modelName)) continue;

      const dealerInfo = findDealerInfo(dealer);

      listings.push({
        year,
        model: modelName,
        color: extractColor(block),
        km: km || 50000,
        price,
        dealer,
        distance: dealerInfo?.distance || 50,
        features: extractFeatures(block),
        carfax: 'unknown',
        carfax_url: '',
        listing_url: listingUrl,
        dealer_url: '',
        carfax_note: 'Found on AutoTrader - verify CARFAX',
        coords: dealerInfo?.coords || HOME_COORDS,
        official: dealerInfo?.official || false,
        address: dealerInfo?.address || '',
        source: 'autotrader'
      });
    } catch (e) {
      // Skip malformed listings
    }
  }

  return listings;
}

// Parse CarGurus listings from HTML
function parseCarGurus(html, brand, model) {
  const listings = [];

  // CarGurus has structured listing cards
  const listingBlocks = html.split(/listing-row|result-card/i);

  for (const block of listingBlocks.slice(1)) {
    try {
      const year = parseYear(block);
      const price = parsePrice(block);
      const km = parseKm(block);

      if (!year || year < 2019) continue;
      if (!price || price > MAX_PRICE_PRETAX) continue;

      // Extract dealer name - try multiple patterns
      let dealer = '';

      // Pattern 1: dealer-name class
      const p1 = block.match(/dealer-name['":\s>]+([A-Za-z0-9\s&'-]+)/i);
      if (p1) dealer = p1[1].trim();

      // Pattern 2: sold by pattern
      if (!dealer) {
        const p2 = block.match(/sold by[:\s]+([A-Za-z0-9\s&'-]+(?:Hyundai|Kia|Nissan|Auto|Motors|Cars|Sales)?)/i);
        if (p2) dealer = p2[1].trim();
      }

      // Pattern 3: Known dealer names from our list
      if (!dealer) {
        const blockLower = block.toLowerCase();
        for (const [key] of Object.entries(DEALER_COORDS)) {
          if (blockLower.includes(key)) {
            dealer = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }

      // Skip if no valid dealer found
      if (!dealer || dealer.length < 3 || dealer.length > 50) continue;

      // Clean up dealer name
      dealer = dealer.replace(/\s+/g, ' ')
                     .replace(/^[^A-Za-z]+/, '')
                     .replace(/[^A-Za-z\s&'-]+$/, '')
                     .trim();

      if (!dealer || dealer.toLowerCase() === 'unknown') continue;

      let listingUrl = '';
      const urlMatch = block.match(/href="([^"]*inventorylisting[^"]+)"/i) ||
                       block.match(/href="(\/Cars\/[^"]+)"/i);
      if (urlMatch) {
        listingUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : 'https://www.cargurus.ca' + urlMatch[1];
      }

      const trim = extractTrim(block, brand);
      const modelName = `${model} ${trim}`.trim();

      if (isExcludedTrim(modelName)) continue;

      const dealerInfo = findDealerInfo(dealer);

      listings.push({
        year,
        model: modelName,
        color: extractColor(block),
        km: km || 50000,
        price,
        dealer,
        distance: dealerInfo?.distance || 50,
        features: extractFeatures(block),
        carfax: 'unknown',
        carfax_url: '',
        listing_url: listingUrl,
        dealer_url: '',
        carfax_note: 'Found on CarGurus - verify CARFAX',
        coords: dealerInfo?.coords || HOME_COORDS,
        official: dealerInfo?.official || false,
        address: dealerInfo?.address || '',
        source: 'cargurus'
      });
    } catch (e) {
      // Skip malformed listings
    }
  }

  return listings;
}

// Try to verify listing on dealer website and get direct URL
async function verifyOnDealerSite(listing) {
  if (!listing.dealer || listing.dealer === 'Unknown Dealer') return listing;

  const dealerInfo = findDealerInfo(listing.dealer);
  if (!dealerInfo) return listing;

  // Try common dealer website patterns
  const dealerDomain = listing.dealer.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');

  const possibleUrls = [
    `https://www.${dealerDomain}.com/inventory/used/`,
    `https://www.${dealerDomain}.ca/inventory/used/`,
    `https://www.${dealerDomain}.com/used-inventory/`,
  ];

  for (const url of possibleUrls) {
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        // Check if our car might be listed
        const hasYear = res.data.includes(String(listing.year));
        const hasModel = res.data.toLowerCase().includes(listing.model.toLowerCase().split(' ')[0]);

        if (hasYear && hasModel) {
          listing.dealer_url = url;
          listing.carfax_note = `Verified on dealer site - check CARFAX`;
          console.log(`    Verified on dealer site: ${url}`);
        }
      }
    } catch (e) {
      // Dealer site not accessible, continue
    }
  }

  return listing;
}

// Generate unique key for a listing
function listingKey(listing) {
  return `${listing.year}-${listing.model}-${listing.dealer}-${listing.price}`.toLowerCase().replace(/\s+/g, '');
}

// Main search function
async function searchForCars() {
  console.log('=== Daily Car Search v2 ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Strategy: Search aggregators -> Verify on dealer sites`);
  console.log(`Looking for: Soul, Venue, Kicks`);
  console.log(`Max distance: ${MAX_DISTANCE_KM}km from Thornhill`);
  console.log(`Max price: $${MAX_PRICE_PRETAX} pre-tax (~$21K all-in)\n`);

  // Get existing listings from database
  let existingCars = [];
  try {
    const apiRes = await fetch(`${SUPABASE_URL}/rest/v1/cars?select=year,model,dealer,price`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    existingCars = JSON.parse(apiRes.data) || [];
    console.log(`Existing listings in database: ${existingCars.length}\n`);
  } catch (e) {
    console.error('Failed to fetch existing cars:', e.message);
    existingCars = [];
  }

  const existingKeys = new Set(existingCars.map(c => listingKey(c)));
  const allListings = [];
  const errors = [];

  // Search each aggregator
  for (const search of SEARCHES) {
    console.log(`Searching ${search.name}...`);

    try {
      const res = await fetch(search.url);

      if (res.status !== 200) {
        console.log(`  Status: ${res.status} (might be blocked)`);
        errors.push(`${search.name}: HTTP ${res.status}`);
        continue;
      }

      let listings = [];
      if (search.url.includes('autotrader')) {
        listings = parseAutoTrader(res.data, search.brand, search.model);
      } else if (search.url.includes('cargurus')) {
        listings = parseCarGurus(res.data, search.brand, search.model);
      }

      console.log(`  Found ${listings.length} potential listings`);

      // Filter out duplicates and existing
      for (const listing of listings) {
        const key = listingKey(listing);
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          allListings.push(listing);
        }
      }

    } catch (e) {
      console.log(`  Error: ${e.message}`);
      errors.push(`${search.name}: ${e.message}`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nTotal new listings found: ${allListings.length}`);

  // Verify listings on dealer sites
  if (allListings.length > 0) {
    console.log('\nVerifying on dealer websites...');
    for (let i = 0; i < allListings.length; i++) {
      const listing = allListings[i];
      console.log(`  [${i+1}/${allListings.length}] ${listing.year} ${listing.model} @ ${listing.dealer}`);
      allListings[i] = await verifyOnDealerSite(listing);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Add to database
  const added = [];
  if (allListings.length > 0) {
    console.log('\nAdding to database...');

    for (const listing of allListings) {
      // Prepare for database
      const dbListing = {
        year: listing.year,
        model: listing.model,
        color: listing.color,
        km: listing.km,
        price: listing.price,
        dealer: listing.dealer,
        distance: listing.distance,
        features: listing.features,
        carfax: listing.carfax,
        carfax_url: listing.carfax_url,
        listing_url: listing.listing_url,
        dealer_url: listing.dealer_url,
        carfax_note: listing.carfax_note,
        coords: listing.coords,
        official: listing.official,
        address: listing.address,
        availability: 'available',
        last_checked: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      try {
        const postData = JSON.stringify(dbListing);
        const insertRes = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: 'bjswbajtxacjwubghytb.supabase.co',
            path: '/rest/v1/cars',
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              'Prefer': 'return=representation'
            }
          }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
          });
          req.on('error', reject);
          req.write(postData);
          req.end();
        });

        if (insertRes.status >= 200 && insertRes.status < 300) {
          added.push(listing);
          console.log(`  Added: ${listing.year} ${listing.model} @ ${listing.dealer} - $${listing.price}`);
        } else {
          console.log(`  Failed: ${listing.year} ${listing.model} - ${insertRes.data}`);
        }
      } catch (e) {
        console.log(`  Error adding ${listing.year} ${listing.model}: ${e.message}`);
      }
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Aggregator searches: ${SEARCHES.length}`);
  console.log(`New listings found: ${allListings.length}`);
  console.log(`Added to database: ${added.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  if (added.length > 0) {
    console.log('\nNewly added:');
    added.forEach(l => console.log(`  - ${l.year} ${l.model} @ ${l.dealer} - $${l.price}`));
  }

  console.log('\nDone!');
  return { found: allListings.length, added: added.length, errors: errors.length };
}

// Run if called directly
if (require.main === module) {
  searchForCars().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { searchForCars };
