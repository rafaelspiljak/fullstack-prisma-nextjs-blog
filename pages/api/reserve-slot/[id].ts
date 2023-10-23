import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";

// PUT /api/publish/:id
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reservedSlotId = req.query.id;
  const session = await getSession({ req });

  if (session && req.method === "DELETE") {
    const post = await prisma.reservedSlot.delete({
      where: { id: String(reservedSlotId) },
    });
    res.json(post);
  } else {
    res.status(401).send({ message: "Unauthorized" });
  }
}
