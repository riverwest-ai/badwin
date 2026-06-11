import { NextResponse } from "next/server";
import { setSessionName } from "@/lib/sheets";

export async function PUT(req: Request) {
  try {
    const { date, name } = await req.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    await setSessionName(date, name ?? "");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
