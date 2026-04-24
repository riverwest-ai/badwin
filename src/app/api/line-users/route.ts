import { NextResponse } from "next/server";
import { getLineUser, upsertLineUser } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineUserId = searchParams.get("lineUserId");
  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }
  try {
    const user = await getLineUser(lineUserId);
    return NextResponse.json({ memberName: user?.memberName ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { lineUserId, memberName, displayName } = await req.json();
    if (!lineUserId || !memberName) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    await upsertLineUser(lineUserId, memberName, displayName ?? "");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
