import { TelegramIngestionService } from '../backend/src/services/telegram-ingestion';

const SUPABASE_URL = 'https://szyktmgtclujvuooofnc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eWt0bWd0Y2x1anZ1b29vZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTA5NzgsImV4cCI6MjEwNDI4Njk3OH0.hlGMgt-i1yAjQwtIbf9_1RHs9oh3NpDaADnhREg7G9Y';

async function ingestMultiBlockPost() {
  console.log('=== Ingesting Multi-Block National Post into Live Database ===\n');

  const ingestionService = new TelegramIngestionService({
    channelId: 'eeuethiopia',
    apiId: '28797551',
    apiHash: '4a32bdbf9ca0c89cc53af784e4a80551',
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: ANON_KEY,
  });

  const postText = `የጥገና ሥራ ለማከናወን የሚቋረጥ የኃይል አቅርቦት 

ነገ ጳጉሜ 1 ቀን 2018 ዓ.ም የጥገና ሥራ ለማከናወን የኃይል አቅርቦት የሚቋረጥባቸው አካባቢዎች ፡-

✅ከጠዋቱ 4፡00-7፡00

👉ቡራዩ ማዘጋጃ ፣ ቡራዩ ካርቶን ሰፈር ፣ ቡራዩ በግ ተራ ፣ ጽርሐ ጽዮን ፣ ቄራ ፣ ሸክላ ሰፈር  እና አካባቢው 

✅ከጠዋቱ 1፡00 - 8፡00  

👉በኮርሜ፣ በሼልዋሾ፣ በመቂ፣ በዓለምጤና፣ በቆሴ፣ በቡልቡላ፣ በኮስቲክ ሶዳ ኢንዱስትሪ፣ በአዳሚቱሉ፣ በዝዋይ እና አካባቢው፣

✅ከጠዋቱ 12:00 እስከ ምሽቱ 12:00  

👉በጊምቢ፣ጉሊሶ፣ ኢናንጎ፣ አይራ፣ ሀሩ፣ ኖሌ ካባ፣ ጋንጂ፣ ቦጂ ደርማጂ፣ ነጆ ወረዳ፣ ጃርሶ፣ ባቦ ጋምቤላ እና አካባቢው፣፣ 

👉በላታ ሲቡ፣ ኪልቱ ካራ፣ መንዲ፣ በጊ፣ ኮንዳላ፣ ግዳሚ፣ ጅማ ሆሮ፣ ጋዎ ቀቤ፣ ቀቤ፣ ሰዳን ጫንቃ እና ዳሌ ሳዲ ወረዳዎች እና አካባቢው፣

👉በአሶሳ ከተማ፣ አሶሳ ወረዳ 1 እና ወረዳ 2፣ ባምበሲ፣ ቶንጎ፣ አብራሞ፣ ኡራ፣ ሆመሻ፣ መንጌ፣ ሽርቆሌ እና አካባቢው፣ 

👉በኩርሙክ፣ ኡንዱሉ፣ ኦዳ እና ሰዳል ወረዳዎችና አካባቢዎቻቸው፣

✅ከጠዋቱ 2፡00-12፡00

👉አርባምንጭ፣ሳውላ እና አካባቢው
የኃይል አቅርቦት ይቋረጣል 

ስለሆነም በአካባቢው የምትገኙ ክቡራን ደንበኞቻችን ይህንኑ በመገንዘብ አስፈላጊውን ቅድመ ዝግጅት እንድታደርጉ በአክብሮት እናሳውቃለን፡፡

#የኢትዮጵያኤሌክትሪክአገልግሎት`;

  const result = await ingestionService.processAnnouncement({
    id: 'post_pagume01_multi',
    channel_id: 'eeuethiopia',
    published_at: '2026-09-06T10:00:00Z',
    raw_text: postText,
    media_urls: [],
    raw_payload: {
      channel: '@eeuethiopia',
      date: 'Pagume 1, 2018 E.C.',
      type: 'official_announcement'
    }
  });

  console.log('Ingestion Result:');
  console.log('  Status:', result.status);
  console.log('  Raw Announcement ID:', result.raw_announcement_id);
  console.log('  Outage IDs created:', result.outage_ids || [result.outage_id]);
  console.log('  Confidence:', result.extracted.confidence, '%');
  console.log('  Total Blocks:', result.extracted.total_blocks);
  console.log('  Neighborhoods matched:', result.extracted.neighborhoods);
  console.log('  Addis Woredas affected:', result.extracted.woredas);
}

ingestMultiBlockPost().catch(console.error);
