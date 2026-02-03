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
  console.log('Added:', listing.dealer, '-', listing.year, listing.model);
  console.log('Response:', JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  // Add Peterborough Kia 2019 Soul EX
  await addListing({
    year: 2019,
    model: 'Soul EX',
    color: 'Blue',
    km: 47759,
    price: 16998,
    dealer: 'Peterborough Kia',
    distance: 140,  // ~140km from Thornhill
    features: ['Low Mileage', 'Automatic'],
    carfax: 'Available',
    carfax_url: null,
    listing_url: 'https://www.peterboroughkia.ca/used/2019-Kia-Soul-id13256753.html',
    carfax_note: 'VIN: KNDJP3A50K7640327, Stock: 2185 - LOW KM at 47,759! Blue exterior, Black interior. Was $18,998, now $16,998',
    coords: [44.3091, -78.3197],  // Peterborough coordinates
    official: true,
    availability: 'available',
    dealer_url: 'https://www.peterboroughkia.ca',
    address: '238 Lansdowne St E., Peterborough, ON K9L 2A3'
  });

  console.log('\n=== CURRENT LISTINGS ===\n');

  // Get all listings
  const res = await fetch(`${BASE_URL}/cars?select=*`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await res.json();
  data.forEach(car => {
    console.log(`${car.year} ${car.model} @ ${car.dealer}`);
    console.log(`  Price: $${car.price}, KM: ${car.km}, Distance: ${car.distance}km`);
    console.log(`  ${car.carfax_note}`);
    console.log('');
  });
}

main().catch(console.error);
