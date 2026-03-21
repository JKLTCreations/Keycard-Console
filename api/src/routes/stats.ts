import { Router, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /stats/dashboard - Aggregated metrics
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const orgId = req.user!.orgId;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Total active agents
  const agentCount = db.prepare(
    'SELECT COUNT(*) as count FROM agents WHERE org_id = ? AND status = ?'
  ).get(orgId, 'active') as { count: number };

  // Requests today
  const requestsToday = db.prepare(
    'SELECT COUNT(*) as count FROM audit_events WHERE org_id = ? AND created_at >= ?'
  ).get(orgId, todayStart) as { count: number };

  // Total requests (for rate calculation)
  const totalEvents = db.prepare(
    'SELECT COUNT(*) as count FROM audit_events WHERE org_id = ?'
  ).get(orgId) as { count: number };

  // Success rate
  const allowedEvents = db.prepare(
    'SELECT COUNT(*) as count FROM audit_events WHERE org_id = ? AND outcome = ?'
  ).get(orgId, 'allow') as { count: number };

  const successRate = totalEvents.count > 0
    ? Math.round((allowedEvents.count / totalEvents.count) * 10000) / 100
    : 0;

  // Approval breakdown
  const outcomeBreakdown = db.prepare(`
    SELECT outcome, COUNT(*) as count
    FROM audit_events
    WHERE org_id = ?
    GROUP BY outcome
  `).all(orgId) as Array<{ outcome: string; count: number }>;

  const approvalBreakdown: Record<string, number> = { allow: 0, deny: 0, escalate: 0 };
  for (const row of outcomeBreakdown) {
    approvalBreakdown[row.outcome] = row.count;
  }

  // Recent denials
  const recentDenials = db.prepare(`
    SELECT e.id, e.action, e.resource, e.outcome, e.reason, e.created_at,
           a.name as agent_name, t.name as tool_name
    FROM audit_events e
    LEFT JOIN agents a ON e.agent_id = a.id
    LEFT JOIN tools t ON e.tool_id = t.id
    WHERE e.org_id = ? AND e.outcome = 'deny'
    ORDER BY e.created_at DESC
    LIMIT 5
  `).all(orgId);

  // Activity over 24h (hourly buckets)
  const activityRows = db.prepare(`
    SELECT
      strftime('%Y-%m-%dT%H:00:00', created_at) as hour,
      outcome,
      COUNT(*) as count
    FROM audit_events
    WHERE org_id = ? AND created_at >= ?
    GROUP BY hour, outcome
    ORDER BY hour ASC
  `).all(orgId, last24h) as Array<{ hour: string; outcome: string; count: number }>;

  // Build hourly activity map
  const activityMap = new Map<string, { allow: number; deny: number; escalate: number }>();
  for (const row of activityRows) {
    if (!activityMap.has(row.hour)) {
      activityMap.set(row.hour, { allow: 0, deny: 0, escalate: 0 });
    }
    const bucket = activityMap.get(row.hour)!;
    (bucket as Record<string, number>)[row.outcome] = row.count;
  }

  const activity = Array.from(activityMap.entries()).map(([hour, counts]) => ({
    hour,
    ...counts,
    total: counts.allow + counts.deny + counts.escalate,
  }));

  // Active sessions
  const activeSessions = db.prepare(
    'SELECT COUNT(*) as count FROM sessions s JOIN agents a ON s.agent_id = a.id WHERE a.org_id = ? AND s.status = ?'
  ).get(orgId, 'running') as { count: number };

  // Top agents by activity
  const topAgents = db.prepare(`
    SELECT a.id, a.name, a.type, COUNT(e.id) as event_count
    FROM agents a
    LEFT JOIN audit_events e ON a.id = e.agent_id
    WHERE a.org_id = ?
    GROUP BY a.id
    ORDER BY event_count DESC
    LIMIT 5
  `).all(orgId);

  res.json({
    data: {
      total_agents: agentCount.count,
      active_sessions: activeSessions.count,
      requests_today: requestsToday.count,
      total_requests: totalEvents.count,
      success_rate: successRate,
      approval_breakdown: approvalBreakdown,
      recent_denials: recentDenials,
      activity_24h: activity,
      top_agents: topAgents,
    },
  });
});

export default router;
