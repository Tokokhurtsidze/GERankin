import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, Match, Startup, Vote } from "@/lib/db/models";
import { objectIdString } from "@/lib/db/object-id";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!objectIdString.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const dbSession = await mongoose.startSession();
  try {
    let notFound = false;
    await dbSession.withTransaction(async () => {
      const tournament = await Tournament.findById(id).session(dbSession);
      if (!tournament) {
        notFound = true;
        return;
      }

      const matchIds = await Match.find({ tournament: id }, { _id: 1 }).session(dbSession);
      await Vote.deleteMany({ match: { $in: matchIds.map((m) => m._id) } }, { session: dbSession });
      await Match.deleteMany({ tournament: id }, { session: dbSession });
      await Startup.deleteMany({ tournament: id }, { session: dbSession });
      await Tournament.findByIdAndDelete(id, { session: dbSession });
    });

    if (notFound) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
  } finally {
    await dbSession.endSession();
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!objectIdString.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const tournament = await Tournament.findByIdAndUpdate(id, { $unset: { champion: 1 } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
