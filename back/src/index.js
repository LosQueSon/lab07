const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createBlueprintRouter } = require('./routes/blueprints.routes');
const { parseBlueprintPayload, parseDrawPayload } = require('./validation/schemas');
const { setupBlueprintSockets } = require('./sockets/blueprints.socket');
const { createBlueprintStore } = require('./store/blueprints.store');

const app = express();
app.use(express.json());

const store = createBlueprintStore();
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'https://tu-frontend.com';
const allowed = process.env.NODE_ENV === 'production'
  ? [frontendOrigin]
  : ['http://localhost:5173'];

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowed,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'blueprints-api',
    uptimeSeconds: Math.floor(process.uptime()),
    blueprintsInMemory: store.size(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.use('/api', createBlueprintRouter({ store, parseBlueprintPayload, io }));
setupBlueprintSockets(io, { store, parseDrawPayload });

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log(`Puedes acceder a la API en http://localhost:${PORT}/api/blueprints/:author/:name`);
});
