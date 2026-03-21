import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /policies - List policies
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { status } = req.query;

  let query = 'SELECT * FROM policies WHERE org_id = ?';
  const params: unknown[] = [req.user!.orgId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY updated_at DESC';

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  const policies = rows.map(formatPolicy);

  res.json({ data: policies });
});

// POST /policies - Create policy
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { name, rules, status: policyStatus } = req.body;

  if (!name) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'name is required' },
    });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const rulesJson = JSON.stringify(rules || []);
  const finalStatus = policyStatus || 'observe';

  if (!['active', 'observe', 'archived'].includes(finalStatus)) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'status must be active, observe, or archived' },
    });
    return;
  }

  db.prepare(
    'INSERT INTO policies (id, name, version, status, rules, org_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, 1, finalStatus, rulesJson, req.user!.orgId, req.user!.id, now, now);

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json({ data: formatPolicy(policy) });
});

// GET /policies/:id - Get policy
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!policy) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Policy not found' },
    });
    return;
  }

  res.json({ data: formatPolicy(policy) });
});

// PUT /policies/:id - Update policy (creates new version)
router.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Policy not found' },
    });
    return;
  }

  const { name, rules, status: policyStatus } = req.body;
  const now = new Date().toISOString();
  const newVersion = (existing.version as number) + 1;

  const updates: string[] = ['version = ?', 'updated_at = ?'];
  const params: unknown[] = [newVersion, now];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (rules !== undefined) { updates.push('rules = ?'); params.push(JSON.stringify(rules)); }
  if (policyStatus !== undefined) {
    if (!['active', 'observe', 'archived'].includes(policyStatus)) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'status must be active, observe, or archived' },
      });
      return;
    }
    updates.push('status = ?');
    params.push(policyStatus);
  }

  params.push(req.params.id);
  db.prepare(`UPDATE policies SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json({ data: formatPolicy(policy) });
});

// POST /policies/:id/simulate - Simulate a request against a policy
router.post('/:id/simulate', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!policy) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Policy not found' },
    });
    return;
  }

  const { tool, action, resource } = req.body;
  if (!tool || !action) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'tool and action are required' },
    });
    return;
  }

  const rules = JSON.parse(policy.rules as string) as Array<{
    tool: string; action: string; outcome: string; reason?: string; condition?: string;
  }>;

  let matchedRule = null;
  for (const rule of rules) {
    const toolMatch = rule.tool === '*' || rule.tool.toLowerCase() === tool.toLowerCase();
    const actionMatch = rule.action === '*' || rule.action.toLowerCase() === action.toLowerCase();
    if (toolMatch && actionMatch) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    res.json({
      data: {
        outcome: 'deny',
        reason: 'No matching rule found; default deny',
        matched_rule: null,
        policy_id: policy.id,
        policy_name: policy.name,
        request: { tool, action, resource },
      },
    });
    return;
  }

  res.json({
    data: {
      outcome: matchedRule.outcome,
      reason: matchedRule.reason || `Matched rule: ${matchedRule.tool}/${matchedRule.action}`,
      matched_rule: matchedRule,
      policy_id: policy.id,
      policy_name: policy.name,
      request: { tool, action, resource },
    },
  });
});

// POST /policies/:id/activate - Activate a policy
router.post('/:id/activate', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM policies WHERE id = ? AND org_id = ?').get(
    req.params.id, req.user!.orgId
  ) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Policy not found' },
    });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE policies SET status = ?, updated_at = ? WHERE id = ?').run('active', now, req.params.id);

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json({ data: formatPolicy(policy) });
});

function formatPolicy(row: Record<string, unknown>) {
  return {
    ...row,
    rules: typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules,
  };
}

export default router;
