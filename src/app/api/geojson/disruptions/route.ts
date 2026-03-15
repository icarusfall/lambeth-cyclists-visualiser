import { NextResponse } from "next/server";
import { fetchDisruptions } from "@/lib/db/disruptions";
import { parseCoordinates, toFeature, toFeatureCollection } from "@/lib/geojson/convert";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const records = await fetchDisruptions();

    const features = records
      .map((r) => {
        const coords = parseCoordinates(r.coordinates);
        if (!coords) return null;

        return toFeature(coords, {
          dataset: "disruptions" as const,
          name: r.name,
          borough: r.borough,
          category: r.category,
          status: r.status,
          severity: r.severity,
          location: r.location,
          startTime: r.startTime,
          endTime: r.endTime,
          cyclingImpact: r.cyclingImpact,
          cyclingSummary: r.cyclingSummary,
          nearbyInfrastructure: r.nearbyInfrastructure,
        });
      })
      .filter(Boolean);

    return NextResponse.json(toFeatureCollection(features as never[]), {
      headers: { "Content-Type": "application/geo+json" },
    });
  } catch (error) {
    console.error("Failed to fetch disruptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch disruptions data" },
      { status: 500 }
    );
  }
}
