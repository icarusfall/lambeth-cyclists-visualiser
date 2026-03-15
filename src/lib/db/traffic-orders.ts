import type { TrafficOrderRecord, TrafficOrderImpact } from "../types";
import pool from "./client";

export async function fetchTrafficOrders(): Promise<TrafficOrderRecord[]> {
  const { rows } = await pool.query(`
    SELECT
      name, dtro_id, borough, regulation_type,
      location_description, street_name,
      made_date, effective_date, end_date,
      authority, action_type,
      cycling_impact, cycling_summary, nearby_cycling_infra,
      lon, lat
    FROM traffic_orders
    WHERE lon IS NOT NULL AND lat IS NOT NULL
  `);

  return rows.map((r) => ({
    name: r.name ?? "",
    dtroId: r.dtro_id,
    borough: r.borough,
    regulationType: r.regulation_type ?? [],
    locationDescription: r.location_description ?? "",
    streetName: r.street_name ?? "",
    madeDate: r.made_date?.toISOString().slice(0, 10) ?? null,
    effectiveDate: r.effective_date?.toISOString().slice(0, 10) ?? null,
    endDate: r.end_date?.toISOString().slice(0, 10) ?? null,
    authority: r.authority ?? "",
    actionType: r.action_type ?? "",
    cyclingImpact: (r.cycling_impact ?? "Neutral") as TrafficOrderImpact,
    cyclingSummary: r.cycling_summary ?? "",
    coordinates: `${r.lon},${r.lat}`,
    nearbyInfrastructure: r.nearby_cycling_infra ?? "",
  }));
}
