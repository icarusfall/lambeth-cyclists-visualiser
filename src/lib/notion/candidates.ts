import { getNotionClient } from "./client";
import { fetchAllPages } from "./paginate";
import {
  getTitle,
  getRichText,
  getSelect,
  getDate,
} from "./properties";

export interface CandidateRecord {
  name: string;
  party: string;
  status: string;
  engagementLevel: string;
  positionOnCycling: string;
  lastContact: string | null;
  contactDetails: string;
  nextAction: string;
  wardName: string; // Resolved from relation
}

/**
 * Resolve a Notion relation to get the ward name.
 * Candidates have a "Ward" relation pointing to the Wards database.
 */
async function resolveWardRelations(
  candidatePages: Array<{ properties: Record<string, unknown> }>
): Promise<Map<string, string>> {
  const notion = getNotionClient();
  const wardCache = new Map<string, string>();

  // Collect all unique ward page IDs from all relation fields
  const wardPageIds = new Set<string>();
  for (const page of candidatePages) {
    const p = page.properties as Record<string, { type: string; relation?: Array<{ id: string }> }>;

    // Check multiple possible relation fields
    for (const key of ["Ward", "Related to Wards (Current Councillors)", "Related to Wards (Declared Candidates 2026)"]) {
      const rel = p[key];
      if (rel?.type === "relation" && rel.relation) {
        for (const r of rel.relation) {
          wardPageIds.add(r.id);
        }
      }
    }
  }

  // Resolve ward names in batch
  for (const pageId of wardPageIds) {
    if (wardCache.has(pageId)) continue;
    try {
      const page = await notion.pages.retrieve({ page_id: pageId });
      if ("properties" in page) {
        const titleProp = page.properties["Ward Name"];
        if (titleProp && "title" in titleProp) {
          const name = (titleProp.title as Array<{ plain_text: string }>)
            .map((t) => t.plain_text)
            .join("");
          wardCache.set(pageId, name);
        }
      }
    } catch {
      // Skip unresolvable relations
    }
  }

  return wardCache;
}

export async function fetchCandidates(): Promise<CandidateRecord[]> {
  const dbId = process.env.NOTION_CANDIDATES_DB_ID;
  if (!dbId) throw new Error("NOTION_CANDIDATES_DB_ID not set");

  const pages = await fetchAllPages(dbId);

  // Resolve ward relations
  const pagesWithProps = pages.filter(
    (p): p is typeof p & { properties: Record<string, unknown> } =>
      "properties" in p
  );

  const wardCache = await resolveWardRelations(
    pagesWithProps as Array<{ properties: Record<string, unknown> }>
  );

  return pagesWithProps
    .map((page) => {
      const p = page.properties;
      const name = getTitle(p, "Name");
      if (!name) return null;

      // Find ward name from any relation field
      let wardName = "";
      const props = p as Record<string, { type: string; relation?: Array<{ id: string }> }>;
      for (const key of ["Ward", "Related to Wards (Current Councillors)", "Related to Wards (Declared Candidates 2026)"]) {
        const rel = props[key];
        if (rel?.type === "relation" && rel.relation?.length) {
          const resolved = wardCache.get(rel.relation[0].id);
          if (resolved) {
            wardName = resolved;
            break;
          }
        }
      }

      return {
        name,
        party: getSelect(p, "Party") || "",
        status: getSelect(p, "Status") || "",
        engagementLevel: getSelect(p, "Engagement Level") || "",
        positionOnCycling: getRichText(p, "Position on Cycling"),
        lastContact: getDate(p, "Last Contact"),
        contactDetails: getRichText(p, "Contact Details"),
        nextAction: getRichText(p, "Next Action"),
        wardName,
      } satisfies CandidateRecord;
    })
    .filter((r): r is CandidateRecord => r !== null);
}
