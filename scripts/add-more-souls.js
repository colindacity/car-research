const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';
const BASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co/rest/v1';

async function addListing(listing) {
  const res = await fetch(`${BASE_URL}/cars`, {
    method: 'POST',
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(listing)
  });

  const data = await res.json();
  if (data.error) {
    console.log('Error adding:', listing.dealer, '-', data.error);
  } else {
    console.log('Added:', listing.year, listing.model, '@', listing.dealer, '- $' + listing.price);
  }
  return data;
}

async function main() {
  console.log('=== ADDING NEW SOUL LISTINGS ===\n');

  // From CarGurus search:
  // 1. 2019 Kia Soul EX Plus - 68,000 km (need to find price)
  // 2. 2022 Kia Soul EX - 80,044 km
  // 3. 2022 Kia Soul EX - 70,673 km
  // 4. 2022 Kia Soul EX Premium - 74,500 km

  // From Foster Kia:
  // 2018 Soul EV - $10,888, 54,509 km (Electric - might not be wanted)

  // Adding confirmed listings found via CarGurus/web searches
  // These are aggregator listings - need to verify on dealer sites

  // Add Foster Kia Soul EV (Electric option - very affordable)
  await addListing({
    year: 2018,
    model: 'Soul EV',
    color: 'Unknown',
    km: 54509,
    price: 10888,
    dealer: 'Foster Kia',
    distance: 18,  // Scarborough
    features: ['Electric', 'Low Price'],
    carfax: 'Available',
    carfax_url: null,
    listing_url: 'https://www.fosterkia.com/used/Kia-Soul.html',
    carfax_note: 'VIN: KNDJP3AEXJ7034399, Stock: 240689A - ELECTRIC Soul EV, Very affordable at $10,888, Best year for reliability (2018)',
    coords: [43.7853, -79.2308],
    official: true,
    availability: 'available',
    dealer_url: 'https://www.fosterkia.com',
    address: '2360 Markham Rd, Scarborough, ON'
  });

  console.log('\n=== ALL CURRENT LISTINGS ===\n');

  // Get all listings
  const res = await fetch(`${BASE_URL}/cars?select=*&order=price.asc`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await res.json();
  console.log(`Total: ${data.length} listings\n`);
  data.forEach(car => {
    console.log(`${car.year} ${car.model} @ ${car.dealer}`);
    console.log(`  $${car.price} | ${car.km} km | ${car.distance} km away`);
    console.log(`  ${car.carfax}`);
    console.log('');
  });
}

main().catch(console.error);
