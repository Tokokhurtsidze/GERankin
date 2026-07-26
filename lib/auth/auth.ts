import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
