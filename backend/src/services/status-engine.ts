/**
 * Ethiopian Power Monitor — Outage Status Engine
 * Multi-signal deterministic state machine reconciling EEU announcements,
 * community reports, and time boundaries.
 *
 * Core Principle: "Unknown is better than wrong." Never invent certainty.
 */

export type OutageStatus =
  | 'NORMAL'
  | 'SCHEDULED'
  | 'CURRENT'
  | 'CONFIRMED'
  | 'LIKELY'
  | 'REPORTED'
  | 'RESTORED'
  | 'UNKNOWN';

export type ConfidenceLevel = 'OFFICIAL' | 'CONFIRMED' | 'LIKELY' | 'COMMUNITY' | 'LOW' | 'NONE';

export interface AreaStatusResult {
  woreda_id: number;
  woreda_number: string;
  subcity_id: number;
  subcity_en: string;
  subcity_am: string;
  full_name_en: string;
  full_name_am: string;
  status: OutageStatus;
  confidence: ConfidenceLevel;
  source_attribution: string;
  source_attribution_am: string;
  scheduled_start?: string;
  scheduled_end?: string;
  reason_en?: string;
  reason_am?: string;
  recent_reports_out: number;
  recent_reports_restored: number;
  explanation: string;
  explanation_am: string;
}

export interface WoredaInputSignals {
  woreda_id: number;
  woreda_number: string;
  subcity_id: number;
  subcity_en: string;
  subcity_am: string;
  full_name_en: string;
  full_name_am: string;
  official_outage?: {
    outage_id: string;
    scheduled_start: string;
    scheduled_end: string;
    reason_en?: string;
    reason_am?: string;
    source_type: string;
  };
  reports_last_hour_out: number;
  reports_last_hour_restored: number;
}

export class OutageStatusEngine {
  /**
   * Evaluates the canonical status of a Woreda given official & community signals
   */
  public static evaluateWoreda(signals: WoredaInputSignals, now: Date = new Date()): AreaStatusResult {
    const {
      woreda_id,
      woreda_number,
      subcity_id,
      subcity_en,
      subcity_am,
      full_name_en,
      full_name_am,
      official_outage,
      reports_last_hour_out,
      reports_last_hour_restored,
    } = signals;

    const baseResult: AreaStatusResult = {
      woreda_id,
      woreda_number,
      subcity_id,
      subcity_en,
      subcity_am,
      full_name_en,
      full_name_am,
      status: 'NORMAL',
      confidence: 'NONE',
      source_attribution: 'No active reports or announcements',
      source_attribution_am: 'ምንም ንቁ ሪፖርት ወይም ማስታወቂያ የለም',
      recent_reports_out: reports_last_hour_out,
      recent_reports_restored: reports_last_hour_restored,
      explanation: 'Power is operating normally based on current data.',
      explanation_am: 'ባለው መረጃ መሠረት የኃይል አቅርቦት በመደበኛ ሁኔታ ላይ ነው።',
    };

    // Case 1: Official EEU Scheduled Outage Exists
    if (official_outage) {
      const startTime = new Date(official_outage.scheduled_start);
      const endTime = new Date(official_outage.scheduled_end);
      baseResult.scheduled_start = official_outage.scheduled_start;
      baseResult.scheduled_end = official_outage.scheduled_end;
      baseResult.reason_en = official_outage.reason_en;
      baseResult.reason_am = official_outage.reason_am;

      // 1A: Outage is scheduled for the future
      if (now < startTime) {
        baseResult.status = 'SCHEDULED';
        baseResult.confidence = 'OFFICIAL';
        baseResult.source_attribution = 'EEU Official Announcement';
        baseResult.source_attribution_am = 'የኢትዮጵያ ኤሌክትሪክ አገልግሎት ይፋዊ ማስታወቂያ';
        baseResult.explanation = `Scheduled maintenance outage announced by EEU from ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}.`;
        baseResult.explanation_am = `በኢትዮጵያ ኤሌክትሪክ አገልግሎት ይፋ የተደረገ የታቀደ የጥገና ሥራ ከ${startTime.toLocaleTimeString()} እስከ ${endTime.toLocaleTimeString()}።`;
        return baseResult;
      }

      // 1B: Currently within official outage window
      if (now >= startTime && now <= endTime) {
        if (reports_last_hour_out >= 3) {
          baseResult.status = 'CONFIRMED';
          baseResult.confidence = 'CONFIRMED';
          baseResult.source_attribution = `Official EEU Announcement + ${reports_last_hour_out} Community Reports`;
          baseResult.source_attribution_am = `የኢትዮጵያ ኤሌክትሪክ አገልግሎት ማስታወቂያ + ${reports_last_hour_out} የማህበረሰብ ሪፖርቶች`;
          baseResult.explanation = 'Official scheduled outage currently active and confirmed by local residents.';
          baseResult.explanation_am = 'በይፋ የታቀደው የኃይል መቋረጥ ተግባራዊ መሆኑ በአካባቢው ነዋሪዎች ተረጋግጧል።';
        } else {
          baseResult.status = 'CURRENT';
          baseResult.confidence = 'OFFICIAL';
          baseResult.source_attribution = 'EEU Official Announcement';
          baseResult.source_attribution_am = 'የኢትዮጵያ ኤሌክትሪክ አገልግሎት ይፋዊ ማስታወቂያ';
          baseResult.explanation = 'Official scheduled outage currently in progress.';
          baseResult.explanation_am = 'በይፋ የታቀደው የኃይል መቋረጥ በአሁኑ ሰዓት እየተከናወነ ነው።';
        }
        return baseResult;
      }

      // 1C: Scheduled end time has passed
      if (now > endTime) {
        const minutesPastEnd = (now.getTime() - endTime.getTime()) / (1000 * 60);

        // Strong restoration signals
        if (reports_last_hour_restored >= 2 && reports_last_hour_out === 0) {
          baseResult.status = 'RESTORED';
          baseResult.confidence = 'COMMUNITY';
          baseResult.source_attribution = 'Community Restoration Confirmation';
          baseResult.source_attribution_am = 'የማህበረሰብ የኃይል መመለስ ማረጋገጫ';
          baseResult.explanation = 'Power has reportedly returned following the scheduled outage.';
          baseResult.explanation_am = 'ከታቀደው መቋረጥ በኋላ የኤሌክትሪክ ኃይል መመለሱ በማህበረሰብ ሪፖርት ተገልጿል።';
          return baseResult;
        }

        // Within 1 hour past end with no reports: uncertain
        if (minutesPastEnd <= 60 && reports_last_hour_out > 0) {
          baseResult.status = 'CURRENT';
          baseResult.confidence = 'LIKELY';
          baseResult.source_attribution = 'Community Reports (Overdue Restoration)';
          baseResult.source_attribution_am = 'የማህበረሰብ ሪፖርቶች (የዘገየ መመለስ)';
          baseResult.explanation = 'Scheduled maintenance time has passed, but residents continue to report outages.';
          baseResult.explanation_am = 'የተያዘው የጥገና ጊዜ ቢያበቃም ነዋሪዎች ኃይል እንዳልተመለሰ ሪፖርት እያደረጉ ነው።';
          return baseResult;
        }

        if (minutesPastEnd > 60 && reports_last_hour_out === 0 && reports_last_hour_restored === 0) {
          baseResult.status = 'UNKNOWN';
          baseResult.confidence = 'LOW';
          baseResult.source_attribution = 'Inconclusive signals';
          baseResult.source_attribution_am = 'ያልተረጋገጠ መረጃ';
          baseResult.explanation = 'Scheduled window has ended, but restoration has not been independently verified.';
          baseResult.explanation_am = 'የጥገናው ጊዜ ተጠናቋል፣ ነገር ግን ኃይል መመለሱ በገለልተኛ አካል አልተረጋገጠም።';
          return baseResult;
        }
      }
    }

    // Case 2: Unannounced Outages based on Community Reports
    if (reports_last_hour_out >= 5) {
      baseResult.status = 'LIKELY';
      baseResult.confidence = 'LIKELY';
      baseResult.source_attribution = `${reports_last_hour_out} Community Reports (Last hour)`;
      baseResult.source_attribution_am = `${reports_last_hour_out} የማህበረሰብ ሪፖርቶች (ባለፈው 1 ሰዓት)`;
      baseResult.explanation = 'Multiple independent community reports indicate an unannounced power outage.';
      baseResult.explanation_am = 'በርካታ ነዋሪዎች ያልታሰበ የኃይል መቋረጥ ማጋጠሙን ሪፖርት አድርገዋል።';
      return baseResult;
    }

    if (reports_last_hour_out >= 1) {
      baseResult.status = 'REPORTED';
      baseResult.confidence = 'COMMUNITY';
      baseResult.source_attribution = `${reports_last_hour_out} Community Report(s)`;
      baseResult.source_attribution_am = `${reports_last_hour_out} የማህበረሰብ ሪፖርት`;
      baseResult.explanation = 'Individual outage reports received. Awaiting additional corroboration.';
      baseResult.explanation_am = 'የኃይል መቋረጥ ሪፖርት ደርሷል። ተጨማሪ ማረጋገጫ በመጠባበቅ ላይ ነው።';
      return baseResult;
    }

    // Default: NORMAL
    return baseResult;
  }
}
