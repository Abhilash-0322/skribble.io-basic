import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_SOCKET_URL || "";

function isVercelApiUrl(url) {
  return /vercel\.app/i.test(url);
}

function isPersistentApiUrl(url) {
  return /\.azurewebsites\.net$/i.test(url) || /onrender\.com$/i.test(url);
}

function socketTransports() {
  if (!API_URL) return ["websocket", "polling"];
  if (isVercelApiUrl(API_URL)) return ["polling", "websocket"];
  return ["websocket", "polling"];
}

export function createSocket() {
  const vercelRemote = Boolean(API_URL) && isVercelApiUrl(API_URL);
  const persistent = Boolean(API_URL) && isPersistentApiUrl(API_URL);
  return io(API_URL, {
    autoConnect: false,
    path: "/socket.io",
    transports: persistent ? ["websocket", "polling"] : socketTransports(),
    upgrade: true,
    withCredentials: !vercelRemote && !persistent,
    reconnectionAttempts: 12,
    reconnectionDelayMax: 5000,
  });
}

export function emitAck(socket, event, payload, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve({
        ok: false,
        error: remoteHint(),
      });
      return;
    }
    const timer = setTimeout(() => {
      resolve({ ok: false, error: "Server did not respond. Is the backend deployment running?" });
    }, timeoutMs);
    socket.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res ?? { ok: false, error: "No response from server" });
    });
  });
}

function remoteHint() {
  if (import.meta.env.PROD && !API_URL) {
    return "Set VITE_SOCKET_URL to your API host (e.g. Azure App Service), then redeploy the client.";
  }
  return "Not connected. Run npm run dev locally or check VITE_SOCKET_URL.";
}
