import { extractOutageFromText, parseEthiopianTime } from '../backend/src/services/amharic-extractor';

function runTests() {
  console.log('=== Running Amharic Deterministic Extractor Unit Tests ===\n');

  // Test 1: Standard EEU Amharic Announcement (Bole Subcity)
  const sample1 = `
    የኤሌክትሪክ ኃይል መቋረጥ ማስታወቂያ
    በቦሌ ክፍለ ከተማ ወረዳ 03 እና 05 እንዲሁም በገርጂ እና ቦሌ መድኃኒዓለም አካባቢዎች 
    የቅድመ መከላከል ጥገና ሥራ ለማከናወን ሲባል ነገ ከጠዋቱ 2:00 ሰዓት እስከ ቀኑ 10:00 ሰዓት 
    ድረስ የኤሌክትሪክ ኃይል ይቋረጣል።
  `;

  const res1 = extractOutageFromText(sample1, new Date('2026-09-07T06:00:00Z'));
  console.log('Test 1 (Bole Maintenance):');
  console.log('  Sub-city:', res1.sub_city_en, '/', res1.sub_city_am);
  console.log('  Woredas:', res1.woredas);
  console.log('  Neighborhoods:', res1.neighborhoods);
  console.log('  Reason:', res1.reason_en);
  console.log('  Scheduled Start:', res1.scheduled_start_iso);
  console.log('  Scheduled End:', res1.scheduled_end_iso);
  console.log('  Confidence:', res1.confidence, '%');
  console.log('  Needs Admin Review:', res1.needs_admin_review);

  if (res1.sub_city_en !== 'Bole') throw new Error('Expected Bole');
  if (!res1.woredas.includes('03') || !res1.woredas.includes('05')) throw new Error('Expected woredas 03 and 05');
  if (!res1.neighborhoods.includes('Gerji') || !res1.neighborhoods.includes('Bole Medhanialem')) throw new Error('Expected Gerji and Bole Medhanialem');
  if (res1.confidence < 80) throw new Error('Confidence should be >= 80');

  // Test 2: Yeka Subcity announcement with multiple woredas
  const sample2 = `
    ለክቡራን ደንበኞቻችን በሙሉ፡
    በየካ ክፍለ ከተማ ወረዳ 08፣ 11 እና 12 በሲኤምሲ እና መገናኛ አካባቢ የመስመር ማሻሻያ እና አቅም ማሳደግ
    ሥራ ስለሚከናወን ዛሬ ከጠዋቱ 3:00 እስከ ቀኑ 8:00 የኃይል አቅርቦት ይቋረጣል።
  `;
  const res2 = extractOutageFromText(sample2, new Date('2026-09-07T06:00:00Z'));
  console.log('\nTest 2 (Yeka Upgrade):');
  console.log('  Sub-city:', res2.sub_city_en);
  console.log('  Woredas:', res2.woredas);
  console.log('  Neighborhoods:', res2.neighborhoods);
  console.log('  Reason:', res2.reason_en);
  console.log('  Confidence:', res2.confidence, '%');

  if (res2.sub_city_en !== 'Yeka') throw new Error('Expected Yeka');
  if (res2.woredas.length !== 3) throw new Error('Expected 3 woredas');
  if (!res2.neighborhoods.includes('CMC') || !res2.neighborhoods.includes('Megenagna')) throw new Error('Expected CMC & Megenagna');

  // Test 3: Ethiopian time parser
  console.log('\nTest 3 (Ethiopian Time Parsing):');
  const tMorning = parseEthiopianTime('ከጠዋቱ 2:00');
  console.log('  ከጠዋቱ 2:00 ->', tMorning, '(Expected ~08:00 UTC+3)');
  if (tMorning?.hours !== 8) throw new Error('2:00 morning should convert to 08:00');

  const tAfternoon = parseEthiopianTime('እስከ ቀኑ 10:00');
  console.log('  እስከ ቀኑ 10:00 ->', tAfternoon, '(Expected ~16:00 UTC+3)');
  if (tAfternoon?.hours !== 16) throw new Error('10:00 afternoon should convert to 16:00');

  // Test 4: Ambiguous post triggers admin review
  const ambiguous = 'በአንዳንድ አካባቢዎች የጥገና ሥራ ስላለ መቆራረጥ ሊያጋጥም ይችላል።';
  const res4 = extractOutageFromText(ambiguous);
  console.log('\nTest 4 (Ambiguous text):');
  console.log('  Confidence:', res4.confidence, '%');
  console.log('  Needs Admin Review:', res4.needs_admin_review);
  if (!res4.needs_admin_review) throw new Error('Ambiguous text must flag needs_admin_review=true');

  console.log('\n All Deterministic Amharic Extractor Tests PASSED successfully!');
}

runTests();
