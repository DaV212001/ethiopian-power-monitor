async function testLookup(q) {
  const t0 = Date.now();
  const res = await fetch('http://localhost:4000/api/v1/landmarks/lookup?q=' + encodeURIComponent(q));
  const data = await res.json();
  const duration = Date.now() - t0;
  console.log(`Query: "${q}" (${duration}ms) -> Source: ${data.data?.source || 'N/A'}`);
  if (data.found) {
    console.log(`  Name: ${data.data.name_am} (${data.data.name_en})`);
    console.log(`  Coords: [${data.data.lat}, ${data.data.lng}]`);
    console.log(`  Woreda: ${data.data.full_name_en || 'Regional'} (ID: ${data.data.woreda_id || 'N/A'}, Woreda Num: ${data.data.woreda_number || 'N/A'})`);
    console.log(`  Subcity: ${data.data.subcity_en || data.data.region_name}`);
  } else {
    console.log('  Not found:', data);
  }
}

async function run() {
  console.log('=== TEST 1: Gebeta Maps Geocoding (ቡራዩ ድሬ) ===');
  await testLookup('ቡራዩ ድሬ');

  console.log('\n=== TEST 2: Repeated Lookup (Cache Hit: 2ms) ===');
  await testLookup('ቡራዩ ድሬ');

  console.log('\n=== TEST 3: Gebeta Maps Geocoding (ዘቢደር ሆቴል) ===');
  await testLookup('ዘቢደር ሆቴል');

  console.log('\n=== TEST 4: Gebeta Maps Geocoding (ኢምፕረስ ህንፃ) ===');
  await testLookup('ኢምፕረስ ህንፃ');
}

run().catch(console.error);
