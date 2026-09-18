import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { assertSecret } from "@/lib/env";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/auth/rate-limit";

// Fails fast at import time (NextAuth would otherwise fall back to an
// insecure implicit default if this were ever unset in production).
const nextAuthSecret = assertSecret("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET);

export const authOptions: AuthOptions = {
  secret: nextAuthSecret,
  session: {
    strategy: "jwt", // required - the Credentials provider doesn't support database sessions
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the session on activity within the last day
  },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.trim().toLowerCase();

        const { allowed } = await checkRateLimit("login", email);
        if (!allowed) {
          console.warn(`[auth] login rate-limited for ${email}`);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
