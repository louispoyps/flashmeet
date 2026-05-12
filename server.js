const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    const filePath = path.join(__dirname, "..", "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("index.html introuvable — place-le dans speeddate/");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

let waitingQueue = [];
const activeRooms = new Map();
const socketRoom = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

function tryMatch(socket) {
  waitingQueue = waitingQueue.filter((s) => s.id !== socket.id);

  if (waitingQueue.length > 0) {
    const partner = waitingQueue.shift();
    const roomId = generateRoomId();

    activeRooms.set(roomId, {
      users: [socket.id, partner.id],
      likes: {},
    });
    socketRoom.set(socket.id, roomId);
    socketRoom.set(partner.id, roomId);

    socket.join(roomId);
    partner.join(roomId);

    socket.emit("matched", { roomId, initiator: false });
    partner.emit("matched", { roomId, initiator: true });

    console.log(`[MATCH] ${socket.id} <-> ${partner.id}  room=${roomId}`);
  } else {
    waitingQueue.push(socket);
    socket.emit("waiting");
    console.log(`[WAIT] ${socket.id} — queue: ${waitingQueue.length}`);
  }
}

function cleanupSocket(socket) {
  waitingQueue = waitingQueue.filter((s) => s.id !== socket.id);
  const roomId = socketRoom.get(socket.id);
  if (roomId) {
    const room = activeRooms.get(roomId);
    if (room) {
      socket.to(roomId).emit("partner_left");
      activeRooms.delete(roomId);
    }
    socketRoom.delete(socket.id);
  }
}

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.on("find_match", () => tryMatch(socket));

  socket.on("cancel_search", () => {
    waitingQueue = waitingQueue.filter((s) => s.id !== socket.id);
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", { sdp: data.sdp });
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", { sdp: data.sdp });
  });

  socket.on("ice_candidate", (data) => {
    socket.to(data.roomId).emit("ice_candidate", { candidate: data.candidate });
  });

  socket.on("next", () => {
    const roomId = socketRoom.get(socket.id);
    if (roomId) {
      const room = activeRooms.get(roomId);
      if (room) {
        socket.to(roomId).emit("partner_left");
        activeRooms.delete(roomId);
        room.users.forEach((uid) => socketRoom.delete(uid));
      }
      socket.leave(roomId);
    }
    tryMatch(socket);
  });

  socket.on("like", () => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    const room = activeRooms.get(roomId);
    if (!room) return;
    room.likes[socket.id] = true;
    const bothLiked = room.users.every((uid) => room.likes[uid] === true);
    if (bothLiked) {
      io.to(roomId).emit("match");
    } else {
      socket.to(roomId).emit("partner_liked");
    }
  });

  socket.on("pass", () => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit("partner_left");
    const room = activeRooms.get(roomId);
    if (room) {
      activeRooms.delete(roomId);
      room.users.forEach((uid) => socketRoom.delete(uid));
    }
    socket.leave(roomId);
    tryMatch(socket);
  });

  socket.on("chat_message", (data) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit("chat_message", { text: data.text });
  });

  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id}`);
    cleanupSocket(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 SpeedDate → http://localhost:${PORT}\n`);
});
