import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { reseller: true, vendor: true }
        });

        if (user) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) throw new Error("Invalid email or password.");

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            resellerId: user.resellerId,
            vendorId: user.vendorId,
            name: user.reseller?.name || user.vendor?.name || "Admin",
          };
        }

        // If user not found in User table, check KycRequest
        const kyc = await db.kycRequest.findFirst({
          where: { email: credentials.email }
        });

        if (kyc) {
          const isValid = await bcrypt.compare(credentials.password, kyc.passwordHash);
          if (!isValid) throw new Error("Invalid email or password.");

          if (kyc.status === "Pending") {
            return {
              id: kyc.id,
              email: kyc.email,
              role: "pending",
              name: kyc.name,
              resellerId: null,
              vendorId: null,
            };
          } else if (kyc.status === "Rejected") {
            throw new Error("Your account application was rejected. Please contact support.");
          }
        }

        throw new Error("Invalid email or password.");
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.resellerId = user.resellerId;
        token.vendorId = user.vendorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.resellerId = token.resellerId as string | null;
        session.user.vendorId = token.vendorId as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "my-super-secret-jwt-token-12345-fallback",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
