import { NextResponse } from "next/server";
import { fetchCollisions } from "@/lib/db/collisions";
import { parseCoordinates, toFeature, toFeatureCollection } from "@/lib/geojson/convert";

export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const records = await fetchCollisions();

    const features = records
      .map((r) => {
        const coords = parseCoordinates(r.coordinates);
        if (!coords) return null;

        // Map severity to a numeric weight for the heatmap layer
        const severityWeight =
          r.severity === "Fatal" ? 1.0 : r.severity === "Serious" ? 0.6 : 0.3;

        return toFeature(coords, {
          dataset: "collisions" as const,
          name: r.name,
          borough: r.borough,
          date: r.date,
          time: r.time,
          severity: r.severity,
          worstCyclistSeverity: r.worstCyclistSeverity,
          numberOfCyclistsHurt: r.numberOfCyclistsHurt,
          otherVehicles: r.otherVehicles,
          roadName: r.roadName,
          speedLimit: r.speedLimit,
          junctionDetail: r.junctionDetail,
          lightConditions: r.lightConditions,
          weather: r.weather,
          severityWeight,
          dataYear: r.dataYear,
        });
      })
      .filter(Boolean);

    return NextResponse.json(toFeatureCollection(features as never[]), {
      headers: { "Content-Type": "application/geo+json" },
    });
  } catch (error) {
    console.error("Failed to fetch collisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch collisions data" },
      { status: 500 }
    );
  }
}
