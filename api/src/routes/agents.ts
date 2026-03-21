import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /agents - List agents
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { cursor, limit: limitStr, status, type } = req.query;
  const limit = Math.min(parseInt(limitStr as string) || 20, 100);

  let query = 'SELECT * FROM agents WHERE org_id = ?';
  const params: unknown[] = [req.user!.orgId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (cursor) {
    query += ' AND created_at < ?';
    params.push(cursor);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit + 1);

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data[data.length - 1].created_at as string) : null;

  const agents = data.map(formatAgent);

  res.json({
    data: agents,
    cursor: nextCursor,
    hasMore,
  });
});

// POST /agents - Create agent
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { name, type, config } = req.body;

  if (!name || !type) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'name and type are required' },
    });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const configJson = JSON.stringify(config || {});

  db.prepare(
    'INSERT INTO agents (id, name, type, status, org_id, created_by, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, type, 'active', req.user!.orgId, req.user!.id, configJson, now, now);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Record<string, unknown>;

  res.status(201).json({ data: formatAgent(agent) });
});

// GET /agents/:id - Get agent
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!agent) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Agent not found' },
    });
    return;
  }

  res.json({ data: formatAgent(agent) });
});

// PATCH /agents/:id - Update agent
router.patch('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM agents WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Agent not found' },
    });
    return;
  }

  const { name, type, config, status } = req.body;
  const updates: string[] = [];
  const params: unknown[] = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (type !== undefined) { updates.push('type = ?'); params.push(type); }
  if (config !== undefined) { updates.push('config = ?'); params.push(JSON.stringify(config)); }
  if (status !== undefined) {
    if (!['active', 'revoked'].includes(status)) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'status must be active or revoked' },
      });
      return;
    }
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length === 0) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
    });
    return;
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);

  db.prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json({ data: formatAgent(agent) });
});

// DELETE /agents/:id - Revoke agent
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM agents WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Agent not found' },
    });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE agents SET status = ?, updated_at = ? WHERE id = ?').run('revoked', now, req.params.id);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json({ data: formatAgent(agent) });
});

// GET /agents/:id/sessions - List sessions for an agent
router.get('/:id/sessions', (req: AuthRequest, res: Response) => {
  const db = getDb();

  const agent = db.prepare('SELECT id FROM agents WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  );
  if (!agent) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Agent not found' },
    });
    return;
  }

  const { cursor, limit: limitStr } = req.query;
  const limit = Math.min(parseInt(limitStr as string) || 20, 100);

  let query = 'SELECT * FROM sessions WHERE agent_id = ?';
  const params: unknown[] = [req.params.id];

  if (cursor) {
    query += ' AND started_at < ?';
    params.push(cursor);
  }

  query += ' ORDER BY started_at DESC LIMIT ?';
  params.push(limit + 1);

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data[data.length - 1].started_at as string) : null;

  res.json({
    data,
    cursor: nextCursor,
    hasMore,
  });
});

function formatAgent(row: Record<string, unknown>) {
  return {
    ...row,
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
  };
}

export default router;
