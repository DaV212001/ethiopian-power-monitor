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
  console.log('=== TEST 1: In-Memory Gazetteer (Instant 0ms) ===');
  await testLookup('መካኒሳ');

  console.log('\n=== TEST 2: Dynamic Live OSM Nominatim + PostGIS (Unlisted: ሽሮ ሜዳ) ===');
  await testLookup('ሽሮ ሜዳ');

  console.log('\n=== TEST 3: Repeated Lookup for ሽሮ ሜዳ (Cache Hit) ===');
  await testLookup('ሽሮ ሜዳ');

  console.log('\n=== TEST 4: Dynamic Live OSM Nominatim + PostGIS (Unlisted: ጦር ኃይሎች) ===');
  await testLookup('ጦር ኃይሎች');

  console.log('\n=== TEST 5: Dynamic Live OSM Nominatim + PostGIS (Unlisted: ኮተቤ) ===');
  await testLookup('ኮተቤ');

  console.log('\n=== TEST 6: Regional Town Lookup (Unlisted: መቂ) ===');
  await testLookup('መቂ');

  console.log('\n=== TEST 7: Unlisted Addis Micro-Landmark: አየር ጤና (Ayer Tena) ===');
  await testLookup('አየር ጤና');

  console.log('\n=== TEST 8: Repeated Lookup for አየር ጤና (DB Cache Hit) ===');
  await testLookup('አየር ጤና');

  console.log('\n=== TEST 9: Unlisted Addis Micro-Landmark: ባልቻ ሆስፒታል ===');
  await testLookup('ባልቻ ሆስፒታል');

  console.log('\n=== TEST 10: Repeated Lookup for ባልቻ ሆስፒታል (Cache Hit) ===');
  await testLookup('ባልቻ ሆስፒታል');
}

run().catch(console.error);
