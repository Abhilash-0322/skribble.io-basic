#!/usr/bin/env node
/**
 * Frees the dev game server port so `npm run dev` does not fail with EADDRINUSE
 * when a previous tsx/node server was left running.
 */
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let port = process.env.PORT;

if (!port && existsSync(path.join(root, ".env"))) {
  const env = readFileSync(path.join(root, ".env"), "utf8");
  const m = env.match(/^PORT=(\d+)/m);
  if (m) port = m[1];
}

port = port || "3100";

try {
  execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
  console.log(`Freed port ${port} (stopped previous dev server).`);
} catch {
  // nothing listening
}
