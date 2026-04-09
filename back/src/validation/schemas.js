const { z } = require('zod');

const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const blueprintSchema = z.object({
  author: z.string().min(1),
  name: z.string().min(1),
  points: z.array(pointSchema)
});

const drawEventSchema = z.object({
  room: z.string().min(1),
  author: z.string().min(1),
  name: z.string().min(1),
  point: pointSchema
});

function parseBlueprintPayload(payload) {
  return blueprintSchema.safeParse(payload);
}

function parseDrawPayload(payload) {
  return drawEventSchema.safeParse(payload);
}

module.exports = {
  parseBlueprintPayload,
  parseDrawPayload
};
