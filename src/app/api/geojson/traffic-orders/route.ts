import { NextResponse } from "next/server";
import { fetchTrafficOrders } from "@/lib/db/traffic-orders";
import { parseCoordinates, toFeature, toFeatureCollection } from "@/lib/geojson/convert";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const records = await fetchTrafficOrders();

    const features = records
      .map((r) => {
        const coords = parseCoordinates(r.coordinates);
        if (!coords) return null;

        return toFeature(coords, {
          dataset: "traffic-orders" as const,
          name: r.name,
          borough: r.borough,
          regulationType: r.regulationType.join(", "),
          locationDescription: r.locationDescription,
          streetName: r.streetName,
          effectiveDate: r.effectiveDate,
          endDate: r.endDate,
          actionType: r.actionType,
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
    console.error("Failed to fetch traffic orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic orders data" },
      { status: 500 }
    );
  }
}
