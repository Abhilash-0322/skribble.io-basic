const { randomUUID } = require("crypto");
const words = require("./data/words.json");

class Game {
  constructor(settings) {
    this.settings = settings;
    this.phase = "lobby";
    this.currentRound = 0;
    this.drawerIndex = 0;
    this.currentWord = null;
    this.wordOptions = [];
    this.strokes = [];
    this.roundTimer = null;
    this.hintTimer = null;
    this.timeLeft = 0;
    this.revealedHintCount = 0;
    this.roundEnded = false;
  }

  getDrawer(players) {
    if (players.length === 0) return null;
    return players[this.drawerIndex % players.length];
  }

  resetPlayersForRound(players) {
    for (const p of players) p.resetRoundState();
  }

  start(players) {
    this.currentRound = 1;
    this.drawerIndex = 0;
    this.beginWordSelect(players);
  }

  beginWordSelect(players) {
    this.clearTimers();
    this.phase = "word_select";
    this.currentWord = null;
    this.strokes = [];
    this.roundEnded = false;
    this.revealedHintCount = 0;
    this.wordOptions = this.pickWords(this.settings.wordCount);
    this.resetPlayersForRound(players);
  }

  pickWords(count) {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  chooseWord(word) {
    if (!this.wordOptions.includes(word)) return false;
    this.currentWord = word;
    this.phase = "drawing";
    this.timeLeft = this.settings.drawTime;
    return true;
  }

  addStroke(stroke) {
    const full = { ...stroke, id: randomUUID() };
    this.strokes.push(full);
    return full;
  }

  undoLastStroke() {
    const removed = this.strokes.pop();
    return removed ?? null;
  }

  clearCanvas() {
    this.strokes = [];
  }

  normalizeGuess(text) {
    return text.trim().toLowerCase().replace(/\s+/g, " ");
  }

  checkGuess(text) {
    if (!this.currentWord) return false;
    return this.normalizeGuess(text) === this.normalizeGuess(this.currentWord);
  }

  getHintDisplay() {
    if (!this.currentWord) return "";
    if (this.settings.hints <= 0) {
      return this.currentWord
        .split("")
        .map((c) => (c === " " ? " " : "_"))
        .join(" ");
    }
    const chars = this.currentWord.split("");
    const letterIndices = [];
    chars.forEach((c, i) => {
      if (c !== " ") letterIndices.push(i);
    });
    const revealSet = new Set(letterIndices.slice(0, this.revealedHintCount));
    return chars
      .map((c, i) => {
        if (c === " ") return " ";
        return revealSet.has(i) ? c.toUpperCase() : "_";
      })
      .join(" ");
  }

  scheduleHints(onTick) {
    if (this.settings.hints <= 0 || !this.currentWord) return;
    const interval = Math.max(10, Math.floor(this.settings.drawTime / (this.settings.hints + 1)));
    this.hintTimer = setInterval(() => {
      if (this.phase !== "drawing" || this.roundEnded) return;
      const maxLetters = this.currentWord.replace(/\s/g, "").length;
      if (this.revealedHintCount < maxLetters) {
        this.revealedHintCount++;
        onTick();
      }
    }, interval * 1000);
  }

  startRoundTimer(onTick, onEnd) {
    this.clearRoundTimer();
    onTick(this.timeLeft);
    this.roundTimer = setInterval(() => {
      this.timeLeft--;
      onTick(this.timeLeft);
      if (this.timeLeft <= 0) {
        this.clearRoundTimer();
        onEnd();
      }
    }, 1000);
  }

  clearRoundTimer() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }

  clearHintTimer() {
    if (this.hintTimer) {
      clearInterval(this.hintTimer);
      this.hintTimer = null;
    }
  }

  clearTimers() {
    this.clearRoundTimer();
    this.clearHintTimer();
  }

  advanceAfterRound(players) {
    this.phase = "round_end";
    this.clearTimers();
    const totalTurns = this.settings.rounds * players.length;
    const completedTurn = (this.currentRound - 1) * players.length + this.drawerIndex + 1;
    if (completedTurn >= totalTurns) {
      this.phase = "game_over";
      return { gameOver: true };
    }
    this.drawerIndex++;
    if (this.drawerIndex >= players.length) {
      this.drawerIndex = 0;
      this.currentRound++;
    }
    return { gameOver: false };
  }
}

module.exports = { Game };
