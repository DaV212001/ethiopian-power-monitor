/**
 * Ethiopian Power Monitor — Telegram Ingestion Service
 * Ingests official EEU announcements, computes SHA256 hashes for deduplication,
 * maintains an immutable audit trail in raw_announcements, and links multiple subcities & woredas.
 */

import crypto from 'crypto';
import { extractOutageFromText, ExtractedOutage } from './amharic-extractor';
import { GeocodingService } from './geocoding-service';

export interface TelegramRawMessage {
  id: string;
  channel_id: string;
  published_at: string;
  edited_at?: string;
  raw_text: string;
  caption?: string;
  media_urls?: string[];
  raw_payload: any;
}

export interface IngestionResult {
  raw_announcement_id?: string;
  is_duplicate: boolean;
  content_hash: string;
  extracted: ExtractedOutage;
  outage_id?: string;
  outage_ids?: string[];
  status: 'PROCESSED_AUTOMATIC' | 'QUEUED_FOR_REVIEW' | 'DUPLICATE_SKIPPED';
}

export function computeAnnouncementHash(text: string, mediaUrls: string[] = []): string {
  const content = (text || '').trim() + '|' + mediaUrls.sort().join(',');
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export class TelegramIngestionService {
  private channelId: string;
  private apiId: string;
  private apiHash: string;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private geocodingService: GeocodingService;

  constructor(config: {
    channelId?: string;
    apiId?: string;
    apiHash?: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    gebetaApiKey?: string;
  }) {
    this.channelId = config.channelId || 'eeuethiopia';
    this.apiId = config.apiId || '28797551';
    this.apiHash = config.apiHash || '4a32bdbf9ca0c89cc53af784e4a80551';
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.geocodingService = new GeocodingService({
      supabaseUrl: this.supabaseUrl,
      supabaseAnonKey: this.supabaseAnonKey,
      gebetaApiKey: config.gebetaApiKey || process.env.GEBETA_MAPS_API_KEY,
    });
  }

  public getGeocodingService(): GeocodingService {
    return this.geocodingService;
  }

  public async processAnnouncement(msg: TelegramRawMessage): Promise<IngestionResult> {
    const contentHash = computeAnnouncementHash(msg.raw_text, msg.media_urls);
    const cleanChannel = (msg.channel_id || this.channelId || 'eeuethiopia').replace(/^@/, '');
    const sourceUrl = msg.id ? `https://t.me/${cleanChannel}/${msg.id}` : `https://t.me/${cleanChannel}`;

    // 1. Check if hash already exists in raw_announcements
    const checkUrl = `${this.supabaseUrl}/rest/v1/raw_announcements?content_hash=eq.${contentHash}&select=id`;
    const checkRes = await fetch(checkUrl, {
      headers: {
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAnonKey}`,
      },
    });

    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return {
        raw_announcement_id: existing[0].id,
        is_duplicate: true,
        content_hash: contentHash,
        extracted: extractOutageFromText(msg.raw_text, new Date(msg.published_at)),
        status: 'DUPLICATE_SKIPPED',
      };
    }

    // 2. Insert into raw_announcements
    const rawRecord = {
      source_type: 'TELEGRAM',
      channel_id: cleanChannel,
      message_id: msg.id,
      published_at: msg.published_at,
      edited_at: msg.edited_at || null,
      raw_text: msg.raw_text,
      caption: msg.caption || null,
      media_urls: msg.media_urls || [],
      raw_payload: msg.raw_payload,
      content_hash: contentHash,
      source_url: sourceUrl,
      ingestion_status: 'INGESTED',
    };

    const insertRawUrl = `${this.supabaseUrl}/rest/v1/raw_announcements`;
    const insertRawRes = await fetch(insertRawUrl, {
      method: 'POST',
      headers: {
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(rawRecord),
    });

    const insertedRaw = await insertRawRes.json();
    const rawId = insertedRaw?.[0]?.id;

    // 3. Trigger Deterministic Amharic Extraction
    const extracted = extractOutageFromText(msg.raw_text, new Date(msg.published_at));

    // 4. Save Extraction Audit record
    const extractionRecord = {
      raw_announcement_id: rawId,
      extractor_type: 'DETERMINISTIC_RULES',
      version: '1.2.0',
      extracted_json: extracted,
      confidence_score: extracted.confidence,
      validation_status: extracted.needs_admin_review ? 'PENDING_REVIEW' : 'VALIDATED',
      validation_errors: extracted.needs_admin_review ? ['LOW_CONFIDENCE_OR_INCOMPLETE_GEOGRAPHY'] : [],
    };

    const insertExtUrl = `${this.supabaseUrl}/rest/v1/extractions`;
    const insertExtRes = await fetch(insertExtUrl, {
      method: 'POST',
      headers: {
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(extractionRecord),
    });
    const insertedExt = await insertExtRes.json();
    const extractionId = insertedExt?.[0]?.id;

    const createdOutageIds: string[] = [];
    const status: 'PROCESSED_AUTOMATIC' | 'QUEUED_FOR_REVIEW' = extracted.needs_admin_review
      ? 'QUEUED_FOR_REVIEW'
      : 'PROCESSED_AUTOMATIC';

    // 5. If flagged for admin review, queue in admin_reviews
    if (extracted.needs_admin_review) {
      try {
        await fetch(`${this.supabaseUrl}/rest/v1/admin_reviews`, {
          method: 'POST',
          headers: {
            apikey: this.supabaseAnonKey,
            Authorization: `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target_type: 'raw_announcement',
            target_id: rawId,
            action: 'PENDING_REVIEW',
            original_data: { raw_text: msg.raw_text, extracted },
            reviewer_notes: 'Unrecognized or ambiguous location pattern requiring administrative review',
          }),
        });
      } catch (err) {
        console.error('Failed to log admin review entry:', err);
      }
    } else {
      // 6. Multi-Block Outage Creation: Loop through all extracted schedule blocks
      for (const block of extracted.blocks) {
        // Dynamic geocoding fallback for tokens not matched in static gazetteer
        const existingLandmarkNames = new Set(
          (block.landmarks || []).map((l) => l.name_am.toLowerCase())
        );

        for (const rawToken of block.location_tokens) {
          const clean = this.geocodingService.cleanToken(rawToken);
          if (!clean || clean.length < 2 || existingLandmarkNames.has(clean.toLowerCase())) {
            continue;
          }

          try {
            const resolved = await this.geocodingService.resolveLandmark(rawToken);
            if (resolved && resolved.is_addis_ababa && resolved.woreda_id) {
              existingLandmarkNames.add(clean.toLowerCase());
              if (!block.landmarks) block.landmarks = [];
              block.landmarks.push({
                name_en: resolved.name_en,
                name_am: resolved.name_am,
                lng: resolved.lng,
                lat: resolved.lat,
                woreda_id: resolved.woreda_id,
                woreda_number: resolved.woreda_number || '',
                subcity_id: resolved.subcity_id || 0,
                subcity_en: resolved.subcity_en || 'Addis Ababa',
                subcity_am: resolved.subcity_am || 'አዲስ አበባ',
                full_name_en: resolved.full_name_en || undefined,
                full_name_am: resolved.full_name_am || undefined,
              });

              // Add to addis_targets if not already present
              let targetGroup = block.addis_targets.find((t) => t.subcity_id === resolved.subcity_id);
              if (!targetGroup) {
                targetGroup = {
                  subcity_id: resolved.subcity_id || 0,
                  subcity_en: resolved.subcity_en || 'Addis Ababa',
                  subcity_am: resolved.subcity_am || 'አዲስ አበባ',
                  woreda_numbers: [],
                  neighborhood: resolved.name_en,
                };
                block.addis_targets.push(targetGroup);
              }
              if (resolved.woreda_number && !targetGroup.woreda_numbers.includes(resolved.woreda_number)) {
                targetGroup.woreda_numbers.push(resolved.woreda_number);
              }
              if (resolved.woreda_number && !block.all_woredas.includes(resolved.woreda_number)) {
                block.all_woredas.push(resolved.woreda_number);
              }
              block.is_addis_ababa = true;
            } else if (resolved && !resolved.is_addis_ababa) {
              if (!block.region_name && resolved.region_name) {
                block.region_name = resolved.region_name;
              }
            }
          } catch (geoErr) {
            console.warn(`[TelegramIngestionService] Geocoding lookup failed for token "${rawToken}":`, geoErr);
          }
        }

        const hasLocations = block.addis_targets.length > 0 || block.location_tokens.length > 0 || block.all_woredas.length > 0;
        if (!hasLocations && extracted.blocks.length > 1) {
          continue;
        }

        const outageRecord = {
          raw_announcement_id: rawId,
          extraction_id: extractionId,
          status: 'SCHEDULED',
          reason: extracted.reason_en,
          reason_am: extracted.reason_am,
          scheduled_start: block.scheduled_start_iso || extracted.scheduled_start_iso,
          scheduled_end: block.scheduled_end_iso || extracted.scheduled_end_iso,
          confidence: 'OFFICIAL',
          source_type: 'EEU_ANNOUNCEMENT',
          review_status: 'AUTOMATIC',
          source_url: sourceUrl,
          ethiopian_date: extracted.ethiopian_date || extracted.outage_date_raw || null,
          raw_text: msg.raw_text,
          region_name: block.region_name || (block.is_addis_ababa ? 'Addis Ababa' : 'Regional'),
          affected_locations_raw: block.location_tokens.length > 0 ? block.location_tokens : (block.raw_locations_text ? [block.raw_locations_text] : []),
          landmarks: block.landmarks || [],
        };

        const insertOutageUrl = `${this.supabaseUrl}/rest/v1/outages`;
        const insertOutageRes = await fetch(insertOutageUrl, {
          method: 'POST',
          headers: {
            apikey: this.supabaseAnonKey,
            Authorization: `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(outageRecord),
        });

        const insertedOutage = await insertOutageRes.json();
        const blockOutageId = insertedOutage?.[0]?.id;

        if (blockOutageId) {
          createdOutageIds.push(blockOutageId);

          // If block targets Addis Ababa woredas, link them to outage_areas
          if (block.is_addis_ababa && block.addis_targets.length > 0) {
            const areaLinks: Array<{
              outage_id: string;
              woreda_id: number;
              subcity_id: number;
              specific_neighborhoods: string[];
              landmarks: any[];
            }> = [];

            for (const target of block.addis_targets) {
              const woredaNums = target.woreda_numbers.map((w: string) => `"${w}"`).join(',');
              const getWoredasUrl = `${this.supabaseUrl}/rest/v1/woredas?subcity_id=eq.${target.subcity_id}&woreda_number=in.(${woredaNums})&select=id,woreda_number`;

              const woredaRes = await fetch(getWoredasUrl, {
                headers: {
                  apikey: this.supabaseAnonKey,
                  Authorization: `Bearer ${this.supabaseAnonKey}`,
                },
              });

              const woredasFound = await woredaRes.json();
              if (Array.isArray(woredasFound)) {
                for (const wf of woredasFound) {
                  const targetLandmarks = (block.landmarks || []).filter(
                    (l) =>
                      l.woreda_id === wf.id ||
                      l.woreda_number === wf.woreda_number ||
                      (l.woreda_number &&
                        wf.woreda_number &&
                        parseInt(l.woreda_number, 10) === parseInt(wf.woreda_number, 10))
                  );
                  areaLinks.push({
                    outage_id: blockOutageId,
                    woreda_id: wf.id,
                    subcity_id: target.subcity_id,
                    specific_neighborhoods: [target.neighborhood, ...block.location_tokens.slice(0, 5)],
                    landmarks: targetLandmarks,
                  });
                }
              }
            }

            if (areaLinks.length > 0) {
              await fetch(`${this.supabaseUrl}/rest/v1/outage_areas`, {
                method: 'POST',
                headers: {
                  apikey: this.supabaseAnonKey,
                  Authorization: `Bearer ${this.supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(areaLinks),
              });
            }
          }
        }
      }
    }

    return {
      raw_announcement_id: rawId,
      is_duplicate: false,
      content_hash: contentHash,
      extracted,
      outage_id: createdOutageIds[0],
      outage_ids: createdOutageIds,
      status,
    };
  }
}
