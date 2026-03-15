import { NextResponse } from "next/server";
import { fetchWards } from "@/lib/notion/wards";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const wards = await fetchWards();
    return NextResponse.json(wards);
  } catch (error) {
    console.error("Failed to fetch wards:", error);
    return NextResponse.json(
      { error: "Failed to fetch wards data" },
      { status: 500 }
    );
  }
}
