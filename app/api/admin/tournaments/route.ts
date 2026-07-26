import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Tournament } from "@/lib/db/models";
import { scheduleTournamentStart } from "@/lib/tournament/schedule";

const REGISTRATION_WINDOW_MS = 60 * 60_000; // 1 hour, per spec

const createSchema = z.object({
  name: z.string().min(2).max(120),
  roundDurationMinutes: z.number().int().min(1).max(1440).default(60),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();

  const existingOpen = await Tournament.findOne({
    status: { $in: ["registration", "seeding", "in_progress"] },
  });
  if (existingOpen) {
    return NextResponse.json({ error: "A tournament is already active" }, { status: 409 });
  }

  const registrationOpensAt = new Date();
  const registrationClosesAt = new Date(registrationOpensAt.getTime() + REGISTRATION_WINDOW_MS);

  const tournament = await Tournament.create({
    name: parsed.data.name,
    status: "registration",
    registrationOpensAt,
    registrationClosesAt,
    roundDurationMinutes: parsed.data.roundDurationMinutes,
  });

  try {
    await scheduleTournamentStart(tournament._id.toString(), registrationClosesAt);
  } catch (err) {
    // QStash not configured (e.g. local dev) — tournament still opens, just
    // won't auto-start; trigger /api/cron/start-tournament manually instead.
    console.warn("Failed to schedule QStash start job:", err);
  }

  return NextResponse.json({ tournament }, { status: 201 });
}
