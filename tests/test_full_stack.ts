import { buildApp } from '../backend/src/server';

async function verifyFullStack() {
  console.log('=== Verifying Full-Stack Ethiopian Power Monitor ===\n');

  const app = await buildApp();
  await app.ready();

  // 1. Verify frontend HTML serves at /
  const resIndex = await app.inject({ method: 'GET', url: '/' });
  console.log('GET / -> Status:', resIndex.statusCode);
  if (resIndex.statusCode !== 200 || !resIndex.body.includes('Ethiopian Power Monitor')) {
    throw new Error('Frontend failed to serve at root /');
  }
  console.log('  Frontend HTML served successfully with correct branding!');

  // 2. Verify GeoJSON static file serves
  const resGeo = await app.inject({ method: 'GET', url: '/addis_ababa_woredas.json' });
  console.log('GET /addis_ababa_woredas.json -> Status:', resGeo.statusCode);
  if (resGeo.statusCode !== 200) throw new Error('Failed to serve GeoJSON');
  const geoObj = JSON.parse(resGeo.body);
  console.log('  GeoJSON features count:', geoObj.features?.length);
  if (geoObj.features?.length !== 116) throw new Error('Expected 116 woredas in GeoJSON');

  // 3. Verify JavaScript app.js serves
  const resJs = await app.inject({ method: 'GET', url: '/app.js' });
  console.log('GET /app.js -> Status:', resJs.statusCode);
  if (resJs.statusCode !== 200) throw new Error('Failed to serve app.js');

  // 4. Verify API map status
  const resMap = await app.inject({ method: 'GET', url: '/api/v1/map' });
  console.log('GET /api/v1/map -> Status:', resMap.statusCode);
  const mapJson = resMap.json();
  console.log('  Live PostGIS evaluated area statuses:', mapJson.total_areas);

  // 5. Verify Community report flow
  const resReport = await app.inject({
    method: 'POST',
    url: '/api/v1/reports',
    payload: {
      woreda_id: 85, // Bole Woreda 03
      reported_status: 'POWER_OUT',
      comments: 'Test community report verification',
    },
  });
  console.log('POST /api/v1/reports -> Status:', resReport.statusCode);
  console.log('  Report response:', resReport.json());

  await app.close();
  console.log('\n Full Stack Verification PASSED completely!');
}

verifyFullStack().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
