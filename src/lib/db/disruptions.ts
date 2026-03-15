import type { DisruptionRecord, CyclingImpact } from "../types";
import pool from "./client";

export async function fetchDisruptions(): Promise<DisruptionRecord[]> {
  const { rows } = await pool.query(`
    SELECT
      name, disruption_id, borough, category, sub_category,
      status, severity, location_desc, corridors,
      start_time, end_time, description,
      cycling_impact, cycling_summary, nearby_cycling_infra,
      lon, lat
    FROM disruptions
    WHERE lon IS NOT NULL AND lat IS NOT NULL
  `);

  return rows.map((r) => ({
    name: r.name ?? "",
    disruptionId: r.disruption_id,
    borough: r.borough,
    category: r.category ?? "",
    status: r.status ?? "",
    severity: r.severity ?? "",
    location: r.location_desc ?? "",
    startTime: r.start_time?.toISOString() ?? null,
    endTime: r.end_time?.toISOString() ?? null,
    description: r.description ?? "",
    cyclingImpact: (r.cycling_impact ?? "Minimal") as CyclingImpact,
    cyclingSummary: r.cycling_summary ?? "",
    coordinates: `${r.lon},${r.lat}`,
    nearbyInfrastructure: r.nearby_cycling_infra ?? "",
  }));
}
