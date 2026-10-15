import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import { createServer, type Server as HttpServer } from "http";
import { setupSocketIO } from "./socketSetup.js";
import { attachPublicAssets } from "./publicAssets.js";

function clientOrigin(): string | boolean {
  if (process.env.CLIENT_ORIGIN) return process.env.CLIENT_ORIGIN;
  if (process.env.VERCEL === "1") return true;
  return "http://localhost:5173";
}

export function createApp(assetDir = __dirname): { app: Express; httpServer: HttpServer } {
  const app = express();
  app.use(cors({ origin: clientOrigin() }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: process.env.VERCEL === "1" ? "vercel-service" : "monolith" });
  });

  if (process.env.VERCEL === "1") {
    attachPublicAssets(app, assetDir);
  }

  const httpServer = createServer(app);
  setupSocketIO(httpServer, { path: "/socket.io", corsOrigin: clientOrigin() });
  return { app, httpServer };
}

const { app } = createApp();
export default app;
