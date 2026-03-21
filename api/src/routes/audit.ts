import { Router, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /audit/events - Query audit events
router.get('/events', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { agent_id, user_id, tool_id, outcome, since, until, cursor, limit: limitStr } = req.query;
  const limit = Math.min(parseInt(limitStr as string) || 50, 200);

  let query = `
    SELECT e.*, t.name as tool_name, a.name as agent_name, u.name as user_name
    FROM audit_events e
    LEFT JOIN tools t ON e.tool_id = t.id
    LEFT JOIN agents a ON e.agent_id = a.id
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.org_id = ?
  `;
  const params: unknown[] = [req.user!.orgId];

  if (agent_id) { query += ' AND e.agent_id = ?'; params.push(agent_id); }
  if (user_id) { query += ' AND e.user_id = ?'; params.push(user_id); }
  if (tool_id) { query += ' AND e.tool_id = ?'; params.push(tool_id); }
  if (outcome) { query += ' AND e.outcome = ?'; params.push(outcome); }
  if (since) { query += ' AND e.created_at >= ?'; params.push(since); }
  if (until) { query += ' AND e.created_at <= ?'; params.push(until); }
  if (cursor) { query += ' AND e.created_at < ?'; params.push(cursor); }

  query += ' ORDER BY e.created_at DESC LIMIT ?';
  params.push(limit + 1);

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data[data.length - 1].created_at as string) : null;

  const events = data.map((e) => ({
    ...e,
    metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata as string) : e.metadata,
  }));

  res.json({ data: events, cursor: nextCursor, hasMore });
});

// GET /audit/stream - SSE endpoint for live events
router.get('/stream', (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const orgId = req.user!.orgId;
  let lastSeenAt = new Date().toISOString();

  const sendEvents = () => {
    try {
      const db = getDb();
      const events = db.prepare(`
        SELECT e.*, t.name as tool_name, a.name as agent_name
        FROM audit_events e
        LEFT JOIN tools t ON e.tool_id = t.id
        LEFT JOIN agents a ON e.agent_id = a.id
        WHERE e.org_id = ? AND e.created_at > ?
        ORDER BY e.created_at ASC
        LIMIT 50
      `).all(orgId, lastSeenAt) as Record<string, unknown>[];

      for (const event of events) {
        const formatted = {
          ...event,
          metadata: typeof event.metadata === 'string' ? JSON.parse(event.metadata as string) : event.metadata,
        };
        res.write(`data: ${JSON.stringify(formatted)}\n\n`);
        lastSeenAt = event.created_at as string;
      }
    } catch {
      // DB might be closed during shutdown
    }
  };

  // Send heartbeat immediately
  res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);

  const interval = setInterval(sendEvents, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;
