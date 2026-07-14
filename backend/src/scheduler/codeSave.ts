// import cron from "node-cron";
// import prisma from "../lib/prisma.js";
// import { roomCodeMap, dirtyRooms } from "../index.js";



// export const codeSave = () => {
//     cron.schedule("0 * * * *", async () => {
//         console.log("running a task every minute");

//         for (const roomId of dirtyRooms) {

//             const code = roomCodeMap.get(roomId)!;

//             if (!code) {
//                 console.log("No code found for room", roomId);
//                 continue;
//             }

//             await prisma.document.upsert({
//                 where: { roomId },
//                 update: { code },
//                 create: { roomId, code },
//             });
//         }

//         dirtyRooms.clear();
//     });
// }
