import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(session.user.id);

  const memberships = await prisma.roomMember.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      Room: true
    }
  });

  const rooms = memberships.map(m => m.Room);

  return Response.json({
    message: "Room left successfully",
    rooms
  });
} 