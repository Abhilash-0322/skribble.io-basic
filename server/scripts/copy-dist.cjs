const fs = require("fs");
const path = require("path");

const serverRoot = path.join(__dirname, "..");
const src = path.join(serverRoot, "src");
const dist = path.join(serverRoot, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "data"), { recursive: true });

for (const name of fs.readdirSync(src)) {
  if (name.endsWith(".js")) {
    fs.copyFileSync(path.join(src, name), path.join(dist, name));
  }
}

fs.copyFileSync(path.join(src, "data", "words.json"), path.join(dist, "data", "words.json"));
