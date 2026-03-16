"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";

const BAND_COLOURS: Record<string, string> = {
  Low: "#22C55E",
  Moderate: "#F59E0B",
  High: "#F97316",
  "Very High": "#DC2626",
};

interface Props {
  data: FeatureCollection<Point>;
  visible: boolean;
}

export default function AirQualityLayer({ data, visible }: Props) {
  if (!visible) return null;

  return (
    <Source id="air-quality" type="geojson" data={data}>
      <Layer
        id="air-quality-points"
        type="circle"
        paint={{
          "circle-color": [
            "match",
            ["get", "airQualityBand"],
            "Low",
            BAND_COLOURS.Low,
            "Moderate",
            BAND_COLOURS.Moderate,
            "High",
            BAND_COLOURS.High,
            "Very High",
            BAND_COLOURS["Very High"],
            "#6B7280",
          ],
          "circle-radius": 9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }}
      />
    </Source>
  );
}
