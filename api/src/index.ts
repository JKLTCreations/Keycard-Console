import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { getDb, closeDb } from './db';
import { initializeSchema, seedDemoData } from './db/schema';

import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import policyRoutes from './routes/policies';
import sessionRoutes from './routes/sessions';
import toolRoutes from './routes/tools';
import auditRoutes from './routes/audit';
import statsRoutes from './routes/stats';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (all under /v1)
app.use('/v1/auth', authRoutes);
app.use('/v1/agents', agentRoutes);
app.use('/v1/policies', policyRoutes);
app.use('/v1/sessions', sessionRoutes);
app.use('/v1/tools', toolRoutes);
app.use('/v1/audit', auditRoutes);
app.use('/v1/stats', statsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' },
  });
});

// Initialize database and start server
function start() {
  const db = getDb();
  initializeSchema(db);
  seedDemoData(db);
  console.log('Database initialized and seeded.');

  const server = app.listen(PORT, () => {
    console.log(`Keycard Console API running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();

export default app;
