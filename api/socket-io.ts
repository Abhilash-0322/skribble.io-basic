import { createServer } from "node:http";
import { setupSocketIO } from "../server/src/socketSetup.js";

/**
 * Vercel WebSocket function — https://vercel.com/docs/functions/websockets
 * Served at /api/socket-io (Socket.IO client path: /api/socket-io/socket.io)
 */
const httpServer = createServer();

setupSocketIO(httpServer, {
  path: "/api/socket-io/socket.io",
  corsOrigin: true,
});

export default httpServer;
