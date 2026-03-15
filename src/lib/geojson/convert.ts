import type { Feature, FeatureCollection, Point } from "geojson";

/**
 * Parse a "lon,lat" string into a GeoJSON coordinate pair [lon, lat].
 * Returns null if the string is invalid.
 */
export function parseCoordinates(
  coordString: string
): [number, number] | null {
  const parts = coordString.split(",").map((s) => s.trim());
  if (parts.length !== 2) return null;
  const lon = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (isNaN(lon) || isNaN(lat)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return [lon, lat];
}

/**
 * Create a GeoJSON Feature from coordinates and properties.
 */
export function toFeature<T extends Record<string, unknown>>(
  coordinates: [number, number],
  properties: T
): Feature<Point, T> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates,
    },
    properties,
  };
}

/**
 * Wrap an array of Features into a FeatureCollection.
 */
export function toFeatureCollection<T extends Record<string, unknown>>(
  features: Feature<Point, T>[]
): FeatureCollection<Point, T> {
  return {
    type: "FeatureCollection",
    features,
  };
}
