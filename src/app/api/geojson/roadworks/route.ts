import { NextResponse } from "next/server";
import { fetchRoadworks } from "@/lib/db/roadworks";
import { parseCoordinates, toFeature, toFeatureCollection } from "@/lib/geojson/convert";

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const records = await fetchRoadworks();

    const features = records
      .map((r) => {
        const coords = parseCoordinates(r.coordinates);
        if (!coords) return null;

        return toFeature(coords, {
          dataset: "roadworks" as const,
          name: r.name,
          borough: r.borough,
          promoter: r.promoter,
          workCategory: r.workCategory,
          trafficManagement: r.trafficManagement,
          workStatus: r.workStatus,
          proposedStart: r.proposedStart,
          proposedEnd: r.proposedEnd,
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
    console.error("Failed to fetch roadworks:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadworks data" },
      { status: 500 }
    );
  }
}
