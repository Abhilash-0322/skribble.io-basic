const fs = require("fs");
const path = require("path");
const express = require("express");

function attachPublicAssets(app, dirname) {
  const publicDir = path.join(dirname, "public");
  if (!fs.existsSync(publicDir)) {
    console.warn("public assets missing at", publicDir);
    return;
  }

  app.use(
    express.static(publicDir, {
      index: false,
      maxAge: "1h",
    })
  );

  app.get(/^(?!\/api\/)(?!\/socket\.io).*/, (req, res, next) => {
    const filePath = path.join(publicDir, req.path);
    if (req.path !== "/" && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

module.exports = { attachPublicAssets };
