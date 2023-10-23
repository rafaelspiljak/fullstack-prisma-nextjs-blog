import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";
import { hash } from "bcrypt";
// PUT /api/publish/:id
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNumber, password, firstName, lastName } = await req.body;
  const exists = await prisma.user.findUnique({
    where: {
      phoneNumber,
    },
  });
  if (exists) {
    res.status(400);
    return res.send({ error: "User already exists" });
  } else if (req.method === "POST") {
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        password: await hash(password, 10),
        firstName,
        lastName,
      },
    });
    return res.json(user);
  }
  return res.status(400);
}
