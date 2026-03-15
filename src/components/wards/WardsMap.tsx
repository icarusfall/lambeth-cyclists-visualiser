"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Map, { Source, Layer, NavigationControl, type MapMouseEvent } from "react-map-gl/mapbox";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { useWardsData } from "@/hooks/useWardsData";
import {
  enrichWardFeatures,
  type ColourMode,
  type EnrichedWardFeature,
} from "@/lib/ward-utils";
import WardPanel from "./WardPanel";

const LAMBETH_CENTER = { longitude: -0.118, latitude: 51.457 };

export default function WardsMap() {
  const { wards, candidates, loading, error } = useWardsData();
  const [boundaryGeoJson, setBoundaryGeoJson] = useState<FeatureCollection<
    Polygon | MultiPolygon
  > | null>(null);
  const [colourMode, setColourMode] = useState<ColourMode>("party");
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);

  // Load static ward boundary GeoJSON
  useEffect(() => {
    fetch("/data/lambeth-wards.geojson")
      .then((r) => r.json())
      .then(setBoundaryGeoJson)
      .catch(console.error);
  }, []);

  // Merge boundary GeoJSON with Notion data
  const enrichedGeoJson = useMemo(() => {
    if (!boundaryGeoJson || !wards.length) return null;
    return enrichWardFeatures(boundaryGeoJson, wards, candidates);
  }, [boundaryGeoJson, wards, candidates]);

  // Build the Mapbox-compatible GeoJSON with flat properties for styling
  const mapGeoJson = useMemo(() => {
    if (!enrichedGeoJson) return null;
    return {
      type: "FeatureCollection" as const,
      features: enrichedGeoJson.features.map((f) => ({
        ...f,
        properties: {
          wardName: f.properties.wardName,
          fillColour: f.properties.fillColour[colourMode],
          currentParty: f.properties.currentParty,
          margin: f.properties.ward?.margin2022 ?? null,
        },
      })),
    };
  }, [enrichedGeoJson, colourMode]);

  const selectedWardData = useMemo(() => {
    if (!enrichedGeoJson || !selectedWard) return null;
    return enrichedGeoJson.features.find(
      (f) => f.properties.wardName === selectedWard
    )?.properties ?? null;
  }, [enrichedGeoJson, selectedWard]);

  const onClick = useCallback(
    (event: MapMouseEvent) => {
      const feature = event.features?.[0];
      if (feature?.properties?.wardName) {
        setSelectedWard(feature.properties.wardName as string);
      } else {
        setSelectedWard(null);
      }
    },
    []
  );

  const onMouseMove = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    setHoveredWard(
      feature?.properties?.wardName
        ? (feature.properties.wardName as string)
        : null
    );
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoveredWard(null);
  }, []);

  return (
    <div className="h-full w-full flex">
      {/* Map area */}
      <div className="flex-1 relative">
        {/* Controls overlay */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Colour by</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="radio"
              name="colourMode"
              checked={colourMode === "party"}
              onChange={() => setColourMode("party")}
            />
            Current party
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="radio"
              name="colourMode"
              checked={colourMode === "margin"}
              onChange={() => setColourMode("margin")}
            />
            2022 margin (marginality)
          </label>
        </div>

        {/* Hover tooltip */}
        {hoveredWard && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2">
            <p className="text-sm font-medium text-gray-800">{hoveredWard}</p>
          </div>
        )}

        {/* Loading / error states */}
        {(loading || !mapGeoJson) && !error && (
          <div className="absolute top-4 right-16 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg px-4 py-2">
            <p className="text-sm text-gray-600 animate-pulse">Loading ward data...</p>
          </div>
        )}
        {error && (
          <div className="absolute top-4 right-16 z-10 bg-red-50 border border-red-200 rounded-lg shadow-lg px-4 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={{
            ...LAMBETH_CENTER,
            zoom: 12.5,
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onClick={onClick}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          interactiveLayerIds={["ward-fill"]}
          style={{ width: "100%", height: "100%" }}
          maxZoom={16}
          minZoom={10}
          cursor={hoveredWard ? "pointer" : "auto"}
        >
          <NavigationControl position="top-right" />

          {mapGeoJson && (
            <Source id="wards" type="geojson" data={mapGeoJson}>
              {/* Filled polygons */}
              <Layer
                id="ward-fill"
                type="fill"
                paint={{
                  "fill-color": ["get", "fillColour"],
                  "fill-opacity": [
                    "case",
                    ["==", ["get", "wardName"], selectedWard ?? ""],
                    0.7,
                    ["==", ["get", "wardName"], hoveredWard ?? ""],
                    0.55,
                    0.4,
                  ],
                }}
              />

              {/* Ward borders */}
              <Layer
                id="ward-border"
                type="line"
                paint={{
                  "line-color": [
                    "case",
                    ["==", ["get", "wardName"], selectedWard ?? ""],
                    "#1F2937",
                    "#6B7280",
                  ],
                  "line-width": [
                    "case",
                    ["==", ["get", "wardName"], selectedWard ?? ""],
                    2.5,
                    1,
                  ],
                }}
              />

              {/* Ward name labels */}
              <Layer
                id="ward-labels"
                type="symbol"
                layout={{
                  "text-field": ["get", "wardName"],
                  "text-size": 11,
                  "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                  "text-anchor": "center",
                  "text-max-width": 8,
                }}
                paint={{
                  "text-color": "#1F2937",
                  "text-halo-color": "#FFFFFF",
                  "text-halo-width": 1.5,
                }}
              />
            </Source>
          )}
        </Map>
      </div>

      {/* Side panel */}
      {selectedWardData && (
        <WardPanel
          data={selectedWardData}
          onClose={() => setSelectedWard(null)}
        />
      )}
    </div>
  );
}
