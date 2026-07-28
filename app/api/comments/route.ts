import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Comment } from "@/lib/db/models";
import { objectIdString } from "@/lib/db/object-id";

const postSchema = z.object({
  matchId: objectIdString,
  body: z.string().min(1).max(1000),
  parentId: objectIdString.optional(),
});

export async function GET(req: Request) {
  const matchId = new URL(req.url).searchParams.get("matchId");
  if (!matchId || !objectIdString.safeParse(matchId).success) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  await dbConnect();
  const comments = await Comment.find({ match: matchId, deleted: false })
    .sort({ createdAt: -1 })
    .populate("author", "name image")
    .limit(200)
    .lean();

  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const comment = await (
    await Comment.create({
      match: parsed.data.matchId,
      author: session.user.id,
      body: parsed.data.body,
      parent: parsed.data.parentId,
    })
  ).populate("author", "name image");

  return NextResponse.json({ comment }, { status: 201 });
}
