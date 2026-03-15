import type { CollisionRecord, CollisionSeverity } from "../types";
import { fetchAllPages } from "./paginate";
import {
  getTitle,
  getRichText,
  getSelect,
  getDate,
  getNumber,
} from "./properties";

export async function fetchCollisions(): Promise<CollisionRecord[]> {
  const dbId = process.env.NOTION_COLLISIONS_DB_ID;
  if (!dbId) throw new Error("NOTION_COLLISIONS_DB_ID not set");

  const pages = await fetchAllPages(dbId);

  return pages
    .map((page) => {
      if (!("properties" in page)) return null;
      const p = page.properties;

      const coords = getRichText(p, "Coordinates");
      if (!coords) return null;

      return {
        name: getTitle(p, "Name"),
        collisionReference: getRichText(p, "Collision Reference"),
        borough: getSelect(p, "Borough"),
        date: getDate(p, "Date"),
        time: getRichText(p, "Time"),
        severity: (getSelect(p, "Severity") || "Slight") as CollisionSeverity,
        numberOfCyclistsHurt: getNumber(p, "Number of Cyclists Hurt"),
        worstCyclistSeverity: (getSelect(p, "Worst Cyclist Severity") ||
          "Slight") as CollisionSeverity,
        otherVehicles: getRichText(p, "Other Vehicles"),
        roadName: getRichText(p, "Road Name"),
        speedLimit: getNumber(p, "Speed Limit"),
        junctionDetail: getSelect(p, "Junction Detail"),
        lightConditions: getSelect(p, "Light Conditions"),
        weather: getSelect(p, "Weather"),
        roadSurface: getSelect(p, "Road Surface"),
        coordinates: coords,
        dataYear: getRichText(p, "Data Year"),
      } satisfies CollisionRecord;
    })
    .filter((r): r is CollisionRecord => r !== null);
}
