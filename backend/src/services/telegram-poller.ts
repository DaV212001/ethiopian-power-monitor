/**
 * Ethiopian Power Monitor — Continuous Live Telegram Channel Poller
 * Periodically polls the public feed at https://t.me/s/eeuethiopia,
 * parses messages, and passes them to TelegramIngestionService.
 */

import { TelegramIngestionService, TelegramRawMessage } from './telegram-ingestion';

export class TelegramPoller {
  private ingestionService: TelegramIngestionService;
  private channels: string[];
  private intervalMs: number;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: {
    ingestionService: TelegramIngestionService;
    channelUsername?: string;
    channels?: string[];
    intervalMs?: number;
  }) {
    this.ingestionService = config.ingestionService;
    if (config.channels && config.channels.length > 0) {
      this.channels = config.channels.map((c) => c.replace(/^@/, '').trim()).filter(Boolean);
    } else if (config.channelUsername) {
      this.channels = [config.channelUsername.replace(/^@/, '').trim()];
    } else if (process.env.TELEGRAM_CHANNELS) {
      this.channels = process.env.TELEGRAM_CHANNELS.split(',').map((c) => c.replace(/^@/, '').trim()).filter(Boolean);
    } else {
      this.channels = [(process.env.TELEGRAM_CHANNEL || 'eeuethiopia').replace(/^@/, '').trim()];
    }
    this.intervalMs = config.intervalMs || 60000; // default 1 minute
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[TelegramPoller] Started polling channels [${this.channels.map((c) => '@' + c).join(', ')}] every ${this.intervalMs / 1000}s`);

    // Run first check immediately
    this.pollAllChannels().catch((err) => console.error('[TelegramPoller] Initial poll error:', err));

    this.timer = setInterval(() => {
      this.pollAllChannels().catch((err) => console.error('[TelegramPoller] Poll error:', err));
    }, this.intervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[TelegramPoller] Polling stopped.');
  }

  public async pollAllChannels(): Promise<number> {
    let total = 0;
    for (const channel of this.channels) {
      total += await this.pollChannel(channel);
    }
    return total;
  }

  public async pollChannel(channelUsername: string = this.channels[0]): Promise<number> {
    const url = `https://t.me/s/${channelUsername}`;
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!resp.ok) {
        console.warn(`[TelegramPoller] Received HTTP ${resp.status} from ${url}`);
        return 0;
      }

      const html = await resp.text();
      const messages = this.parseHtmlMessages(html, channelUsername);
      let newCount = 0;

      for (const msg of messages) {
        const result = await this.ingestionService.processAnnouncement(msg);
        if (result.status === 'PROCESSED_AUTOMATIC') {
          console.log(`[TelegramPoller] Auto-processed new outage: ${msg.id} (Outage ID: ${result.outage_id})`);
          newCount++;
        } else if (result.status === 'QUEUED_FOR_REVIEW') {
          console.log(`[TelegramPoller] Queued post for admin review: ${msg.id}`);
          newCount++;
        }
      }

      return newCount;
    } catch (err: any) {
      console.error(`[TelegramPoller] Failed to fetch channel @${channelUsername}: ${err.message}`);
      return 0;
    }
  }

  /**
   * Extracts messages from Telegram's web preview HTML with strict per-message wrap isolation.
   * Guarantees that photo-only messages without text do not bleed their post IDs onto subsequent text messages.
   */
  private parseHtmlMessages(html: string, channelUsername: string = this.channels[0]): TelegramRawMessage[] {
    const messages: TelegramRawMessage[] = [];
    const rawWraps = html.split('<div class="tgme_widget_message_wrap');

    for (let i = 1; i < rawWraps.length; i++) {
      const wrap = rawWraps[i];

      // Match post ID strictly within this message wrap
      const postMatch = wrap.match(/data-post="([^"]+)"/);
      if (!postMatch) continue;
      const rawPostId = postMatch[1]; // e.g. "eeuethiopia/12953"

      // Match text strictly within this message wrap
      const textMatch = wrap.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const rawHtmlText = textMatch ? textMatch[1] : '';

      // Match datetime strictly within this message wrap
      const timeMatch = wrap.match(/<time datetime="([^"]+)"/);
      const publishedAt = timeMatch ? timeMatch[1] : new Date().toISOString();

      // Check for attached media image URLs (both background-image and img tags)
      const mediaUrls: string[] = [];
      const photoMatch = wrap.match(/background-image:\s*url\('([^']+)'\)/i);
      if (photoMatch && !photoMatch[1].includes('emoji')) {
        mediaUrls.push(photoMatch[1]);
      }
      const imgMatches = wrap.matchAll(/<img[^>]+src="([^">]+)"/gi);
      for (const m of imgMatches) {
        if (!m[1].includes('emoji') && !m[1].includes('avatar') && !mediaUrls.includes(m[1])) {
          mediaUrls.push(m[1]);
        }
      }

      // Strip HTML tags and entities
      const cleanText = rawHtmlText
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/gi, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      const postId = rawPostId.split('/')[1] || rawPostId;

      // Keep if message has substantive text OR contains an attached flyer/media
      if (cleanText.length > 20 || mediaUrls.length > 0) {
        messages.push({
          id: postId,
          channel_id: channelUsername,
          published_at: publishedAt,
          raw_text: cleanText || '[Official Schedule Flyer Graphic]',
          caption: cleanText || undefined,
          media_urls: mediaUrls,
          raw_payload: {
            rawPostId,
            source: 'web_preview',
            direct_url: `https://t.me/${rawPostId}`,
            has_media: mediaUrls.length > 0,
          },
        });
      }
    }

    return messages;
  }
}
