# Ethiopian Power Monitor — Technical Architecture

## 1. Core Mission & Guiding Principle
The **Ethiopian Power Monitor** is a civic-tech platform designed to answer five fundamental questions for residents of Addis Ababa and Ethiopia:
1. When is electricity scheduled to go out?
2. Is it currently out in my area?
3. Why is it out?
4. When is it expected to return?
5. How reliable is that information?

### Architectural Rule: "Unknown is better than wrong."
The system enforces strict separation across three signal classes:
- **Official EEU Information**: Direct statements from Ethiopian Electric Utility.
- **Community Reports**: Crowdsourced status from local residents.
- **System Inference**: Algorithmic state evaluation. Inferences are never presented as official statements.

---

## 2. End-to-End System Diagram

```text
               EEU Official Telegram Channel (@eeuethiopia)
                                     │
                                     ▼
                      Telegram Ingestion Service
                      • SHA-256 Deduplication
                      • Immutable raw_announcements audit
                                     │
                                     ▼
                Deterministic Amharic NLP & Time Engine
                • Ethiopian 12-hr clock conversion
                • Sub-city & Woreda extraction
                • Neighborhood / Landmark mapping
                • Maintenance reason detection
                                     │
                                     ▼
                           Deterministic Validator
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
             Confidence >= 70%               Confidence < 70%
                     │                               │
                     ▼                               ▼
            Canonical Outages                Admin Review Queue
            + Woreda Spatial Join            (Human Verification)
                     │
                     ▼
           PostgreSQL + PostGIS Database (Supabase)
           • EPSG:4326 Woreda Polygons (116 Woredas)
           • Spatial indexes & Point-in-polygon queries
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    Fastify REST API       Community Reports Aggregator
    • OpenAPI 3.0 Docs     • Device fingerprinting + daily salt
    • GeoJSON Layers       • Rate limiting & spatial clustering
         │
         ▼
  Modern Responsive Web Application (Leaflet + Tailwind)
  • Multilingual (English & Amharic)
  • Live Map with Woreda Status Color Coding
  • Universal Area Search (English + Ge'ez script)
  • Outage Calendar & Timetable
  • GPS Point-in-Polygon "Report Outage" Flow
```

---

## 3. Deterministic Amharic NLP Engine
Rather than relying on costly external AI APIs that can hallucinate or fail, the platform uses a high-performance deterministic rule-based extractor:
- **Sub-City Dictionary**: Matches all 10 sub-cities in both English transliterations and Ge'ez script (`ቦሌ`, `ቂርቆስ`, `አራዳ`, `የካ`, `ንፋስ ስልክ ላፍቶ`, etc.).
- **Woreda Extraction**: Extracts comma-separated, conjunction-separated (`እና`, `እንዲሁም`), and ranged (`እስከ`) woreda numbers (`01` through `15`).
- **Ethiopian Time Parser**: Converts Ethiopian 12-hour clock (where 1:00 morning = 07:00 UTC+3, 6:00 = 12:00 noon, 10:00 afternoon = 16:00 UTC+3) into standard ISO-8601 timestamps.
- **Confidence Scoring**: Evaluates completeness of geographic and temporal entities. Scores below 70% are automatically routed to the Admin Review Queue.

---

## 4. PostGIS Spatial Operations
- **Coordinate Reference System**: EPSG:4326 (WGS 84).
- **Point-in-Polygon (`find_woreda_by_coords`)**: Takes user GPS latitude and longitude and resolves the enclosing Woreda polygon in microseconds via spatial GiST indexes.
- **Bounding-Box Query (`get_woredas_in_bbox`)**: Allows viewport-filtered spatial queries for mobile map performance.
- **Status Evaluation (`get_area_power_status`)**: Joins PostGIS polygons with active outages and recent community report clusters in a single SQL query.
