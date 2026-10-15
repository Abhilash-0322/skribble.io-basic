import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isVercelService = process.env.VERCEL === "1";

const { app, httpServer } = createApp();

if (!isVercelService) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });

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

/** Vercel WebSocket / Node service entry (not Express framework). */
export default httpServer;
