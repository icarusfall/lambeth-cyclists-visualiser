"use client";

import { useState, useCallback } from "react";
import { Popup, type MapMouseEvent } from "react-map-gl/mapbox";
import MapProvider from "./MapProvider";
import RoadworksLayer from "./layers/RoadworksLayer";
import DisruptionsLayer from "./layers/DisruptionsLayer";
import CollisionsLayer from "./layers/CollisionsLayer";
import TrafficOrdersLayer from "./layers/TrafficOrdersLayer";
import { useMapData } from "@/hooks/useMapData";
import type { DatasetId } from "@/lib/types";

const DATASET_LABELS: Record<DatasetId, string> = {
  roadworks: "Roadworks",
  disruptions: "TfL Disruptions",
  collisions: "Collisions",
  "traffic-orders": "Traffic Orders",
};

const CLICKABLE_LAYERS = [
  "roadworks-points",
  "disruptions-points",
  "collisions-points",
  "traffic-orders-points",
];

interface PopupInfo {
  longitude: number;
  latitude: number;
  properties: Record<string, string | number | boolean | null | undefined>;
}

export default function MapShell() {
  const { data, loading, errors } = useMapData();
  const [visibleLayers, setVisibleLayers] = useState<Set<DatasetId>>(
    new Set(["roadworks", "disruptions", "collisions", "traffic-orders"])
  );
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const toggleLayer = useCallback((id: DatasetId) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setPopupInfo(null);
      return;
    }

    const coords = (feature.geometry as GeoJSON.Point).coordinates;
    setPopupInfo({
      longitude: coords[0],
      latitude: coords[1],
      properties: (feature.properties ?? {}) as PopupInfo["properties"],
    });
  }, []);

  return (
    <div className="relative h-screen w-screen">
      {/* Layer toggle controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Layers</h2>
        {(Object.entries(DATASET_LABELS) as [DatasetId, string][]).map(
          ([id, label]) => (
            <label
              key={id}
              className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleLayers.has(id)}
                onChange={() => toggleLayer(id)}
                className="rounded"
              />
              {label}
              {data[id] && (
                <span className="text-xs text-gray-400">
                  ({data[id]!.features.length})
                </span>
              )}
            </label>
          )
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 right-16 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg px-4 py-2">
          <p className="text-sm text-gray-600 animate-pulse">
            Loading data...
          </p>
        </div>
      )}

      {/* Error display */}
      {Object.keys(errors).length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 max-w-sm">
          <p className="text-sm font-medium text-red-800">Data errors:</p>
          {Object.entries(errors).map(([id, msg]) => (
            <p key={id} className="text-xs text-red-600">
              {DATASET_LABELS[id as DatasetId]}: {msg}
            </p>
          ))}
        </div>
      )}

      <MapProvider interactiveLayerIds={CLICKABLE_LAYERS} onClick={onClick}>
        {data.roadworks && (
          <RoadworksLayer
            data={data.roadworks}
            visible={visibleLayers.has("roadworks")}
          />
        )}
        {data.disruptions && (
          <DisruptionsLayer
            data={data.disruptions}
            visible={visibleLayers.has("disruptions")}
          />
        )}
        {data.collisions && (
          <CollisionsLayer
            data={data.collisions}
            visible={visibleLayers.has("collisions")}
          />
        )}
        {data["traffic-orders"] && (
          <TrafficOrdersLayer
            data={data["traffic-orders"]}
            visible={visibleLayers.has("traffic-orders")}
          />
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            maxWidth="320px"
          >
            <div className="p-2 text-sm">
              <h3 className="font-semibold text-gray-900">
                {String(popupInfo.properties.name || "Unknown")}
              </h3>

              {popupInfo.properties.cyclingSummary && (
                <p className="mt-1 text-gray-600">
                  {String(popupInfo.properties.cyclingSummary)}
                </p>
              )}

              <div className="mt-2 space-y-1 text-xs text-gray-500">
                {popupInfo.properties.borough && (
                  <p>Borough: {String(popupInfo.properties.borough)}</p>
                )}
                {popupInfo.properties.cyclingImpact && (
                  <p>
                    Cycling Impact:{" "}
                    <span className="font-medium">
                      {String(popupInfo.properties.cyclingImpact)}
                    </span>
                  </p>
                )}
                {popupInfo.properties.severity && (
                  <p>
                    Severity:{" "}
                    <span className="font-medium">
                      {String(popupInfo.properties.severity)}
                    </span>
                  </p>
                )}
                {popupInfo.properties.promoter && (
                  <p>Promoter: {String(popupInfo.properties.promoter)}</p>
                )}
                {popupInfo.properties.trafficManagement && (
                  <p>
                    Traffic Mgmt:{" "}
                    {String(popupInfo.properties.trafficManagement)}
                  </p>
                )}
                {popupInfo.properties.proposedStart && (
                  <p>
                    Dates: {String(popupInfo.properties.proposedStart)}
                    {popupInfo.properties.proposedEnd &&
                      ` — ${String(popupInfo.properties.proposedEnd)}`}
                  </p>
                )}
                {popupInfo.properties.nearbyInfrastructure && (
                  <p>
                    Nearby:{" "}
                    {String(popupInfo.properties.nearbyInfrastructure)}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        )}
      </MapProvider>
    </div>
  );
}
