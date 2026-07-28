import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export function MatchResultEmail({
  tournamentName,
  startupName,
  round,
  advanced,
}: {
  tournamentName: string;
  startupName: string;
  round: number;
  advanced: boolean;
}) {
  return (
    <EmailLayout preview={advanced ? `${startupName} advances!` : `${startupName}'s run has ended`}>
      <Heading as="h2">{advanced ? "You advanced!" : "Match result"}</Heading>
      <Text>
        {advanced
          ? `${startupName} won its round ${round} match in ${tournamentName} and moves on to the next round.`
          : `${startupName} was eliminated in round ${round} of ${tournamentName}. Thanks for competing!`}
      </Text>
    </EmailLayout>
  );
}
