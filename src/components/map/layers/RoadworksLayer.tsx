"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import { IMPACT_COLOURS } from "@/lib/constants";

interface Props {
  data: FeatureCollection<Point>;
  visible: boolean;
}

export default function RoadworksLayer({ data, visible }: Props) {
  if (!visible) return null;

  return (
    <Source
      id="roadworks"
      type="geojson"
      data={data}
      cluster
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      {/* Cluster circles */}
      <Layer
        id="roadworks-clusters"
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": IMPACT_COLOURS.High,
          "circle-opacity": 0.8,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15, // radius for count < 10
            10,
            20, // radius for count < 50
            50,
            25, // radius for count >= 50
          ],
        }}
      />

      {/* Cluster count labels */}
      <Layer
        id="roadworks-cluster-count"
        type="symbol"
        filter={["has", "point_count"]}
        layout={{
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        }}
        paint={{
          "text-color": "#ffffff",
        }}
      />

      {/* Individual points */}
      <Layer
        id="roadworks-points"
        type="circle"
        filter={["!", ["has", "point_count"]]}
        paint={{
          "circle-color": [
            "match",
            ["get", "cyclingImpact"],
            "High",
            IMPACT_COLOURS.High,
            "Medium",
            IMPACT_COLOURS.Medium,
            "Low",
            IMPACT_COLOURS.Low,
            "Minimal",
            IMPACT_COLOURS.Minimal,
            IMPACT_COLOURS.Minimal,
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }}
      />
    </Source>
  );
}
