import { NextResponse } from "next/server";
import { fetchCandidates } from "@/lib/notion/candidates";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const candidates = await fetchCandidates();
    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates data" },
      { status: 500 }
    );
  }
}
