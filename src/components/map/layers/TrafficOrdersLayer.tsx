"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import { IMPACT_COLOURS } from "@/lib/constants";

interface Props {
  data: FeatureCollection<Point>;
  visible: boolean;
}

export default function TrafficOrdersLayer({ data, visible }: Props) {
  if (!visible) return null;

  return (
    <Source
      id="traffic-orders"
      type="geojson"
      data={data}
      cluster
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      <Layer
        id="traffic-orders-clusters"
        type="circle"
        filter={["has", "point_count"]}
        paint={{
          "circle-color": IMPACT_COLOURS["Needs Review"],
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
        id="traffic-orders-cluster-count"
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
        id="traffic-orders-points"
        type="circle"
        filter={["!", ["has", "point_count"]]}
        paint={{
          "circle-color": [
            "match",
            ["get", "cyclingImpact"],
            "Positive",
            IMPACT_COLOURS.Positive,
            "Negative",
            IMPACT_COLOURS.Negative,
            "Neutral",
            IMPACT_COLOURS.Neutral,
            "Needs Review",
            IMPACT_COLOURS["Needs Review"],
            IMPACT_COLOURS.Neutral,
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }}
      />
    </Source>
  );
}
