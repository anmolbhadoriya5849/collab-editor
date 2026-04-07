import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});
// Typed storage
const roomCodeMap = new Map();
async function getRoomPeerCount(roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    return sockets.length;
}
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join-room", async (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        if (!roomCodeMap.has(roomId)) {
            roomCodeMap.set(roomId, "");
        }
        // Send current code to the joining user
        socket.emit("code", roomCodeMap.get(roomId));
        // Broadcast updated peer count to the whole room
        const count = await getRoomPeerCount(roomId);
        io.to(roomId).emit("peer-count", count);
    });
    socket.on("code-change", ({ roomId, newCode }) => {
        roomCodeMap.set(roomId, newCode);
        socket.to(roomId).emit("code", newCode);
    });
    socket.on("disconnecting", async () => {
        for (const roomId of socket.rooms) {
            if (roomId === socket.id)
                continue; // skip the socket's own room
            const sockets = await io.in(roomId).fetchSockets();
            // subtract 1 because the current socket hasn't left yet
            const count = Math.max(0, sockets.length - 1);
            socket.to(roomId).emit("peer-count", count);
        }
    });
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});
server.listen(5001, () => {
    console.log("Server running on port 5001");
});
//# sourceMappingURL=index.js.map