import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";

// PUT /api/publish/:id
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  console.log(session);
  if (req.method === "GET") {
    const today = new Date();
    today.setHours(today.getHours() - 1);
    const slots = await prisma.reservedSlot.findMany({
      where: {
        reservedAt: {
          gte: today,
        },
      },
    });
    res.json(slots);
  }

  console.log(
    req.method,
    session.user.id,
    session,
    req.body.id,
    JSON.parse(req.body)
  );
  const parsedBody = JSON.parse(req.body);
  console.log(new Date(parsedBody.id));
  if (session && req.method === "POST") {
    const post = await prisma.reservedSlot.create({
      data: {
        reservedById: +session.user.id,
        id: parsedBody.id,
        reservedAt: new Date(parsedBody.id),
      },
    });
    res.json(post);
  } else {
    res.status(401).send({ message: "Unauthorized" });
  }
}
