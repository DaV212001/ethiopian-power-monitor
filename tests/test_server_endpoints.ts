import { buildApp } from '../backend/src/server';

async function testServer() {
  console.log('=== Testing Fastify REST API Endpoints ===\n');

  const app = await buildApp();
  await app.ready();

  // 1. Health check
  const resHealth = await app.inject({
    method: 'GET',
    url: '/api/v1/health',
  });
  console.log('GET /api/v1/health -> Status:', resHealth.statusCode);
  console.log('  Response:', resHealth.json());
  if (resHealth.statusCode !== 200) throw new Error('Health check failed');

  // 2. Map Status endpoint
  const resMap = await app.inject({
    method: 'GET',
    url: '/api/v1/map',
  });
  console.log('\nGET /api/v1/map -> Status:', resMap.statusCode);
  const mapData = resMap.json();
  console.log('  Total areas returned:', mapData.total_areas);
  if (mapData.total_areas !== 116) throw new Error('Expected 116 areas in map endpoint');

  // 3. Areas with search
  const resAreas = await app.inject({
    method: 'GET',
    url: '/api/v1/areas?search=Bole',
  });
  console.log('\nGET /api/v1/areas?search=Bole -> Status:', resAreas.statusCode);
  const boleAreas = resAreas.json();
  console.log('  Bole woredas matched:', boleAreas.length);
  if (boleAreas.length !== 14) throw new Error('Expected 14 woredas for Bole');

  // 4. OpenAPI / Swagger Docs
  const resDocs = await app.inject({
    method: 'GET',
    url: '/docs/json',
  });
  console.log('\nGET /docs/json -> Status:', resDocs.statusCode);
  const swaggerSpec = resDocs.json();
  console.log('  OpenAPI Title:', swaggerSpec.info?.title);
  console.log('  Paths defined:', Object.keys(swaggerSpec.paths).length);

  await app.close();
  console.log('\n All API endpoint tests PASSED with flying colors!');
}

testServer().catch((err) => {
  console.error('API Test Failed:', err);
  process.exit(1);
});
