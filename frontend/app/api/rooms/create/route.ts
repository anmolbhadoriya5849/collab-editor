import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const room = await prisma.room.create({
        data: {
            id: body.roomId,
            name: "MY ROOM",
            created_by_id: session.user.id,
        },
    })

    await prisma.roomMember.create({
        data: {
            roomId: room.id,
            userId: session.user.id,
            role: "owner",
        }
    })

  return Response.json({
    message: "Room created successfully",
    room
  });
}
