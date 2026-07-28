import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export function ChampionEmail({ tournamentName, startupName }: { tournamentName: string; startupName: string }) {
  return (
    <EmailLayout preview={`${startupName} won ${tournamentName}!`}>
      <Heading as="h2">🏆 Champion</Heading>
      <Text>
        <strong>{startupName}</strong> won {tournamentName}. Congratulations!
      </Text>
    </EmailLayout>
  );
}
