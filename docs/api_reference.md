# Ethiopian Power Monitor — REST API Documentation

The Ethiopian Power Monitor API is fully documented with OpenAPI 3.0. When the server is running, the interactive Swagger UI is available at:
`http://localhost:4000/docs`

---

## Base Endpoints

### 1. System Health
* **`GET /api/v1/health`**
  * Returns system health, database status, telegram ingestion status, and monitored woreda count (116).

---

### 2. Map & Spatial Layers
* **`GET /api/v1/map`**
  * Returns all 116 Woredas with real-time evaluated status (`NORMAL`, `SCHEDULED`, `CURRENT`, `LIKELY`, `CONFIRMED`, `UNKNOWN`), scheduled start/end times, and reason in both English and Amharic.
* **`POST /api/v1/map/resolve-coordinates`**
  * Resolves user latitude and longitude to a Woreda via PostGIS Point-in-Polygon.
  * Body: `{"latitude": 8.9954, "longitude": 38.7876}`

---

### 3. Outages
* **`GET /api/v1/outages`**
  * List all outages with optional status filtering (`?status=SCHEDULED`, `?limit=20`, `?offset=0`).
* **`GET /api/v1/outages/current`**
  * Returns currently active outages.
* **`GET /api/v1/outages/upcoming`**
  * Returns upcoming scheduled outages announced by EEU.
* **`GET /api/v1/outages/:id`**
  * Returns detailed information for a single outage, including source EEU announcement traceability and affected woredas.

---

### 4. Administrative Areas
* **`GET /api/v1/areas`**
  * List sub-cities and woredas with optional multilingual search (`?search=Bole` or `?search=ቦሌ`).
* **`GET /api/v1/areas/:id`**
  * Individual Woreda profile and currently active outages.
* **`GET /api/v1/areas/:id/statistics`**
  * Historical metrics (total outages recorded, average duration, reliability score).

---

### 5. Community Reporting
* **`POST /api/v1/reports`**
  * Submit a privacy-safe crowdsourced power outage or restoration report.
  * Rate-limited to prevent abuse.
  * Body:
    ```json
    {
      "woreda_id": 85,
      "reported_status": "POWER_OUT",
      "comments": "Transformer sparked near church"
    }
    ```

---

### 6. Admin & Extraction Review
* **`GET /api/v1/announcements`**
  * Raw immutable EEU announcement audit stream.
* **`GET /api/v1/admin/extractions`**
  * List extractions requiring admin review (`?status=PENDING_REVIEW`).
* **`POST /api/v1/admin/extractions/:id/review`**
  * Action an extraction (`APPROVED`, `MODIFIED`, `REJECTED`).
