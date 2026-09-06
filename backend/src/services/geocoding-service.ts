/**
 * Ethiopian Power Monitor — Dynamic Geocoding & PostGIS Spatial Resolution Service
 * Hybrid multi-tier architecture:
 *   Tier 1: 0ms In-Memory Verified Addis Ababa Landmark Gazetteer
 *   Tier 2: Persistent Supabase `landmarks_cache` Table
 *   Tier 3: Free OpenStreetMap Nominatim API (Rate-Limited to 1 req/s, Bounded to Addis Ababa)
 *   Tier 4: PostGIS ST_Contains Point-in-Polygon Resolution (find_woreda_by_coords)
 */

import rawGazetteer from '../data/addis-landmarks.json';

export interface ResolvedLandmark {
  search_query: string;
  name_en: string;
  name_am: string;
  lat: number;
  lng: number;
  woreda_id?: number | null;
  woreda_number?: string | null;
  subcity_id?: number | null;
  subcity_en?: string | null;
  subcity_am?: string | null;
  full_name_en?: string | null;
  full_name_am?: string | null;
  is_addis_ababa: boolean;
  region_name?: string;
  source: 'GAZETTEER' | 'DB_CACHE' | 'OSM_NOMINATIM';
}

export class GeocodingService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private memoryCache: Map<string, ResolvedLandmark> = new Map();
  private static lastOsmTimestamp: number = 0;

  constructor(config: { supabaseUrl: string; supabaseAnonKey: string }) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.initGazetteer();
  }

  /**
   * Pre-load verified gazetteer into fast memory lookup map
   */
  private initGazetteer() {
    if (Array.isArray(rawGazetteer)) {
      for (const item of rawGazetteer) {
        const resolved: ResolvedLandmark = {
          search_query: item.name_am.toLowerCase(),
          name_en: item.name_en,
          name_am: item.name_am,
          lat: item.coordinates[1],
          lng: item.coordinates[0],
          woreda_id: item.woreda_id,
          woreda_number: item.woreda_number,
          subcity_id: item.subcity_id,
          subcity_en: item.subcity_en,
          subcity_am: item.subcity_am,
          full_name_en: item.full_name_en,
          full_name_am: item.full_name_am,
          is_addis_ababa: true,
          source: 'GAZETTEER',
        };

        this.memoryCache.set(item.name_am.toLowerCase().trim(), resolved);
        this.memoryCache.set(item.name_en.toLowerCase().trim(), resolved);

        if (Array.isArray(item.patterns)) {
          for (const pat of item.patterns) {
            this.memoryCache.set(pat.toLowerCase().trim(), resolved);
          }
        }
      }
    }
  }

  /**
   * Clean colloquial Amharic location strings from EEU announcements
   */
  public cleanToken(raw: string): string {
    if (!raw) return '';
    let t = raw.replace(/[👉✅•\-\*\(\)\[\]"']/g, ' ').trim();

    // Strip leading prepositions: በ..., ከ..., ወ..., ለ... (when string is long enough)
    if (/^[በከወለ][\u1200-\u137F]{2,}/.test(t)) {
      t = t.substring(1).trim();
    }

    // Strip trailing boilerplate phrases
    t = t.replace(/\s+(?:እና\s+)?አካባቢ(?:ው)?\s*$/i, '').trim();
    t = t.replace(/\s+በከፊል\s*$/i, '').trim();
    t = t.replace(/\s+መብራት\s*$/i, '').trim();

    return t;
  }

  /**
   * Rate-limited fetch to OpenStreetMap Nominatim respecting the 1 req/s usage policy
   */
  private async fetchOsmNominatim(query: string, boundedToAddis: boolean = true): Promise<any | null> {
    const now = Date.now();
    const elapsed = now - GeocodingService.lastOsmTimestamp;
    if (elapsed < 1100) {
      await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
    }
    GeocodingService.lastOsmTimestamp = Date.now();

    const baseUrl = 'https://nominatim.openstreetmap.org/search';
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    if (boundedToAddis) {
      // Addis Ababa geographic envelope: West 38.60, North 9.15, East 38.92, South 8.80
      params.append('viewbox', '38.60,9.15,38.92,8.80');
      params.append('bounded', '1');
    }

    try {
      const resp = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'EthiopianPowerMonitor/1.0 (contact@power-monitor.et)',
          'Accept-Language': 'am,en',
        },
      });

      if (!resp.ok) {
        console.warn(`[GeocodingService] OSM Nominatim returned HTTP ${resp.status}`);
        return null;
      }

      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return null;
    } catch (err: any) {
      console.error(`[GeocodingService] OSM query error for "${query}":`, err.message);
      return null;
    }
  }

  /**
   * Query Supabase PostGIS spatial RPC to find exact containing woreda
   */
  public async resolveWoredaByCoords(
    lat: number,
    lng: number
  ): Promise<{
    woreda_id: number;
    woreda_number: string;
    subcity_id: number;
    subcity_en: string;
    subcity_am: string;
    full_name_en: string;
    full_name_am: string;
  } | null> {
    try {
      const url = `${this.supabaseUrl}/rest/v1/rpc/find_woreda_by_coords`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_lat: lat, p_lng: lng }),
      });

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return null;
    } catch (err: any) {
      console.error(`[GeocodingService] PostGIS resolve error:`, err.message);
      return null;
    }
  }

  /**
   * Primary hybrid resolution function:
   * 1. Memory Gazetteer -> 2. DB Cache -> 3. OSM Nominatim + PostGIS -> Save Cache
   */
  public async resolveLandmark(rawToken: string): Promise<ResolvedLandmark | null> {
    const clean = this.cleanToken(rawToken);
    if (!clean || clean.length < 2) return null;
    const cleanLower = clean.toLowerCase();

    // 1. Check in-memory gazetteer / cache (0ms)
    if (this.memoryCache.has(cleanLower)) {
      return this.memoryCache.get(cleanLower)!;
    }

    // 2. Check Supabase `landmarks_cache` table
    try {
      const checkUrl = `${this.supabaseUrl}/rest/v1/landmarks_cache?search_query=eq.${encodeURIComponent(
        cleanLower
      )}&select=*`;
      const checkRes = await fetch(checkUrl, {
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
        },
      });

      const cachedRows = await checkRes.json();
      if (Array.isArray(cachedRows) && cachedRows.length > 0) {
        const row = cachedRows[0];
        const resolved: ResolvedLandmark = {
          search_query: row.search_query,
          name_en: row.name_en || clean,
          name_am: row.name_am || clean,
          lat: row.lat,
          lng: row.lng,
          woreda_id: row.woreda_id,
          woreda_number: row.woreda_number,
          subcity_id: row.subcity_id,
          subcity_en: row.subcity_en,
          subcity_am: row.subcity_am,
          full_name_en: row.full_name_en,
          full_name_am: row.full_name_am,
          is_addis_ababa: Boolean(row.woreda_id),
          region_name: row.subcity_en || 'Regional',
          source: 'DB_CACHE',
        };
        this.memoryCache.set(cleanLower, resolved);
        return resolved;
      }
    } catch (err: any) {
      console.warn(`[GeocodingService] Error querying landmarks_cache:`, err.message);
    }

    // 3. Query OpenStreetMap Nominatim with Addis Ababa envelope
    let osmResult = await this.fetchOsmNominatim(`${clean} Addis Ababa`, true);

    // If not found in Addis bbox, try general Ethiopia query to catch regional towns
    let isAddisQuery = true;
    if (!osmResult) {
      osmResult = await this.fetchOsmNominatim(`${clean} Ethiopia`, false);
      isAddisQuery = false;
    }

    if (!osmResult) {
      return null;
    }

    const lat = parseFloat(osmResult.lat);
    const lng = parseFloat(osmResult.lon);
    const displayName = osmResult.display_name || clean;
    const nameEn = osmResult.name || displayName.split(',')[0].trim();

    // 4. Pass coordinates to PostGIS ST_Contains point-in-polygon resolution
    const woredaMatch = await this.resolveWoredaByCoords(lat, lng);

    const resolved: ResolvedLandmark = {
      search_query: cleanLower,
      name_en: nameEn,
      name_am: clean,
      lat,
      lng,
      woreda_id: woredaMatch ? woredaMatch.woreda_id : null,
      woreda_number: woredaMatch ? woredaMatch.woreda_number : null,
      subcity_id: woredaMatch ? woredaMatch.subcity_id : null,
      subcity_en: woredaMatch ? woredaMatch.subcity_en : null,
      subcity_am: woredaMatch ? woredaMatch.subcity_am : null,
      full_name_en: woredaMatch ? woredaMatch.full_name_en : null,
      full_name_am: woredaMatch ? woredaMatch.full_name_am : null,
      is_addis_ababa: Boolean(woredaMatch),
      region_name: woredaMatch ? 'Addis Ababa' : (osmResult.address?.state || 'Regional'),
      source: 'OSM_NOMINATIM',
    };

    // 5. Cache result in Supabase `landmarks_cache`
    try {
      await fetch(`${this.supabaseUrl}/rest/v1/landmarks_cache`, {
        method: 'POST',
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          search_query: cleanLower,
          name_am: clean,
          name_en: nameEn,
          lat,
          lng,
          woreda_id: resolved.woreda_id,
          woreda_number: resolved.woreda_number,
          subcity_id: resolved.subcity_id,
          subcity_en: resolved.subcity_en,
          subcity_am: resolved.subcity_am,
          full_name_en: resolved.full_name_en,
          full_name_am: resolved.full_name_am,
          source: 'OSM_NOMINATIM',
        }),
      });
    } catch (err: any) {
      console.warn(`[GeocodingService] Failed to cache landmark "${clean}":`, err.message);
    }

    // Save in fast memory map
    this.memoryCache.set(cleanLower, resolved);
    return resolved;
  }
}
