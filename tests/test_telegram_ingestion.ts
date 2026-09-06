import { TelegramIngestionService } from '../backend/src/services/telegram-ingestion';

const SUPABASE_URL = 'https://szyktmgtclujvuooofnc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eWt0bWd0Y2x1anZ1b29vZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTA5NzgsImV4cCI6MjEwNDI4Njk3OH0.hlGMgt-i1yAjQwtIbf9_1RHs9oh3NpDaADnhREg7G9Y';

async function testIngestion() {
  console.log('=== Running Telegram Ingestion & Deduplication Pipeline Test ===\n');

  const ingestionService = new TelegramIngestionService({
    channelId: 'eeuethiopia',
    apiId: '28797551',
    apiHash: '4a32bdbf9ca0c89cc53af784e4a80551',
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: ANON_KEY,
  });

  const runTag = Date.now();
  // Test Announcement 1: Bole Maintenance
  const msg1 = {
    id: 'msg_' + runTag,
    channel_id: 'eeuethiopia',
    published_at: new Date().toISOString(),
    raw_text: `የኤሌክትሪክ ኃይል መቋረጥ ማስታወቂያ፡ በቦሌ ክፍለ ከተማ ወረዳ 03 እና 05 በገርጂ እና ቦሌ መድኃኒዓለም አካባቢዎች የቅድመ መከላከል ጥገና ሥራ ለማከናወን ሲባል ነገ ከጠዋቱ 2:00 እስከ ቀኑ 10:00 የኤሌክትሪክ ኃይል ይቋረጣል። #${runTag}`,
    caption: 'Official EEU Post',
    media_urls: [],
    raw_payload: { message_id: 101, sender: '@eeuethiopia' },
  };

  console.log('1. Ingesting Announcement 1 (Bole Woredas 03 & 05)...');
  const res1 = await ingestionService.processAnnouncement(msg1);
  console.log('  Result 1 status:', res1.status);
  console.log('  Raw Announcement ID:', res1.raw_announcement_id);
  console.log('  Outage ID created:', res1.outage_id);
  console.log('  Extracted woredas:', res1.extracted.woredas);
  console.log('  Confidence:', res1.extracted.confidence, '%');

  if (res1.status !== 'PROCESSED_AUTOMATIC') {
    throw new Error('Expected PROCESSED_AUTOMATIC');
  }

  // Test Announcement 2: Duplicate Ingestion Check
  console.log('\n2. Ingesting the exact same message to test deduplication...');
  const resDuplicate = await ingestionService.processAnnouncement(msg1);
  console.log('  Duplicate status:', resDuplicate.status);
  console.log('  is_duplicate:', resDuplicate.is_duplicate);

  if (!resDuplicate.is_duplicate || resDuplicate.status !== 'DUPLICATE_SKIPPED') {
    throw new Error('Deduplication failed! Expected DUPLICATE_SKIPPED');
  }

  // Test Announcement 3: Ambiguous post requiring review
  console.log('\n3. Ingesting Ambiguous Announcement...');
  const msgAmbiguous = {
    id: 'msg_amb_' + Date.now(),
    channel_id: 'eeuethiopia',
    published_at: new Date().toISOString(),
    raw_text: `ለተከበራችሁ ደንበኞቻችን በከፊል ከተማው አካባቢዎች ያልታሰበ የኃይል ማቋረጥ አጋጥሟል። #${runTag}`,
    raw_payload: { message_id: 102 },
  };

  const resAmbiguous = await ingestionService.processAnnouncement(msgAmbiguous);
  console.log('  Ambiguous status:', resAmbiguous.status);
  console.log('  Needs admin review:', resAmbiguous.extracted.needs_admin_review);

  if (resAmbiguous.status !== 'QUEUED_FOR_REVIEW') {
    throw new Error('Expected QUEUED_FOR_REVIEW for ambiguous announcement');
  }

  console.log('\n All Telegram Ingestion & Deduplication Tests PASSED successfully!');
}

testIngestion().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
