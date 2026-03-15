import type { WardRecord } from "./notion/wards";
import type { CandidateRecord } from "./notion/candidates";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";

/** Normalise ward names: "and" ↔ "&", trim, lowercase for matching. */
export function normaliseWardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Party colours for UK political parties. */
export const PARTY_COLOURS: Record<string, string> = {
  Labour: "#DC241F",
  Conservative: "#0087DC",
  "Liberal Democrat": "#FAA61A",
  "Liberal Democrats": "#FAA61A",
  "Lib Dem": "#FAA61A",
  Green: "#6AB023",
  "Green Party": "#6AB023",
  Independent: "#DDDDDD",
  "": "#9CA3AF",
};

export function getPartyColour(party: string): string {
  // Try exact match first, then partial
  if (PARTY_COLOURS[party]) return PARTY_COLOURS[party];
  const lower = party.toLowerCase();
  for (const [key, colour] of Object.entries(PARTY_COLOURS)) {
    if (lower.includes(key.toLowerCase())) return colour;
  }
  return "#9CA3AF";
}

/** Get margin colour — more marginal = darker brown, safer = paler grey */
export function getMarginColour(margin: number | null): string {
  if (margin === null) return "#D1D5DB";
  const pct = Math.abs(margin);
  if (pct < 5) return "#4A2C17";   // very marginal — dark brown
  if (pct < 10) return "#78502B";
  if (pct < 15) return "#A67B4E";
  if (pct < 20) return "#CDAE8A";
  return "#E8E0D8";                 // safe seat — pale grey/taupe
}

export type ColourMode = "party" | "margin";

export interface EnrichedWardFeature {
  wardName: string;
  ward: WardRecord | null;
  currentParty: string;
  currentCouncillors: CandidateRecord[];
  allCandidates: CandidateRecord[];
  fillColour: Record<ColourMode, string>;
}

/** Merge GeoJSON features with Notion ward + candidate data. */
export function enrichWardFeatures(
  geojson: FeatureCollection<Polygon | MultiPolygon>,
  wards: WardRecord[],
  candidates: CandidateRecord[]
): FeatureCollection<Polygon | MultiPolygon, EnrichedWardFeature> {
  // Build lookup maps
  const wardMap = new Map<string, WardRecord>();
  for (const w of wards) {
    wardMap.set(normaliseWardName(w.wardName), w);
  }

  const candidatesByWard = new Map<string, CandidateRecord[]>();
  for (const c of candidates) {
    const key = normaliseWardName(c.wardName);
    if (!candidatesByWard.has(key)) candidatesByWard.set(key, []);
    candidatesByWard.get(key)!.push(c);
  }

  const features = geojson.features.map((feature) => {
    const rawName = feature.properties?.WD22NM ?? "";
    const key = normaliseWardName(rawName);
    const ward = wardMap.get(key) ?? null;
    const allCandidates = candidatesByWard.get(key) ?? [];

    // Derive current party from councillors
    const currentCouncillors = allCandidates.filter(
      (c) => c.status.toLowerCase().includes("current councillor") ||
             c.status.toLowerCase().includes("incumbent")
    );
    // Most common party among current councillors
    const partyCounts = new Map<string, number>();
    for (const c of currentCouncillors) {
      partyCounts.set(c.party, (partyCounts.get(c.party) ?? 0) + 1);
    }
    let currentParty = "";
    let maxCount = 0;
    for (const [party, count] of partyCounts) {
      if (count > maxCount) {
        currentParty = party;
        maxCount = count;
      }
    }

    const margin = ward?.margin2022 ?? null;

    const properties: EnrichedWardFeature = {
      wardName: rawName,
      ward,
      currentParty,
      currentCouncillors,
      allCandidates,
      fillColour: {
        party: getPartyColour(currentParty),
        margin: getMarginColour(margin),
      },
    };

    return {
      ...feature,
      properties,
    } as Feature<Polygon | MultiPolygon, EnrichedWardFeature>;
  });

  return { type: "FeatureCollection", features };
}
