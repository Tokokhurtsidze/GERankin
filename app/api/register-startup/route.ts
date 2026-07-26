import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Startup, Tournament } from "@/lib/db/models";

const bodySchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(2).max(80),
  tagline: z.string().min(2).max(160),
  description: z.string().min(10).max(2000),
  logoUrl: z.string().url(),
  websiteUrl: z.string().url(),
  pitchDeckUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  await dbConnect();
  const tournament = await Tournament.findById(data.tournamentId);
  if (!tournament || tournament.status !== "registration") {
    return NextResponse.json({ error: "Registration window is closed" }, { status: 409 });
  }
  if ((tournament.entrants?.length ?? 0) >= tournament.maxEntrants) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 409 });
  }

  try {
    const startup = await Startup.create({
      owner: session.user.id,
      tournament: tournament._id,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      pitchDeckUrl: data.pitchDeckUrl,
    });

    (tournament.entrants ??= []).push(startup._id);
    await tournament.save();

    return NextResponse.json({ startupId: startup._id.toString() }, { status: 201 });
  } catch (err: unknown) {
    // Unique (owner, tournament) index -> duplicate entry attempt.
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json({ error: "You already registered a startup for this tournament" }, { status: 409 });
    }
    throw err;
  }
}
