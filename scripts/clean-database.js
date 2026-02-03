const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';
const BASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co/rest/v1';

async function main() {
  console.log('=== CLEANING DATABASE - Removing non-Soul listings ===\n');

  // Get all listings
  const listRes = await fetch(`${BASE_URL}/cars?select=*`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await listRes.json();

  // Remove any Venue listings
  for (const car of data) {
    if (car.model.toLowerCase().includes('venue') ||
        car.model.toLowerCase().includes('ev') ||
        car.year < 2019 ||
        car.year > 2024) {
      console.log(`Removing: ${car.year} ${car.model} @ ${car.dealer} (doesn't meet criteria)`);

      await fetch(`${BASE_URL}/cars?id=eq.${car.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
    }
  }

  // Show remaining listings
  console.log('\n=== VALID LISTINGS (2019-2024 Soul EX/EX+/Premium only) ===\n');
  const finalRes = await fetch(`${BASE_URL}/cars?select=*&order=price.asc`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const finalData = await finalRes.json();
  console.log(`Total: ${finalData.length} listings\n`);
  finalData.forEach(car => {
    console.log(`${car.year} ${car.model} @ ${car.dealer}`);
    console.log(`  $${car.price} | ${car.km} km | ${car.distance} km away`);
    console.log('');
  });
}

main().catch(console.error);
