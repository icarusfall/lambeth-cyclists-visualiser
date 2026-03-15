import type { RoadworkRecord, CyclingImpact } from "../types";
import pool from "./client";

export async function fetchRoadworks(): Promise<RoadworkRecord[]> {
  const { rows } = await pool.query(`
    SELECT
      name, permit_reference, borough, street_name, promoter,
      work_category, traffic_management, work_status,
      proposed_start, proposed_end, actual_start,
      cycling_impact, cycling_summary, nearby_cycling_infra,
      lon, lat
    FROM roadworks
    WHERE lon IS NOT NULL AND lat IS NOT NULL
  `);

  return rows.map((r) => ({
    name: r.name ?? "",
    permitReference: r.permit_reference,
    borough: r.borough,
    streetName: r.street_name ?? "",
    promoter: r.promoter ?? "",
    workCategory: r.work_category ?? "",
    trafficManagement: r.traffic_management ?? "",
    workStatus: r.work_status ?? "",
    proposedStart: r.proposed_start?.toISOString().slice(0, 10) ?? null,
    proposedEnd: r.proposed_end?.toISOString().slice(0, 10) ?? null,
    actualStart: r.actual_start?.toISOString().slice(0, 10) ?? null,
    cyclingImpact: (r.cycling_impact ?? "Minimal") as CyclingImpact,
    cyclingSummary: r.cycling_summary ?? "",
    coordinates: `${r.lon},${r.lat}`,
    nearbyInfrastructure: r.nearby_cycling_infra ?? "",
  }));
}
