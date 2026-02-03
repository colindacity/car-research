const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';
const BASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co/rest/v1';

async function main() {
  console.log('=== REMOVING 2018 SOUL EV (Doesnt meet criteria - EV model, wrong year) ===\n');

  // Delete the 2018 Soul EV (ID 70)
  const res = await fetch(`${BASE_URL}/cars?id=eq.70`, {
    method: 'DELETE',
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  if (res.ok) {
    console.log('Successfully removed 2018 Soul EV from database');
  } else {
    console.log('Error removing listing:', await res.text());
  }

  // Show remaining listings
  console.log('\n=== REMAINING LISTINGS ===\n');
  const listRes = await fetch(`${BASE_URL}/cars?select=*&order=price.asc`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await listRes.json();
  console.log(`Total: ${data.length} listings\n`);
  data.forEach(car => {
    console.log(`${car.year} ${car.model} @ ${car.dealer}`);
    console.log(`  $${car.price} | ${car.km} km | ${car.distance} km away`);
    console.log('');
  });
}

main().catch(console.error);
