import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createSocket, emitAck } from "./socket.js";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const socket = useMemo(() => createSocket(), []);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(() => {
    const raw = sessionStorage.getItem("skribble_session");
    return raw ? JSON.parse(raw) : null;
  });
  const [lobby, setLobby] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [wordOptions, setWordOptions] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roundBanner, setRoundBanner] = useState(null);
  const [gameOver, setGameOver] = useState(null);

  const connect = useCallback(() => {
    if (!socket.connected) socket.connect();
  }, [socket]);

  useEffect(() => {
    if (session) {
      sessionStorage.setItem("skribble_session", JSON.stringify(session));
    } else {
      sessionStorage.removeItem("skribble_session");
    }
  }, [session]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    socket.on("lobby_state", (data) => setLobby(data));
    socket.on("player_updated", (data) => {
      setLobby((prev) => (prev ? { ...prev, players: data.players, canStart: prev.canStart } : prev));
    });
    socket.on("player_joined", (data) => {
      setLobby((prev) => (prev ? { ...prev, players: data.players } : prev));
    });
    socket.on("player_left", (data) => {
      setLobby((prev) => (prev ? { ...prev, players: data.players } : prev));
    });
    socket.on("game_state", (data) => setGameState(data));
    socket.on("round_start", (data) => {
      setWordOptions(data.wordOptions);
      setRoundBanner(null);
      setMessages([]);
    });
    socket.on("round_drawing_start", () => {
      setWordOptions(null);
    });
    socket.on("timer_tick", (data) => {
      setGameState((prev) => (prev ? { ...prev, timeLeft: data.timeLeft } : prev));
    });
    socket.on("hint_update", (data) => {
      setGameState((prev) => (prev ? { ...prev, hint: data.hint } : prev));
    });
    socket.on("round_end", (data) => {
      setRoundBanner(`Round over! The word was: ${data.word}`);
      if (!data.gameOver) setWordOptions(null);
    });
    socket.on("game_over", (data) => {
      setGameOver(data);
    });
    socket.on("chat_message", (msg) => {
      setMessages((m) => [...m, msg]);
    });
    socket.on("guess_result", (data) => {
      if (data.correct) {
        setMessages((m) => [
          ...m,
          {
            playerId: data.playerId,
            playerName: data.playerName,
            text: `${data.playerName} guessed the word!`,
            isGuess: true,
            isCorrect: true,
          },
        ]);
      }
    });
    socket.on("canvas_clear", () => {
      setGameState((prev) => (prev ? { ...prev, strokes: [] } : prev));
    });
    socket.on("draw_undo", () => {
      setGameState((prev) => {
        if (!prev) return prev;
        const strokes = [...prev.strokes];
        strokes.pop();
        return { ...prev, strokes };
      });
    });
    socket.on("draw_data", (data) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const strokes = [...prev.strokes];
        if (data.action === "add" && data.stroke) {
          strokes.push(data.stroke);
        } else if (data.action === "move" && data.strokeId && data.point) {
          const idx = strokes.findIndex((x) => x.id === data.strokeId);
          if (idx >= 0) {
            const s = strokes[idx];
            strokes[idx] = { ...s, points: [...s.points, data.point] };
          }
        }
        return { ...prev, strokes };
      });
    });
    return () => {
      socket.off("lobby_state");
      socket.off("player_updated");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("game_state");
      socket.off("round_start");
      socket.off("round_drawing_start");
      socket.off("timer_tick");
      socket.off("hint_update");
      socket.off("round_end");
      socket.off("game_over");
      socket.off("chat_message");
      socket.off("guess_result");
      socket.off("canvas_clear");
      socket.off("draw_undo");
      socket.off("draw_data");
    };
  }, [socket]);

  const value = {
    socket,
    connected,
    session,
    setSession,
    lobby,
    gameState,
    wordOptions,
    messages,
    roundBanner,
    gameOver,
    setGameOver,
    connect,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame outside provider");
  return ctx;
}

export { emitAck };
