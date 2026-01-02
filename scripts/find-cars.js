#!/usr/bin/env node
/**
 * Daily car finder script
 * Searches for new Kia Soul, Hyundai Venue, and Nissan Kicks listings
 * Criteria: Clean CARFAX, within 75km of Thornhill, no base trims
 */

const https = require('https');
const http = require('http');

// Config
const SUPABASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';

const HOME_COORDS = [43.8108, -79.4250]; // 299 Mullen Dr, Thornhill
const MAX_DISTANCE_KM = 75;
const MAX_PRICE_PRETAX = 18584; // ~$21K all-in

// Dealer sources to check (official dealers with inventory pages)
const DEALER_SOURCES = [
  {
    name: 'Thornhill Hyundai',
    brand: 'Hyundai',
    url: 'https://www.thornhillhyundai.com/inventory/used/',
    coords: [43.8108, -79.42],
    address: '7200 Yonge St, Thornhill ON',
    distance: 2,
    official: true
  },
  {
    name: 'Richmond Hill Hyundai',
    brand: 'Hyundai',
    url: 'https://www.richmondhillhyundai.com/inventory/used/',
    coords: [43.8828, -79.4383],
    address: '11188 Yonge St, Richmond Hill ON',
    distance: 10,
    official: true
  },
  {
    name: 'Stouffville Hyundai',
    brand: 'Hyundai',
    url: 'https://www.stouffvillehyundai.com/inventory/used/',
    coords: [43.9701, -79.2503],
    address: '67 Automall Blvd, Stouffville ON',
    distance: 20,
    official: true
  },
  {
    name: 'Durham Kia',
    brand: 'Kia',
    url: 'https://www.durhamkia.com/inventory/used/',
    coords: [43.9026, -78.8658],
    address: '550 Taunton Rd W, Oshawa ON',
    distance: 47,
    official: true
  },
  {
    name: 'Plaza Kia',
    brand: 'Kia',
    url: 'https://www.plazakia.com/inventory/used/',
    coords: [43.8025, -79.4142],
    address: '8250 Yonge St, Thornhill ON',
    distance: 6,
    official: true
  },
  {
    name: 'Airport Kia',
    brand: 'Kia',
    url: 'https://www.airportkia.com/inventory/used/',
    coords: [43.7165, -79.6115],
    address: '6701 Hurontario St, Mississauga ON',
    distance: 18,
    official: true
  },
  {
    name: 'Morningside Nissan',
    brand: 'Nissan',
    url: 'https://www.morningsidenissan.com/en/new-pre-owned/pre-owned-inventory/',
    coords: [43.7577, -79.1868],
    address: '4900 Sheppard Ave E, Scarborough ON',
    distance: 21,
    official: true
  }
];

// Models we're looking for
const TARGET_MODELS = [
  { pattern: /kia.*soul/i, brand: 'Kia', model: 'Soul' },
  { pattern: /hyundai.*venue/i, brand: 'Hyundai', model: 'Venue' },
  { pattern: /nissan.*kicks/i, brand: 'Nissan', model: 'Kicks' }
];

// Trims to exclude (base trims)
const EXCLUDED_TRIMS = ['Essential', 'S FWD', 'Kicks S'];

// Helper: fetch URL
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/json',
      ...options.headers
    };
    const req = client.get(url, { headers, timeout: 15000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, options).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Helper: Supabase API call
async function supabaseGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`);
  if (res.status !== 200) throw new Error(`Supabase error: ${res.status}`);
  return JSON.parse(res.data);
}

async function supabaseInsert(table, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    const postData = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
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
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '[]'));
        } else {
          reject(new Error(`Insert failed: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Parse year from text
function parseYear(text) {
  const match = text.match(/20(19|2[0-5])/);
  return match ? parseInt(match[0]) : null;
}

// Parse price from text
function parsePrice(text) {
  const match = text.match(/\$?([\d,]+)/);
  if (match) {
    const price = parseInt(match[1].replace(/,/g, ''));
    if (price > 10000 && price < 30000) return price;
  }
  return null;
}

// Parse mileage from text
function parseKm(text) {
  const match = text.match(/([\d,]+)\s*km/i);
  if (match) {
    const km = parseInt(match[1].replace(/,/g, ''));
    if (km > 1000 && km < 200000) return km;
  }
  return null;
}

// Check if trim is excluded
function isExcludedTrim(model) {
  return EXCLUDED_TRIMS.some(t => model.toLowerCase().includes(t.toLowerCase()));
}

// Extract features from text
function extractFeatures(text) {
  const features = [];
  if (/heated\s*seat/i.test(text)) features.push('htd-seats');
  if (/heated\s*(steering|wheel)/i.test(text)) features.push('htd-wheel');
  if (/backup\s*cam|rear\s*cam|reverse\s*cam/i.test(text)) features.push('camera');
  if (/blind\s*spot/i.test(text)) features.push('blind-spot');
  if (/lane\s*(assist|depart|keep)/i.test(text)) features.push('lane');
  if (/auto(matic)?\s*(emergency\s*)?brak/i.test(text)) features.push('auto-brake');
  return features;
}

// Generate unique key for a listing
function listingKey(listing) {
  return `${listing.year}-${listing.model}-${listing.dealer}-${listing.price}`.toLowerCase();
}

// Main search function
async function searchForCars() {
  console.log('=== Daily Car Search ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Looking for: Soul, Venue, Kicks`);
  console.log(`Max distance: ${MAX_DISTANCE_KM}km from Thornhill`);
  console.log(`Max price: $${MAX_PRICE_PRETAX} pre-tax (~$21K all-in)`);
  console.log('');

  // Get existing listings
  let existingCars = [];
  try {
    const apiRes = await fetch(`${SUPABASE_URL}/rest/v1/cars?select=year,model,dealer,price`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    existingCars = JSON.parse(apiRes.data) || [];
    console.log(`Existing listings in database: ${existingCars.length}`);
  } catch (e) {
    console.error('Failed to fetch existing cars:', e.message);
    existingCars = [];
  }

  const existingKeys = new Set(existingCars.map(c => listingKey(c)));
  const newListings = [];
  const errors = [];

  // Check each dealer source
  for (const dealer of DEALER_SOURCES) {
    console.log(`\nChecking ${dealer.name}...`);

    try {
      const res = await fetch(dealer.url);
      if (res.status !== 200) {
        errors.push(`${dealer.name}: HTTP ${res.status}`);
        continue;
      }

      const html = res.data;

      // Look for our target models in the page
      for (const target of TARGET_MODELS) {
        if (dealer.brand !== target.brand) continue;

        // Simple regex to find vehicle listings
        // This is a basic approach - real implementations would need proper parsing
        const vehicleBlocks = html.split(/vehicle|listing|inventory-item/i);

        for (const block of vehicleBlocks) {
          if (!target.pattern.test(block)) continue;

          const year = parseYear(block);
          const price = parsePrice(block);
          const km = parseKm(block);

          if (!year || year < 2019) continue;
          if (!price || price > MAX_PRICE_PRETAX) continue;

          // Try to extract trim
          let trim = '';
          if (/EX\+|EX Plus/i.test(block)) trim = 'EX+';
          else if (/\bEX\b/i.test(block)) trim = 'EX';
          else if (/Ultimate/i.test(block)) trim = 'Ultimate';
          else if (/Preferred/i.test(block)) trim = 'Preferred';
          else if (/Trend/i.test(block)) trim = 'Trend';
          else if (/\bSR\b/i.test(block)) trim = 'SR';
          else if (/\bSV\b/i.test(block)) trim = 'SV';

          const modelName = `${target.model} ${trim}`.trim();
          if (isExcludedTrim(modelName)) continue;

          const listing = {
            year,
            model: modelName,
            color: 'Unknown',
            km: km || 50000,
            price,
            dealer: dealer.name,
            distance: dealer.distance,
            features: extractFeatures(block),
            carfax: 'unknown', // Need to verify manually
            carfax_url: '',
            listing_url: dealer.url,
            dealer_url: dealer.url,
            carfax_note: 'Auto-discovered - verify CARFAX',
            coords: dealer.coords,
            official: dealer.official,
            address: dealer.address,
            availability: 'available',
            last_checked: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };

          const key = listingKey(listing);
          if (!existingKeys.has(key)) {
            newListings.push(listing);
            existingKeys.add(key);
            console.log(`  Found: ${year} ${modelName} - $${price}`);
          }
        }
      }
    } catch (e) {
      errors.push(`${dealer.name}: ${e.message}`);
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`New listings found: ${newListings.length}`);
  console.log(`Errors: ${errors.length}`);

  // Insert new listings
  if (newListings.length > 0) {
    console.log('\nAdding new listings to database...');
    for (const listing of newListings) {
      try {
        await supabaseInsert('cars', listing);
        console.log(`  Added: ${listing.year} ${listing.model} @ ${listing.dealer}`);
      } catch (e) {
        console.error(`  Failed to add ${listing.year} ${listing.model}: ${e.message}`);
      }
    }
  }

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log('\nDone!');
  return { newListings, errors };
}

// Run if called directly
if (require.main === module) {
  searchForCars().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { searchForCars };
