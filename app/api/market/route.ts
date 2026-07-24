import { NextResponse } from "next/server";
import { liveSnapshot } from "@/lib/market";
import { getAllPriceOverrides, recentPriceReports } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = liveSnapshot(getAllPriceOverrides());
  return NextResponse.json({ ...snap, reports: recentPriceReports(8) });
}
