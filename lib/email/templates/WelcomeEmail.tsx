import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <EmailLayout preview="Welcome to Startup Clash GE">
      <Heading as="h2">Welcome, {name}!</Heading>
      <Text>Your account is set up. When a tournament opens registration, head back and enter your startup.</Text>
    </EmailLayout>
  );
}
