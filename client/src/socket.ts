import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "";

export function createSocket(): Socket {
  return io(URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
}

export type SocketAck<T> = (response: { ok: boolean; error?: string; data?: T }) => void;

export function emitAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 8000
): Promise<{ ok: boolean; error?: string; data?: T }> {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve({
        ok: false,
        error: "Not connected to game server. Restart npm run dev and check the terminal for port errors.",
      });
      return;
    }
    const timer = setTimeout(() => {
      resolve({
        ok: false,
        error: "Server did not respond. Is the backend running on the port in .env (default 3100)?",
      });
    }, timeoutMs);
    socket.emit(event, payload, (res: { ok: boolean; error?: string; data?: T }) => {
      clearTimeout(timer);
      resolve(res ?? { ok: false, error: "No response from server" });
    });
  });
}
