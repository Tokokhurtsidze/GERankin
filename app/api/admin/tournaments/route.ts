import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Tournament } from "@/lib/db/models";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  registrationWindowMinutes: z.number().int().min(1).max(1440).default(60),
  roundDurationMinutes: z.number().int().min(1).max(1440).default(1440),
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

  const registrationOpensAt = new Date();
  const registrationClosesAt = new Date(
    registrationOpensAt.getTime() + parsed.data.registrationWindowMinutes * 60_000
  );

  try {
    const tournament = await Tournament.create({
      name: parsed.data.name,
      status: "registration",
      registrationOpensAt,
      registrationClosesAt,
      registrationWindowMinutes: parsed.data.registrationWindowMinutes,
      roundDurationMinutes: parsed.data.roundDurationMinutes,
      activeLock: 1,
    });

    // /api/cron/sweep (Vercel Cron) picks up the registration close and every
    // round advance from here — no manual step needed.
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (err: unknown) {
    // Unique activeLock index -> another tournament is already open. A plain
    // find-then-create here would race under concurrent requests, so the
    // index (not the read) is the actual guard — this just gives a clean error.
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json({ error: "A tournament is already active" }, { status: 409 });
    }
    throw err;
  }
}
