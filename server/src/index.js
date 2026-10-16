const path = require("path");
const express = require("express");
const { app, httpServer } = require("./app.js");

const PORT = Number(process.env.PORT) || 3001;
const isVercelService = process.env.VERCEL === "1";

if (!isVercelService) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Run: npm run predev — or change PORT and VITE_DEV_API_URL in .env to match.`
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });
}

module.exports = httpServer;
