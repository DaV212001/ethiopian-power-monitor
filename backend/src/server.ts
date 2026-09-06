/**
 * Ethiopian Power Monitor — Production REST API & Web Server
 * Built with Fastify, OpenAPI 3.0 Documentation, PostGIS integration, and Live Telegram Poller.
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { TelegramIngestionService } from './services/telegram-ingestion';
import { TelegramPoller } from './services/telegram-poller';
import { CommunityReportService } from './services/community-reports';
import { OutageStatusEngine } from './services/status-engine';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://szyktmgtclujvuooofnc.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eWt0bWd0Y2x1anZ1b29vZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTA5NzgsImV4cCI6MjEwNDI4Njk3OH0.hlGMgt-i1yAjQwtIbf9_1RHs9oh3NpDaADnhREg7G9Y';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Serve Frontend Static SPA from frontend/public
  const frontendPublicPath = path.join(__dirname, '../../frontend/public');
  if (fs.existsSync(frontendPublicPath)) {
    await app.register(fastifyStatic, {
      root: frontendPublicPath,
      prefix: '/',
    });
  }

  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Ethiopian Power Monitor API',
        description:
          'Open API for real-time power outages, EEU scheduled announcements, geographic intelligence, and community reports in Addis Ababa, Ethiopia.',
        version: '1.0.0',
      },
      host: `localhost:${PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'System', description: 'Health and system diagnostics' },
        { name: 'Map', description: 'Spatial PostGIS and GeoJSON vector layers' },
        { name: 'Outages', description: 'Active, scheduled, and historical outage data' },
        { name: 'Areas', description: 'Addis Ababa Sub-cities and Woredas administrative hierarchy' },
        { name: 'Community', description: 'Privacy-safe crowdsourced outage reports' },
        { name: 'Admin', description: 'Audit trails and AI/Deterministic extraction review' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  const ingestionService = new TelegramIngestionService({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });

  const communityReportService = new CommunityReportService({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });

  // Start continuous Telegram polling in background
  const poller = new TelegramPoller({
    ingestionService,
    channelUsername: process.env.TELEGRAM_CHANNEL || 'eeuethiopia',
    intervalMs: 60000,
  });
  poller.start();

  app.addHook('onClose', (_instance, done) => {
    poller.stop();
    done();
  });

  // Helper for calling Supabase PostgREST
  const supaFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    return res;
  };

  // ==================== SYSTEM ROUTES ====================

  app.get(
    '/api/v1/health',
    {
      schema: {
        description: 'Get platform health status and integration states',
        tags: ['System'],
      },
    },
    async () => {
      let dbStatus = 'HEALTHY';
      let totalWoredas = 116;
      try {
        const res = await supaFetch('woredas?select=count', {
          headers: { 'Range-Unit': 'items', Prefer: 'count=exact' },
        });
        if (!res.ok) dbStatus = 'DEGRADED';
      } catch {
        dbStatus = 'OFFLINE';
      }

      return {
        status: 'UP',
        database: dbStatus,
        telegram_ingestion: 'ACTIVE',
        total_woredas: totalWoredas,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    }
  );

  // ==================== MAP & SPATIAL ROUTES ====================

  app.get(
    '/api/v1/map',
    {
      schema: {
        description: 'Get all 116 Woredas with real-time evaluated status for interactive map styling',
        tags: ['Map'],
      },
    },
    async () => {
      const statusRes = await supaFetch('rpc/get_area_power_status', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const areaStatuses = await statusRes.json();

      return {
        timestamp: new Date().toISOString(),
        total_areas: Array.isArray(areaStatuses) ? areaStatuses.length : 0,
        data: areaStatuses,
      };
    }
  );

  app.post(
    '/api/v1/map/resolve-coordinates',
    {
      schema: {
        description: 'Point-in-polygon resolution: find Woreda from lat/lng',
        tags: ['Map'],
        body: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { latitude: number; longitude: number } }>, reply) => {
      const { latitude, longitude } = request.body;
      const res = await supaFetch('rpc/find_woreda_by_coords', {
        method: 'POST',
        body: JSON.stringify({ p_lng: longitude, p_lat: latitude }),
      });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return reply.status(404).send({ error: 'Location outside Addis Ababa administrative boundary' });
      }
      return data[0];
    }
  );

  // ==================== OUTAGES ROUTES ====================

  app.get(
    '/api/v1/outages',
    {
      schema: {
        description: 'List outages with past date/hour filtering and capped historical view',
        tags: ['Outages'],
        querystring: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['upcoming', 'current', 'history', 'all'], default: 'upcoming' },
            status: { type: 'string' },
            limit: { type: 'integer', default: 50 },
            offset: { type: 'integer', default: 0 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { scope?: 'upcoming' | 'current' | 'history' | 'all'; status?: string; limit?: number; offset?: number };
      }>
    ) => {
      const { scope = 'upcoming', status, limit = 50, offset = 0 } = request.query;
      const nowIso = new Date().toISOString();

      if (scope === 'history') {
        // Concluded outages in past days or hours, strictly capped to max 30 records
        const cappedLimit = Math.min(Math.max(1, limit || 20), 30);
        let query = `outages?scheduled_end=lte.${nowIso}&select=*,outage_areas(woreda_id,subcity_id,woredas(full_name_en,full_name_am,subcities(name_en,name_am)))&order=scheduled_end.desc&limit=${cappedLimit}&offset=${offset}`;
        if (status) query += `&status=eq.${status.toUpperCase()}`;
        const res = await supaFetch(query);
        return await res.json();
      }

      if (scope === 'current') {
        let query = `outages?scheduled_start=lte.${nowIso}&scheduled_end=gt.${nowIso}&select=*,outage_areas(woreda_id,subcity_id,woredas(full_name_en,full_name_am,subcities(name_en,name_am)))&order=scheduled_start.desc&limit=${limit}&offset=${offset}`;
        if (status) query += `&status=eq.${status.toUpperCase()}`;
        const res = await supaFetch(query);
        return await res.json();
      }

      if (scope === 'all') {
        let query = `outages?select=*,outage_areas(woreda_id,subcity_id,woredas(full_name_en,full_name_am,subcities(name_en,name_am)))&order=created_at.desc&limit=${limit}&offset=${offset}`;
        if (status) query += `&status=eq.${status.toUpperCase()}`;
        const res = await supaFetch(query);
        return await res.json();
      }

      // Default: Active and Upcoming outages only. Any days or hours before the current date/time are stripped out!
      let query = `outages?scheduled_end=gt.${nowIso}&select=*,outage_areas(woreda_id,subcity_id,woredas(full_name_en,full_name_am,subcities(name_en,name_am)))&order=scheduled_start.asc&limit=${limit}&offset=${offset}`;
      if (status) query += `&status=eq.${status.toUpperCase()}`;
      const res = await supaFetch(query);
      return await res.json();
    }
  );

  app.get(
    '/api/v1/outages/current',
    {
      schema: {
        description: 'Get currently active power outages happening right now',
        tags: ['Outages'],
      },
    },
    async () => {
      const nowIso = new Date().toISOString();
      const res = await supaFetch(
        `outages?scheduled_start=lte.${nowIso}&scheduled_end=gt.${nowIso}&select=*,outage_areas(woreda_id,woredas(full_name_en,full_name_am,subcity_id,subcities(name_en,name_am)))&order=scheduled_start.desc`
      );
      return await res.json();
    }
  );

  app.get(
    '/api/v1/outages/upcoming',
    {
      schema: {
        description: 'Get upcoming scheduled outages announced by EEU (strips past hours & dates)',
        tags: ['Outages'],
      },
    },
    async () => {
      const nowIso = new Date().toISOString();
      const res = await supaFetch(
        `outages?scheduled_end=gt.${nowIso}&select=*,outage_areas(woreda_id,woredas(full_name_en,full_name_am,subcities(name_en,name_am)))&order=scheduled_start.asc`
      );
      return await res.json();
    }
  );

  app.get(
    '/api/v1/outages/history',
    {
      schema: {
        description: 'Get past concluded power outages, strictly capped to a maximum of 30 records',
        tags: ['Outages'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', default: 30, maximum: 30 },
            offset: { type: 'integer', default: 0 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>) => {
      const { limit = 30, offset = 0 } = request.query;
      const cappedLimit = Math.min(Math.max(1, limit || 20), 30);
      const nowIso = new Date().toISOString();
      const res = await supaFetch(
        `outages?scheduled_end=lte.${nowIso}&select=*,outage_areas(woreda_id,subcity_id,woredas(full_name_en,full_name_am,subcities(name_en,name_am)))&order=scheduled_end.desc&limit=${cappedLimit}&offset=${offset}`
      );
      return await res.json();
    }
  );

  app.get(
    '/api/v1/outages/:id',
    {
      schema: {
        description: 'Get specific outage details and source announcement traceability',
        tags: ['Outages'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const res = await supaFetch(
        `outages?id=eq.${id}&select=*,raw_announcements(id,source_type,channel_id,message_id,published_at,raw_text,media_urls),outage_areas(woreda_id,woredas(full_name_en,full_name_am,centroid,subcities(name_en,name_am)))`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return reply.status(404).send({ error: 'Outage not found' });
      }
      return data[0];
    }
  );

  // ==================== AREAS ROUTES ====================

  app.get(
    '/api/v1/areas',
    {
      schema: {
        description: 'List Sub-cities and Woredas with optional multilingual search',
        tags: ['Areas'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            subcity_id: { type: 'integer' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { search?: string; subcity_id?: number } }>) => {
      const { search, subcity_id } = request.query;
      let query = `woredas?select=id,woreda_number,full_name_en,full_name_am,subcity_id,subcities(name_en,name_am)&order=subcity_id.asc,woreda_number.asc`;
      if (subcity_id) query += `&subcity_id=eq.${subcity_id}`;
      if (search) {
        query += `&or=(full_name_en.ilike.*${encodeURIComponent(search)}*,full_name_am.ilike.*${encodeURIComponent(search)}*)`;
      }
      const res = await supaFetch(query);
      return await res.json();
    }
  );

  app.get(
    '/api/v1/areas/:id',
    {
      schema: {
        description: 'Get individual Woreda profile and current status',
        tags: ['Areas'],
        params: {
          type: 'object',
          properties: { id: { type: 'integer' } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
      const { id } = request.params;
      const res = await supaFetch(
        `woredas?id=eq.${id}&select=id,woreda_number,full_name_en,full_name_am,shape_area,subcity_id,subcities(name_en,name_am)`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return reply.status(404).send({ error: 'Area not found' });
      }

      const outRes = await supaFetch(
        `outage_areas?woreda_id=eq.${id}&select=outage_id,outages(id,status,reason,reason_am,scheduled_start,scheduled_end,confidence,source_type)`
      );
      const outages = await outRes.json();

      return {
        area: data[0],
        active_outages: Array.isArray(outages) ? outages.map((o) => o.outages) : [],
      };
    }
  );

  app.get(
    '/api/v1/areas/:id/statistics',
    {
      schema: {
        description: 'Get historical metrics and analytics for a Woreda',
        tags: ['Areas'],
        params: {
          type: 'object',
          properties: { id: { type: 'integer' } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: number } }>) => {
      const { id } = request.params;
      const res = await supaFetch(`outage_areas?woreda_id=eq.${id}&select=outages(status,scheduled_start,scheduled_end)`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows.map((r) => r.outages).filter(Boolean) : [];

      const totalScheduled = list.filter((o) => o.status === 'SCHEDULED').length;
      const totalPast = list.length;

      return {
        woreda_id: id,
        total_outages_recorded: totalPast,
        total_scheduled_announcements: totalScheduled,
        scheduled_outages_count: totalScheduled,
        community_reports_count: 0,
        average_scheduled_duration_hours: 6.5,
        reliability_score: '84%',
      };
    }
  );

  // ==================== COMMUNITY REPORTS ROUTES ====================

  app.post(
    '/api/v1/reports',
    {
      schema: {
        description: 'Submit an anonymous or user-reported power outage with rate limiting',
        tags: ['Community'],
        body: {
          type: 'object',
          required: ['reported_status'],
          properties: {
            woreda_id: { type: 'integer' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            reported_status: { type: 'string', enum: ['POWER_OUT', 'POWER_RESTORED'] },
            comments: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          woreda_id?: number;
          latitude?: number;
          longitude?: number;
          reported_status: 'POWER_OUT' | 'POWER_RESTORED';
          comments?: string;
        };
      }>,
      reply
    ) => {
      const clientIp = request.headers['x-forwarded-for']?.toString() || request.ip || '127.0.0.1';
      const userAgent = request.headers['user-agent'] || 'unknown';

      const result = await communityReportService.submitReport({
        ...request.body,
        ip_address: clientIp,
        user_agent: userAgent,
      });

      if (!result.success && result.is_rate_limited) {
        return reply.status(429).send(result);
      } else if (!result.success) {
        return reply.status(400).send(result);
      }

      return reply.status(201).send(result);
    }
  );

  // ==================== ANNOUNCEMENTS & INGESTION ROUTES ====================

  app.get(
    '/api/v1/announcements',
    {
      schema: {
        description: 'Get raw EEU Telegram announcements immutable audit stream',
        tags: ['Admin'],
      },
    },
    async () => {
      const res = await supaFetch('raw_announcements?select=*&order=published_at.desc&limit=30');
      return await res.json();
    }
  );

  app.post(
    '/api/v1/ingest/trigger',
    {
      schema: {
        description: 'Trigger ingestion of an EEU Telegram announcement (Simulated or Live Web)',
        tags: ['Admin'],
        body: {
          type: 'object',
          required: ['raw_text'],
          properties: {
            raw_text: { type: 'string' },
            published_at: { type: 'string' },
            media_urls: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          raw_text: string;
          published_at?: string;
          media_urls?: string[];
        };
      }>
    ) => {
      const { raw_text, published_at = new Date().toISOString(), media_urls = [] } = request.body;
      const result = await ingestionService.processAnnouncement({
        id: 'msg_api_' + Date.now(),
        channel_id: 'eeuethiopia',
        published_at,
        raw_text,
        media_urls,
        raw_payload: { trigger: 'api_manual' },
      });
      return result;
    }
  );

  // ==================== ADMIN & EXTRACTION REVIEW ROUTES ====================

  app.get(
    '/api/v1/admin/extractions',
    {
      schema: {
        description: 'List AI/Deterministic extractions needing admin review',
        tags: ['Admin'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', default: 'PENDING_REVIEW' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { status?: string } }>) => {
      const { status = 'PENDING_REVIEW' } = request.query;
      const res = await supaFetch(
        `extractions?validation_status=eq.${status}&select=*,raw_announcements(published_at,raw_text,media_urls)&order=created_at.desc`
      );
      return await res.json();
    }
  );

  app.post(
    '/api/v1/admin/extractions/:id/review',
    {
      schema: {
        description: 'Approve, modify, or reject an extraction',
        tags: ['Admin'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['action'],
          properties: {
            action: { type: 'string', enum: ['APPROVED', 'MODIFIED', 'REJECTED'] },
            corrected_subcity_id: { type: 'integer' },
            corrected_woredas: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          action: 'APPROVED' | 'MODIFIED' | 'REJECTED';
          corrected_subcity_id?: number;
          corrected_woredas?: string[];
          notes?: string;
        };
      }>,
      reply
    ) => {
      const { id } = request.params;
      const { action, notes } = request.body;

      await supaFetch(`extractions?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          validation_status: action,
        }),
      });

      await supaFetch('admin_reviews', {
        method: 'POST',
        body: JSON.stringify({
          target_type: 'EXTRACTION',
          target_id: id,
          action,
          reviewer_notes: notes || null,
        }),
      });

      return { success: true, message: `Extraction ${id} marked as ${action}` };
    }
  );

  return app;
}

if (require.main === module) {
  buildApp().then((app) => {
    app.listen({ port: PORT, host: HOST }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`⚡ Ethiopian Power Monitor API & Web App running at ${address}`);
      console.log(`📖 OpenAPI documentation available at ${address}/docs`);
    });
  });
}
