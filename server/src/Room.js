const { randomUUID } = require("crypto");
const { Game } = require("./Game.js");
const { Player } = require("./Player.js");
const { DEFAULT_SETTINGS } = require("./types.js");

function roomCode() {
  return randomUUID().slice(0, 6).toUpperCase();
}

class Room {
  constructor(hostName, hostSocketId, settings) {
    this.id = randomUUID();
    this.code = roomCode();
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.players = new Map();
    this.chatHistory = [];
    this.game = new Game(this.settings);
    const host = new Player(randomUUID(), hostName, hostSocketId, true);
    this.players.set(host.id, host);
  }

  get playerList() {
    return Array.from(this.players.values());
  }

  get host() {
    return this.playerList.find((p) => p.isHost);
  }

  findBySocket(socketId) {
    return this.playerList.find((p) => p.socketId === socketId);
  }

  addPlayer(name, socketId) {
    if (this.players.size >= this.settings.maxPlayers) return null;
    if (this.game.phase !== "lobby") return null;
    const player = new Player(randomUUID(), name, socketId, false);
    this.players.set(player.id, player);
    return player;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    this.players.delete(playerId);
    if (this.players.size > 0 && player.isHost) {
      const next = this.playerList[0];
      next.isHost = true;
    }
    return player;
  }

  updateSocket(playerId, socketId) {
    const p = this.players.get(playerId);
    if (p) p.socketId = socketId;
  }

  canStart() {
    return (
      this.game.phase === "lobby" &&
      this.players.size >= 2 &&
      this.playerList.every((p) => p.isReady || p.isHost)
    );
  }

  awardGuessPoints(player, rank) {
    const base = Math.max(50, this.game.timeLeft);
    const points = Math.floor(base * (1 - rank * 0.15));
    player.score += Math.max(10, points);
    const drawer = this.game.getDrawer(this.playerList);
    if (drawer) drawer.score += 25;
    return Math.max(10, points);
  }

  pushChat(msg) {
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 200) this.chatHistory.shift();
  }

  getGameStateFor(playerId) {
    const drawer = this.game.getDrawer(this.playerList);
    const isDrawer = drawer?.id === playerId;
    const word =
      this.game.phase === "drawing" || this.game.phase === "round_end"
        ? isDrawer || this.game.phase === "round_end"
          ? this.game.currentWord
          : null
        : null;

    return {
      phase: this.game.phase,
      round: this.game.currentRound,
      totalRounds: this.settings.rounds,
      drawerId: drawer?.id ?? null,
      timeLeft: this.game.timeLeft,
      hint: this.game.getHintDisplay(),
      word,
      wordMode: this.settings.wordMode,
      scores: this.playerList.map((p) => p.toPublic()),
      strokes: this.game.strokes,
    };
  }

  getRoundStartPayload(drawerId) {
    const drawer = this.players.get(drawerId);
    return {
      drawerId,
      drawerName: drawer?.name,
      drawTime: this.settings.drawTime,
      round: this.game.currentRound,
    };
  }

  getWordOptionsForDrawer(drawerId) {
    const drawer = this.game.getDrawer(this.playerList);
    if (!drawer || drawer.id !== drawerId) return null;
    return this.game.wordOptions;
  }
}

module.exports = { Room };
