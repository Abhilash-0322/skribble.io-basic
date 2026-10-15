const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const serverRoot = path.join(__dirname, "..");
const repoRoot = path.join(serverRoot, "..");
const clientDist = path.join(repoRoot, "client", "dist");
const publicDir = path.join(serverRoot, "public");

execSync("npm run build", { cwd: path.join(repoRoot, "client"), stdio: "inherit" });
execSync("npm run build", { cwd: serverRoot, stdio: "inherit" });

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(clientDist, publicDir, { recursive: true });

console.log("Copied client build to server/public for Vercel CDN");
