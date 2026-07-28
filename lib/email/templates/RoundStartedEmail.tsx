import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export function RoundStartedEmail({
  tournamentName,
  startupName,
  round,
}: {
  tournamentName: string;
  startupName: string;
  round: number;
}) {
  return (
    <EmailLayout preview={`Round ${round} is live — ${tournamentName}`}>
      <Heading as="h2">Round {round} is live</Heading>
      <Text>
        <strong>{startupName}</strong> has a new match in {tournamentName}. Go vote and rally support before it
        closes.
      </Text>
    </EmailLayout>
  );
}
