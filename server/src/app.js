const path = require("path");
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { setupSocketIO } = require("./socketSetup.js");
const { attachPublicAssets } = require("./publicAssets.js");

function clientOrigin() {
  if (process.env.CLIENT_ORIGIN) {
    return process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim());
  }
  if (process.env.VERCEL === "1") return true;
  return "http://localhost:5173";
}

function createApp(assetDir = __dirname) {
  const app = express();
  app.use(cors({ origin: clientOrigin() }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    const mode =
      process.env.VERCEL === "1"
        ? "vercel-service"
        : process.env.WEBSITE_SITE_NAME
          ? "azure-app-service"
          : "monolith";
    res.json({ ok: true, mode });
  });

  if (process.env.VERCEL === "1") {
    attachPublicAssets(app, assetDir);
  }

  const httpServer = createServer(app);
  const io = setupSocketIO(httpServer, { path: "/socket.io", corsOrigin: clientOrigin() });

  if (process.env.VERCEL === "1") {
    app.use((req, res, next) => {
      if (!req.url?.startsWith("/socket.io")) return next();
      io.engine.handleRequest(req, res);
    });
  }

  return { app, httpServer };
}

const bundle = createApp();

module.exports = { createApp, app: bundle.app, httpServer: bundle.httpServer };
