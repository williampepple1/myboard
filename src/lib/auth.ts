import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendVerificationEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["https://myboard.space", "https://www.myboard.space", "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }, url: string }) => {
      await sendVerificationEmail({ to: user.email, url });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
