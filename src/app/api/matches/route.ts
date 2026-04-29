import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { addMatch, deleteMatch, getMatches, updateMatch } from "@/lib/sheets";

export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json(matches);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, team1, team2, score1, score2 } = body;

    if (!date || !team1?.[0]) {
      return NextResponse.json({ error: "Invalid match data" }, { status: 400 });
    }
    if (score1 == null || score2 == null) {
      return NextResponse.json({ error: "Scores are required" }, { status: 400 });
    }

    const match = await addMatch({ date, team1, team2, score1, score2 });
    revalidateTag("matches", "max");
    return NextResponse.json(match, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add match" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, date, team1, team2, score1, score2 } = body;

    if (!id || !date || !team1?.[0]) {
      return NextResponse.json({ error: "Invalid match data" }, { status: 400 });
    }
    if (score1 == null || score2 == null) {
      return NextResponse.json({ error: "Scores are required" }, { status: 400 });
    }

    await updateMatch({ id, date, team1, team2: team2 ?? [], score1, score2 });
    revalidateTag("matches", "max");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await deleteMatch(id);
    revalidateTag("matches", "max");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
}
