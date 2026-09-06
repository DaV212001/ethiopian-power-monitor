/**
 * Ethiopian Calendar Utility & Exact Astronomical Converter
 * Bidirectional conversion between Gregorian and Ge'ez/Ethiopian Calendar.
 * Supports Amharic fidel and English transliteration, month names, and text parsing.
 */

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthNameAm: string;
  monthNameEn: string;
  formattedAm: string;
  formattedEn: string;
}

export const ETHIOPIAN_MONTHS = [
  { index: 1, am: 'መስከረም', en: 'Meskerem' },
  { index: 2, am: 'ጥቅምት', en: 'Tikimt' },
  { index: 3, am: 'ኅዳር', en: 'Hidar' },
  { index: 4, am: 'ታኅሣሥ', en: 'Tahsas' },
  { index: 5, am: 'ጥር', en: 'Tir' },
  { index: 6, am: 'የካቲት', en: 'Yekatit' },
  { index: 7, am: 'መጋቢት', en: 'Megabit' },
  { index: 8, am: 'ሚያዝያ', en: 'Miazia' },
  { index: 9, am: 'ግንቦት', en: 'Ginbot' },
  { index: 10, am: 'ሰኔ', en: 'Sene' },
  { index: 11, am: 'ሐምሌ', en: 'Hamle' },
  { index: 12, am: 'ነሐሴ', en: 'Nehase' },
  { index: 13, am: 'ጳጉሜ', en: 'Pagume' },
];

/**
 * Gregorian Y/M/D to Julian Day Number
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/**
 * JDN to Ethiopian Y/M/D
 */
export function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  const ERA = 1723856;
  const r = (jdn - ERA) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - ERA) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

/**
 * Ethiopian Y/M/D to JDN
 */
export function ethiopianToJDN(year: number, month: number, day: number): number {
  const ERA = 1723856;
  return ERA + 365 * year + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

/**
 * JDN to Gregorian Y/M/D
 */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const day = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const month = j + 2 - 12 * l4;
  const year = 100 * (n - 49) + i + l4;
  return { year, month, day };
}

/**
 * Convert standard JS Date to Ethiopian Date object
 */
export function gregorianToEthiopian(date: Date): EthiopianDate {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const jdn = gregorianToJDN(y, m, d);
  const eth = jdnToEthiopian(jdn);
  const mInfo = ETHIOPIAN_MONTHS.find((item) => item.index === eth.month) || {
    index: eth.month,
    am: 'ጳጉሜ',
    en: 'Pagume',
  };

  return {
    year: eth.year,
    month: eth.month,
    day: eth.day,
    monthNameAm: mInfo.am,
    monthNameEn: mInfo.en,
    formattedAm: `${mInfo.am} ${eth.day} ቀን ${eth.year} ዓ.ም`,
    formattedEn: `${mInfo.en} ${eth.day}, ${eth.year} E.C.`,
  };
}

/**
 * Convert Ethiopian Date numbers to JS Gregorian Date (UTC midnight)
 */
export function ethiopianToGregorian(year: number, month: number, day: number): Date {
  const jdn = ethiopianToJDN(year, month, day);
  const greg = jdnToGregorian(jdn);
  return new Date(Date.UTC(greg.year, greg.month - 1, greg.day));
}

/**
 * Extracts and normalizes Ethiopian calendar date from announcement text.
 * Handles patterns like:
 * - "ነገ ጳጉሜ 1 ቀን 2018 ዓ.ም"
 * - "ጳጉሜ 2 ቀን 2018"
 * - "ነገ ከጠዋቱ 2:00..." (infers tomorrow from reference date)
 */
export function parseEthiopianDateFromText(
  text: string,
  referenceDate: Date = new Date()
): {
  matchedRaw: string | null;
  ethiopian: EthiopianDate;
  gregorianDate: Date;
  formattedAm: string;
  formattedEn: string;
} {
  const refJdn = gregorianToJDN(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth() + 1,
    referenceDate.getUTCDate()
  );
  const curEth = jdnToEthiopian(refJdn);

  const ethDateRegex = /(?:ነገ\s*)?(መስከረም|ጥቅምት|ኅዳር|ታኅሣሥ|ጥር|የካቲት|መጋቢት|ሚያዝያ|ግንቦት|ሰኔ|ሐምሌ|ነሐሴ|ጳጉሜ)\s*(\d{1,2})\s*(?:ቀን)?\s*(?:(\d{4})\s*(?:ዓ\.?ም)?)?/i;
  const match = text.match(ethDateRegex);

  if (match) {
    const monthName = match[1];
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : curEth.year;
    const mInfo = ETHIOPIAN_MONTHS.find((m) => m.am === monthName) || {
      index: 13,
      am: monthName,
      en: 'Pagume',
    };

    const greg = ethiopianToGregorian(year, mInfo.index, day);
    const formattedAm = `${mInfo.am} ${day} ቀን ${year} ዓ.ም`;
    const formattedEn = `${mInfo.en} ${day}, ${year} E.C.`;

    return {
      matchedRaw: match[0].trim(),
      ethiopian: {
        year,
        month: mInfo.index,
        day,
        monthNameAm: mInfo.am,
        monthNameEn: mInfo.en,
        formattedAm,
        formattedEn,
      },
      gregorianDate: greg,
      formattedAm,
      formattedEn,
    };
  }

  // Fallback: Check relative terms ("ነገ", "tomorrow", "ዛሬ", "today")
  const targetGreg = new Date(referenceDate);
  if (/ነገ|tomorrow/i.test(text)) {
    targetGreg.setUTCDate(targetGreg.getUTCDate() + 1);
  }

  const eth = gregorianToEthiopian(targetGreg);
  return {
    matchedRaw: null,
    ethiopian: eth,
    gregorianDate: targetGreg,
    formattedAm: eth.formattedAm,
    formattedEn: eth.formattedEn,
  };
}
