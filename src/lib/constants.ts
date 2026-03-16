import type { DatasetId } from "./types";

export const BOROUGHS = [
  "Lambeth",
  "Southwark",
  "Wandsworth",
  "Lewisham",
  "Merton",
  "Croydon",
  "City of London",
  "Westminster",
] as const;

export const MAP_DEFAULTS = {
  center: [-0.12, 51.46] as [number, number], // Lambeth area
  zoom: 11,
  style: "mapbox://styles/mapbox/light-v11",
} as const;

export const IMPACT_COLOURS: Record<string, string> = {
  // Roadworks & Disruptions cycling impact
  High: "#DC2626",
  Medium: "#F59E0B",
  Low: "#FBBF24",
  Minimal: "#22C55E",
  // Traffic order impact
  Positive: "#16A34A",
  Negative: "#DC2626",
  Neutral: "#6B7280",
  "Needs Review": "#F59E0B",
  // Collision severity
  Fatal: "#DC2626",
  Serious: "#F97316",
  Slight: "#FBBF24",
};

export const DISRUPTION_COLOURS: Record<string, string> = {
  High: "#9333EA",
  Medium: "#A855F7",
  Low: "#C084FC",
  Minimal: "#E9D5FF",
};

export const LAYER_IDS: Record<
  DatasetId,
  { cluster: string; count: string; point: string; heatmap?: string }
> = {
  roadworks: {
    cluster: "roadworks-clusters",
    count: "roadworks-cluster-count",
    point: "roadworks-points",
  },
  disruptions: {
    cluster: "disruptions-clusters",
    count: "disruptions-cluster-count",
    point: "disruptions-points",
  },
  collisions: {
    cluster: "collisions-clusters",
    count: "collisions-cluster-count",
    point: "collisions-points",
    heatmap: "collisions-heatmap",
  },
  "traffic-orders": {
    cluster: "traffic-orders-clusters",
    count: "traffic-orders-cluster-count",
    point: "traffic-orders-points",
  },
  "air-quality": {
    cluster: "air-quality-clusters",
    count: "air-quality-cluster-count",
    point: "air-quality-points",
  },
};

export const REVALIDATION_SECONDS: Record<DatasetId, number> = {
  roadworks: 300, // 5 minutes
  disruptions: 3600, // 1 hour
  collisions: 86400, // 24 hours
  "traffic-orders": 3600, // 1 hour
  "air-quality": 3600, // 1 hour
};
