const { extractMultiBlockOutage } = require('../backend/dist/services/amharic-extractor');

const announcementText = `የጥገና ሥራ ለማከናወን የሚቋረጥ የኃይል አቅርቦት 

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

console.log('=== Testing Multi-Block Schedule Extractor ===\n');

// First recompile backend to dist
const { execSync } = require('child_process');
execSync('node backend/node_modules/typescript/bin/tsc -p backend/tsconfig.json', { stdio: 'inherit' });

// Now require the newly compiled amharic-extractor
delete require.cache[require.resolve('../backend/dist/services/amharic-extractor')];
const { extractMultiBlockOutage: freshExtractor } = require('../backend/dist/services/amharic-extractor');

const result = freshExtractor(announcementText, new Date('2026-09-06T18:00:00Z'));

console.log(`Total Schedule Blocks Detected: ${result.total_blocks}`);
console.log(`Outage Date: ${result.outage_date_raw} (${result.isoDate || result.iso_date})`);
console.log(`Reason: ${result.reason_en}\n`);

result.blocks.forEach((b, i) => {
  console.log(`--- Block ${b.block_index} ---`);
  console.log(`  Time Window: ${b.time_header_raw}`);
  console.log(`  Start UTC: ${b.scheduled_start_iso} | End UTC: ${b.scheduled_end_iso}`);
  console.log(`  Region: ${b.region_name} (Is Addis Ababa: ${b.is_addis_ababa})`);
  console.log(`  Addis Woredas Mapped: ${b.all_woredas.join(', ') || 'None (Regional)'}`);
  console.log(`  Location Sample: ${b.location_tokens.slice(0, 4).join(', ')}...`);
  console.log(`  Confidence: ${b.confidence}%\n`);
});
