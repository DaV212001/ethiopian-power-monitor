/**
 * Ethiopian Power Monitor — Community Reporting & Abuse Protection
 * Handles privacy-safe reporting, rate-limiting, and spatial clustering.
 */

import crypto from 'crypto';

export interface SubmitReportInput {
  woreda_id?: number;
  latitude?: number;
  longitude?: number;
  reported_status: 'POWER_OUT' | 'POWER_RESTORED';
  comments?: string;
  ip_address: string;
  user_agent: string;
}

export interface ReportResult {
  success: boolean;
  message: string;
  report_id?: string;
  woreda_id?: number;
  woreda_name?: string;
  is_rate_limited?: boolean;
}

export class CommunityReportService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private dailySalt: string;

  constructor(config: { supabaseUrl: string; supabaseAnonKey: string }) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    // Daily rotating salt for privacy so user fingerprints cannot be tracked across days
    const dateStr = new Date().toISOString().slice(0, 10);
    this.dailySalt = crypto.createHash('sha256').update(`epm_salt_${dateStr}`).digest('hex');
  }

  public computeUserFingerprint(ip: string, userAgent: string): string {
    return crypto
      .createHash('sha256')
      .update(`${ip}|${userAgent}|${this.dailySalt}`)
      .digest('hex');
  }

  public async submitReport(input: SubmitReportInput): Promise<ReportResult> {
    const fingerprint = this.computeUserFingerprint(input.ip_address, input.user_agent);

    let resolvedWoredaId = input.woreda_id;
    let resolvedWoredaName = '';

    // 1. If coordinates provided instead of woreda_id, resolve using PostGIS point-in-polygon
    if (!resolvedWoredaId && input.latitude !== undefined && input.longitude !== undefined) {
      const spatialRes = await fetch(`${this.supabaseUrl}/rest/v1/rpc/find_woreda_by_coords`, {
        method: 'POST',
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_lng: input.longitude, p_lat: input.latitude }),
      });
      const spatialData = await spatialRes.json();
      if (Array.isArray(spatialData) && spatialData.length > 0) {
        resolvedWoredaId = spatialData[0].woreda_id;
        resolvedWoredaName = spatialData[0].full_name_en;
      }
    }

    if (!resolvedWoredaId) {
      return {
        success: false,
        message: 'Could not resolve a valid Addis Ababa Woreda for this location.',
      };
    }

    // 2. Abuse protection & Rate Limiting:
    // Check if this fingerprint already submitted a report for this woreda in the last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const rateCheckUrl = `${this.supabaseUrl}/rest/v1/community_reports?woreda_id=eq.${resolvedWoredaId}&user_fingerprint_hash=eq.${fingerprint}&reported_at=gte.${fifteenMinsAgo}&select=id`;
    const rateRes = await fetch(rateCheckUrl, {
      headers: {
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAnonKey}`,
      },
    });
    const recentSubmissions = await rateRes.json();
    if (Array.isArray(recentSubmissions) && recentSubmissions.length > 0) {
      return {
        success: false,
        is_rate_limited: true,
        message: 'You have recently submitted a report for this area. Please wait before reporting again.',
        woreda_id: resolvedWoredaId,
      };
    }

    // 3. Insert report
    const insertRes = await fetch(`${this.supabaseUrl}/rest/v1/community_reports`, {
      method: 'POST',
      headers: {
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        woreda_id: resolvedWoredaId,
        user_fingerprint_hash: fingerprint,
        reported_status: input.reported_status,
        comments: input.comments || null,
        verification_status: 'PENDING',
      }),
    });

    const inserted = await insertRes.json();
    const reportId = inserted?.[0]?.id;

    return {
      success: true,
      message: 'Outage report submitted successfully. Thank you for contributing to your community!',
      report_id: reportId,
      woreda_id: resolvedWoredaId,
      woreda_name: resolvedWoredaName,
    };
  }

  /**
   * Retrieves aggregated report counts per woreda for the past 2 hours
   */
  public async getRecentReportsSummary(): Promise<Record<number, { out: number; restored: number }>> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const url = `${this.supabaseUrl}/rest/v1/community_reports?reported_at=gte.${twoHoursAgo}&verification_status=neq.REJECTED&select=woreda_id,reported_status`;

    const res = await fetch(url, {
      headers: {
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAnonKey}`,
      },
    });

    const rows = await res.json();
    const summary: Record<number, { out: number; restored: number }> = {};

    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (!summary[r.woreda_id]) summary[r.woreda_id] = { out: 0, restored: 0 };
        if (r.reported_status === 'POWER_OUT') summary[r.woreda_id].out++;
        else if (r.reported_status === 'POWER_RESTORED') summary[r.woreda_id].restored++;
      }
    }

    return summary;
  }
}
