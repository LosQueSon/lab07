function buildBlueprintKey(author, name) {
  return `${author}:${name}`;
}

function createBlueprintStore() {
  const blueprints = new Map();

  return {
    size() {
      return blueprints.size;
    },

    listByAuthor(author) {
      const byAuthor = Array.from(blueprints.values())
        .filter((bp) => bp.author === author)
        .map((bp) => ({
          author: bp.author,
          name: bp.name,
          points: bp.points,
          totalPoints: bp.points.length
        }));

      const totalPoints = byAuthor.reduce((acc, bp) => acc + bp.totalPoints, 0);

      return {
        author,
        totalBlueprints: byAuthor.length,
        totalPoints,
        blueprints: byAuthor
      };
    },

    get(author, name) {
      return blueprints.get(buildBlueprintKey(author, name));
    },

    create(blueprint) {
      const key = buildBlueprintKey(blueprint.author, blueprint.name);
      if (blueprints.has(key)) {
        return { created: false };
      }

      blueprints.set(key, blueprint);
      return { created: true, blueprint };
    },

    update(author, name, points) {
      const key = buildBlueprintKey(author, name);
      if (!blueprints.has(key)) {
        return { updated: false };
      }

      const blueprint = { author, name, points };
      blueprints.set(key, blueprint);
      return { updated: true, blueprint };
    },

    delete(author, name) {
      const key = buildBlueprintKey(author, name);
      if (!blueprints.has(key)) {
        return { deleted: false };
      }

      blueprints.delete(key);
      return { deleted: true };
    },

    appendPoint(author, name, point) {
      const key = buildBlueprintKey(author, name);
      const existing = blueprints.get(key) || { author, name, points: [] };
      existing.points.push({ x: point.x, y: point.y });
      blueprints.set(key, existing);
      return existing;
    }
  };
}

module.exports = {
  createBlueprintStore,
  buildBlueprintKey
};
