/**
 * Ethiopian Power Monitor — Gemini 3.8 Flash Semantic & Multimodal Extraction Service
 * Uses @google/genai with 'gemini-3.8-flash' to parse unstructured Amharic outage announcements,
 * relative dates, multi-tier schedules, and visual flyer infographics.
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  ExtractedAnnouncement,
  ScheduleBlock,
  AddisWoredaTarget,
  LandmarkPin,
  SUBCITY_DICTIONARY,
  ADDIS_LANDMARK_MAP,
} from './amharic-extractor';

export interface GeminiParsedBlock {
  block_index: number;
  time_header_raw?: string;
  start_time_24h: string; // "08:00"
  end_time_24h: string;   // "16:00"
  subcities: string[];
  woredas: string[];
  specific_landmarks: string[];
  region_name: string;
  is_addis_ababa: boolean;
}

export interface GeminiParsedAnnouncement {
  is_outage_announcement: boolean;
  confidence_score: number; // 0 to 100
  reason_am: string;
  reason_en: string;
  outage_date_raw?: string;
  iso_date?: string; // "YYYY-MM-DD"
  blocks: GeminiParsedBlock[];
  raw_summary?: string;
}

// Strict Gemini JSON Schema
const OutageExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    is_outage_announcement: {
      type: Type.BOOLEAN,
      description: 'True if message announces an electric power outage or scheduled maintenance. False for PR, billing, safety campaigns, holiday greetings.',
    },
    confidence_score: {
      type: Type.INTEGER,
      description: 'Confidence score from 0 to 100 based on clarity and completeness of location and time information.',
    },
    reason_am: {
      type: Type.STRING,
      description: 'The stated reason in Amharic (e.g. የቅድመ መከላከል ጥገና ሥራ, የመስመር ማሻሻያ).',
    },
    reason_en: {
      type: Type.STRING,
      description: 'English translation of the reason (e.g. Preventive maintenance work, Grid expansion).',
    },
    outage_date_raw: {
      type: Type.STRING,
      description: 'The raw date string in Amharic (e.g. ጥቅምት 15 ቀን 2016 ዓ.ም or ነገ እሁድ).',
    },
    iso_date: {
      type: Type.STRING,
      description: 'The Gregorian date in YYYY-MM-DD format if determinable relative to reference date.',
    },
    blocks: {
      type: Type.ARRAY,
      description: 'List of scheduled outage time blocks with their affected areas.',
      items: {
        type: Type.OBJECT,
        properties: {
          block_index: { type: Type.INTEGER },
          time_header_raw: { type: Type.STRING, description: 'Raw Amharic time window e.g. ከጠዋቱ 2:00 እስከ 10:00' },
          start_time_24h: { type: Type.STRING, description: 'Start time in 24-hour HH:MM format (EAT UTC+3)' },
          end_time_24h: { type: Type.STRING, description: 'End time in 24-hour HH:MM format (EAT UTC+3)' },
          subcities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Subcities mentioned (e.g. Bole, Yeka, Kirkos, Arada, Lideta, Nifas Silk-Lafto, Gullele, Kolfe Keranio, Akaki Kality, Addis Ketema, Lemi Kura)',
          },
          woredas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific woreda numbers e.g. ["03", "07", "12"]',
          },
          specific_landmarks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific neighborhoods, landmarks, streets, condominiums, or sub-stations (e.g. Atlas, Hayahulet, CMC, Kazanchis, Jemo, Sarbet)',
          },
          region_name: {
            type: Type.STRING,
            description: '"Addis Ababa" or the regional state / town name (e.g. Oromia, Adama, Bishoftu, Hawassa)',
          },
          is_addis_ababa: {
            type: Type.BOOLEAN,
            description: 'True if affected areas are inside Addis Ababa',
          },
        },
        required: ['block_index', 'start_time_24h', 'end_time_24h', 'subcities', 'is_addis_ababa'],
      },
    },
    raw_summary: {
      type: Type.STRING,
      description: 'One-sentence English summary of the outage.',
    },
  },
  required: ['is_outage_announcement', 'confidence_score', 'blocks'],
};

export class GeminiParserService {
  private client: GoogleGenAI | null = null;
  private modelName: string;
  private isConfigured: boolean = false;

  constructor(apiKey?: string, modelName: string = 'gemini-3.8-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;

    if (key) {
      try {
        this.client = new GoogleGenAI({ apiKey: key });
        this.isConfigured = true;
        console.log(`[GeminiParserService] Initialized with model ${this.modelName}`);
      } catch (err: any) {
        console.warn('[GeminiParserService] Failed to initialize GoogleGenAI client:', err.message);
      }
    } else {
      console.warn('[GeminiParserService] No GEMINI_API_KEY provided. Hybrid fallback will use deterministic rules.');
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Helper to execute content generation with automatic failover between 3.8-flash and 3.6-flash
   * Includes exponential backoff for transient 503 high-demand or 429 rate limit spikes.
   */
  private async executeWithFallback(
    contents: any,
    taskDescription: string
  ): Promise<string | null> {
    if (!this.isAvailable() || !this.client) return null;

    const modelsToTry = [this.modelName, 'gemini-3.6-flash'].filter(
      (m, i, arr) => arr.indexOf(m) === i
    );

    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await this.client.models.generateContent({
            model,
            contents,
            config: {
              responseMimeType: 'application/json',
              responseSchema: OutageExtractionSchema,
              temperature: 0.1,
            },
          });

          if (response.text) {
            return response.text;
          }
        } catch (err: any) {
          const isRetryable =
            err.message?.includes('503') ||
            err.message?.includes('429') ||
            err.message?.includes('high demand') ||
            err.message?.includes('UNAVAILABLE');

          console.warn(
            `[GeminiParserService] ${taskDescription} failed with ${model} (attempt ${attempt}): ${err.message}.`
          );

          if (isRetryable && attempt === 1) {
            const backoffMs = 1500;
            console.log(`[GeminiParserService] Retrying ${model} after ${backoffMs}ms backoff...`);
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      }

      if (model !== modelsToTry[modelsToTry.length - 1]) {
        console.log(`[GeminiParserService] Switching to backup model...`);
      }
    }

    return null;
  }

  /**
   * Parse narrative or complex text using Gemini 3.8 Flash (with 3.6 Flash fallback)
   */
  public async parseText(
    rawText: string,
    referenceDate: Date = new Date()
  ): Promise<GeminiParsedAnnouncement | null> {
    if (!this.isAvailable() || !this.client) return null;

    const refIso = referenceDate.toISOString().split('T')[0];
    const systemPrompt = `You are an expert power grid intelligence analyst for the Ethiopian Electric Utility (EEU).
Analyze the following Amharic post and extract planned outage schedules.
Reference Date: Today is ${refIso}.
Important Rules:
1. "ነገ" means tomorrow (Reference Date + 1 day). "ከነገ ወዲያ" means in 2 days.
2. Ethiopian time: daytime hour 1 = 07:00 EAT, hour 2 = 08:00 EAT, hour 4 = 10:00 EAT, hour 7 = 13:00 EAT, hour 10 = 16:00 EAT. Convert correctly to 24h format.
3. Extract all affected subcities, woreda numbers, and landmark neighborhoods.
4. If this is a corporate PR post, executive appointment, or general payment reminder without actual power cut times/areas, set is_outage_announcement to false.`;

    const responseText = await this.executeWithFallback(
      [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nAnnouncement Text:\n${rawText}` }] }],
      'Text parsing'
    );

    if (!responseText) return null;

    try {
      const parsed: GeminiParsedAnnouncement = JSON.parse(responseText);
      return parsed;
    } catch (parseErr: any) {
      console.error('[GeminiParserService] JSON parse error:', parseErr.message);
      return null;
    }
  }

  /**
   * Parse visual flyer / graphic timetable image using Gemini 3.8 Flash Multimodal Vision
   */
  public async parseFlyerImage(
    imageUrlOrBase64: string,
    caption: string = '',
    referenceDate: Date = new Date()
  ): Promise<GeminiParsedAnnouncement | null> {
    if (!this.isAvailable() || !this.client) return null;

    const refIso = referenceDate.toISOString().split('T')[0];
    const prompt = `You are an expert OCR & power grid analyst for Ethiopian Electric Utility (EEU) power outage flyers.
The attached image is an official schedule flyer containing a table or list of planned power interruptions.
Reference Date for relative dates: ${refIso}.
Read all text and tables in Amharic from the image carefully. Extract all dates, time windows, subcities, woredas, and specific landmark neighborhoods into the structured schema.
Caption context: ${caption}`;

    try {
      let imagePart: any;

      if (imageUrlOrBase64.startsWith('http://') || imageUrlOrBase64.startsWith('https://')) {
        // Fetch image buffer and convert to base64
        const resp = await fetch(imageUrlOrBase64);
        if (!resp.ok) throw new Error(`Failed to fetch flyer image HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const contentType = resp.headers.get('content-type') || 'image/jpeg';

        imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: contentType.split(';')[0],
          },
        };
      } else {
        // Assume raw base64 string
        const cleanBase64 = imageUrlOrBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        };
      }

      const responseText = await this.executeWithFallback(
        [
          {
            role: 'user',
            parts: [
              imagePart,
              { text: prompt },
            ],
          },
        ],
        'Flyer OCR'
      );

      if (!responseText) return null;

      const parsed: GeminiParsedAnnouncement = JSON.parse(responseText);
      return parsed;
    } catch (err: any) {
      console.error(`[GeminiParserService] Flyer OCR failed:`, err.message);
      return null;
    }
  }
}

/**
 * Converts GeminiParsedAnnouncement into the system's standard ExtractedAnnouncement format,
 * mapping detected subcities and landmarks to the canonical gazetteer.
 */
export function convertGeminiToExtracted(
  gemini: GeminiParsedAnnouncement,
  referenceDate: Date = new Date(),
  rawText: string = ''
): ExtractedAnnouncement {
  const isoDate = gemini.iso_date || referenceDate.toISOString().split('T')[0];

  const blocks: ScheduleBlock[] = (gemini.blocks || []).map((b, idx) => {
    let startIso: string | undefined;
    let endIso: string | undefined;

    if (b.start_time_24h && isoDate) {
      startIso = `${isoDate}T${b.start_time_24h}:00+03:00`;
    }
    if (b.end_time_24h && isoDate) {
      endIso = `${isoDate}T${b.end_time_24h}:00+03:00`;
    }

    const addisTargets: AddisWoredaTarget[] = [];
    const matchedSubcityIds = new Set<number>();

    for (const subName of b.subcities || []) {
      const match = SUBCITY_DICTIONARY.find(
        (s) =>
          s.patterns.some((p) => p.test(subName)) ||
          s.en.toLowerCase() === subName.toLowerCase() ||
          s.am === subName
      );
      if (match) {
        matchedSubcityIds.add(match.id);
        addisTargets.push({
          subcity_id: match.id,
          subcity_en: match.en,
          subcity_am: match.am,
          woreda_numbers: b.woredas || [],
          neighborhood: (b.specific_landmarks && b.specific_landmarks[0]) || match.en,
        });
      }
    }

    const landmarks: LandmarkPin[] = [];
    const allTokens = [
      ...(b.specific_landmarks || []),
      ...(b.woredas || []).map((w) => `ወረዳ ${w}`),
    ];

    for (const lmName of b.specific_landmarks || []) {
      const found = ADDIS_LANDMARK_MAP.find(
        (entry) =>
          entry.name_en.toLowerCase() === lmName.toLowerCase() ||
          entry.name_am === lmName ||
          entry.patterns.some((p) => p.test(lmName))
      );
      if (found) {
        landmarks.push({
          name_en: found.name_en,
          name_am: found.name_am,
          lng: found.coordinates[0],
          lat: found.coordinates[1],
          woreda_id: found.woreda_id,
          woreda_number: found.woreda_number,
          subcity_id: found.subcity_id,
          subcity_en: found.subcity_en,
          subcity_am: found.subcity_am,
          full_name_en: found.full_name_en,
          full_name_am: found.full_name_am,
        });
        if (!matchedSubcityIds.has(found.subcity_id)) {
          matchedSubcityIds.add(found.subcity_id);
          addisTargets.push({
            subcity_id: found.subcity_id,
            subcity_en: found.subcity_en,
            subcity_am: found.subcity_am,
            woreda_numbers: [found.woreda_number],
            neighborhood: found.name_en,
          });
        }
      }
    }

    const isAddis: boolean =
      b.is_addis_ababa !== false &&
      (addisTargets.length > 0 ||
        landmarks.length > 0 ||
        Boolean(b.region_name?.toLowerCase().includes('addis')));

    return {
      block_index: b.block_index || idx + 1,
      time_header_raw: b.time_header_raw || `${b.start_time_24h} - ${b.end_time_24h}`,
      start_time_raw: b.start_time_24h,
      end_time_raw: b.end_time_24h,
      scheduled_start_iso: startIso,
      scheduled_end_iso: endIso,
      raw_locations_text: (b.specific_landmarks || []).join(', '),
      location_tokens: allTokens,
      region_name: isAddis ? 'Addis Ababa' : b.region_name || 'Regional',
      is_addis_ababa: isAddis,
      addis_targets: addisTargets,
      all_woredas: b.woredas || [],
      landmarks,
      confidence: gemini.confidence_score || 85,
    };
  });

  const allAreaTargets: AddisWoredaTarget[] = [];
  const allWoredas = new Set<string>();
  const allNeighborhoods = new Set<string>();
  const allLandmarks: LandmarkPin[] = [];

  for (const blk of blocks) {
    for (const t of blk.addis_targets) {
      allAreaTargets.push(t);
      for (const w of t.woreda_numbers) allWoredas.add(w);
      if (t.neighborhood) allNeighborhoods.add(t.neighborhood);
    }
    for (const w of blk.all_woredas) allWoredas.add(w);
    for (const lm of blk.landmarks) {
      if (!allLandmarks.some((x) => x.name_en === lm.name_en)) {
        allLandmarks.push(lm);
      }
    }
  }

  const needsReview =
    !gemini.is_outage_announcement ||
    blocks.length === 0 ||
    (allAreaTargets.length === 0 &&
      allLandmarks.length === 0 &&
      !blocks.some((b) => !b.is_addis_ababa));

  return {
    outage_date_raw: gemini.outage_date_raw || isoDate,
    iso_date: isoDate,
    reason_en: gemini.reason_en || 'Scheduled electrical maintenance work',
    reason_am: gemini.reason_am || 'የታቀደ የኤሌክትሪክ ጥገና ሥራ',
    source_language: 'am',
    blocks,
    total_blocks: blocks.length,
    has_addis_ababa: blocks.some((b) => b.is_addis_ababa),
    has_regional: blocks.some((b) => !b.is_addis_ababa),
    area_targets: allAreaTargets,
    woredas: Array.from(allWoredas).sort(),
    neighborhoods: Array.from(allNeighborhoods),
    landmarks: allLandmarks,
    confidence: gemini.confidence_score || (needsReview ? 30 : 90),
    needs_admin_review: needsReview,
    sub_city_en: allAreaTargets[0]?.subcity_en,
    sub_city_am: allAreaTargets[0]?.subcity_am,
    subcity_id: allAreaTargets[0]?.subcity_id,
    scheduled_start_iso: blocks[0]?.scheduled_start_iso,
    scheduled_end_iso: blocks[0]?.scheduled_end_iso,
    matched_rules: ['GEMINI_3_8_FLASH'],
  };
}
