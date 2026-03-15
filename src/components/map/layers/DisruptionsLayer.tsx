"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import { DISRUPTION_COLOURS } from "@/lib/constants";

interface Props {
  data: FeatureCollection<Point>;
  visible: boolean;
}

export default function DisruptionsLayer({ data, visible }: Props) {
  if (!visible) return null;

  return (
    <Source
      id="disruptions"
      type="geojson"
      data={data}
      cluster
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      <Layer
        id="disruptions-clusters"
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": DISRUPTION_COLOURS.High,
          "circle-opacity": 0.8,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15,
            10,
            20,
            50,
            25,
          ],
        }}
      />

      <Layer
        id="disruptions-cluster-count"
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

      <Layer
        id="disruptions-points"
        type="circle"
        filter={["!", ["has", "point_count"]]}
        paint={{
          "circle-color": [
            "match",
            ["get", "cyclingImpact"],
            "High",
            DISRUPTION_COLOURS.High,
            "Medium",
            DISRUPTION_COLOURS.Medium,
            "Low",
            DISRUPTION_COLOURS.Low,
            "Minimal",
            DISRUPTION_COLOURS.Minimal,
            DISRUPTION_COLOURS.Minimal,
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }}
      />
    </Source>
  );
}
