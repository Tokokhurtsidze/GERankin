import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN as string });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL as string;

/** Schedules the start-tournament job for the exact moment the 1-hour registration window closes. */
export async function scheduleTournamentStart(tournamentId: string, registrationClosesAt: Date) {
  return qstash.publishJSON({
    url: `${SITE_URL}/api/cron/start-tournament`,
    body: { tournamentId },
    notBefore: Math.floor(registrationClosesAt.getTime() / 1000),
  });
}

/** Schedules the advance-round job for the exact moment a round's custom duration ends. */
export async function scheduleRoundAdvance(tournamentId: string, roundEndsAt: Date) {
  return qstash.publishJSON({
    url: `${SITE_URL}/api/cron/advance-round`,
    body: { tournamentId },
    notBefore: Math.floor(roundEndsAt.getTime() / 1000),
  });
}
