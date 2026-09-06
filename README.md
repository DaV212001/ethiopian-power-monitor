# ⚡ Ethiopian Power Monitor (የኢትዮጵያ የኃይል መከታተያ)

> **Know when electricity is scheduled to go out, whether it is currently out, why it is out, when it is expected to return, and how reliable that information is.**

A civic-tech electricity outage intelligence platform initially focused on **Addis Ababa, Ethiopia**, designed to expand nationally.

---

## 🌟 Key Features

1. **🗺️ Interactive Live Map (116 Woredas)**:
   - Full PostGIS-backed boundary map of all 116 Woredas across Addis Ababa's 10 Sub-cities.
   - Status color coding:
     - 🟢 **Normal** (መደበኛ)
     - 🟡 **Scheduled Outage** (የታቀደ መቋረጥ)
     - 🔴 **Current Outage** (የአሁኑ መቋረጥ)
     - 🟠 **Likely Outage** (ሊሆን የሚችል መቋረጥ)
     - ⚪ **Unknown** (ያልታወቀ)

2. **🤖 Deterministic Amharic NLP & Ethiopian Time Engine**:
   - Zero-cost, privacy-safe, deterministic Amharic parser built specifically for Ethiopian Electric Utility (EEU) announcement patterns.
   - Converts Ethiopian 12-hour clock (where 2:00 morning = 08:00 modern time, 10:00 afternoon = 16:00 modern time) into standard ISO-8601 UTC timestamps.
   - Detects sub-cities, woredas, neighborhoods, and maintenance reasons with confidence scoring.

3. **📢 EEU Telegram Ingestion & Deduplication**:
   - SHA-256 content hashing prevents duplicate outage generation.
   - Maintains an immutable audit trail in `raw_announcements`.

4. **👥 Privacy-Safe Community Outage Reporting**:
   - HTML5 GPS location auto-detection resolved via PostGIS point-in-polygon queries.
   - Anti-abuse protection: daily-salted device fingerprinting and rate limiting.
   - Exact user coordinates are never exposed publicly; aggregated at the Woreda level.

5. **🔍 Universal Bilingual Search**:
   - Matches English and Ge'ez (Amharic) spellings and aliases (e.g. "Bole", "ቦሌ", "Kazanchis", "ካዛንቺስ", "Woreda 03", "ወረዳ 03").

6. **📅 Outage Calendar & Administrative Directory**:
   - Filterable scheduled outage timetables and sub-city directory.

7. **🛡️ Admin Review & Audit Dashboard**:
   - Side-by-side view of original Amharic Telegram posts and extracted entities with one-click approval or rejection.

---

## 🏗️ Tech Stack

- **Frontend**: Leaflet, Tailwind CSS, Responsive Mobile-First Design, PWA Shell, Bilingual i18n (English & Amharic).
- **Backend**: Fastify, TypeScript, OpenAPI 3.0 (Swagger UI at `/docs`), CORS, Static File Serving.
- **Database**: PostgreSQL 17 + PostGIS (Hosted on Supabase with Row Level Security).
- **GIS Engine**: EPSG:4326 (WGS 84), Douglas-Peucker topological polygon optimization, Point-in-polygon resolution.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v20+ or v22+)
- Python 3.10+ (for GIS tools)

### 2. Install Dependencies
```bash
# In backend directory
cd backend
npm install

# Return to project root
cd ..
```

### 3. Environment Configuration
The `.env` file is pre-configured with the Supabase PostGIS connection and Telegram credentials:
```env
PORT=4000
HOST=0.0.0.0
SUPABASE_URL=https://szyktmgtclujvuooofnc.supabase.co
SUPABASE_ANON_KEY=...
TELEGRAM_CHANNEL=eeuethiopia
TELEGRAM_API_ID=28797551
TELEGRAM_API_HASH=4a32bdbf9ca0c89cc53af784e4a80551
```

### 4. Run the Server
```bash
npm start
```
- 🌐 **Web Application**: Visit [http://localhost:4000](http://localhost:4000)
- 📖 **Interactive API Documentation**: Visit [http://localhost:4000/docs](http://localhost:4000/docs)

---

## 🧪 Testing

Run the automated test suites:

```bash
# Full-stack integration test (Frontend + API + PostGIS + Reports)
npm test

# Unit tests for Amharic NLP and Ethiopian time conversion
npm run test:extractor

# Integration tests for Telegram deduplication and outage creation
npm run test:ingestion

# Unit tests for multi-signal Outage Status Engine
npm run test:status
```

---

## 🗺️ GIS Ingestion Pipeline

To re-run the repeatable shapefile validation and PostGIS seeder:
```bash
npm run import:aa-woredas
```

---

## 📐 Core Product Principles

1. **Unknown is better than wrong**: The platform never invents certainty. When evidence is insufficient, status is explicitly marked as `UNKNOWN`.
2. **Transparent Signal Separation**: Official announcements (`EEU`), community reports (`COMMUNITY`), and algorithmic inferences are never merged invisibly.

---

## 📄 License
MIT License. Built for the residents and businesses of Addis Ababa and Ethiopia.
