"use client";

import { useState, useCallback, useMemo } from "react";
import { Popup, type MapMouseEvent } from "react-map-gl/mapbox";
import type { FeatureCollection, Point } from "geojson";
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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

/** Extract available years from collision features, sorted descending. */
function getAvailableYears(fc: FeatureCollection<Point> | null): string[] {
  if (!fc) return [];
  const years = new Set<string>();
  for (const f of fc.features) {
    const y = f.properties?.dataYear;
    if (y) years.add(String(y));
  }
  return [...years].sort().reverse();
}

/** Extract available months (1-12) for selected years. */
function getAvailableMonths(
  fc: FeatureCollection<Point> | null,
  selectedYears: Set<string>
): Set<number> {
  if (!fc) return new Set();
  const months = new Set<number>();
  for (const f of fc.features) {
    const date = f.properties?.date as string | undefined;
    const year = f.properties?.dataYear as string | undefined;
    if (!date || !year || !selectedYears.has(String(year))) continue;
    const m = parseInt(date.slice(5, 7), 10);
    if (m >= 1 && m <= 12) months.add(m);
  }
  return months;
}

export default function MapShell() {
  const { data, loading, errors } = useMapData();
  const [visibleLayers, setVisibleLayers] = useState<Set<DatasetId>>(
    new Set(["roadworks", "disruptions", "collisions", "traffic-orders"])
  );
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Collision filters — null means "all selected"
  const [collisionYears, setCollisionYears] = useState<Set<string> | null>(null);
  const [collisionMonths, setCollisionMonths] = useState<Set<number> | null>(null);
  const [collisionSeverities, setCollisionSeverities] = useState<Set<string> | null>(null);

  const SEVERITY_LEVELS = ["Fatal", "Serious", "Slight"] as const;
  const effectiveSeverities = collisionSeverities ?? new Set(SEVERITY_LEVELS);

  const availableYears = useMemo(
    () => getAvailableYears(data.collisions),
    [data.collisions]
  );

  // Initialise year selection when data arrives
  const effectiveYears = useMemo(
    () => collisionYears ?? new Set(availableYears),
    [collisionYears, availableYears]
  );

  const availableMonths = useMemo(
    () => getAvailableMonths(data.collisions, effectiveYears),
    [data.collisions, effectiveYears]
  );

  const effectiveMonths = useMemo(
    () => collisionMonths ?? availableMonths,
    [collisionMonths, availableMonths]
  );

  // Client-side filtered collisions
  const filteredCollisions = useMemo(() => {
    if (!data.collisions) return null;
    // If all filters at default, skip filtering
    if (!collisionYears && !collisionMonths && !collisionSeverities) return data.collisions;

    const features = data.collisions.features.filter((f) => {
      const year = String(f.properties?.dataYear ?? "");
      if (!effectiveYears.has(year)) return false;
      if (collisionMonths) {
        const date = f.properties?.date as string | undefined;
        if (!date) return false;
        const m = parseInt(date.slice(5, 7), 10);
        if (!effectiveMonths.has(m)) return false;
      }
      const severity = String(f.properties?.severity ?? "");
      if (!effectiveSeverities.has(severity)) return false;
      return true;
    });
    return { ...data.collisions, features } as FeatureCollection<Point>;
  }, [data.collisions, collisionYears, collisionMonths, collisionSeverities, effectiveYears, effectiveMonths, effectiveSeverities]);

  const toggleLayer = useCallback((id: DatasetId) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleYear = useCallback((year: string) => {
    setCollisionYears((prev) => {
      const next = new Set(prev ?? availableYears);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
    // Reset month filter when years change
    setCollisionMonths(null);
  }, [availableYears]);

  const toggleMonth = useCallback((month: number) => {
    setCollisionMonths((prev) => {
      const next = new Set(prev ?? availableMonths);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  }, [availableMonths]);

  const toggleSeverity = useCallback((sev: string) => {
    setCollisionSeverities((prev) => {
      const next = new Set(prev ?? new Set(SEVERITY_LEVELS));
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
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
    <div className="relative h-full w-full">
      {/* Layer toggle controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Layers</h2>
          <button
            onClick={() => setPanelCollapsed((p) => !p)}
            className="text-xs text-gray-400 hover:text-gray-600"
            aria-label={panelCollapsed ? "Expand layers panel" : "Collapse layers panel"}
          >
            {panelCollapsed ? "\u25B6" : "\u25C0"}
          </button>
        </div>
        {!panelCollapsed && (Object.entries(DATASET_LABELS) as [DatasetId, string][]).map(
          ([id, label]) => (
            <div key={id}>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleLayers.has(id)}
                  onChange={() => toggleLayer(id)}
                  className="rounded"
                />
                {label}
                {id === "collisions" && filteredCollisions ? (
                  <span className="text-xs text-gray-400">
                    ({filteredCollisions.features.length})
                  </span>
                ) : (
                  data[id] && (
                    <span className="text-xs text-gray-400">
                      ({data[id]!.features.length})
                    </span>
                  )
                )}
              </label>

              {/* Collision severity/year/month filters */}
              {id === "collisions" && visibleLayers.has("collisions") && availableYears.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  <p className="text-xs font-medium text-gray-500">Severity</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {SEVERITY_LEVELS.map((sev) => (
                      <label
                        key={sev}
                        className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={effectiveSeverities.has(sev)}
                          onChange={() => toggleSeverity(sev)}
                          className="rounded w-3 h-3"
                        />
                        {sev}
                      </label>
                    ))}
                  </div>

                  <p className="text-xs font-medium text-gray-500">Years</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {availableYears.map((year) => (
                      <label
                        key={year}
                        className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={effectiveYears.has(year)}
                          onChange={() => toggleYear(year)}
                          className="rounded w-3 h-3"
                        />
                        {year}
                      </label>
                    ))}
                  </div>

                  <p className="text-xs font-medium text-gray-500 mt-1">Months</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {MONTH_NAMES.map((name, i) => {
                      const month = i + 1;
                      const available = availableMonths.has(month);
                      return (
                        <label
                          key={month}
                          className={`flex items-center gap-1 text-xs cursor-pointer ${
                            available ? "text-gray-500" : "text-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={effectiveMonths.has(month)}
                            onChange={() => toggleMonth(month)}
                            disabled={!available}
                            className="rounded w-3 h-3"
                          />
                          {name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
        {filteredCollisions && (
          <CollisionsLayer
            data={filteredCollisions}
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
