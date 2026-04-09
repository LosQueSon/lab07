const express = require('express');

function createBlueprintRouter({ store, parseBlueprintPayload, io }) {
  const router = express.Router();

  function emitUserPoints(author) {
    if (!io) {
      return;
    }

    const summary = store.listByAuthor(author);
    const authorRoom = `author.${author}`;
    io.to(authorRoom).emit('user-points-update', {
      author,
      totalPoints: summary.totalPoints,
      totalBlueprints: summary.totalBlueprints
    });
  }

  router.get('/users/:author/points', (req, res) => {
    const { author } = req.params;
    const summary = store.listByAuthor(author);

    return res.json({
      author,
      totalPoints: summary.totalPoints,
      totalBlueprints: summary.totalBlueprints
    });
  });

  router.get('/blueprints', (req, res) => {
    const { author } = req.query;

    if (!author || typeof author !== 'string') {
      return res.status(400).json({
        message: 'Debes enviar el query param author, por ejemplo: /api/blueprints?author=juan'
      });
    }

    return res.json(store.listByAuthor(author));
  });

  router.post('/blueprints', (req, res) => {
    const result = parseBlueprintPayload(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: 'Payload invalido.',
        issues: result.error.issues
      });
    }

    const created = store.create(result.data);
    if (!created.created) {
      return res.status(409).json({
        message: `El blueprint ${result.data.name} del autor ${result.data.author} ya existe.`
      });
    }

    emitUserPoints(result.data.author);

    return res.status(201).json(created.blueprint);
  });

  // Compatibilidad temporal con el endpoint anterior.
  router.post('/blueprints/:author/:name', (req, res) => {
    const result = parseBlueprintPayload({
      author: req.params.author,
      name: req.params.name,
      points: req.body.points
    });

    if (!result.success) {
      return res.status(400).json({
        message: 'Payload invalido.',
        issues: result.error.issues
      });
    }

    const created = store.create(result.data);
    if (!created.created) {
      return res.status(409).json({
        message: `El blueprint ${result.data.name} del autor ${result.data.author} ya existe.`
      });
    }

    emitUserPoints(result.data.author);

    return res.status(201).json(created.blueprint);
  });

  router.put('/blueprints/:author/:name', (req, res) => {
    const result = parseBlueprintPayload({
      author: req.params.author,
      name: req.params.name,
      points: req.body.points
    });

    if (!result.success) {
      return res.status(400).json({
        message: 'Payload invalido.',
        issues: result.error.issues
      });
    }

    const updated = store.update(result.data.author, result.data.name, result.data.points);
    if (!updated.updated) {
      return res.status(404).json({
        message: `No existe el blueprint ${result.data.name} del autor ${result.data.author}`
      });
    }

    emitUserPoints(result.data.author);

    return res.json(updated.blueprint);
  });

  router.delete('/blueprints/:author/:name', (req, res) => {
    const { author, name } = req.params;
    const removed = store.delete(author, name);

    if (!removed.deleted) {
      return res.status(404).json({
        message: `No existe el blueprint ${name} del autor ${author}`
      });
    }

    const room = `blueprints.${author}.${name}`;
    if (io) {
      // Compatibilidad con front actual: al borrar se limpia el canvas en tiempo real.
      io.to(room).emit('blueprint-update', {
        author,
        name,
        points: []
      });

      io.to(room).emit('blueprint-deleted', {
        author,
        name,
        room
      });

      console.log(`[DELETE] room=${room} event=blueprint-deleted`);
    }

    emitUserPoints(author);

    return res.json({ message: `Blueprint ${name} del autor ${author} eliminado.` });
  });

  router.get('/blueprints/:author/:name', (req, res) => {
    const { author, name } = req.params;
    const blueprint = store.get(author, name);

    if (!blueprint) {
      return res.status(404).json({
        message: `No existe el blueprint ${name} del autor ${author}`
      });
    }

    return res.json(blueprint);
  });

  return router;
}

module.exports = {
  createBlueprintRouter
};
