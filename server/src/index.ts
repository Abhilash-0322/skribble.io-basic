import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, type Server as HttpServer } from "http";
import { setupSocketIO } from "./socketSetup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

/** Monolith deploy (Render/Railway/local). Vercel Services only runs the API + Socket.IO. */
const isVercelService = process.env.VERCEL === "1";

function clientOrigin(): string | boolean {
  if (process.env.CLIENT_ORIGIN) return process.env.CLIENT_ORIGIN;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:5173";
}

export function createHttpServer(): HttpServer {
  const app = express();
  app.use(cors({ origin: clientOrigin() }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: isVercelService ? "vercel-service" : "monolith" });
  });

  if (!isVercelService) {
    const clientDist = path.join(__dirname, "../../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
      res.sendFile(path.join(clientDist, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  const httpServer = createServer(app);
  setupSocketIO(httpServer, { path: "/socket.io", corsOrigin: clientOrigin() });
  return httpServer;
}

const httpServer = createHttpServer();

if (!isVercelService) {
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Run: npm run predev — or change PORT and VITE_DEV_API_URL in .env to match.`
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default httpServer;
