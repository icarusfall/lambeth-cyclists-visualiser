"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
import { IMPACT_COLOURS } from "@/lib/constants";

interface Props {
  data: FeatureCollection<Point>;
  visible: boolean;
}

export default function CollisionsLayer({ data, visible }: Props) {
  if (!visible) return null;

  return (
    <Source id="collisions" type="geojson" data={data} maxzoom={15}>
      {/* Heatmap layer — visible at low zoom, fades out at high zoom */}
      <Layer
        id="collisions-heatmap"
        type="heatmap"
        maxzoom={15}
        paint={{
          // Weight by severity
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "severityWeight"],
            0,
            0,
            1,
            1,
          ],
          // Intensity increases with zoom
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            3,
          ],
          // Colour ramp
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "rgb(103,169,207)",
            0.4,
            "rgb(209,229,240)",
            0.6,
            "rgb(253,219,199)",
            0.8,
            "rgb(239,138,98)",
            1,
            "rgb(178,24,43)",
          ],
          // Radius grows with zoom
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            2,
            15,
            20,
          ],
          // Fade out at high zoom to reveal circles
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            1,
            15,
            0,
          ],
        }}
      />

      {/* Circle layer — fades in at high zoom */}
      <Layer
        id="collisions-points"
        type="circle"
        minzoom={12}
        paint={{
          "circle-color": [
            "match",
            ["get", "severity"],
            "Fatal",
            IMPACT_COLOURS.Fatal,
            "Serious",
            IMPACT_COLOURS.Serious,
            "Slight",
            IMPACT_COLOURS.Slight,
            IMPACT_COLOURS.Slight,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            3,
            16,
            8,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            0,
            14,
            1,
          ],
        }}
      />
    </Source>
  );
}
