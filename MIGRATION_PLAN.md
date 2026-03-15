# Migration Plan: Notion → PostgreSQL + PostGIS

## Summary

Migrate the 4 machine-generated datasets (Roadworks, TfL Disruptions, Collisions, Traffic Orders) from Notion to PostgreSQL + PostGIS on Railway. Keep Notion for human-collaboration data (candidates, wards, meetings, projects, emails).

## Why

- **Notion pagination is sequential** — 3,800 roadworks = 38 pages at 3 req/s = ~13s minimum per query
- **No spatial indexing** — every query fetches everything; can't do "roadworks within 500m of my route"
- **Rate limiting** — 3 req/s shared across all API consumers
- **PostGIS solves all of this** — spatial indexes, bounding box queries, sub-100ms responses, SQL aggregation

## Current Architecture (lambeth-cyclists-street-manager)

```
External APIs → pipeline.py → notion/writer.py → Notion databases
                                    │
                                    ├── notion.pages.create()
                                    ├── notion.pages.update()
                                    └── notion.databases.query() (dedup check)
```

- **Language**: Python 3.10+, FastAPI, async throughout
- **Notion SDK**: notion-client 2.2.1
- **Key file**: `src/notion/writer.py` — single class `NotionWriter` handles all 4 databases
- **Upsert pattern**: Query by reference ID → update if exists, create if not
- **Coordinates**: Stored as "lon,lat" strings in Notion rich_text fields
- **Dedup**: In-memory cache per database, plus Notion query fallback

## Target Architecture

```
External APIs → pipeline.py → db/writer.py → PostgreSQL + PostGIS (Railway)
                                                    │
                                          Visualiser API routes query here
```

## Database Schema

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Roadworks
CREATE TABLE roadworks (
    id              SERIAL PRIMARY KEY,
    permit_reference TEXT UNIQUE NOT NULL,
    name            TEXT,
    borough         TEXT NOT NULL,
    street_name     TEXT,
    promoter        TEXT,
    work_category   TEXT,
    traffic_management TEXT,
    work_status     TEXT,
    proposed_start  DATE,
    proposed_end    DATE,
    actual_start    DATE,
    ttro_required   BOOLEAN DEFAULT FALSE,
    cycling_impact  TEXT CHECK (cycling_impact IN ('High','Medium','Low','Minimal')),
    cycling_summary TEXT,
    nearby_infrastructure TEXT,
    location        GEOMETRY(Point, 4326) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_roadworks_location ON roadworks USING GIST (location);
CREATE INDEX idx_roadworks_borough ON roadworks (borough);
CREATE INDEX idx_roadworks_impact ON roadworks (cycling_impact);
CREATE INDEX idx_roadworks_status ON roadworks (work_status);

-- TfL Disruptions
CREATE TABLE disruptions (
    id              SERIAL PRIMARY KEY,
    disruption_id   TEXT UNIQUE NOT NULL,
    name            TEXT,
    borough         TEXT NOT NULL,
    category        TEXT,
    sub_category    TEXT,
    status          TEXT,
    severity        TEXT,
    location_desc   TEXT,
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    description     TEXT,
    cycling_impact  TEXT CHECK (cycling_impact IN ('High','Medium','Low','Minimal')),
    cycling_summary TEXT,
    nearby_infrastructure TEXT,
    location        GEOMETRY(Point, 4326) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_disruptions_location ON disruptions USING GIST (location);
CREATE INDEX idx_disruptions_borough ON disruptions (borough);

-- Cycling Collisions (STATS19)
CREATE TABLE collisions (
    id                      SERIAL PRIMARY KEY,
    collision_reference     TEXT UNIQUE NOT NULL,
    name                    TEXT,
    borough                 TEXT NOT NULL,
    date                    DATE,
    time                    TEXT,
    severity                TEXT CHECK (severity IN ('Fatal','Serious','Slight')),
    number_of_cyclists_hurt INTEGER DEFAULT 0,
    worst_cyclist_severity  TEXT,
    other_vehicles          TEXT,
    road_name               TEXT,
    speed_limit             INTEGER,
    junction_detail         TEXT,
    light_conditions        TEXT,
    weather                 TEXT,
    road_surface            TEXT,
    data_year               TEXT,
    location                GEOMETRY(Point, 4326) NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_collisions_location ON collisions USING GIST (location);
CREATE INDEX idx_collisions_borough ON collisions (borough);
CREATE INDEX idx_collisions_severity ON collisions (severity);
CREATE INDEX idx_collisions_date ON collisions (date);

-- Traffic Orders (D-TRO)
CREATE TABLE traffic_orders (
    id                  SERIAL PRIMARY KEY,
    dtro_id             TEXT UNIQUE NOT NULL,
    name                TEXT,
    borough             TEXT NOT NULL,
    regulation_type     TEXT[],
    location_description TEXT,
    street_name         TEXT,
    made_date           DATE,
    effective_date      DATE,
    end_date            DATE,
    authority           TEXT,
    action_type         TEXT,
    cycling_impact      TEXT CHECK (cycling_impact IN ('Positive','Negative','Neutral','Needs Review')),
    cycling_summary     TEXT,
    nearby_infrastructure TEXT,
    location            GEOMETRY(Point, 4326) NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_traffic_orders_location ON traffic_orders USING GIST (location);
CREATE INDEX idx_traffic_orders_borough ON traffic_orders (borough);
```

## Migration Steps

### Phase 1: Set up PostgreSQL on Railway (~30 min)

1. Add a PostgreSQL plugin to the existing Railway project
2. Enable PostGIS extension
3. Run the schema SQL above
4. Note the `DATABASE_URL` connection string

### Phase 2: Add database writer to feeder scripts (~2 hours)

The current `src/notion/writer.py` has a clean `NotionWriter` class with methods:
- `upsert_roadwork(data)`
- `upsert_disruption(data)`
- `upsert_collision(data)`
- `upsert_traffic_order(data)`

Create a parallel `src/db/writer.py` with a `DatabaseWriter` class that:
- Uses `asyncpg` for async PostgreSQL access
- Mirrors the same upsert methods
- Uses `INSERT ... ON CONFLICT (reference_id) DO UPDATE` instead of query-then-create
- Converts coordinates to PostGIS `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`
- Connection pooling via `asyncpg.create_pool()`

**Key dependency changes in pyproject.toml:**
```
asyncpg >= 0.30.0
```

### Phase 3: Wire into pipeline.py (~30 min)

`src/pipeline.py` currently calls `self.notion_writer.upsert_*()`. Change to:
- Call `self.db_writer.upsert_*()` as primary
- Optionally keep Notion writes behind a `WRITE_TO_NOTION=true` flag for transition period

### Phase 4: Backfill existing data (~1 hour)

Write a one-time script `scripts/backfill_postgres.py` that:
1. Reads all records from the 4 Notion databases (paginating through everything)
2. Inserts into PostgreSQL
3. Reports counts and any coordinate parsing failures

This reuses the existing `notion/writer.py` query methods and the new `db/writer.py` insert methods.

### Phase 5: Update visualiser API routes (~1 hour)

Replace the `src/lib/notion/*.ts` fetchers in the visualiser with direct PostgreSQL queries:

```typescript
// lib/db/client.ts
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

Each Route Handler becomes a single SQL query returning GeoJSON:
```sql
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
        json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(location)::json,
            'properties', json_build_object(
                'name', name,
                'borough', borough,
                'cyclingImpact', cycling_impact,
                'cyclingSummary', cycling_summary
                -- etc
            )
        )
    ), '[]'::json)
) FROM roadworks;
```

This returns a complete GeoJSON FeatureCollection in a single query, ~50ms instead of ~13 seconds.

### Phase 6: Remove Notion dependencies (~30 min)

- Remove `notion-client` from pyproject.toml
- Remove `src/notion/` directory
- Remove `@notionhq/client` from visualiser package.json
- Remove `src/lib/notion/` directory from visualiser
- Update environment variables

## Risk Mitigation

- **Transition period**: Run both Notion and Postgres writes simultaneously for 1 week
- **Backfill verification**: Compare record counts between Notion and Postgres
- **Rollback**: Keep Notion integration behind a feature flag until confident

## Timeline Estimate

- **Phase 1-3**: Half a day (feeder script changes)
- **Phase 4**: 1 hour (one-time backfill)
- **Phase 5**: 1 hour (visualiser API route updates)
- **Phase 6**: 30 minutes (cleanup)

**Total: ~1 day of Claude-assisted work**

## What Stays on Notion

- Wards & Candidates (human-annotated election data)
- Lambeth Cyclists meetings
- Projects
- Email items
- Any future tables where collaboration/annotation is the point
