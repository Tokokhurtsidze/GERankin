import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Startup, Tournament, User } from "@/lib/db/models";
import { sendMail } from "@/lib/email/send";

// Synchronous, string-only SSRF guard (no DNS resolution — a domain that
// resolves to a private/internal address at request time still gets through,
// but this stops the obvious cases: literal localhost/loopback/link-local/
// private-range IPs and the cloud metadata hostname).
const BLOCKED_HOSTNAMES = new Set(["localhost", "169.254.169.254", "metadata.google.internal"]);

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host === "0.0.0.0" || host.endsWith(".local")) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return true;
    }
  }
  return false;
}

function isSafePublicUrl(url: string): boolean {
  try {
    return !isPrivateHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

const httpUrl = z
  .string()
  .url()
  .refine((url) => /^https?:\/\//i.test(url), { message: "URL must start with http:// or https://" })
  .refine(isSafePublicUrl, { message: "URL must not point to a private or internal address" });

const logoUrlSchema = z
  .string()
  .max(2_900_000, { message: "Logo image is too large" })
  .refine(
    (url) => /^https?:\/\//i.test(url) || /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i.test(url),
    { message: "Logo must be a valid URL or a Base64 image" }
  )
  .refine((url) => !/^https?:\/\//i.test(url) || isSafePublicUrl(url), {
    message: "Logo URL must not point to a private or internal address",
  });

const localizedText = (min: number, max: number) =>
  z.object({
    en: z.string().min(min).max(max),
    ka: z.string().min(min).max(max),
  });

const bodySchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(2).max(80),
  tagline: localizedText(2, 160),
  description: localizedText(10, 2000),
  logoUrl: logoUrlSchema,
  websiteUrl: httpUrl,
  pitchDeckUrl: httpUrl.optional(),
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

    // Atomic capacity check + push — a find-then-save here would race under
    // concurrent registrations (lost update on `entrants`, cap bypassable).
    const updated = await Tournament.findOneAndUpdate(
      { _id: tournament._id, $expr: { $lt: [{ $size: { $ifNull: ["$entrants", []] } }, "$maxEntrants"] } },
      { $push: { entrants: startup._id } }
    );

    if (!updated) {
      // Cap was already hit by a concurrent request — roll back the orphaned Startup doc.
      await Startup.deleteOne({ _id: startup._id });
      return NextResponse.json({ error: "Tournament is full" }, { status: 409 });
    }

    const owner = await User.findById(session.user.id);
    if (owner?.email) {
      sendMail({
        to: owner.email,
        subject: `You're in — ${startup.name} entered ${tournament.name}`,
        html: `
          <p>Hey${owner.name ? ` ${owner.name}` : ""},</p>
          <p><strong>${startup.name}</strong> is registered for <strong>${tournament.name}</strong>.</p>
          <p>Registration closes at ${tournament.registrationClosesAt.toUTCString()}. Once it does, the bracket is seeded and round 1 goes live — check back to vote and rally votes for your match.</p>
        `,
      }).catch((err) => console.error("Failed to send registration confirmation email:", err));
    }

    return NextResponse.json({ startupId: startup._id.toString() }, { status: 201 });
  } catch (err: unknown) {
    // Unique (owner, tournament) index -> duplicate entry attempt.
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json({ error: "You already registered a startup for this tournament" }, { status: 409 });
    }
    throw err;
  }
}
