// import prisma from "../../lib/prisma.js";
// import { Router } from "express";
export {};
// const router = Router();
// router.post("/create", async (req, res) => {
//     const { roomId } = req.body;
//     if (!roomId) {
//         return res.status(400).json({ error: "Room ID is required" });
//     }
//     try {
//         const room = await prisma.room.create({
//             data: { id: roomId,
//                 name : "NEW ROOM",
//                 created_by_id: id,
//              }
//         });
//         res.status(201).json(room);
//     } catch (error) {
//         console.error("Error creating room:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });
// export default router;
//# sourceMappingURL=routes.js.map