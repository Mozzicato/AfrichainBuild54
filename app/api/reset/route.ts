import { NextResponse } from "next/server";
import { reset, getState } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  reset();
  return NextResponse.json(getState());
}
