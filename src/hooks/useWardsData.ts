"use client";

import { useState, useEffect, useRef } from "react";
import type { WardRecord } from "@/lib/notion/wards";
import type { CandidateRecord } from "@/lib/notion/candidates";

interface WardsData {
  wards: WardRecord[];
  candidates: CandidateRecord[];
  loading: boolean;
  error: string | null;
}

export function useWardsData(): WardsData {
  const [wards, setWards] = useState<WardRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function load() {
      try {
        const [wardsRes, candidatesRes] = await Promise.all([
          fetch("/api/wards"),
          fetch("/api/candidates"),
        ]);

        if (!wardsRes.ok) throw new Error("Failed to fetch wards");
        if (!candidatesRes.ok) throw new Error("Failed to fetch candidates");

        const wardsData = await wardsRes.json();
        const candidatesData = await candidatesRes.json();

        setWards(wardsData);
        setCandidates(candidatesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { wards, candidates, loading, error };
}
