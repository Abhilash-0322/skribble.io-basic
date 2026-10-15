import express, { type Express } from "express";
import cors from "cors";
import { createServer, type Server as HttpServer } from "http";
import { setupSocketIO } from "./socketSetup.js";

function clientOrigin(): string | boolean {
  if (process.env.CLIENT_ORIGIN) return process.env.CLIENT_ORIGIN;
  // Preview + production Vercel hosts (avoid CORS blocking Socket.IO)
  if (process.env.VERCEL === "1") return true;
  return "http://localhost:5173";
}

export function createApp(): { app: Express; httpServer: HttpServer } {
  const app = express();
  app.use(cors({ origin: clientOrigin() }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: process.env.VERCEL === "1" ? "vercel-service" : "monolith" });
  });

  const httpServer = createServer(app);
  setupSocketIO(httpServer, { path: "/socket.io", corsOrigin: clientOrigin() });
  return { app, httpServer };
}

/** Vercel Express service entry (HTTP routes; Socket.IO needs httpServer entry). */
const { app } = createApp();
export default app;
