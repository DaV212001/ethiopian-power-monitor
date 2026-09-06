# Addis Ababa Woreda Boundary GIS Ingestion & Normalization Guide

## 1. Overview
This guide documents the ingestion, topological validation, normalization, and PostGIS seeding process for the Addis Ababa Woreda boundary dataset (`aa_worda_boundary (1).zip`).

---

## 2. Dataset Verification Summary
- **Source File**: `gis/raw_data/aa_worda_boundary.shp`
- **CRS**: `EPSG:4326 (WGS 84)`
- **Total Features**: Exactly 116 Woredas across 10 Sub-cities:
  1. Addis Ketema (10 Woredas: 01–10)
  2. Akaki Kality (11 Woredas: 01–11)
  3. Arada (10 Woredas: 01–10)
  4. Bole (14 Woredas: 01–14)
  5. Gulele (10 Woredas: 01–10)
  6. Kirkos (11 Woredas: 01–11)
  7. Kolfe Keranyo (15 Woredas: 01–15)
  8. Lideta (10 Woredas: 01–10)
  9. Nefas - Silk Lafto (12 Woredas: 01–12)
  10. Yeka (13 Woredas: 01–13)
- **Topological Validity**: 100% closed, valid polygons. 0 duplicate records.

---

## 3. Running the Import Command
To run the complete validation, normalization, and PostGIS database seeding pipeline:

```bash
npm run import:aa-woredas
```

Or execute directly via Python:

```bash
# Step 1: Validate shapefile, normalize names, and export GeoJSON & SQL
python gis/import_woredas.py

# Step 2: Seed into Supabase PostGIS
python gis/seed_database.py
```

### Outputs Produced:
1. `gis/addis_ababa_woredas.geojson`: Normalized GeoJSON with English & Amharic names.
2. `frontend/public/addis_ababa_woredas.json`: Production GeoJSON served to web map clients.
3. `gis/seed_woredas.sql`: Compact PostGIS SQL with MultiPolygon geometries and centroids.
4. `docs/gis_import_report.md`: Detailed audit report.
