import type { RoadworkRecord, CyclingImpact } from "../types";
import { fetchAllPages } from "./paginate";
import {
  getTitle,
  getRichText,
  getSelect,
  getDate,
} from "./properties";

export async function fetchRoadworks(): Promise<RoadworkRecord[]> {
  const dbId = process.env.NOTION_ROADWORKS_DB_ID;
  if (!dbId) throw new Error("NOTION_ROADWORKS_DB_ID not set");

  const pages = await fetchAllPages(dbId);

  return pages
    .map((page) => {
      if (!("properties" in page)) return null;
      const p = page.properties;

      const coords = getRichText(p, "Coordinates");
      if (!coords) return null;

      return {
        name: getTitle(p, "Name"),
        permitReference: getRichText(p, "Permit Reference"),
        borough: getSelect(p, "Borough"),
        streetName: getRichText(p, "Street Name"),
        promoter: getRichText(p, "Promoter"),
        workCategory: getSelect(p, "Work Category"),
        trafficManagement: getSelect(p, "Traffic Management"),
        workStatus: getSelect(p, "Work Status"),
        proposedStart: getDate(p, "Proposed Start"),
        proposedEnd: getDate(p, "Proposed End"),
        actualStart: getDate(p, "Actual Start"),
        cyclingImpact: (getSelect(p, "Cycling Impact") || "Minimal") as CyclingImpact,
        cyclingSummary: getRichText(p, "Cycling Summary"),
        coordinates: coords,
        nearbyInfrastructure: getRichText(p, "Nearby Cycling Infrastructure"),
      } satisfies RoadworkRecord;
    })
    .filter((r): r is RoadworkRecord => r !== null);
}
