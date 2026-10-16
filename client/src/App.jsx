import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppBackground } from "./components/AppBackground.jsx";
import { GameProvider } from "./GameContext.jsx";
import { Home } from "./pages/Home.jsx";
import { Lobby } from "./pages/Lobby.jsx";
import { Game } from "./pages/Game.jsx";
import "./styles.css";

export default function App() {
  return (
    <GameProvider>
      <div className="app-shell">
        <AppBackground />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </BrowserRouter>
      </div>
    </GameProvider>
  );
}
