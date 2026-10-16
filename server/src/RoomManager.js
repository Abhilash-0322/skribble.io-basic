const { Room } = require("./Room.js");

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.codeToId = new Map();
  }

  create(hostName, hostSocketId, settings) {
    const room = new Room(hostName, hostSocketId, settings);
    this.rooms.set(room.id, room);
    this.codeToId.set(room.code, room.id);
    return room;
  }

  get(roomId) {
    return this.rooms.get(roomId);
  }

  getByCode(code) {
    const id = this.codeToId.get(code.toUpperCase());
    return id ? this.rooms.get(id) : undefined;
  }

  listPublic() {
    return Array.from(this.rooms.values())
      .filter((r) => !r.settings.isPrivate && r.game.phase === "lobby")
      .map((r) => ({
        id: r.id,
        code: r.code,
        players: r.players.size,
        maxPlayers: r.settings.maxPlayers,
      }));
  }

  delete(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      this.codeToId.delete(room.code);
      this.rooms.delete(roomId);
    }
  }

  findRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      const player = room.findBySocket(socketId);
      if (player) return { room, player };
    }
    return null;
  }
}

module.exports = { RoomManager };
