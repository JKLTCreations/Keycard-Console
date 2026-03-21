import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /tools - List tools
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { category } = req.query;

  let query = 'SELECT * FROM tools WHERE org_id = ?';
  const params: unknown[] = [req.user!.orgId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY name ASC';

  const tools = db.prepare(query).all(...params);
  res.json({ data: tools });
});

// POST /tools - Create/connect a tool
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { name, description, category, icon } = req.body;

  if (!name) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'name is required' },
    });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO tools (id, name, description, category, icon, org_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, description || null, category || null, icon || null, req.user!.orgId, now);

  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(id);
  res.status(201).json({ data: tool });
});

// GET /tools/:id - Get tool detail
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const tool = db.prepare('SELECT * FROM tools WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  );

  if (!tool) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Tool not found' },
    });
    return;
  }

  res.json({ data: tool });
});

export default router;
