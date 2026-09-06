import { TelegramIngestionService } from '../backend/src/services/telegram-ingestion';

const SUPABASE_URL = 'https://szyktmgtclujvuooofnc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eWt0bWd0Y2x1anZ1b29vZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTA5NzgsImV4cCI6MjEwNDI4Njk3OH0.hlGMgt-i1yAjQwtIbf9_1RHs9oh3NpDaADnhREg7G9Y';

async function ingestSeptember6Post() {
  console.log('=== Ingesting September 6th 15:24 EEU Announcement into Live Database ===\n');

  const ingestionService = new TelegramIngestionService({
    channelId: 'eeuethiopia',
    apiId: '28797551',
    apiHash: '4a32bdbf9ca0c89cc53af784e4a80551',
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: ANON_KEY,
  });

  const postText = `የጥገና ሥራ ለማከናወን የሚቋረጥ የኃይል አቅርቦት 

ነገ ጳጉሜ 2 ቀን 2018 ዓ.ም የጥገና ሥራ ለማከናወን የኃይል አቅርቦት የሚቋረጥባቸው አካባቢዎች ፡-

✅ከጠዋቱ 2፡00-9፡30

👉ጎፋ ካምፕ ፣ ሀዋርያው ቸርች ፣ ኪዳነምህረት ቤተ ክርስቲያን፣ መካኒሳ አረቄ ፋብሪካ መብራት ፣ ቆሬ አደባባይ ፣ አሚጎ ኮንዶሚንየም በከፊል፣ ፋና ት/ቤት እና አካባቢው፣

👉ኮዬ 05 ፕሮጀክት 16 በከፊል፣ ፕሮጀክት 12 ፣ ፕሮጀክት 17   እና አካባቢው የኃይል አቅርቦት ይቋረጣል፡፡

ስለሆነም በአካባቢው የምትገኙ ክቡራን ደንበኞቻችን ይህንኑ በመገንዘብ አስፈላጊውን ቅድመ ዝግጅት እንድታደርጉ በአክብሮት እናሳውቃለን፡፡

#የኢትዮጵያኤሌክትሪክአገልግሎት`;

  const result = await ingestionService.processAnnouncement({
    id: 'post_sep06_1524',
    channel_id: 'eeuethiopia',
    published_at: '2026-09-06T12:24:00Z', // 15:24 EAT is 12:24 UTC
    raw_text: postText,
    media_urls: [],
    raw_payload: {
      channel: '@eeuethiopia',
      date: 'September 6, 2026 15:24 EAT',
      type: 'official_announcement'
    }
  });

  console.log('Ingestion Result:');
  console.log('  Status:', result.status);
  console.log('  Raw Announcement ID:', result.raw_announcement_id);
  console.log('  Outage ID created:', result.outage_id);
  console.log('  Confidence:', result.extracted.confidence, '%');
  console.log('  Neighborhoods matched:', result.extracted.neighborhoods);
  console.log('  Area Targets:', result.extracted.area_targets);
  console.log('  Woredas affected:', result.extracted.woredas);
}

ingestSeptember6Post().catch(console.error);
