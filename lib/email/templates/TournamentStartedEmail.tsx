import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export function TournamentStartedEmail({
  tournamentName,
  startupName,
}: {
  tournamentName: string;
  startupName: string;
}) {
  return (
    <EmailLayout preview={`${tournamentName} has started`}>
      <Heading as="h2">{tournamentName} is live</Heading>
      <Text>
        Registration closed and the bracket is seeded. <strong>{startupName}</strong> is in — check your match
        and rally votes.
      </Text>
    </EmailLayout>
  );
}
