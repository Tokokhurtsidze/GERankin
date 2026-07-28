import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Match } from "@/lib/db/models";
import { objectIdString } from "@/lib/db/object-id";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const match = await Match.findById(id, { votesA: 1, votesB: 1, status: 1 }).lean();
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ votesA: match.votesA, votesB: match.votesB, status: match.status });
}
