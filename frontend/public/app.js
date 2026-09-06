/**
 * Ethiopian Power Monitor — Frontend Core Application
 * Interactive Leaflet PostGIS Map, Multilingual i18n (EN/AM), Search,
 * Community Reporting with GPS Point-in-Polygon, Calendar, and Admin Review.
 */

// Multilingual Dictionary
const I18N = {
  en: {
    brand_title: 'Ethiopian Power Monitor',
    brand_sub: 'Addis Ababa Electricity Intelligence Platform',
    nav_map: 'Live Map',
    nav_outages: 'Outages',
    nav_calendar: 'Calendar',
    nav_areas: 'Areas',
    nav_admin: 'Admin Review',
    btn_report: 'Report Outage',
    search_placeholder: 'Search sub-city, woreda, or neighborhood (e.g. Bole, ካዛንቺስ, Woreda 03)...',
    stat_current: 'Current Outages',
    stat_scheduled: 'Scheduled Today',
    stat_reports: 'Reports Today',
    stat_monitored: 'Monitored Woredas',
    legend_normal: 'Normal',
    legend_scheduled: 'Scheduled Outage',
    legend_current: 'Current Outage',
    legend_likely: 'Likely Outage',
    legend_unknown: 'Unknown',
    tab_active: 'Active Now',
    tab_upcoming: 'Upcoming Scheduled',
    tab_reports: 'Community Reports',
    no_active_outages: 'No current outages reported in Addis Ababa.',
    no_upcoming_outages: 'No upcoming scheduled outages found.',
    source_official: 'Official EEU Announcement',
    source_community: 'Community Reports',
    confidence_official: 'Official',
    confidence_confirmed: 'Confirmed',
    confidence_likely: 'Likely',
    btn_locate_me: 'Detect My Location',
    report_modal_title: 'Report Electricity Outage',
    report_modal_desc: 'Your report helps neighbors know if power is out. Coordinates are private and aggregated into Woreda data.',
    report_type_out: 'Power is OUT',
    report_type_restored: 'Power has RETURNED',
    report_comments_placeholder: 'Optional notes (e.g. Transformer sparked, street lights out)...',
    btn_submit_report: 'Submit Report',
    btn_cancel: 'Cancel',
    admin_title: 'EEU Announcement & Extraction Audit',
    admin_desc: 'Review and verify incoming announcements before canonical outage generation.',
    btn_approve: 'Approve',
    btn_reject: 'Reject',
    status_label: 'Status',
    subcity_label: 'Sub-city',
    woreda_label: 'Woreda',
    time_label: 'Time Window',
    date_label: 'Scheduled Date',
    reason_label: 'Reason',
    confidence_label: 'Confidence',
    source_label: 'Source Attribution',
    tab_upcoming_active: 'Active & Upcoming',
    tab_history: 'History (Capped to 30)',
    history_capped_notice: 'Showing the 30 most recent concluded outages. Older records are archived.',
    calendar_show_history: 'Show Past Outage History (Capped to 30)',
    calendar_hide_history: 'Hide Past Outage History',
    status_concluded: 'Concluded',
    no_history_outages: 'No concluded historical outages recorded.',
    quoted_telegram_title: 'Quoted Official Telegram Announcement',
    quoted_specific_point: 'Quoted Point in Announcement',
    view_full_announcement: 'View full announcement text',
    copy_keyword_btn: 'Copy Keyword to Search in Telegram',
    copied_btn: 'Copied! Press Ctrl+F in Telegram',
    show_embed: 'Show Embed ▾',
    hide_embed: 'Hide Embed ▴',
  },
  am: {
    brand_title: 'የኢትዮጵያ የኃይል መከታተያ',
    brand_sub: 'የአዲስ አበባ የኤሌክትሪክ ኃይል መረጃ መድረክ',
    nav_map: 'ቀጥታ ካርታ',
    nav_outages: 'መቋረጦች',
    nav_calendar: 'የቀን መቁጠሪያ',
    nav_areas: 'አካባቢዎች',
    nav_admin: 'አስተዳደር',
    btn_report: 'መቋረጥ ሪፖርት አድርግ',
    search_placeholder: 'ክፍለ ከተማ፣ ወረዳ ወይም ሰፈር ይፈልጉ (ለምሳሌ ቦሌ፣ ካዛንቺስ፣ ወረዳ 03)...',
    stat_current: 'የአሁኑ መቋረጦች',
    stat_scheduled: 'የዛሬ የታቀዱ',
    stat_reports: 'የዛሬ ሪፖርቶች',
    stat_monitored: 'የተከታተሉ ወረዳዎች',
    legend_normal: 'መደበኛ',
    legend_scheduled: 'የታቀደ መቋረጥ',
    legend_current: 'የአሁኑ መቋረጥ',
    legend_likely: 'ሊሆን የሚችል መቋረጥ',
    legend_unknown: 'ያልታወቀ',
    tab_active: 'አሁን የጠፉ',
    tab_upcoming: 'ቀጣይ የታቀዱ',
    tab_reports: 'የማህበረሰብ ሪፖርቶች',
    no_active_outages: 'በአሁኑ ሰዓት የተመዘገበ የኃይል መቋረጥ የለም።',
    no_upcoming_outages: 'የታቀደ የኃይል መቋረጥ ማስታወቂያ የለም።',
    source_official: 'የኢትዮጵያ ኤሌክትሪክ አገልግሎት ይፋዊ ማስታወቂያ',
    source_community: 'የማህበረሰብ ሪፖርቶች',
    confidence_official: 'ይፋዊ',
    confidence_confirmed: 'የተረጋገጠ',
    confidence_likely: 'ሊሆን የሚችል',
    btn_locate_me: 'አካባቢዬን ፈልግ',
    report_modal_title: 'የኃይል መቋረጥ ሪፖርት ያድርጉ',
    report_modal_desc: 'የእርስዎ ሪፖርት ጎረቤቶች የኃይል ሁኔታውን እንዲያውቁ ይረዳል። የግል መገኛዎ ሳይገለጽ በወረዳ ደረጃ ይሰበሰባል።',
    report_type_out: 'ኃይል ተቋርጧል',
    report_type_restored: 'ኃይል ተመልሷል',
    report_comments_placeholder: 'ተጨማሪ አስተያየት (ለምሳሌ ትራንስፎርመር ፈንድቷል)...',
    btn_submit_report: 'ሪፖርት ላክ',
    btn_cancel: 'ሰርዝ',
    admin_title: 'የማስታወቂያዎች ኦዲት እና ማረጋገጫ',
    admin_desc: 'ከቴሌግራም የገቡ ማስታወቂያዎችን ይመርምሩ እና ያረጋግጡ።',
    btn_approve: 'አጽድቅ',
    btn_reject: 'ውድቅ አድርግ',
    status_label: 'ሁኔታ',
    subcity_label: 'ክፍለ ከተማ',
    woreda_label: 'ወረዳ',
    time_label: 'የጊዜ ሰሌዳ',
    date_label: 'የታቀደበት ቀን',
    reason_label: 'ምክንያት',
    confidence_label: 'እርግጠኝነት',
    source_label: 'የመረጃ ምንጭ',
    tab_upcoming_active: 'ቀጣይ እና አሁን ያሉ',
    tab_history: 'ያለፉ መቋረጦች (እስከ 30)',
    history_capped_notice: 'በቅርብ የተጠናቀቁ 30 መቋረጦች ብቻ ይታያሉ። የቀደሙት በአግባቡ ተመዝግበው ተቀምጠዋል።',
    calendar_show_history: 'ያለፉ መቋረጦችን አሳይ (እስከ 30)',
    calendar_hide_history: 'ያለፉ መቋረጦችን ደብቅ',
    status_concluded: 'የተጠናቀቀ',
    no_history_outages: 'የተመዘገበ ያለፈ መቋረጥ የለም።',
    quoted_telegram_title: 'የቴሌግራም ይፋዊ ማስታወቂያ ጽሑፍ',
    quoted_specific_point: 'የተጠቀሰው የማስታወቂያው ክፍል',
    view_full_announcement: 'ሙሉውን ማስታወቂያ ጽሑፍ ይመልከቱ',
    copy_keyword_btn: 'በቴሌግራም ለመፈለግ ቃሉን ቅዳ',
    copied_btn: 'ተቀድቷል! በቴሌግራም Ctrl+F ተጭነው ይፈልጉ',
    show_embed: 'ማስታወቂያውን አሳይ ▾',
    hide_embed: 'ማስታወቂያውን ደብቅ ▴',
  },
};

// Application State
let currentLang = 'en';
let mapInstance = null;
let geoJsonLayer = null;
let woredaFeatures = [];
let woredaStatusMap = new Map();
let currentView = 'map'; // 'map', 'outages', 'calendar', 'areas', 'admin'
let allOutages = []; // Active and Upcoming outages (past stripped out)
let historyOutages = []; // Concluded historical outages (strictly capped to 30)
let selectedOutagesScope = 'upcoming'; // 'upcoming' or 'history'
let calendarHistoryVisible = false;
let pendingExtractions = [];
let selectedRegionFilter = 'all';

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  initLanguage();
  initNavigation();
  initRegionFilters();
  initScopeTabs();
  initMap();
  await loadData();
  initSearch();
  initReportModal();
});

function initScopeTabs() {
  document.querySelectorAll('.outages-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.outages-tab-btn').forEach((b) => {
        b.classList.remove('bg-amber-500', 'text-slate-950', 'font-bold');
        b.classList.add('text-slate-400');
      });
      btn.classList.remove('text-slate-400');
      btn.classList.add('bg-amber-500', 'text-slate-950', 'font-bold');
      selectedOutagesScope = btn.getAttribute('data-tab');

      const banner = document.getElementById('historyBanner');
      if (banner) {
        if (selectedOutagesScope === 'history') {
          banner.classList.remove('hidden');
        } else {
          banner.classList.add('hidden');
        }
      }

      renderOutagesList();
    });
  });

  const calHistoryBtn = document.getElementById('toggleCalendarHistoryBtn');
  if (calHistoryBtn) {
    calHistoryBtn.addEventListener('click', () => {
      calendarHistoryVisible = !calendarHistoryVisible;
      const section = document.getElementById('calendarHistorySection');
      const label = document.getElementById('calendarHistoryBtnLabel');
      if (calendarHistoryVisible) {
        if (section) section.classList.remove('hidden');
        if (label) label.textContent = t('calendar_hide_history');
        renderCalendarHistory();
      } else {
        if (section) section.classList.add('hidden');
        if (label) label.textContent = t('calendar_show_history');
      }
    });
  }
}

function initRegionFilters() {
  document.querySelectorAll('.region-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.region-filter-btn').forEach((b) => {
        b.classList.remove('bg-amber-500', 'text-slate-950', 'font-bold');
        b.classList.add('text-slate-400');
      });
      btn.classList.remove('text-slate-400');
      btn.classList.add('bg-amber-500', 'text-slate-950', 'font-bold');
      selectedRegionFilter = btn.getAttribute('data-filter');
      renderOutagesList();
    });
  });
}

function t(key) {
  return I18N[currentLang][key] || key;
}

function initLanguage() {
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'am' : 'en';
      langBtn.textContent = currentLang === 'en' ? 'አማርኛ' : 'English';
      applyTranslations();
      updateMapLabels();
      renderOutagesList();
      renderCalendar();
      renderAreasDirectory();
    });
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (I18N[currentLang][key]) {
      el.textContent = I18N[currentLang][key];
    }
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = t('search_placeholder');
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-view');
      switchView(target);
    });
  });
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view-section').forEach((sec) => sec.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('text-amber-400', 'border-b-2', 'border-amber-400');
    link.classList.add('text-slate-300');
  });

  const activeSec = document.getElementById(`view-${viewName}`);
  if (activeSec) activeSec.classList.remove('hidden');

  const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (activeLink) {
    activeLink.classList.remove('text-slate-300');
    activeLink.classList.add('text-amber-400', 'border-b-2', 'border-amber-400');
  }

  if (viewName === 'map' && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  } else if (viewName === 'outages') {
    renderOutagesList();
  } else if (viewName === 'calendar') {
    renderCalendar();
  } else if (viewName === 'areas') {
    renderAreasDirectory();
  } else if (viewName === 'admin') {
    renderAdminQueue();
  }
}

// Map Initialization
function initMap() {
  mapInstance = L.map('map', {
    zoomControl: true,
    minZoom: 10,
    maxZoom: 17,
  }).setView([9.0105, 38.7612], 11); // Center Addis Ababa

  // Clean, high-contrast dark basemap from Carto
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);
}

// Load GeoJSON and live API status
async function loadData() {
  try {
    // 1. Fetch GeoJSON
    const geoRes = await fetch('/addis_ababa_woredas.json');
    const geoData = await geoRes.json();
    woredaFeatures = geoData.features;

    // 2. Fetch live status from backend PostGIS
    const statusRes = await fetch('/api/v1/map');
    const statusData = await statusRes.json();

    if (Array.isArray(statusData.data)) {
      statusData.data.forEach((s) => {
        woredaStatusMap.set(s.woreda_id, s);
      });
    }

    // 3. Fetch active and upcoming outages (past days & hours stripped out)
    const outRes = await fetch('/api/v1/outages?scope=upcoming');
    allOutages = await outRes.json();

    // 3b. Fetch concluded past outages (strictly capped to 30)
    try {
      const histRes = await fetch('/api/v1/outages/history?limit=30');
      historyOutages = await histRes.json();
    } catch (e) {
      historyOutages = [];
    }

    // Update count badges
    const upBadge = document.getElementById('badgeUpcomingCount');
    if (upBadge) upBadge.textContent = Array.isArray(allOutages) ? allOutages.length : 0;
    const histBadge = document.getElementById('badgeHistoryCount');
    if (histBadge) histBadge.textContent = Array.isArray(historyOutages) ? historyOutages.length : 0;

    // 4. Update Stats
    updateStats();

    // 5. Render GeoJSON on Map
    renderGeoJsonLayer();
  } catch (err) {
    console.error('Failed to load map data:', err);
  }
}

function updateStats() {
  let activeCount = 0;
  let scheduledCount = 0;
  let reportsToday = 0;

  woredaStatusMap.forEach((status) => {
    if (['CURRENT', 'CONFIRMED', 'LIKELY'].includes(status.current_status)) {
      activeCount++;
    }
    if (status.current_status === 'SCHEDULED') {
      scheduledCount++;
    }
    reportsToday += Number(status.recent_reports_count || 0);
  });

  document.getElementById('statCurrent').textContent = activeCount;
  document.getElementById('statScheduled').textContent = scheduledCount;
  document.getElementById('statReports').textContent = reportsToday;
  document.getElementById('statMonitored').textContent = woredaFeatures.length;
}

// Style for each Woreda polygon
function getFeatureStyle(feature) {
  const woredaId = feature.properties.woreda_id;
  const statusInfo = woredaStatusMap.get(woredaId);
  const status = statusInfo ? statusInfo.current_status : 'NORMAL';

  switch (status) {
    case 'CURRENT':
    case 'CONFIRMED':
      return {
        fillColor: '#ef4444', // Red
        weight: 1.5,
        opacity: 0.9,
        color: '#dc2626',
        fillOpacity: 0.75,
      };
    case 'SCHEDULED':
      return {
        fillColor: '#f59e0b', // Amber
        weight: 1.5,
        opacity: 0.9,
        color: '#d97706',
        fillOpacity: 0.65,
      };
    case 'LIKELY':
    case 'REPORTED':
      return {
        fillColor: '#f97316', // Orange
        weight: 1.5,
        opacity: 0.8,
        color: '#ea580c',
        fillOpacity: 0.6,
      };
    case 'UNKNOWN':
      return {
        fillColor: '#6b7280', // Gray
        weight: 1,
        opacity: 0.5,
        color: '#4b5563',
        fillOpacity: 0.35,
      };
    case 'NORMAL':
    default:
      return {
        fillColor: '#10b981', // Green
        weight: 1,
        opacity: 0.6,
        color: '#059669',
        fillOpacity: 0.25,
      };
  }
}

function renderGeoJsonLayer() {
  if (geoJsonLayer) mapInstance.removeLayer(geoJsonLayer);

  geoJsonLayer = L.geoJSON(woredaFeatures, {
    style: getFeatureStyle,
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      const statusInfo = woredaStatusMap.get(p.woreda_id);
      const status = statusInfo ? statusInfo.current_status : 'NORMAL';

      const woredaName = currentLang === 'am' ? p.full_name_am : p.full_name_en;
      const subcityName = currentLang === 'am' ? p.subcity_am : p.subcity_en;

      // Tooltip
      layer.bindTooltip(
        `<div class="font-semibold text-xs text-white">${woredaName}</div>
         <div class="text-[11px] text-slate-300">${subcityName} • <span class="font-medium ${getStatusColorClass(
          status
        )}">${getStatusLabel(status)}</span></div>`,
        { sticky: true, className: 'leaflet-dark-tooltip' }
      );

      // Hover effect
      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({ weight: 3, color: '#fbbf24', fillOpacity: 0.85 });
          l.bringToFront();
        },
        mouseout: (e) => {
          geoJsonLayer.resetStyle(e.target);
        },
        click: () => {
          openWoredaDetailModal(p, statusInfo);
        },
      });
    },
  }).addTo(mapInstance);
}

function updateMapLabels() {
  if (geoJsonLayer) renderGeoJsonLayer();
}

function getStatusLabel(status) {
  switch (status) {
    case 'SCHEDULED':
      return t('legend_scheduled');
    case 'CURRENT':
    case 'CONFIRMED':
      return t('legend_current');
    case 'LIKELY':
    case 'REPORTED':
      return t('legend_likely');
    case 'UNKNOWN':
      return t('legend_unknown');
    case 'NORMAL':
    default:
      return t('legend_normal');
  }
}

function getStatusColorClass(status) {
  switch (status) {
    case 'CURRENT':
    case 'CONFIRMED':
      return 'text-red-400';
    case 'SCHEDULED':
      return 'text-amber-400';
    case 'LIKELY':
    case 'REPORTED':
      return 'text-orange-400';
    case 'UNKNOWN':
      return 'text-slate-400';
    default:
      return 'text-emerald-400';
  }
}

// Ethiopian Calendar & Astronomical Converter for Frontend
const ETHIOPIAN_MONTHS = [
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

function formatEthiopianDate(isoStr) {
  if (!isoStr) return null;
  const date = new Date(isoStr);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const a = Math.floor((14 - m) / 12);
  const yCalc = y + 4800 - a;
  const mCalc = m + 12 * a - 3;
  const jdn = d + Math.floor((153 * mCalc + 2) / 5) + 365 * yCalc + Math.floor(yCalc / 4) - Math.floor(yCalc / 100) + Math.floor(yCalc / 400) - 32045;
  const ERA = 1723856;
  const r = (jdn - ERA) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear = 4 * Math.floor((jdn - ERA) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;
  const mInfo = ETHIOPIAN_MONTHS.find((item) => item.index === ethMonth) || { am: 'ጳጉሜ', en: 'Pagume' };

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameAm: mInfo.am,
    monthNameEn: mInfo.en,
    formattedAm: `${mInfo.am} ${ethDay} ቀን ${ethYear} ዓ.ም`,
    formattedEn: `${mInfo.en} ${ethDay}, ${ethYear} E.C.`,
    combined: `${mInfo.am} ${ethDay} ቀን ${ethYear} ዓ.ም (${mInfo.en} ${ethDay}, ${ethYear} E.C.)`
  };
}

function formatEthiopianTime(isoStr) {
  if (!isoStr) return null;
  const date = new Date(isoStr);
  const utcHours = date.getUTCHours();
  const eatHours = (utcHours + 3) % 24;
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  // Ethiopian daytime/nighttime 12-hour clock
  const ethHours = ((eatHours + 6) % 12) || 12;
  const periodAm = (eatHours >= 6 && eatHours < 12) ? 'ከጠዋቱ' : (eatHours >= 12 && eatHours < 18) ? 'ከሰዓት' : 'ከምሽቱ';
  const periodEn = (eatHours >= 6 && eatHours < 12) ? 'Morning' : (eatHours >= 12 && eatHours < 18) ? 'Afternoon' : 'Evening';

  return {
    am: `${periodAm} ${ethHours}:${minutes}`,
    en: `${ethHours}:${minutes} ${periodEn}`,
    civil: `${String(eatHours).padStart(2, '0')}:${minutes} EAT`
  };
}

// Open detailed modal for an affected or selected Woreda
function openWoredaDetailModal(properties, statusInfo) {
  const modal = document.getElementById('detailModal');
  const woredaName = currentLang === 'am' ? properties.full_name_am : properties.full_name_en;
  const subcityName = currentLang === 'am' ? properties.subcity_am : properties.subcity_en;
  const status = statusInfo ? statusInfo.current_status : 'NORMAL';

  document.getElementById('modalTitle').textContent = woredaName;
  document.getElementById('modalSubcity').textContent = subcityName;

  const statusBadge = document.getElementById('modalStatusBadge');
  statusBadge.textContent = getStatusLabel(status);
  statusBadge.className = `px-3 py-1 rounded-full text-xs font-semibold ${
    status === 'NORMAL'
      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
      : status === 'SCHEDULED'
      ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
      : 'bg-red-900/60 text-red-300 border border-red-700'
  }`;

  // Date & Time
  const dateBox = document.getElementById('modalDateBox');
  const timeBox = document.getElementById('modalTimeBox');

  if (statusInfo && statusInfo.scheduled_start) {
    const ethDate = formatEthiopianDate(statusInfo.scheduled_start);
    const gregDate = new Date(statusInfo.scheduled_start).toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    let displayEthDate = statusInfo.ethiopian_date
      ? (currentLang === 'am' ? statusInfo.ethiopian_date.split('(')[0].trim() : statusInfo.ethiopian_date)
      : (currentLang === 'am' ? ethDate.formattedAm : ethDate.formattedEn);

    document.getElementById('modalDateEth').textContent = `📅 ${displayEthDate}`;
    document.getElementById('modalDateGreg').textContent = `Gregorian: ${gregDate}`;
    dateBox.classList.remove('hidden');

    if (statusInfo.scheduled_end) {
      const sEth = formatEthiopianTime(statusInfo.scheduled_start);
      const eEth = formatEthiopianTime(statusInfo.scheduled_end);
      document.getElementById('modalTimeEth').textContent =
        currentLang === 'am'
          ? `🕒 ${sEth.am} – ${eEth.am}`
          : `🕒 ${sEth.en} – ${eEth.en}`;
      document.getElementById('modalTimeCivil').textContent = `24h Civil Time: ${sEth.civil} – ${eEth.civil}`;
      timeBox.classList.remove('hidden');
    }
  } else {
    dateBox.classList.add('hidden');
    timeBox.classList.add('hidden');
  }

  // Reason
  const reasonBox = document.getElementById('modalReasonBox');
  if (statusInfo && (statusInfo.reason || statusInfo.reason_am)) {
    document.getElementById('modalReason').textContent =
      currentLang === 'am' ? statusInfo.reason_am || statusInfo.reason : statusInfo.reason;
    reasonBox.classList.remove('hidden');
  } else {
    reasonBox.classList.add('hidden');
  }

  // Source & Confidence
  document.getElementById('modalSource').textContent =
    statusInfo && statusInfo.source_type === 'EEU_ANNOUNCEMENT' ? t('source_official') : t('source_community');
  document.getElementById('modalConfidence').textContent =
    statusInfo && statusInfo.confidence ? statusInfo.confidence : 'OFFICIAL';

  // Quoted Official Announcement & Embed
  const quoteBox = document.getElementById('modalQuoteBox');
  const quoteTimeHeader = document.getElementById('modalQuoteTimeHeader');
  const quoteSnippet = document.getElementById('modalQuoteSnippet');
  const quoteText = document.getElementById('modalQuoteText');
  const fullTextDetails = document.getElementById('modalFullTextDetails');
  const copySearchBtn = document.getElementById('modalCopySearchBtn');
  const copySearchLabel = document.getElementById('modalCopySearchLabel');
  const toggleEmbedBtn = document.getElementById('modalToggleEmbedBtn');
  const toggleEmbedLabel = document.getElementById('modalToggleEmbedLabel');
  const embedWrapper = document.getElementById('modalEmbedWrapper');
  const telegramIframe = document.getElementById('modalTelegramIframe');
  const sourceLink = document.getElementById('modalSourceLink');
  const sourceLinkFallback = document.getElementById('modalSourceLinkFallback');
  const sourceLinkBox = document.getElementById('modalSourceLinkBox');

  if (quoteBox) {
    if (statusInfo && statusInfo.raw_text) {
      const searchKeywords = [
        properties.full_name_am,
        properties.subcity_am,
        properties.woreda_num ? `ወረዳ ${properties.woreda_num}` : '',
        properties.woreda_num ? `ወረዳ ${parseInt(properties.woreda_num, 10)}` : '',
        ...(SUBCITY_LANDMARKS[properties.subcity_id] || []),
        ...(statusInfo.affected_locations_raw || []),
      ].filter(Boolean);

      const targetQuote = extractTargetQuote(statusInfo.raw_text, searchKeywords);

      if (quoteTimeHeader) {
        quoteTimeHeader.textContent = targetQuote && targetQuote.timeHeader ? targetQuote.timeHeader : '';
      }
      if (quoteSnippet) {
        quoteSnippet.innerHTML = targetQuote && targetQuote.highlightedLine
          ? targetQuote.highlightedLine
          : escapeHtml(statusInfo.raw_text);
      }
      if (quoteText) {
        quoteText.textContent = statusInfo.raw_text.trim();
      }
      if (fullTextDetails) {
        fullTextDetails.classList.remove('hidden');
        fullTextDetails.removeAttribute('open');
      }

      // Copy Search Keyword helper
      if (targetQuote && targetQuote.keyword && copySearchBtn && copySearchLabel) {
        copySearchLabel.textContent = `📋 Copy "${targetQuote.keyword}"`;
        copySearchBtn.classList.remove('hidden');
        copySearchBtn.onclick = (e) => {
          e.preventDefault();
          copyToClipboard(targetQuote.keyword, copySearchBtn);
        };
      } else if (copySearchBtn) {
        copySearchBtn.classList.add('hidden');
      }

      // Telegram source link with text fragment
      if (sourceLink && statusInfo.source_url) {
        const textFragment = targetQuote && targetQuote.keyword
          ? `#:~:text=${encodeURIComponent(targetQuote.keyword)}`
          : '';
        sourceLink.href = `${statusInfo.source_url}${textFragment}`;
      }

      quoteBox.classList.remove('hidden');
      if (sourceLinkBox) sourceLinkBox.classList.add('hidden');

      if (embedWrapper) embedWrapper.classList.add('hidden');
      if (toggleEmbedLabel) toggleEmbedLabel.textContent = t('show_embed');
      if (telegramIframe) telegramIframe.src = '';

      if (toggleEmbedBtn && statusInfo.source_url) {
        toggleEmbedBtn.classList.remove('hidden');
        toggleEmbedBtn.onclick = (e) => {
          e.preventDefault();
          const isHidden = embedWrapper.classList.contains('hidden');
          if (isHidden) {
            const embedUrl = statusInfo.source_url.includes('?')
              ? `${statusInfo.source_url}&embed=1`
              : `${statusInfo.source_url}?embed=1`;
            telegramIframe.src = embedUrl;
            embedWrapper.classList.remove('hidden');
            if (toggleEmbedLabel) toggleEmbedLabel.textContent = t('hide_embed');
          } else {
            embedWrapper.classList.add('hidden');
            if (toggleEmbedLabel) toggleEmbedLabel.textContent = t('show_embed');
          }
        };
      } else if (toggleEmbedBtn) {
        toggleEmbedBtn.classList.add('hidden');
      }
    } else {
      quoteBox.classList.add('hidden');
      if (telegramIframe) telegramIframe.src = '';
      if (sourceLinkBox && sourceLinkFallback) {
        if (statusInfo && statusInfo.source_url) {
          sourceLinkFallback.href = statusInfo.source_url;
          sourceLinkBox.classList.remove('hidden');
        } else {
          sourceLinkBox.classList.add('hidden');
        }
      }
    }
  }

  // Quick report button on modal
  const reportBtn = document.getElementById('modalReportBtn');
  reportBtn.onclick = () => {
    modal.classList.add('hidden');
    openReportModalWithWoreda(properties.woreda_id, woredaName);
  };

  modal.classList.remove('hidden');
}

// Universal Search
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const resultsBox = document.getElementById('searchResults');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      resultsBox.classList.add('hidden');
      return;
    }

    const matches = woredaFeatures.filter((f) => {
      const p = f.properties;
      return (
        p.full_name_en.toLowerCase().includes(query) ||
        p.full_name_am.includes(query) ||
        p.subcity_en.toLowerCase().includes(query) ||
        p.subcity_am.includes(query) ||
        p.woreda_num.includes(query)
      );
    });

    if (matches.length === 0) {
      resultsBox.innerHTML = `<div class="p-3 text-sm text-slate-400">No areas found matching "${query}"</div>`;
      resultsBox.classList.remove('hidden');
      return;
    }

    resultsBox.innerHTML = matches
      .slice(0, 8)
      .map((f) => {
        const p = f.properties;
        const name = currentLang === 'am' ? p.full_name_am : p.full_name_en;
        const sub = currentLang === 'am' ? p.subcity_am : p.subcity_en;
        const st = woredaStatusMap.get(p.woreda_id)?.current_status || 'NORMAL';
        return `
        <div class="p-3 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between border-b border-slate-700/50 last:border-0" data-fid="${
          p.woreda_id
        }">
          <div>
            <div class="font-medium text-sm text-white">${name}</div>
            <div class="text-xs text-slate-400">${sub}</div>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full ${getStatusColorClass(st)} bg-slate-800">
            ${getStatusLabel(st)}
          </span>
        </div>
      `;
      })
      .join('');

    resultsBox.querySelectorAll('[data-fid]').forEach((el) => {
      el.addEventListener('click', () => {
        const wid = parseInt(el.getAttribute('data-fid'), 10);
        const feature = woredaFeatures.find((f) => f.properties.woreda_id === wid);
        if (feature) {
          const centroid = feature.properties.centroid;
          mapInstance.flyTo([centroid[1], centroid[0]], 14, { duration: 1.2 });
          openWoredaDetailModal(feature.properties, woredaStatusMap.get(wid));
          resultsBox.classList.add('hidden');
          searchInput.value = '';
        }
      });
    });

    resultsBox.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
      resultsBox.classList.add('hidden');
    }
  });
}

const SUBCITY_LANDMARKS = {
  1: ['መርካቶ', 'አውቶቡስ ተራ', 'አዲስ ከተማ'],
  2: ['ኮዬ', 'ኮዬ ፈጬ', 'ፕሮጀክት 16', 'ፕሮጀክት 12', 'ፕሮጀክት 17', 'ቃሊቲ', 'አቃቂ'],
  3: ['አራዳ', 'ፒያሳ'],
  4: ['ቦሌ', 'ጎሮ', 'ሰሚት', 'ገርጂ', 'ጃፓን'],
  5: ['ጉለሌ', 'ሸክላ ሰፈር', 'ሽሮ ሜዳ'],
  6: ['ቂርቆስ', 'ቄራ', 'ጎተራ', 'ካዛንቺስ', 'መስቀል አደባባይ'],
  7: ['ኮልፌ', 'ቀራኒዮ', 'ቡራዩ', 'ጽርሐ ጽዮን', 'በግ ተራ', 'ጦር ኃይሎች'],
  8: ['ልደታ', 'ሜክሲኮ', 'ባልቻ'],
  9: ['ንፋስ ስልክ', 'ላፍቶ', 'መካኒሳ', 'ጎፋ', 'ጎፋ ካምፕ', 'ቆሬ', 'ፋና', 'አሚጎ', 'ጀሞ', 'ሌቡ', 'ሳሪስ'],
  10: ['የካ', 'አያት', 'መገናኛ', 'ኮተቤ'],
};

window.copyToClipboard = function (text, btn) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = `✅ Copied "${escapeHtml(text)}"`;
    btn.classList.remove('bg-sky-950', 'text-sky-300', 'border-sky-700/70', 'bg-slate-800', 'text-amber-400', 'border-slate-700');
    btn.classList.add('bg-emerald-900', 'text-emerald-300', 'border-emerald-600');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('bg-emerald-900', 'text-emerald-300', 'border-emerald-600');
      btn.classList.add('bg-sky-950', 'text-sky-300', 'border-sky-700/70');
    }, 2500);
  });
};

function highlightKeywordInLine(line, keyword) {
  const safeLine = escapeHtml(line);
  if (!keyword) return safeLine;
  const safeKw = escapeHtml(keyword);
  const regex = new RegExp(`(${safeKw})`, 'gi');
  return safeLine.replace(
    regex,
    '<mark class="bg-amber-400 text-slate-950 font-bold px-1 py-0.5 rounded shadow-sm">$1</mark>'
  );
}

function extractTargetQuote(rawText, searchKeywords = []) {
  if (!rawText) return null;
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let currentTimeHeader = '';
  let bestMatch = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:✅|ከ).*?(?:ጠዋት|ጥዋት|ቀን|ምሽት|\d).*?(?:እስከ|-)/i.test(line)) {
      currentTimeHeader = line;
      continue;
    }

    // Skip boilerplate intros / outros
    if (/^(?:ስለሆነም|በአካባቢው|ክቡራን|ይህንኑ|በአክብሮት|እናሳውቃለን|#)/i.test(line)) {
      continue;
    }

    for (const kw of searchKeywords) {
      if (!kw || kw.length < 2) continue;
      const cleanKw = kw.replace(/^[በከወ\s]+/, '').trim();
      if (cleanKw.length >= 2 && line.includes(cleanKw)) {
        bestMatch = {
          timeHeader: currentTimeHeader,
          line: line,
          keyword: cleanKw,
          highlightedLine: highlightKeywordInLine(line, cleanKw),
        };
        break;
      }
    }
    if (bestMatch) break;
  }

  if (!bestMatch) {
    const contentLine = lines.find(
      (l) =>
        l.startsWith('👉') ||
        (!l.startsWith('✅') &&
          !l.startsWith('የጥገና') &&
          !l.startsWith('ነገ') &&
          !l.startsWith('#') &&
          !l.startsWith('ስለሆነም'))
    );
    if (contentLine) {
      bestMatch = {
        timeHeader: currentTimeHeader || lines.find((l) => l.startsWith('✅') || l.includes('ከጠዋቱ')) || '',
        line: contentLine,
        keyword: '',
        highlightedLine: escapeHtml(contentLine),
      };
    }
  }

  return bestMatch;
}

function renderQuotedAnnouncementSection(rawText, sourceUrl, uniqueId, searchKeywords = []) {
  if (!rawText) return '';
  const escapedFullText = escapeHtml(rawText.trim());
  const embedId = `embed-box-${uniqueId}`;
  const btnId = `embed-btn-${uniqueId}`;
  const targetQuote = extractTargetQuote(rawText, searchKeywords);

  const textFragment =
    targetQuote && targetQuote.keyword ? `#:~:text=${encodeURIComponent(targetQuote.keyword)}` : '';
  const directLink = sourceUrl ? `${sourceUrl}${textFragment}` : '';

  const copyKeywordBtn =
    targetQuote && targetQuote.keyword
      ? `<button type="button" onclick="copyToClipboard('${escapeHtml(
          targetQuote.keyword
        )}', this)" class="text-[11px] px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/70 transition font-medium">
           📋 Copy "${escapeHtml(targetQuote.keyword)}"
         </button>`
      : '';

  const embedControls = sourceUrl
    ? `
      <div class="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <a href="${directLink}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:text-sky-300 underline font-semibold flex items-center gap-1">
          <span>Open in Telegram ↗</span>
        </a>
        <button id="${btnId}" type="button" onclick="toggleEmbedIframe('${embedId}', '${sourceUrl}', '${btnId}')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-medium transition">
          ${t('show_embed')}
        </button>
      </div>
      <div id="${embedId}" class="hidden pt-2">
        <iframe src="" data-src="${
          sourceUrl.includes('?') ? sourceUrl + '&embed=1' : sourceUrl + '?embed=1'
        }" class="w-full h-64 rounded-xl border border-slate-700/80 bg-slate-900" frameborder="0" loading="lazy"></iframe>
      </div>
    `
    : '';

  return `
    <div class="mt-3 bg-slate-900/90 border border-slate-700/90 rounded-xl p-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <span>🎯</span>
          <span>${t('quoted_specific_point')}</span>
        </span>
        ${copyKeywordBtn}
      </div>

      <div class="text-xs text-slate-200 border-l-2 border-amber-400 pl-3 py-1 font-mono whitespace-pre-line leading-relaxed bg-slate-950/60 rounded-r-lg">
        ${
          targetQuote && targetQuote.timeHeader
            ? `<div class="text-amber-400 font-bold mb-1">${escapeHtml(targetQuote.timeHeader)}</div>`
            : ''
        }
        <div class="text-slate-100">${
          targetQuote && targetQuote.highlightedLine ? targetQuote.highlightedLine : escapedFullText
        }</div>
      </div>

      <details class="group text-[11px] text-slate-400">
        <summary class="cursor-pointer select-none text-slate-400 hover:text-slate-300 font-medium">
          <span>${t('view_full_announcement')} ▾</span>
        </summary>
        <blockquote class="mt-1.5 text-[11px] text-slate-300 border-l border-slate-700 pl-2.5 py-1 font-mono whitespace-pre-line max-h-32 overflow-y-auto leading-relaxed bg-slate-950/40 rounded-r">
${escapedFullText}
        </blockquote>
      </details>

      ${embedControls}
    </div>
  `;
}

// Render Outages List View
function renderOutagesList() {
  const container = document.getElementById('outagesListContainer');
  if (!container) return;

  const isHistory = selectedOutagesScope === 'history';
  let baseList = isHistory ? historyOutages : allOutages;

  let filtered = baseList;
  if (selectedRegionFilter === 'Addis Ababa') {
    filtered = baseList.filter((o) => !o.region_name || o.region_name === 'Addis Ababa');
  } else if (selectedRegionFilter === 'regional') {
    filtered = baseList.filter((o) => o.region_name && o.region_name !== 'Addis Ababa');
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700">${t(
      isHistory ? 'no_history_outages' : 'no_upcoming_outages'
    )}</div>`;
    return;
  }

  container.innerHTML = filtered
    .map((o) => {
      const isScheduled = o.status === 'SCHEDULED';
      const isAddis = !o.region_name || o.region_name === 'Addis Ababa';
      const areas = o.outage_areas || [];
      const woredaNames = areas
        .map((a) => (currentLang === 'am' ? a.woredas?.full_name_am : a.woredas?.full_name_en))
        .filter(Boolean)
        .join(', ');

      const rawLocations = Array.isArray(o.affected_locations_raw)
        ? o.affected_locations_raw.join(' • ')
        : (o.affected_locations_raw || '');

      const displayLocation = woredaNames || rawLocations || (isAddis ? 'Addis Ababa Area' : (o.region_name || 'Regional Hub'));

      const ethDateObj = o.scheduled_start ? formatEthiopianDate(o.scheduled_start) : null;
      const ethDateLabel = o.ethiopian_date
        ? (currentLang === 'am' ? o.ethiopian_date.split('(')[0].trim() : o.ethiopian_date)
        : (ethDateObj ? (currentLang === 'am' ? ethDateObj.formattedAm : ethDateObj.formattedEn) : '');

      const gregDateStr = o.scheduled_start
        ? new Date(o.scheduled_start).toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A';

      const sEth = o.scheduled_start ? formatEthiopianTime(o.scheduled_start) : null;
      const eEth = o.scheduled_end ? formatEthiopianTime(o.scheduled_end) : null;
      const ethTimeDisplay = sEth && eEth
        ? (currentLang === 'am' ? `${sEth.am} – ${eEth.am}` : `${sEth.en} – ${eEth.en}`)
        : '';
      const civilTimeDisplay = sEth && eEth ? `${sEth.civil} – ${eEth.civil}` : '';

      const reason = currentLang === 'am' ? o.reason_am || o.reason : o.reason;

      const sourceBtn = o.source_url
        ? `<a href="${o.source_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 text-xs font-semibold transition">
             <span>Telegram Announcement</span>
             <span>↗</span>
           </a>`
        : '';

      const statusBadge = isHistory
        ? `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/60">
             ✅ ${t('status_concluded')}
           </span>`
        : `<span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
            isScheduled
              ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
              : 'bg-red-900/60 text-red-300 border border-red-700/60'
          }">
            ${getStatusLabel(o.status)}
          </span>`;

      return `
      <div class="p-5 bg-slate-800/60 rounded-xl border border-slate-700/80 hover:border-slate-600 transition shadow-lg ${isHistory ? 'opacity-95' : ''}">
        <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div class="flex flex-wrap items-center gap-2">
            ${statusBadge}
            <span class="px-2 py-0.5 rounded text-xs font-semibold ${
              isAddis
                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }">
              ${o.region_name || 'Addis Ababa'}
            </span>
            <span class="text-xs text-slate-400">Confidence: <strong>${o.confidence}</strong></span>
            ${isHistory ? `<span class="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">Archived Record</span>` : ''}
          </div>
          ${sourceBtn || `<span class="text-xs text-slate-400">${t('source_official')}</span>`}
        </div>

        <div class="mb-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-bold">📅 ${ethDateLabel}</span>
            <span class="text-slate-400">(${gregDateStr})</span>
          </div>
          <div class="flex items-center gap-2 text-slate-300">
            <span class="text-white font-semibold">🕒 ${isHistory ? 'Concluded: ' : ''}${ethTimeDisplay || 'TBD'}</span>
            <span class="text-slate-400 text-[11px]">(${civilTimeDisplay})</span>
          </div>
        </div>

        <div class="font-bold text-base text-white mb-1">${displayLocation}</div>
        <div class="text-sm text-slate-300 mb-3">${reason || 'Maintenance Work'}</div>
        <div class="text-xs text-slate-400 flex flex-wrap items-center gap-4">
          ${areas.length > 0 ? `<span>📍 ${areas.length} Woreda(s) affected</span>` : `<span>📍 Regional Town / Grid Substation</span>`}
          ${isHistory && o.scheduled_end ? `<span>🏁 Concluded at ${civilTimeDisplay.split('–')[1] || civilTimeDisplay}</span>` : ''}
        </div>
        ${(() => {
          const searchKeywords = [
            o.region_name,
            ...(Array.isArray(o.affected_locations_raw) ? o.affected_locations_raw : [o.affected_locations_raw]),
            ...(areas.map((a) => a.woredas?.full_name_am || a.woredas?.full_name_en)),
          ].filter(Boolean);
          return renderQuotedAnnouncementSection(o.raw_text, o.source_url, `list-${o.id}`, searchKeywords);
        })()}
      </div>
    `;
    })
    .join('');
}

// Render Calendar Timetable
function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  if (!container) return;

  const scheduled = allOutages.filter((o) => o.status === 'SCHEDULED' || o.scheduled_start);

  if (scheduled.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700">${t(
      'no_upcoming_outages'
    )}</div>`;
  } else {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${scheduled
          .map((s) => {
            const ethDateObj = s.scheduled_start ? formatEthiopianDate(s.scheduled_start) : null;
            const ethDateLabel = s.ethiopian_date
              ? (currentLang === 'am' ? s.ethiopian_date.split('(')[0].trim() : s.ethiopian_date)
              : (ethDateObj ? (currentLang === 'am' ? ethDateObj.formattedAm : ethDateObj.formattedEn) : '');

            const dateStr = new Date(s.scheduled_start).toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const sEth = s.scheduled_start ? formatEthiopianTime(s.scheduled_start) : null;
            const eEth = s.scheduled_end ? formatEthiopianTime(s.scheduled_end) : null;
            const ethTimeDisplay = sEth && eEth
              ? (currentLang === 'am' ? `${sEth.am} – ${eEth.am}` : `${sEth.en} – ${eEth.en}`)
              : '';
            const civilTimeDisplay = sEth && eEth ? `${sEth.civil} – ${eEth.civil}` : '';

            const areas = (s.outage_areas || [])
              .map((a) => (currentLang === 'am' ? a.woredas?.full_name_am : a.woredas?.full_name_en))
              .join(', ');
            const rawLocs = Array.isArray(s.affected_locations_raw)
              ? s.affected_locations_raw.slice(0, 5).join(', ')
              : '';
            const displayArea = areas || rawLocs || s.region_name || 'Addis Ababa';

            return `
            <div class="p-5 bg-slate-800/60 rounded-xl border border-slate-700 flex flex-col justify-between shadow-md">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">📅 ${ethDateLabel}</span>
                  <span class="text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700">${s.region_name || 'Addis Ababa'}</span>
                </div>
                <div class="text-xs text-slate-400 mb-2.5">Gregorian: ${dateStr}</div>

                <div class="text-base font-bold text-white mb-0.5">🕒 ${ethTimeDisplay}</div>
                <div class="text-xs text-slate-400 mb-3">24-Hour Civil: ${civilTimeDisplay}</div>

                <div class="text-sm text-slate-200 mb-2"><strong>Affected:</strong> ${displayArea}</div>
                <div class="text-xs text-slate-400">${
                  currentLang === 'am' ? s.reason_am || s.reason : s.reason || 'Maintenance'
                }</div>
              </div>
              ${(() => {
                const calKeywords = [
                  s.region_name,
                  ...(Array.isArray(s.affected_locations_raw) ? s.affected_locations_raw : [s.affected_locations_raw]),
                  ...((s.outage_areas || []).map((a) => a.woredas?.full_name_am || a.woredas?.full_name_en)),
                ].filter(Boolean);
                return renderQuotedAnnouncementSection(s.raw_text, s.source_url, `cal-${s.id}`, calKeywords);
              })()}
              <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                ${s.source_url ? `<a href="${s.source_url}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:text-sky-300 font-semibold underline flex items-center gap-1"><span>Telegram Post</span><span>↗</span></a>` : `<span>Source: EEU Official</span>`}
                <span class="text-emerald-400">Scheduled Ahead</span>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    `;
  }

  if (calendarHistoryVisible) {
    renderCalendarHistory();
  }
}

// Render Calendar Past History (Capped at 30)
function renderCalendarHistory() {
  const container = document.getElementById('calendarHistoryContainer');
  if (!container) return;

  if (!historyOutages || historyOutages.length === 0) {
    container.innerHTML = `<div class="col-span-full p-6 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700">${t('no_history_outages')}</div>`;
    return;
  }

  container.innerHTML = historyOutages
    .map((s) => {
      const ethDateObj = s.scheduled_start ? formatEthiopianDate(s.scheduled_start) : null;
      const ethDateLabel = s.ethiopian_date
        ? (currentLang === 'am' ? s.ethiopian_date.split('(')[0].trim() : s.ethiopian_date)
        : (ethDateObj ? (currentLang === 'am' ? ethDateObj.formattedAm : ethDateObj.formattedEn) : '');

      const dateStr = s.scheduled_start
        ? new Date(s.scheduled_start).toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A';

      const sEth = s.scheduled_start ? formatEthiopianTime(s.scheduled_start) : null;
      const eEth = s.scheduled_end ? formatEthiopianTime(s.scheduled_end) : null;
      const ethTimeDisplay = sEth && eEth ? (currentLang === 'am' ? `${sEth.am} – ${eEth.am}` : `${sEth.en} – ${eEth.en}`) : '';
      const civilTimeDisplay = sEth && eEth ? `${sEth.civil} – ${eEth.civil}` : '';

      const areas = (s.outage_areas || [])
        .map((a) => (currentLang === 'am' ? a.woredas?.full_name_am : a.woredas?.full_name_en))
        .join(', ');
      const rawLocs = Array.isArray(s.affected_locations_raw) ? s.affected_locations_raw.slice(0, 5).join(', ') : '';
      const displayArea = areas || rawLocs || s.region_name || 'Addis Ababa';

      return `
        <div class="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col justify-between shadow opacity-90 hover:opacity-100 transition">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-300">📅 ${ethDateLabel}</span>
              <span class="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">✅ ${t('status_concluded')}</span>
            </div>
            <div class="text-[11px] text-slate-400 mb-2">Gregorian: ${dateStr}</div>
            <div class="text-xs text-slate-300 mb-1">🕒 Concluded: <strong>${ethTimeDisplay}</strong> (${civilTimeDisplay})</div>
            <div class="text-xs text-white font-medium mb-1">${displayArea}</div>
            <div class="text-[11px] text-slate-400">${currentLang === 'am' ? s.reason_am || s.reason : s.reason || 'Maintenance'}</div>
          </div>
          ${(() => {
            const histKeywords = [
              s.region_name,
              ...(Array.isArray(s.affected_locations_raw) ? s.affected_locations_raw : [s.affected_locations_raw]),
              ...((s.outage_areas || []).map((a) => a.woredas?.full_name_am || a.woredas?.full_name_en)),
            ].filter(Boolean);
            return renderQuotedAnnouncementSection(s.raw_text, s.source_url, `hist-${s.id}`, histKeywords);
          })()}
          <div class="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
            ${s.source_url ? `<a href="${s.source_url}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:text-sky-300 underline flex items-center gap-1"><span>Telegram</span><span>↗</span></a>` : `<span>EEU Official</span>`}
            <span class="text-slate-500 font-mono text-[10px]">CAPPED HISTORY</span>
          </div>
        </div>
      `;
    })
    .join('');
}

// Render Areas Directory
function renderAreasDirectory() {
  const container = document.getElementById('areasContainer');
  if (!container) return;

  // Group features by sub-city
  const bySubcity = new Map();
  woredaFeatures.forEach((f) => {
    const sc = currentLang === 'am' ? f.properties.subcity_am : f.properties.subcity_en;
    if (!bySubcity.has(sc)) bySubcity.set(sc, []);
    bySubcity.get(sc).push(f);
  });

  container.innerHTML = Array.from(bySubcity.entries())
    .map(([subcity, woredas]) => {
      return `
      <div class="p-5 bg-slate-800/50 rounded-xl border border-slate-700/80 mb-4">
        <h3 class="text-base font-bold text-white mb-3 flex items-center justify-between">
          <span>${subcity}</span>
          <span class="text-xs font-normal text-slate-400">${woredas.length} Woredas</span>
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          ${woredas
            .map((w) => {
              const p = w.properties;
              const name = currentLang === 'am' ? `ወረዳ ${p.woreda_num}` : `Woreda ${p.woreda_num}`;
              const st = woredaStatusMap.get(p.woreda_id)?.current_status || 'NORMAL';
              return `
              <button class="p-2 text-left rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/40 text-xs flex items-center justify-between woreda-card-btn" data-wid="${
                p.woreda_id
              }">
                <span class="text-slate-200 font-medium">${name}</span>
                <span class="w-2 h-2 rounded-full ${
                  st === 'NORMAL' ? 'bg-emerald-400' : st === 'SCHEDULED' ? 'bg-amber-400' : 'bg-red-400'
                }"></span>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
    })
    .join('');

  container.querySelectorAll('.woreda-card-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wid = parseInt(btn.getAttribute('data-wid'), 10);
      const feature = woredaFeatures.find((f) => f.properties.woreda_id === wid);
      if (feature) {
        switchView('map');
        const centroid = feature.properties.centroid;
        mapInstance.flyTo([centroid[1], centroid[0]], 14);
        openWoredaDetailModal(feature.properties, woredaStatusMap.get(wid));
      }
    });
  });
}

// Community Report Modal & PostGIS Geolocation
function initReportModal() {
  const modal = document.getElementById('reportModal');
  const openBtns = [document.getElementById('openReportBtn'), document.getElementById('heroReportBtn')];
  const closeBtn = document.getElementById('closeReportBtn');
  const cancelBtn = document.getElementById('cancelReportBtn');
  const gpsBtn = document.getElementById('gpsLocateBtn');
  const woredaSelect = document.getElementById('reportWoredaSelect');
  const form = document.getElementById('outageReportForm');

  openBtns.forEach((btn) => {
    if (btn) btn.addEventListener('click', () => modal.classList.remove('hidden'));
  });

  [closeBtn, cancelBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => modal.classList.add('hidden'));
  });

  // Populate woreda select dropdown
  if (woredaSelect && woredaFeatures.length > 0) {
    woredaSelect.innerHTML = `<option value="">-- ${
      currentLang === 'am' ? 'ወረዳ ይምረጡ' : 'Select your Woreda'
    } --</option>`;
    woredaFeatures.forEach((f) => {
      const p = f.properties;
      const opt = document.createElement('option');
      opt.value = p.woreda_id;
      opt.textContent = `${p.subcity_en} - Woreda ${p.woreda_num} (${p.full_name_am})`;
      woredaSelect.appendChild(opt);
    });
  }

  // HTML5 Geolocation with PostGIS Point-in-Polygon
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      gpsBtn.disabled = true;
      gpsBtn.textContent = 'Locating...';

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            const res = await fetch('/api/v1/map/resolve-coordinates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: lat, longitude: lng }),
            });
            const data = await res.json();
            if (data.woreda_id && woredaSelect) {
              woredaSelect.value = data.woreda_id;
              alert(`Location resolved to: ${data.full_name_en} (${data.full_name_am})`);
            } else {
              alert('Your current GPS location appears to be outside Addis Ababa.');
            }
          } catch {
            alert('Could not resolve location with server.');
          } finally {
            gpsBtn.disabled = false;
            gpsBtn.textContent = t('btn_locate_me');
          }
        },
        (err) => {
          gpsBtn.disabled = false;
          gpsBtn.textContent = t('btn_locate_me');
          alert('Unable to retrieve your location: ' + err.message);
        }
      );
    });
  }

  // Handle report submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const wid = woredaSelect.value ? parseInt(woredaSelect.value, 10) : null;
      const statusType = document.querySelector('input[name="report_type"]:checked')?.value || 'POWER_OUT';
      const comments = document.getElementById('reportComments')?.value;

      if (!wid) {
        alert('Please select your Woreda or use GPS to locate your area.');
        return;
      }

      try {
        const res = await fetch('/api/v1/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            woreda_id: wid,
            reported_status: statusType,
            comments,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert('Report submitted successfully! Thank you for contributing to your community.');
          modal.classList.add('hidden');
          form.reset();
          await loadData();
        } else {
          alert(data.message || 'Could not submit report.');
        }
      } catch {
        alert('Network error while submitting report.');
      }
    });
  }
}

function openReportModalWithWoreda(woredaId, woredaName) {
  const modal = document.getElementById('reportModal');
  const sel = document.getElementById('reportWoredaSelect');
  if (sel) sel.value = woredaId;
  modal.classList.remove('hidden');
}

// Admin Queue View
async function renderAdminQueue() {
  const container = document.getElementById('adminQueueContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/v1/admin/extractions');
    pendingExtractions = await res.json();

    if (!Array.isArray(pendingExtractions) || pendingExtractions.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700">No pending extractions awaiting review. All announcements processed.</div>`;
      return;
    }

    container.innerHTML = pendingExtractions
      .map((item) => {
        const raw = item.raw_announcements;
        const ext = item.extracted_json || {};
        return `
        <div class="p-5 bg-slate-800/80 rounded-xl border border-slate-700 shadow-md mb-4">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700">
              Confidence: ${item.confidence_score}%
            </span>
            <span class="text-xs text-slate-400">${new Date(raw.published_at).toLocaleString()}</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Original EEU Announcement (Amharic)</div>
              <div class="text-sm text-slate-200 font-serif leading-relaxed">${raw.raw_text}</div>
            </div>
            
            <div class="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div class="font-semibold text-slate-400 uppercase mb-1">Deterministic Extracted Fields</div>
              <div><strong>Sub-city:</strong> ${ext.sub_city_en || 'Unknown'} (${ext.sub_city_am || 'ያልታወቀ'})</div>
              <div><strong>Woredas:</strong> ${
                ext.woredas && ext.woredas.length > 0 ? ext.woredas.join(', ') : 'None extracted'
              }</div>
              <div><strong>Time Range:</strong> ${ext.start_time_raw || 'N/A'} – ${
          ext.expected_restoration_time_raw || 'N/A'
        }</div>
              <div><strong>Reason:</strong> ${ext.reason_en || 'Maintenance'}</div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-700/60">
            <button class="px-4 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-red-200 text-xs font-medium border border-red-700" onclick="reviewExtraction('${
              item.id
            }', 'REJECTED')">
              Reject
            </button>
            <button class="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium shadow" onclick="reviewExtraction('${
              item.id
            }', 'APPROVED')">
              Approve & Create Outage
            </button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="text-red-400">Failed to load admin extractions.</div>`;
  }
}

window.reviewExtraction = async function (id, action) {
  try {
    const res = await fetch(`/api/v1/admin/extractions/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes: `Actioned via admin UI at ${new Date().toISOString()}` }),
    });
    if (res.ok) {
      alert(`Extraction marked as ${action}`);
      renderAdminQueue();
      await loadData();
    }
  } catch {
    alert('Failed to update extraction');
  }
};
