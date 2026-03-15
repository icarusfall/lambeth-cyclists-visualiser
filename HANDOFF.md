# Handoff Notes — Pick Up From Here

## What's Done

### Infrastructure
- Next.js 16 + Tailwind v4 + TypeScript project scaffolded
- Mapbox GL JS v3 via react-map-gl v8 — map renders, centred on Lambeth
- Deployed to Vercel, GitHub repo synced at `icarusfall/lambeth-cyclists-visualiser`
- Layer toggle panel, popup system, loading states all working

### Streets Data (4 datasets — MIGRATED TO POSTGRES)
- Postgres fetchers: `src/lib/db/roadworks.ts`, `disruptions.ts`, `collisions.ts`, `traffic-orders.ts`
- DB client: `src/lib/db/client.ts` (pg Pool with `DATABASE_URL`)
- GeoJSON conversion: `src/lib/geojson/convert.ts`
- API routes: `src/app/api/geojson/{roadworks,disruptions,collisions,traffic-orders}/route.ts`
- Map layers: clustered circles for roadworks/disruptions/traffic-orders, heatmap for collisions
- Old Notion fetchers still in `src/lib/notion/` (can be removed once wards/candidates migration is assessed)

### Wards & Candidates (IN PROGRESS — pick up here)
- Ward boundaries GeoJSON downloaded from ONS: `public/data/lambeth-wards.geojson` (25 wards)
- Notion fetchers written: `src/lib/notion/wards.ts` and `src/lib/notion/candidates.ts`
- Ward names confirmed matching between Notion (25) and ONS GeoJSON (25)
- **Name normalization needed**: Notion uses "and" (e.g., "Clapham Common and Abbeville"), ONS uses "&"
- Candidates: 77 records with party, status, engagement level, cycling position, ward relation

## What's Next — Wards & Candidates

### 1. Create API routes for wards and candidates
```
src/app/api/wards/route.ts      — Returns ward data merged with boundary GeoJSON
src/app/api/candidates/route.ts — Returns candidates grouped by ward
```

The wards route should:
- Fetch ward records from Notion (25 records, fast)
- Load `public/data/lambeth-wards.geojson`
- Match Notion ward data to GeoJSON features by name (normalize "and" ↔ "&")
- Return enriched GeoJSON with Notion properties (priority, competitiveness, notes) merged in

### 2. Create WardLayer component
```
src/components/map/layers/WardsLayer.tsx
```
- Render ward boundaries as filled polygons with borders
- Colour by priority: High = red fill, Medium = amber, Low = light grey
- Or colour by competitiveness: Safe = grey, competitive = highlighted
- Show ward name as a label at centroid
- On click: show ward detail panel with candidates

### 3. Create CandidatePanel component
```
src/components/map/CandidatePanel.tsx
```
- When a ward is clicked, show a side panel or expanded popup with:
  - Ward name, priority, competitiveness, 2022 margin
  - List of candidates: name, party (colour-coded), status, cycling position
  - Colour-code cycling position: pro-cycling = green, anti = red, unknown = grey
  - Engagement level indicator
  - Notes from the ward record

### 4. Add to MapShell
- Add wards + candidates to the `useMapData` hook
- Add WardLayer to MapProvider children
- Add "Wards" to the layer toggle
- Wire up ward click → CandidatePanel

## Environment Variables to Add (on Vercel too)

```
NOTION_WARDS_DB_ID=3002d7a24378814ba99cf54d0664ab1c
NOTION_CANDIDATES_DB_ID=3002d7a24378814388effd4357a003d3
```

Already added to `.env.local` and `.env.example`.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/notion/wards.ts` | Notion fetcher for 25 ward records |
| `src/lib/notion/candidates.ts` | Notion fetcher for 77 candidates (resolves ward relations) |
| `public/data/lambeth-wards.geojson` | ONS ward boundary polygons (WGS84) |
| `MIGRATION_PLAN.md` | Full plan for moving streets data to PostgreSQL |
| `src/hooks/useMapData.ts` | Client-side data fetching hook (add wards/candidates here) |
| `src/components/map/MapShell.tsx` | Main map container (add WardLayer + CandidatePanel here) |

## Feeder Scripts Analysis (for Postgres migration)

The feeder scripts at `github.com/icarusfall/lambeth-cyclists-street-manager` are:
- Python 3.10+ / FastAPI / async
- Notion writes are all in `src/notion/writer.py` via a single `NotionWriter` class
- Upsert pattern: query by reference ID → update or create
- Coordinates: Street Manager/D-TRO come in BNG (EPSG:27700), converted to WGS84 via pyproj
- TfL/STATS19 already in WGS84
- Migration = replace `notion.pages.create/update` with `INSERT ... ON CONFLICT DO UPDATE`
- Full details in `MIGRATION_PLAN.md`
