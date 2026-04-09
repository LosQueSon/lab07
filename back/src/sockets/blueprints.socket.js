function setupBlueprintSockets(io, { store, parseDrawPayload }) {
  io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('join-author-room', (author) => {
      if (typeof author !== 'string' || author.trim().length === 0) {
        socket.emit('error-event', { message: 'Autor invalido para join-author-room.' });
        return;
      }

      const authorRoom = `author.${author}`;
      socket.join(authorRoom);
      console.log(`Socket ${socket.id} unido a la sala ${authorRoom}`);

      const summary = store.listByAuthor(author);
      socket.emit('user-points-update', {
        author,
        totalPoints: summary.totalPoints,
        totalBlueprints: summary.totalBlueprints
      });
    });

    socket.on('join-room', (room) => {
      if (typeof room !== 'string' || room.trim().length === 0) {
        socket.emit('error-event', { message: 'Nombre de sala invalido.' });
        return;
      }

      socket.join(room);
      console.log(`Socket ${socket.id} unido a la sala ${room}`);
    });

    socket.on('draw-event', (payload) => {
      const result = parseDrawPayload(payload);

      if (!result.success) {
        socket.emit('error-event', {
          message: 'Payload invalido para draw-event.',
          issues: result.error.issues
        });
        return;
      }

      const { room, author, name, point } = result.data;

      const expectedRoom = `blueprints.${author}.${name}`;
      if (room !== expectedRoom) {
        socket.emit('error-event', {
          message: `Room invalido. Debe ser ${expectedRoom}`
        });
        return;
      }

      if (!socket.rooms.has(expectedRoom)) {
        socket.join(expectedRoom);
      }

      const existing = store.appendPoint(author, name, point);

      console.log(
        `[DRAW] socket=${socket.id} room=${expectedRoom} point=(${point.x},${point.y}) total=${existing.points.length}`
      );

      io.to(expectedRoom).emit('blueprint-update', {
        author,
        name,
        points: existing.points
      });

      const summary = store.listByAuthor(author);
      io.to(`author.${author}`).emit('user-points-update', {
        author,
        totalPoints: summary.totalPoints,
        totalBlueprints: summary.totalBlueprints
      });

      console.log(
        `[BROADCAST] room=${expectedRoom} event=blueprint-update points=${existing.points.length}`
      );
    });

    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });
}

module.exports = {
  setupBlueprintSockets
};
