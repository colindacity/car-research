const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3diYWp0eGFjand1YmdoeXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjIxODYsImV4cCI6MjA4MjYzODE4Nn0.tQvzTXf3xft07Wrv8dB0lG2DaIS1UQNCuz5vVB6fTT4';
const BASE_URL = 'https://bjswbajtxacjwubghytb.supabase.co/rest/v1';

async function main() {
  // Get all listings
  const res = await fetch(`${BASE_URL}/cars?select=*`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await res.json();
  console.log('=== CURRENT DATABASE LISTINGS ===\n');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nTotal listings:', data.length);
}

main().catch(console.error);
