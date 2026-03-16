import { NextResponse } from "next/server";
import { fetchAirQuality } from "@/lib/db/air-quality";
import { parseCoordinates, toFeature, toFeatureCollection } from "@/lib/geojson/convert";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const records = await fetchAirQuality();

    const features = records
      .map((r) => {
        const coords = parseCoordinates(r.coordinates);
        if (!coords) return null;

        return toFeature(coords, {
          dataset: "air-quality" as const,
          name: r.siteName,
          siteCode: r.siteCode,
          siteType: r.siteType,
          borough: r.borough,
          speciesCode: r.speciesCode,
          readingDate: r.readingDate,
          airQualityIndex: r.airQualityIndex,
          airQualityBand: r.airQualityBand,
          indexSource: r.indexSource,
        });
      })
      .filter(Boolean);

    return NextResponse.json(toFeatureCollection(features as never[]), {
      headers: { "Content-Type": "application/geo+json" },
    });
  } catch (error) {
    console.error("Failed to fetch air quality:", error);
    return NextResponse.json(
      { error: "Failed to fetch air quality data" },
      { status: 500 }
    );
  }
}
