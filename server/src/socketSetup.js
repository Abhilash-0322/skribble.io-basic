const { Server } = require("socket.io");
const { RoomManager } = require("./RoomManager.js");
const { MessageHandler } = require("./MessageHandler.js");

const roomManager = new RoomManager();

function setupSocketIO(httpServer, options = {}) {
  const io = new Server(httpServer, {
    path: options.path ?? "/socket.io",
    cors: {
      origin: options.corsOrigin ?? true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });
  const handler = new MessageHandler(io, roomManager);
  io.on("connection", (socket) => handler.register(socket));
  return io;
}

module.exports = { setupSocketIO, roomManager };
