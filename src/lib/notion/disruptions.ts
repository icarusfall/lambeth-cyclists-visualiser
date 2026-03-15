import type { DisruptionRecord, CyclingImpact } from "../types";
import { fetchAllPages } from "./paginate";
import {
  getTitle,
  getRichText,
  getSelect,
  getDate,
} from "./properties";

export async function fetchDisruptions(): Promise<DisruptionRecord[]> {
  const dbId = process.env.NOTION_DISRUPTIONS_DB_ID;
  if (!dbId) throw new Error("NOTION_DISRUPTIONS_DB_ID not set");

  const pages = await fetchAllPages(dbId);

  return pages
    .map((page) => {
      if (!("properties" in page)) return null;
      const p = page.properties;

      const coords = getRichText(p, "Coordinates");
      if (!coords) return null;

      return {
        name: getTitle(p, "Name"),
        disruptionId: getRichText(p, "TfL Disruption ID"),
        borough: getSelect(p, "Borough"),
        category: getSelect(p, "Category"),
        status: getSelect(p, "Status"),
        severity: getRichText(p, "Severity"),
        location: getRichText(p, "Location"),
        startTime: getDate(p, "Start Time"),
        endTime: getDate(p, "End Time"),
        description: getRichText(p, "Description"),
        cyclingImpact: (getSelect(p, "Cycling Impact") || "Minimal") as CyclingImpact,
        cyclingSummary: getRichText(p, "Cycling Summary"),
        coordinates: coords,
        nearbyInfrastructure: getRichText(p, "Nearby Cycling Infrastructure"),
      } satisfies DisruptionRecord;
    })
    .filter((r): r is DisruptionRecord => r !== null);
}
