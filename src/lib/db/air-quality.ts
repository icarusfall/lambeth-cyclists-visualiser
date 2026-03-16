import type { AirQualityRecord, AirQualityBand } from "../types";
import pool from "./client";

export async function fetchAirQuality(): Promise<AirQualityRecord[]> {
  const { rows } = await pool.query(`
    SELECT
      site_code, site_name, site_type, borough,
      species_code, reading_date,
      air_quality_index, air_quality_band, index_source,
      lon, lat
    FROM air_quality
    WHERE lon IS NOT NULL AND lat IS NOT NULL
      AND reading_date = (SELECT MAX(reading_date) FROM air_quality)
  `);

  return rows.map((r) => ({
    siteCode: r.site_code,
    siteName: r.site_name ?? "",
    siteType: r.site_type ?? "",
    borough: r.borough,
    speciesCode: r.species_code,
    readingDate: r.reading_date?.toISOString().slice(0, 10) ?? null,
    airQualityIndex: r.air_quality_index,
    airQualityBand: (r.air_quality_band ?? null) as AirQualityBand | null,
    indexSource: r.index_source ?? "",
    coordinates: `${r.lon},${r.lat}`,
  }));
}
