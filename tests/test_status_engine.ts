import { OutageStatusEngine, WoredaInputSignals } from '../backend/src/services/status-engine';

function testStatusEngine() {
  console.log('=== Running Outage Status Engine Multi-Signal Unit Tests ===\n');

  const baseWoreda: Omit<WoredaInputSignals, 'official_outage' | 'reports_last_hour_out' | 'reports_last_hour_restored'> = {
    woreda_id: 85,
    woreda_number: '03',
    subcity_id: 4,
    subcity_en: 'Bole',
    subcity_am: 'ቦሌ',
    full_name_en: 'Bole Woreda 03',
    full_name_am: 'ቦሌ ወረዳ 03',
  };

  const now = new Date('2026-09-07T10:00:00Z');

  // Test 1: Future Scheduled Outage
  const res1 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    official_outage: {
      outage_id: 'outage-1',
      scheduled_start: '2026-09-07T11:00:00Z',
      scheduled_end: '2026-09-07T15:00:00Z',
      reason_en: 'Maintenance',
      source_type: 'EEU_ANNOUNCEMENT',
    },
    reports_last_hour_out: 0,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 1 (Future):', res1.status, '| Confidence:', res1.confidence);
  if (res1.status !== 'SCHEDULED' || res1.confidence !== 'OFFICIAL') throw new Error('Test 1 Failed');

  // Test 2: Active Scheduled Outage
  const res2 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    official_outage: {
      outage_id: 'outage-1',
      scheduled_start: '2026-09-07T09:00:00Z',
      scheduled_end: '2026-09-07T14:00:00Z',
      reason_en: 'Maintenance',
      source_type: 'EEU_ANNOUNCEMENT',
    },
    reports_last_hour_out: 0,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 2 (Active):', res2.status, '| Confidence:', res2.confidence);
  if (res2.status !== 'CURRENT' || res2.confidence !== 'OFFICIAL') throw new Error('Test 2 Failed');

  // Test 3: Active Scheduled Outage Corroborated by Community
  const res3 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    official_outage: {
      outage_id: 'outage-1',
      scheduled_start: '2026-09-07T09:00:00Z',
      scheduled_end: '2026-09-07T14:00:00Z',
      reason_en: 'Maintenance',
      source_type: 'EEU_ANNOUNCEMENT',
    },
    reports_last_hour_out: 12,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 3 (Confirmed):', res3.status, '| Confidence:', res3.confidence);
  if (res3.status !== 'CONFIRMED' || res3.confidence !== 'CONFIRMED') throw new Error('Test 3 Failed');

  // Test 4: Unannounced Outage with high report volume
  const res4 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    reports_last_hour_out: 8,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 4 (Likely unannounced):', res4.status, '| Confidence:', res4.confidence);
  if (res4.status !== 'LIKELY' || res4.confidence !== 'LIKELY') throw new Error('Test 4 Failed');

  // Test 5: Unannounced Outage with low report volume
  const res5 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    reports_last_hour_out: 2,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 5 (Reported unconfirmed):', res5.status, '| Confidence:', res5.confidence);
  if (res5.status !== 'REPORTED' || res5.confidence !== 'COMMUNITY') throw new Error('Test 5 Failed');

  // Test 6: Ended Outage with no confirmation -> UNKNOWN (Never assume restoration without evidence)
  const res6 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    official_outage: {
      outage_id: 'outage-1',
      scheduled_start: '2026-09-07T06:00:00Z',
      scheduled_end: '2026-09-07T08:00:00Z', // Ended 2 hours ago
      reason_en: 'Maintenance',
      source_type: 'EEU_ANNOUNCEMENT',
    },
    reports_last_hour_out: 0,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 6 (Ended with no reports):', res6.status, '| Confidence:', res6.confidence);
  if (res6.status !== 'UNKNOWN') throw new Error('Test 6 Failed: Ended outage with no signals must be UNKNOWN');

  // Test 7: Normal
  const res7 = OutageStatusEngine.evaluateWoreda({
    ...baseWoreda,
    reports_last_hour_out: 0,
    reports_last_hour_restored: 0,
  }, now);

  console.log('Test 7 (Normal):', res7.status, '| Confidence:', res7.confidence);
  if (res7.status !== 'NORMAL') throw new Error('Test 7 Failed');

  console.log('\n All Outage Status Engine Tests PASSED successfully!');
}

testStatusEngine();
