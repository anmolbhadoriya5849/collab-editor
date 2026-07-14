import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";


export async function POST(req: Request) {

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();


    await prisma.roomMember.create({
        data: {
            roomId: body.roomId,
            userId: session.user.id,
            role: "member",
        }
    })

  return Response.json({
    message: "Room joined successfully",
  });
}