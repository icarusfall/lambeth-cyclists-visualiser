"use client";

import { useState, useEffect } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { DatasetId } from "@/lib/types";

type DataMap = Record<DatasetId, FeatureCollection<Point> | null>;

const EMPTY: DataMap = {
  roadworks: null,
  disruptions: null,
  collisions: null,
  "traffic-orders": null,
};

const ENDPOINTS: Record<DatasetId, string> = {
  roadworks: "/api/geojson/roadworks",
  disruptions: "/api/geojson/disruptions",
  collisions: "/api/geojson/collisions",
  "traffic-orders": "/api/geojson/traffic-orders",
};

export function useMapData() {
  const [data, setData] = useState<DataMap>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<DatasetId, string>>>({});

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const datasets = Object.entries(ENDPOINTS) as [DatasetId, string][];

      const results = await Promise.allSettled(
        datasets.map(async ([id, url]) => {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          const geojson = await res.json();
          return [id, geojson] as [DatasetId, FeatureCollection<Point>];
        })
      );

      const newData = { ...EMPTY };
      const newErrors: Partial<Record<DatasetId, string>> = {};

      results.forEach((result, i) => {
        const id = datasets[i][0];
        if (result.status === "fulfilled") {
          newData[id] = result.value[1];
        } else {
          newErrors[id] = result.reason?.message ?? "Unknown error";
          console.error(`Failed to load ${id}:`, result.reason);
        }
      });

      setData(newData);
      setErrors(newErrors);
      setLoading(false);
    }

    load();
    return () => controller.abort();
  }, []);

  return { data, loading, errors };
}
