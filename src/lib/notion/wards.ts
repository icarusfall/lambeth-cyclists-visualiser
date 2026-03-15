import { fetchAllPages } from "./paginate";
import {
  getTitle,
  getRichText,
  getSelect,
  getMultiSelect,
  getNumber,
} from "./properties";

export interface WardRecord {
  wardName: string;
  priority: string;
  competitiveness: string;
  status: string;
  margin2022: number | null;
  cyclingIssues: string[];
  notes: string;
}

export async function fetchWards(): Promise<WardRecord[]> {
  const dbId = process.env.NOTION_WARDS_DB_ID;
  if (!dbId) throw new Error("NOTION_WARDS_DB_ID not set");

  const pages = await fetchAllPages(dbId);

  return pages
    .map((page) => {
      if (!("properties" in page)) return null;
      const p = page.properties;

      const wardName = getTitle(p, "Ward Name");
      if (!wardName) return null;

      return {
        wardName,
        priority: getSelect(p, "Priority") || "Low",
        competitiveness: getSelect(p, "Competitiveness") || "",
        status: getSelect(p, "Status") || "",
        margin2022: getNumber(p, "2022 Margin") || null,
        cyclingIssues: getMultiSelect(p, "Cycling Issues"),
        notes: getRichText(p, "Notes"),
      } satisfies WardRecord;
    })
    .filter((r): r is WardRecord => r !== null);
}
