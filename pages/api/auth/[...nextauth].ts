import { NextApiHandler } from "next";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "../../../lib/prisma";

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options);
export default authHandler;

const options = {
  providers: [
    CredentialsProvider({
      credentials: {
        phoneNumber: {
          type: "text",
          placeholder: "Broj telefona",
          label: "Broj telefona",
        },
        password: {
          type: "password",
          placeholder: "lozinka",
          label: "Lozinka",
        },
      },
      async authorize(credentials, req) {
        const { phoneNumber, password } = credentials ?? {};
        const user = await prisma.user.findUnique({
          where: { phoneNumber },
        });
        if (!user) return null;

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) return null;

        return user;
      },
    }),
  ],
  // adapter: PrismaAdapter(prisma),
  secret: process.env.JWT_SECRET,
  callbacks: {
    session({ session, token, ...rest }) {
      session.user.id = token.sub;
      session.user.phoneNumber = token.phoneNumber;
      return session;
    },
    jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = user.id;
        token.phoneNumber = user.phoneNumber;
      }
      return token;
    },
  },
};
