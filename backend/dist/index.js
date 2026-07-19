import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import * as Y from "yjs";
import prisma from "./lib/prisma.js";
import "dotenv/config";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.get("/health", (_, res) => res.status(200).send("OK"));
app.get("/", (_, res) => res.send("WORKING ROOT"));
export const roomDocs = new Map();
export const dirtyRooms = new Set();
async function getRoomPeerCount(roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    return sockets.length;
}
io.on("connection", (socket) => {
    socket.on("join-room", async (roomId) => {
        socket.join(roomId);
        if (!roomDocs.has(roomId)) {
            const doc = new Y.Doc();
            try {
                const dbDocument = await prisma.document.findUnique({
                    where: { roomId: roomId },
                });
                if (dbDocument && dbDocument.code) {
                    // Existing room — restore full CRDT state from DB
                    Y.applyUpdate(doc, dbDocument.code);
                }
                else {
                    // Fresh room — seed default files into fileContents map
                    const fileContents = doc.getMap("fileContents");
                    fileContents.set("main.ts", new Y.Text());
                    fileContents.set("package.json", new Y.Text());
                }
            }
            catch (error) {
                console.error(`Error fetching document ${roomId} from DB:`, error);
            }
            roomDocs.set(roomId, doc);
        }
        const doc = roomDocs.get(roomId);
        const state = Y.encodeStateAsUpdate(doc);
        socket.emit("document-state", Array.from(state));
        const count = await getRoomPeerCount(roomId);
        io.to(roomId).emit("peer-count", count);
    });
    socket.on("yjs-update", ({ roomId, update }) => {
        const doc = roomDocs.get(roomId);
        if (!doc)
            return;
        // FIX: Convert standard array back to strict Uint8Array for Yjs
        Y.applyUpdate(doc, new Uint8Array(update));
        dirtyRooms.add(roomId); // Mark room as needing a DB save
        socket.to(roomId).emit("yjs-update", update);
    });
    socket.on("disconnecting", async () => {
        for (const roomId of socket.rooms) {
            if (roomId === socket.id)
                continue;
            const sockets = await io.in(roomId).fetchSockets();
            const count = Math.max(0, sockets.length - 1);
            socket.to(roomId).emit("peer-count", count);
        }
    });
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});
const SAVE_INTERVAL_MS = 3000;
setInterval(async () => {
    if (dirtyRooms.size === 0)
        return;
    console.log(`Auto-saving ${dirtyRooms.size} active rooms to the database...`);
    // Snapshot the dirty rooms and clear the main list to prevent race conditions
    const roomsToSave = Array.from(dirtyRooms);
    dirtyRooms.clear();
    for (const roomId of roomsToSave) {
        try {
            const doc = roomDocs.get(roomId);
            if (!doc)
                continue;
            // // Get binary data and convert to Buffer
            //   console.log(
            //   "SAVING:",
            //   doc.get("fileContents")
            // );
            const binaryState = Y.encodeStateAsUpdate(doc);
            const bufferToSave = Buffer.from(binaryState);
            // Upsert into Database (Update if exists, Create if new)
            await prisma.document.upsert({
                where: { roomId: roomId },
                update: { code: bufferToSave },
                create: { roomId: roomId, code: bufferToSave },
            });
        }
        catch (error) {
            console.error(`Failed to save room ${roomId} to DB. Retrying next cycle.`, error);
            // If the save failed, put it back on the dirty list so we don't lose data
            dirtyRooms.add(roomId);
        }
    }
}, SAVE_INTERVAL_MS);
server.listen(5001, "0.0.0.0", () => {
    console.log("Server running on port 5001");
});
//# sourceMappingURL=index.js.map