class Player {
  constructor(id, name, socketId, isHost = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isHost = isHost;
    this.isReady = false;
    this.hasGuessed = false;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isHost: this.isHost,
      isReady: this.isReady,
      hasGuessed: this.hasGuessed,
    };
  }

  resetRoundState() {
    this.hasGuessed = false;
  }
}

module.exports = { Player };
