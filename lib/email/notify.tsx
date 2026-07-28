import { sendMail } from "./send";
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { TournamentStartedEmail } from "./templates/TournamentStartedEmail";
import { RoundStartedEmail } from "./templates/RoundStartedEmail";
import { MatchResultEmail } from "./templates/MatchResultEmail";
import { ChampionEmail } from "./templates/ChampionEmail";

async function dispatchAll(sends: Array<() => Promise<void>>) {
  const results = await Promise.allSettled(sends.map((send) => send()));
  for (const r of results) {
    if (r.status === "rejected") console.error("Failed to send notification email:", r.reason);
  }
}

export async function notifyWelcome(email: string, name: string) {
  await dispatchAll([
    () => sendMail({ to: email, subject: "Welcome to Startup Clash GE", react: <WelcomeEmail name={name} /> }),
  ]);
}

export async function notifyTournamentStarted(
  entrants: { email: string; startupName: string }[],
  tournamentName: string
) {
  await dispatchAll(
    entrants.map(
      (e) => () =>
        sendMail({
          to: e.email,
          subject: `${tournamentName} is live`,
          react: <TournamentStartedEmail tournamentName={tournamentName} startupName={e.startupName} />,
        })
    )
  );
}

export async function notifyRoundStarted(
  entrants: { email: string; startupName: string }[],
  tournamentName: string,
  round: number
) {
  await dispatchAll(
    entrants.map(
      (e) => () =>
        sendMail({
          to: e.email,
          subject: `Round ${round} is live — ${tournamentName}`,
          react: <RoundStartedEmail tournamentName={tournamentName} startupName={e.startupName} round={round} />,
        })
    )
  );
}

export async function notifyMatchResults(
  results: { email: string; startupName: string; round: number; advanced: boolean }[],
  tournamentName: string
) {
  await dispatchAll(
    results.map(
      (r) => () =>
        sendMail({
          to: r.email,
          subject: r.advanced ? `You advanced! — ${tournamentName}` : `Match result — ${tournamentName}`,
          react: (
            <MatchResultEmail
              tournamentName={tournamentName}
              startupName={r.startupName}
              round={r.round}
              advanced={r.advanced}
            />
          ),
        })
    )
  );
}

export async function notifyChampion(email: string, startupName: string, tournamentName: string) {
  await dispatchAll([
    () =>
      sendMail({
        to: email,
        subject: `🏆 ${startupName} won ${tournamentName}!`,
        react: <ChampionEmail tournamentName={tournamentName} startupName={startupName} />,
      }),
  ]);
}
