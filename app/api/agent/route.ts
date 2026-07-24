import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }
    const result = await runAgent(transcript, typeof mode === "string" ? mode : undefined);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
