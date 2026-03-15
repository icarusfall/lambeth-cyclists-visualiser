import type { TrafficOrderRecord, TrafficOrderImpact } from "../types";
import { fetchAllPages } from "./paginate";
import {
  getTitle,
  getRichText,
  getSelect,
  getMultiSelect,
  getDate,
} from "./properties";

export async function fetchTrafficOrders(): Promise<TrafficOrderRecord[]> {
  const dbId = process.env.NOTION_TRAFFIC_ORDERS_DB_ID;
  if (!dbId) throw new Error("NOTION_TRAFFIC_ORDERS_DB_ID not set");

  const pages = await fetchAllPages(dbId);

  return pages
    .map((page) => {
      if (!("properties" in page)) return null;
      const p = page.properties;

      const coords = getRichText(p, "Coordinates");
      if (!coords) return null;

      return {
        name: getTitle(p, "Name"),
        dtroId: getRichText(p, "D-TRO ID"),
        borough: getSelect(p, "Borough"),
        regulationType: getMultiSelect(p, "Regulation Type"),
        locationDescription: getRichText(p, "Location Description"),
        streetName: getRichText(p, "Street Name"),
        madeDate: getDate(p, "Made Date"),
        effectiveDate: getDate(p, "Effective Date"),
        endDate: getDate(p, "End Date"),
        authority: getRichText(p, "Authority"),
        actionType: getSelect(p, "Action Type"),
        cyclingImpact: (getSelect(p, "Cycling Impact") ||
          "Neutral") as TrafficOrderImpact,
        cyclingSummary: getRichText(p, "Cycling Summary"),
        coordinates: coords,
        nearbyInfrastructure: getRichText(p, "Nearby Cycling Infrastructure"),
      } satisfies TrafficOrderRecord;
    })
    .filter((r): r is TrafficOrderRecord => r !== null);
}
