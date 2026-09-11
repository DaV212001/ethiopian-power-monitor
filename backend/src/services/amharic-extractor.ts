/**
 * Ethiopian Power Monitor — Multi-Section Schedule Amharic Parser
 * Handles real-world EEU post formats:
 * - Multi-block schedules (e.g. ✅ከጠዋቱ 4፡00-7፡00, ✅ከጠዋቱ 1፡00-8፡00, etc.)
 * - Bullet lists (👉...) of landmarks, sub-woredas, and regional towns
 * - Amharic preposition stripping (በ..., ከ...)
 * - Pre-configured location ontology for Addis Ababa woredas and Regional Ethiopian hubs
 * - Direct Telegram post URL binding
 */

import {
  EthiopianDate,
  parseEthiopianDateFromText,
  gregorianToEthiopian,
} from './ethiopian-calendar';
import rawGazetteer from '../data/addis-landmarks.json';

export interface LandmarkPin {
  name_en: string;
  name_am: string;
  lng: number;
  lat: number;
  woreda_id: number;
  woreda_number: string;
  subcity_id: number;
  subcity_en: string;
  subcity_am: string;
  full_name_en?: string;
  full_name_am?: string;
}

export interface LandmarkGazetteerEntry {
  name_en: string;
  name_am: string;
  coordinates: [number, number];
  woreda_id: number;
  woreda_number: string;
  subcity_id: number;
  subcity_en: string;
  subcity_am: string;
  full_name_en: string;
  full_name_am: string;
  patterns: string[];
}

export interface AddisWoredaTarget {
  subcity_id: number;
  subcity_en: string;
  subcity_am: string;
  woreda_numbers: string[];
  neighborhood: string;
}

export interface ScheduleBlock {
  block_index: number;
  time_header_raw: string;
  start_time_raw: string;
  end_time_raw: string;
  scheduled_start_iso?: string;
  scheduled_end_iso?: string;
  raw_locations_text: string;
  location_tokens: string[];
  region_name: string; // 'Addis Ababa', 'Oromia', 'Benishangul-Gumuz', 'South Ethiopia', etc.
  is_addis_ababa: boolean;
  addis_targets: AddisWoredaTarget[];
  all_woredas: string[];
  landmarks: LandmarkPin[];
  confidence: number;
}

export interface ExtractedAnnouncement {
  outage_date_raw?: string;
  ethiopian_date_am?: string;
  ethiopian_date_en?: string;
  ethiopian_date?: string;
  ethiopian_details?: EthiopianDate;
  iso_date: string;
  reason_en: string;
  reason_am: string;
  source_language: 'am' | 'en' | 'mixed';
  blocks: ScheduleBlock[];
  total_blocks: number;
  has_addis_ababa: boolean;
  has_regional: boolean;
  // Backward-compatible fields
  area_targets: AddisWoredaTarget[];
  woredas: string[];
  neighborhoods: string[];
  landmarks: LandmarkPin[];
  confidence: number;
  needs_admin_review: boolean;
  sub_city_en?: string;
  sub_city_am?: string;
  subcity_id?: number;
  scheduled_start_iso?: string;
  scheduled_end_iso?: string;
  matched_rules: string[];
}

// 1. Subcity Reference Dictionary
export const SUBCITY_DICTIONARY = [
  { id: 1, en: 'Addis Ketema', am: 'አዲስ ከተማ', patterns: [/አዲስ\s*ከተማ/i, /addis\s*ketema/i] },
  { id: 2, en: 'Akaki Kality', am: 'አቃቂ ቃሊቲ', patterns: [/አቃቂ\s*ቃሊቲ/i, /አቃቂ/i, /ቃሊቲ/i, /akaki\s*kality/i, /akaki/i, /kality/i] },
  { id: 3, en: 'Arada', am: 'አራዳ', patterns: [/አራዳ/i, /arada/i] },
  { id: 4, en: 'Bole', am: 'ቦሌ', patterns: [/ቦሌ/i, /bole/i] },
  { id: 5, en: 'Gulele', am: 'ጉለሌ', patterns: [/ጉለሌ/i, /gulele/i, /gullele/i] },
  { id: 6, en: 'Kirkos', am: 'ቂርቆስ', patterns: [/ቂርቆስ/i, /kirkos/i, /cherkos/i, /kirqos/i] },
  { id: 7, en: 'Kolfe Keranyo', am: 'ኮልፌ ቀራኒዮ', patterns: [/ኮልፌ\s*ቀራኒዮ/i, /ኮልፌ/i, /ቀራኒዮ/i, /kolfe\s*keranyo/i, /kolfe/i] },
  { id: 8, en: 'Lideta', am: 'ልደታ', patterns: [/ልደታ/i, /lideta/i] },
  { id: 9, en: 'Nefas - Silk Lafto', am: 'ንፋስ ስልክ ላፍቶ', patterns: [/ንፋስ\s*ስልክ\s*ላፍቶ/i, /ንፋስ\s*ስልክ/i, /ላፍቶ/i, /nefas\s*silk/i, /nifas\s*silk/i] },
  { id: 10, en: 'Yeka', am: 'የካ', patterns: [/የካ/i, /yeka/i] },
];

// 2. Addis Ababa Landmark & Border Neighborhood Mapping (PostGIS-verified single woreda containment)
export const ADDIS_LANDMARK_MAP: Array<{
  name_en: string;
  name_am: string;
  coordinates: [number, number];
  woreda_id: number;
  woreda_number: string;
  subcity_id: number;
  subcity_en: string;
  subcity_am: string;
  full_name_en?: string;
  full_name_am?: string;
  woredas: string[];
  patterns: RegExp[];
}> = (rawGazetteer as LandmarkGazetteerEntry[]).map((entry) => ({
  name_en: entry.name_en,
  name_am: entry.name_am,
  coordinates: entry.coordinates,
  woreda_id: entry.woreda_id,
  woreda_number: entry.woreda_number,
  subcity_id: entry.subcity_id,
  subcity_en: entry.subcity_en,
  subcity_am: entry.subcity_am,
  full_name_en: entry.full_name_en,
  full_name_am: entry.full_name_am,
  woredas: [entry.woreda_number], // EXACT SINGLE WOREDA!
  patterns: entry.patterns.map((p) => new RegExp(p, 'i')),
}));

// 3. Ethiopian Regional Cities & Hubs Ontology
export const REGIONAL_HUB_MAP: Array<{
  name_en: string;
  name_am: string;
  region: string;
  patterns: RegExp[];
}> = [
  { name_en: 'Meki', name_am: 'መቂ', region: 'Oromia', patterns: [/መቂ/i, /meki/i] },
  { name_en: 'Ziway / Batu', name_am: 'ዝዋይ', region: 'Oromia', patterns: [/ዝዋይ/i, /ባቱ/i, /ziway/i, /batu/i] },
  { name_en: 'Adami Tulu', name_am: 'አዳሚቱሉ', region: 'Oromia', patterns: [/አዳሚ\s*ቱሉ/i, /አዳሚቱሉ/i] },
  { name_en: 'Alem Tena', name_am: 'ዓለምጤና', region: 'Oromia', patterns: [/ዓለም\s*ጤና/i, /ዓለምጤና/i] },
  { name_en: 'Bulbula', name_am: 'ቡልቡላ', region: 'Oromia', patterns: [/ቡልቡላ/i, /bulbula/i] },
  { name_en: 'Adama / Nazareth', name_am: 'አዳማ', region: 'Oromia', patterns: [/አዳማ/i, /adama/i, /ናዝሬት/i] },
  { name_en: 'Bishoftu', name_am: 'ቢሾፍቱ', region: 'Oromia', patterns: [/ቢሾፍቱ/i, /ደብረዘይት/i, /bishoftu/i] },
  { name_en: 'Shashemene', name_am: 'ሻሸመኔ', region: 'Oromia', patterns: [/ሻሸመኔ/i, /shashemene/i] },
  { name_en: 'Gimbi', name_am: 'ጊምቢ', region: 'Oromia', patterns: [/ጊምቢ/i, /gimbi/i] },
  { name_en: 'Nejo', name_am: 'ነጆ', region: 'Oromia', patterns: [/ነጆ/i, /nejo/i] },
  { name_en: 'Mendi', name_am: 'መንዲ', region: 'Oromia', patterns: [/መንዲ/i, /mendi/i] },
  { name_en: 'Begi', name_am: 'በጊ', region: 'Oromia', patterns: [/በጊ/i, /begi/i] },
  { name_en: 'Gidami', name_am: 'ግዳሚ', region: 'Oromia', patterns: [/ግዳሚ/i, /gidami/i] },
  { name_en: 'Asosa City & Woredas', name_am: 'አሶሳ', region: 'Benishangul-Gumuz', patterns: [/አሶሳ/i, /asosa/i, /assosa/i] },
  { name_en: 'Bambasi', name_am: 'ባምበሲ', region: 'Benishangul-Gumuz', patterns: [/ባምበሲ/i, /bambasi/i] },
  { name_en: 'Kurmuk', name_am: 'ኩርሙክ', region: 'Benishangul-Gumuz', patterns: [/ኩርሙክ/i, /kurmuk/i] },
  { name_en: 'Arba Minch', name_am: 'አርባምንጭ', region: 'South Ethiopia', patterns: [/አርባ\s*ምንጭ/i, /አርባምንጭ/i, /arba\s*minch/i] },
  { name_en: 'Sawla', name_am: 'ሳውላ', region: 'South Ethiopia', patterns: [/ሳውላ/i, /sawla/i] },
  { name_en: 'Hawassa', name_am: 'ሀዋሳ', region: 'Sidama', patterns: [/ሀዋሳ/i, /hawassa/i] },
  { name_en: 'Bahir Dar', name_am: 'ባህር ዳር', region: 'Amhara', patterns: [/ባህር\s*ዳር/i, /bahir\s*dar/i] },
  { name_en: 'Gondar', name_am: 'ጎንደር', region: 'Amhara', patterns: [/ጎንደር/i, /gondar/i] },
  { name_en: 'Dessie', name_am: 'ደሴ', region: 'Amhara', patterns: [/ደሴ/i, /dessie/i] },
  { name_en: 'Mekelle', name_am: 'መቀሌ', region: 'Tigray', patterns: [/መቀሌ/i, /mekelle/i] },
  { name_en: 'Dire Dawa', name_am: 'ድሬዳዋ', region: 'Dire Dawa', patterns: [/ድሬዳዋ/i, /ድሬ\s*ዳዋ/i, /dire\s*dawa/i] },
  { name_en: 'Harar', name_am: 'ሐረር', region: 'Harari', patterns: [/ሐረር/i, /harar/i] },
];

export function parseEthiopianTime(timeStr?: string, isMorningDefault = true): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/፡/g, ':').trim();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;

  const rawHours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  const isMorning = /ጠዋ[ትቱ]|ጥዋ[ትቱ]|morning/i.test(clean);
  const isAfternoon = /ቀን|ቀኑ|ከሰዓት|afternoon/i.test(clean);
  const isNight = /ምሽ[ትቱ]|ማታ|night|evening/i.test(clean);

  let convertedHours = rawHours;

  if (isNight) {
    convertedHours = rawHours === 12 ? 18 : (rawHours % 12) + 18;
  } else if (isMorning && rawHours === 12) {
    convertedHours = 6;
  } else if (rawHours === 12) {
    convertedHours = isMorningDefault ? 6 : 18;
  } else {
    // Daytime hours 1 to 11 are consistently rawHours + 6 (e.g. 1 -> 07:00, 7 -> 13:00)
    convertedHours = rawHours + 6;
  }

  return { hours: Math.min(23, Math.max(0, convertedHours)), minutes: Math.min(59, Math.max(0, minutes)) };
}

function cleanAmharicToken(token: string): string {
  let t = token
    .replace(/&nbsp;/gi, ' ')
    .replace(/[👉✅•\-\*\(\)\[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s፣,]+$/, '');
  if (t.startsWith('በ') && t.length > 2) {
    t = t.slice(1).trim();
  }
  t = t.replace(/\s*(?:እና\s*)?አካባቢ(?:ው)?(?:ች)?/i, '').trim();
  return t;
}

/**
 * Main Multi-Section EEU Announcement Extractor
 */
export function extractMultiBlockOutage(text: string, referenceDate: Date = new Date()): ExtractedAnnouncement {
  const normalizedText = text.replace(/&nbsp;/gi, ' ').replace(/፡/g, ':');
  const lines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Exact Ethiopian Date Detection & Astronomical Gregorian Conversion
  const dateInfo = parseEthiopianDateFromText(text, referenceDate);
  const targetDate = dateInfo.gregorianDate;
  const outageDateRaw = dateInfo.matchedRaw || dateInfo.formattedAm;
  const ethiopianDateAm = dateInfo.formattedAm;
  const ethiopianDateEn = dateInfo.formattedEn;
  const ethiopianDateCombined = `${ethiopianDateAm} (${ethiopianDateEn})`;

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  // 2. Reason Detection
  let reasonEn = 'Preventive maintenance work';
  let reasonAm = 'የቅድመ መከላከል ጥገና ሥራ';
  if (/ማሻሻያ|ዝርጋታ|አቅም\s*ማሳደግ/i.test(text)) {
    reasonEn = 'Network expansion and upgrading';
    reasonAm = 'የመስመር ማሻሻያ እና አቅም ማሳደግ';
  } else if (/አደጋ|አስቸኳይ|ብልሽት/i.test(text)) {
    reasonEn = 'Emergency power system repair';
    reasonAm = 'የአደጋ ጊዜ የኃይል ጥገና';
  }

  // 3. Split into Multi-Time Sections
  const timeHeaderRegex = /(?:✅\s*)?ከ\s*(?:ጠዋቱ|ጥዋቱ|ቀኑ|ምሽቱ)?\s*(\d{1,2}(?::\d{2})?)\s*(?:ሰዓት)?\s*(?:እስከ|-|to)\s*(?:ቀኑ|ምሽቱ|ከሰዓት|ጠዋቱ)?\s*(\d{1,2}(?::\d{2})?)\s*(?:ሰዓት)?/i;

  const rawBlocks: Array<{ header: string; startRaw: string; endRaw: string; textLines: string[] }> = [];
  const introLines: string[] = [];
  let currentBlock: { header: string; startRaw: string; endRaw: string; textLines: string[] } | null = null;

  for (const line of lines) {
    const tm = line.match(timeHeaderRegex);
    if (tm) {
      if (currentBlock) {
        rawBlocks.push(currentBlock);
      }
      currentBlock = {
        header: line,
        startRaw: tm[1],
        endRaw: tm[2],
        textLines: [],
      };
    } else if (currentBlock) {
      if (!/^(?:ስለሆነም|በአካባቢው|ይህንን|ይህንኑ|በአክብሮት|እናሳውቃለን|#)/.test(line)) {
        currentBlock.textLines.push(line);
      }
    } else {
      introLines.push(line);
    }
  }
  if (currentBlock) {
    rawBlocks.push(currentBlock);
  }

  if (rawBlocks.length === 0) {
    const singleMatch = normalizedText.match(timeHeaderRegex);
    rawBlocks.push({
      header: singleMatch ? singleMatch[0] : 'General Time Window',
      startRaw: singleMatch ? singleMatch[1] : '2:00',
      endRaw: singleMatch ? singleMatch[2] : '10:00',
      textLines: lines,
    });
  }

  const parsedBlocks: ScheduleBlock[] = [];
  const allAggregatedWoredas = new Set<string>();
  const allAggregatedNeighborhoods = new Set<string>();

  for (let idx = 0; idx < rawBlocks.length; idx++) {
    const b = rawBlocks[idx];
    const fullBlockText = rawBlocks.length === 1
      ? normalizedText
      : [b.header, ...b.textLines].join(' ');

    let startParsed = parseEthiopianTime(b.header.split(/እስከ|-|to/i)[0], true);
    let endParsed = parseEthiopianTime(b.header.split(/እስከ|-|to/i)[1], false);

    if (startParsed && endParsed) {
      if (endParsed.hours <= startParsed.hours) {
        endParsed.hours = (endParsed.hours + 12) % 24;
      }
    }

    let sIso: string | undefined;
    let eIso: string | undefined;

    if (startParsed) {
      const s = new Date(targetDate);
      s.setHours(startParsed.hours, startParsed.minutes, 0, 0);
      sIso = s.toISOString();
    }
    if (endParsed) {
      const e = new Date(targetDate);
      e.setHours(endParsed.hours, endParsed.minutes, 0, 0);
      eIso = e.toISOString();
    }

    const rawTokens = fullBlockText
      .split(/[፣,\n👉•;\-]+|\s+እና\s+|\s{2,}/)
      .map(cleanAmharicToken)
      .filter(
        (t) =>
          t.length > 1 &&
          !/^(?:ስለሆነም|በአካባቢው|ይቋረጣል|ክቡራን|ደንበኞቻችን|የጥገና|ሥራ|ለማከናወን|የኃይል|አቅርቦት|የሚቋረጥባቸው|ነገ|ዛሬ|ከጠዋቱ|ከቀኑ|ከሰዓት|ከምሽቱ)/.test(t) &&
          !/^\d{1,2}(?::\d{2})?$/.test(t) &&
          !/\b(?:ቀን|ዓ\.ም|ዓም)\b/.test(t)
      );

    const addisTargets: AddisWoredaTarget[] = [];
    const matchedWoredas = new Set<string>();
    let isAddis = false;
    let regionName = 'Addis Ababa';

    // A. Check explicit Subcity & Woredas
    for (const sc of SUBCITY_DICTIONARY) {
      if (sc.patterns.some((p) => p.test(fullBlockText))) {
        isAddis = true;
        const wMatches = fullBlockText.matchAll(/(?:ወረዳ|woreda)[\s:]*([0-9\s,፣እና\/\-&]+)/gi);
        const scWoredas: string[] = [];
        for (const wm of wMatches) {
          const digits = wm[1].match(/\b\d{1,2}\b/g) || wm[1].match(/\d{1,2}/g) || [];
          for (const d of digits) {
            const num = parseInt(d, 10);
            if (num >= 1 && num <= 20) {
              const wNum = d.padStart(2, '0');
              if (!scWoredas.includes(wNum)) {
                scWoredas.push(wNum);
                matchedWoredas.add(wNum);
                allAggregatedWoredas.add(wNum);
              }
            }
          }
        }
        if (scWoredas.length > 0) {
          addisTargets.push({
            subcity_id: sc.id,
            subcity_en: sc.en,
            subcity_am: sc.am,
            woreda_numbers: scWoredas,
            neighborhood: 'Explicitly Announced Woredas',
          });
        }
      }
    }

    // B. Check Addis Ababa Landmarks
    const blockLandmarks: LandmarkPin[] = [];
    for (const lm of ADDIS_LANDMARK_MAP) {
      if (lm.patterns.some((p) => p.test(fullBlockText))) {
        isAddis = true;
        allAggregatedNeighborhoods.add(lm.name_en);

        if (!blockLandmarks.some((pin) => pin.name_en === lm.name_en)) {
          blockLandmarks.push({
            name_en: lm.name_en,
            name_am: lm.name_am,
            lng: lm.coordinates[0],
            lat: lm.coordinates[1],
            woreda_id: lm.woreda_id,
            woreda_number: lm.woreda_number,
            subcity_id: lm.subcity_id,
            subcity_en: lm.subcity_en,
            subcity_am: lm.subcity_am,
            full_name_en: lm.full_name_en,
            full_name_am: lm.full_name_am,
          });
        }

        lm.woredas.forEach((w) => {
          matchedWoredas.add(w);
          allAggregatedWoredas.add(w);
        });

        const alreadyHasWoreda = addisTargets.some(
          (t) => t.subcity_id === lm.subcity_id && t.woreda_numbers.includes(lm.woreda_number)
        );

        if (!alreadyHasWoreda) {
          addisTargets.push({
            subcity_id: lm.subcity_id,
            subcity_en: lm.subcity_en,
            subcity_am: lm.subcity_am,
            woreda_numbers: [lm.woreda_number], // EXACT single woreda!
            neighborhood: lm.name_en,
          });
        }
      }
    }

    // C. Check Regional Ethiopian Hubs
    for (const rh of REGIONAL_HUB_MAP) {
      if (rh.patterns.some((p) => p.test(fullBlockText))) {
        regionName = rh.region;
        break;
      }
    }

    let conf = 40;
    if (sIso && eIso) conf += 20;
    if (addisTargets.length > 0 || regionName !== 'Addis Ababa') conf += 30;
    if (rawTokens.length > 0) conf += 10;

    parsedBlocks.push({
      block_index: idx + 1,
      time_header_raw: b.header,
      start_time_raw: b.startRaw,
      end_time_raw: b.endRaw,
      scheduled_start_iso: sIso,
      scheduled_end_iso: eIso,
      raw_locations_text: fullBlockText,
      location_tokens: rawTokens,
      region_name: isAddis ? 'Addis Ababa' : regionName,
      is_addis_ababa: isAddis,
      addis_targets: addisTargets,
      all_woredas: Array.from(matchedWoredas).sort(),
      landmarks: blockLandmarks,
      confidence: Math.min(100, conf),
    });
  }

  const firstAddis = parsedBlocks.find((b) => b.is_addis_ababa && b.addis_targets.length > 0);
  const allAreaTargets: AddisWoredaTarget[] = [];
  const allAggregatedLandmarks: LandmarkPin[] = [];
  for (const b of parsedBlocks) {
    for (const t of b.addis_targets) {
      allAreaTargets.push(t);
    }
    for (const lm of b.landmarks) {
      if (!allAggregatedLandmarks.some((x) => x.name_en === lm.name_en)) {
        allAggregatedLandmarks.push(lm);
      }
    }
  }

  const hasRecognizedAddis = allAggregatedWoredas.size > 0 || allAggregatedNeighborhoods.size > 0;
  const hasRecognizedRegional = parsedBlocks.some((b) => b.region_name !== 'Addis Ababa' && b.location_tokens.length > 0);
  const hasRecognizedLocation = hasRecognizedAddis || hasRecognizedRegional;
  const needsAdminReview = !hasRecognizedLocation || parsedBlocks.length === 0;

  const finalConfidence = needsAdminReview ? 35 : (parsedBlocks.length > 0 ? parsedBlocks[0].confidence : 50);

  return {
    outage_date_raw: outageDateRaw,
    ethiopian_date_am: ethiopianDateAm,
    ethiopian_date_en: ethiopianDateEn,
    ethiopian_date: ethiopianDateCombined,
    ethiopian_details: dateInfo.ethiopian,
    iso_date: isoDate,
    reason_en: reasonEn,
    reason_am: reasonAm,
    source_language: 'am',
    blocks: parsedBlocks,
    total_blocks: parsedBlocks.length,
    has_addis_ababa: parsedBlocks.some((b) => b.is_addis_ababa),
    has_regional: parsedBlocks.some((b) => !b.is_addis_ababa),
    area_targets: allAreaTargets,
    woredas: Array.from(allAggregatedWoredas).sort(),
    neighborhoods: Array.from(allAggregatedNeighborhoods),
    landmarks: allAggregatedLandmarks,
    confidence: finalConfidence,
    needs_admin_review: needsAdminReview,
    sub_city_en: firstAddis ? firstAddis.addis_targets[0]?.subcity_en : undefined,
    sub_city_am: firstAddis ? firstAddis.addis_targets[0]?.subcity_am : undefined,
    subcity_id: firstAddis ? firstAddis.addis_targets[0]?.subcity_id : undefined,
    scheduled_start_iso: parsedBlocks[0]?.scheduled_start_iso,
    scheduled_end_iso: parsedBlocks[0]?.scheduled_end_iso,
    matched_rules: parsedBlocks.map((b) => `block_${b.block_index}:${b.region_name}`),
  };
}

// Backward-compatible alias
export const extractOutageFromText = extractMultiBlockOutage;
export type ExtractedOutage = ExtractedAnnouncement;
