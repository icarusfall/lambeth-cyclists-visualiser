import type { CollisionRecord, CollisionSeverity } from "../types";
import pool from "./client";

export async function fetchCollisions(): Promise<CollisionRecord[]> {
  const { rows } = await pool.query(`
    SELECT
      name, collision_reference, borough, date, time,
      severity, number_of_cyclists_hurt, worst_cyclist_severity,
      other_vehicles, road_name, speed_limit,
      junction_detail, light_conditions, weather, road_surface,
      data_year, lon, lat
    FROM collisions
    WHERE lon IS NOT NULL AND lat IS NOT NULL
  `);

  return rows.map((r) => ({
    name: r.name ?? "",
    collisionReference: r.collision_reference,
    borough: r.borough,
    date: r.date?.toISOString().slice(0, 10) ?? null,
    time: r.time ?? "",
    severity: (r.severity ?? "Slight") as CollisionSeverity,
    numberOfCyclistsHurt: r.number_of_cyclists_hurt ?? 0,
    worstCyclistSeverity: (r.worst_cyclist_severity ?? "Slight") as CollisionSeverity,
    otherVehicles: r.other_vehicles ?? "",
    roadName: r.road_name ?? "",
    speedLimit: r.speed_limit ?? 0,
    junctionDetail: r.junction_detail ?? "",
    lightConditions: r.light_conditions ?? "",
    weather: r.weather ?? "",
    roadSurface: r.road_surface ?? "",
    coordinates: `${r.lon},${r.lat}`,
    dataYear: r.data_year ?? "",
  }));
}
