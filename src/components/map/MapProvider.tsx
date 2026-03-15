"use client";

import { useRef, useCallback, type ReactNode } from "react";
import Map, {
  NavigationControl,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import { MAP_DEFAULTS } from "@/lib/constants";

interface MapProviderProps {
  children: ReactNode;
  interactiveLayerIds?: string[];
  onClick?: (event: MapMouseEvent) => void;
}

export default function MapProvider({
  children,
  interactiveLayerIds,
  onClick,
}: MapProviderProps) {
  const mapRef = useRef<MapRef>(null);

  const onLoad = useCallback(() => {
    console.log("Map loaded");
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: MAP_DEFAULTS.center[0],
        latitude: MAP_DEFAULTS.center[1],
        zoom: MAP_DEFAULTS.zoom,
      }}
      mapStyle={MAP_DEFAULTS.style}
      onLoad={onLoad}
      onClick={onClick}
      interactiveLayerIds={interactiveLayerIds}
      style={{ width: "100%", height: "100%" }}
      maxZoom={18}
      minZoom={8}
      cursor="auto"
    >
      <NavigationControl position="top-right" />
      {children}
    </Map>
  );
}
