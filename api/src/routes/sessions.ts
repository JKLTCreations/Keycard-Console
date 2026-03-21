import { Router, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /sessions - List sessions
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { cursor, limit: limitStr, status, agent_id } = req.query;
  const limit = Math.min(parseInt(limitStr as string) || 20, 100);

  let query = `
    SELECT s.*, a.name as agent_name, a.type as agent_type
    FROM sessions s
    JOIN agents a ON s.agent_id = a.id
    WHERE a.org_id = ?
  `;
  const params: unknown[] = [req.user!.orgId];

  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }
  if (agent_id) {
    query += ' AND s.agent_id = ?';
    params.push(agent_id);
  }
  if (cursor) {
    query += ' AND s.started_at < ?';
    params.push(cursor);
  }

  query += ' ORDER BY s.started_at DESC LIMIT ?';
  params.push(limit + 1);

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data[data.length - 1].started_at as string) : null;

  res.json({ data, cursor: nextCursor, hasMore });
});

// GET /sessions/:id - Get session detail
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const session = db.prepare(`
    SELECT s.*, a.name as agent_name, a.type as agent_type
    FROM sessions s
    JOIN agents a ON s.agent_id = a.id
    WHERE s.id = ? AND a.org_id = ?
  `).get(req.params.id, req.user!.orgId) as Record<string, unknown> | undefined;

  if (!session) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    });
    return;
  }

  // Include credentials for this session
  const credentials = db.prepare('SELECT * FROM credentials WHERE session_id = ?').all(req.params.id);

  res.json({ data: { ...session, credentials } });
});

// GET /sessions/:id/events - Get events for a session
router.get('/:id/events', (req: AuthRequest, res: Response) => {
  const db = getDb();

  // Verify session belongs to org
  const session = db.prepare(`
    SELECT s.id FROM sessions s
    JOIN agents a ON s.agent_id = a.id
    WHERE s.id = ? AND a.org_id = ?
  `).get(req.params.id, req.user!.orgId);

  if (!session) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    });
    return;
  }

  const events = db.prepare(`
    SELECT e.*, t.name as tool_name, a.name as agent_name
    FROM audit_events e
    LEFT JOIN tools t ON e.tool_id = t.id
    LEFT JOIN agents a ON e.agent_id = a.id
    WHERE e.session_id = ?
    ORDER BY e.created_at ASC
  `).all(req.params.id) as Record<string, unknown>[];

  const formatted = events.map((e) => ({
    ...e,
    metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata as string) : e.metadata,
  }));

  res.json({ data: formatted });
});

export default router;
