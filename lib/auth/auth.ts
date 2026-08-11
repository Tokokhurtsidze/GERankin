import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { notifyWelcome } from "@/lib/email/notify";

// Bootstraps admin access: list comma-separated emails in ADMIN_EMAILS and they're
// promoted to "admin" on their next sign-in — there's no other way to create one.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Only runs on initial sign-in (account/profile are only present then).
      // Google's own subject id is NOT our Mongo _id, so resolve/create our
      // internal User record here and use its _id as the session identity.
      if (account?.provider === "google" && profile?.email) {
        await dbConnect();
        let internalUser = await User.findOne({ email: profile.email });
        if (!internalUser) {
          internalUser = await User.create({
            name: profile.name ?? "Founder",
            email: profile.email,
            image: (profile as { picture?: string }).picture,
            provider: "google",
            emailVerified: new Date(),
          });
          notifyWelcome(internalUser.email, internalUser.name).catch((err) =>
            console.error("Failed to send welcome email:", err)
          );
        } else if (!internalUser.emailVerified) {
          // Google already verified this address — backfill for accounts created
          // before emailVerified existed, or created via another path.
          internalUser.emailVerified = new Date();
          await internalUser.save();
        }

        if (ADMIN_EMAILS.includes(profile.email.toLowerCase()) && internalUser.role !== "admin") {
          internalUser.role = "admin";
          await internalUser.save();
        }

        token.id = internalUser._id.toString();
        token.role = internalUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
