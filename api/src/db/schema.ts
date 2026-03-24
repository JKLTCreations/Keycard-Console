import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
      org_id TEXT NOT NULL REFERENCES organizations(id),
      created_by TEXT NOT NULL REFERENCES users(id),
      config TEXT DEFAULT '{}',
      last_active_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'observe' CHECK (status IN ('active', 'observe', 'archived')),
      rules TEXT NOT NULL DEFAULT '[]',
      org_id TEXT NOT NULL REFERENCES organizations(id),
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      user_id TEXT REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
      task_description TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      tool_call_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      icon TEXT,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      agent_id TEXT REFERENCES agents(id),
      user_id TEXT REFERENCES users(id),
      session_id TEXT REFERENCES sessions(id),
      tool_id TEXT REFERENCES tools(id),
      action TEXT NOT NULL,
      resource TEXT,
      outcome TEXT NOT NULL CHECK (outcome IN ('allow', 'deny', 'escalate')),
      reason TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      agent_id TEXT NOT NULL REFERENCES agents(id),
      scope TEXT NOT NULL,
      ttl_seconds INTEGER NOT NULL DEFAULT 3600,
      issued_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
    );

    CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(org_id);
    CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_org ON audit_events(org_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_events_outcome ON audit_events(outcome);
    CREATE INDEX IF NOT EXISTS idx_credentials_agent ON credentials(agent_id);
    CREATE INDEX IF NOT EXISTS idx_credentials_session ON credentials(session_id);
  `);
}

export function seedDemoData(db: Database.Database): void {
  // Check if data already exists
  const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get() as { count: number };
  if (orgCount.count > 0) return;

  // Fixed IDs so the console's demo JWT token always matches
  const orgId = '10aed352-b129-4890-99b6-60cb2a71069a';
  const userId = '7a3a8960-aae4-4e5d-ba13-8922b3c2b78d';

  // Organization
  db.prepare('INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)').run(
    orgId, 'Lathu & Jordan LLC', '2025-11-01T00:00:00.000Z'
  );

  // User
  db.prepare('INSERT INTO users (id, email, name, org_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
    userId, 'admin@acme.dev', 'Admin User', orgId, '2025-11-01T00:00:00.000Z'
  );

  // Agents (6 total)
  const agents = [
    { id: uuidv4(), name: 'deploy-bot', type: 'ci', config: JSON.stringify({ repo: 'acme/platform', branch: 'main', auto_deploy: true }), lastActive: '2026-03-21T08:30:00.000Z', created: '2025-12-01T10:00:00.000Z' },
    { id: uuidv4(), name: 'code-reviewer', type: 'coding-agent', config: JSON.stringify({ languages: ['typescript', 'python'], max_file_size: 5000 }), lastActive: '2026-03-21T09:15:00.000Z', created: '2025-12-05T14:00:00.000Z' },
    { id: uuidv4(), name: 'data-pipeline', type: 'service-bot', config: JSON.stringify({ schedule: '0 */6 * * *', source: 's3://acme-data', target: 'warehouse' }), lastActive: '2026-03-21T06:00:00.000Z', created: '2026-01-10T09:00:00.000Z' },
    { id: uuidv4(), name: 'security-scanner', type: 'monitoring', config: JSON.stringify({ scan_interval: 3600, severity_threshold: 'medium' }), lastActive: '2026-03-21T07:45:00.000Z', created: '2026-01-15T11:00:00.000Z' },
    { id: uuidv4(), name: 'onboarding-agent', type: 'coding-agent', config: JSON.stringify({ template_repo: 'acme/dev-starter', auto_setup: true, slack_channel: '#new-devs' }), lastActive: '2026-03-20T16:30:00.000Z', created: '2026-02-01T09:00:00.000Z' },
    { id: uuidv4(), name: 'incident-responder', type: 'service-bot', config: JSON.stringify({ pagerduty_service: 'acme-platform', escalation_policy: 'default', auto_acknowledge: true }), lastActive: '2026-03-21T04:15:00.000Z', created: '2026-02-15T11:00:00.000Z' },
  ];

  const insertAgent = db.prepare(
    'INSERT INTO agents (id, name, type, status, org_id, created_by, config, last_active_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const a of agents) {
    insertAgent.run(a.id, a.name, a.type, 'active', orgId, userId, a.config, a.lastActive, a.created, a.lastActive);
  }

  // Tools (7 total)
  const tools = [
    { id: uuidv4(), name: 'GitHub', description: 'Source code management and CI/CD', category: 'developer', icon: 'github' },
    { id: uuidv4(), name: 'Linear', description: 'Issue tracking and project management', category: 'project-management', icon: 'linear' },
    { id: uuidv4(), name: 'Datadog', description: 'Infrastructure monitoring and APM', category: 'monitoring', icon: 'datadog' },
    { id: uuidv4(), name: 'AWS', description: 'Cloud infrastructure and services', category: 'cloud', icon: 'aws' },
    { id: uuidv4(), name: 'Slack', description: 'Team messaging and notifications', category: 'communication', icon: 'slack' },
    { id: uuidv4(), name: 'PagerDuty', description: 'Incident management and on-call scheduling', category: 'incident-management', icon: 'pagerduty' },
    { id: uuidv4(), name: 'Vercel', description: 'Frontend deployment and edge functions', category: 'deployment', icon: 'vercel' },
  ];

  const insertTool = db.prepare(
    'INSERT INTO tools (id, name, description, category, icon, org_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const t of tools) {
    insertTool.run(t.id, t.name, t.description, t.category, t.icon, orgId, '2025-12-01T00:00:00.000Z');
  }

  // Policies (3 total)
  const policies = [
    {
      id: uuidv4(),
      name: 'ci-deploy-standard',
      version: 1,
      status: 'active',
      rules: JSON.stringify([
        { tool: 'GitHub', action: 'read', outcome: 'allow' },
        { tool: 'GitHub', action: 'write', outcome: 'allow', condition: 'branch != main' },
        { tool: 'Linear', action: 'read', outcome: 'allow' },
        { tool: 'Linear', action: 'write', outcome: 'allow' },
        { tool: 'AWS', action: 'deploy', outcome: 'allow', condition: 'environment != production' },
        { tool: 'Vercel', action: 'deploy', outcome: 'allow', condition: 'environment != production' },
        { tool: '*', action: 'delete', outcome: 'deny', reason: 'Delete operations require manual approval' },
      ]),
      created: '2025-12-10T10:00:00.000Z',
    },
    {
      id: uuidv4(),
      name: 'code-review-policy',
      version: 2,
      status: 'active',
      rules: JSON.stringify([
        { tool: 'GitHub', action: 'read', outcome: 'allow' },
        { tool: 'GitHub', action: 'comment', outcome: 'allow' },
        { tool: 'GitHub', action: 'write', outcome: 'deny', reason: 'Code reviewers cannot push code' },
        { tool: 'Linear', action: 'read', outcome: 'allow' },
        { tool: 'Slack', action: 'send', outcome: 'allow' },
      ]),
      created: '2026-01-05T14:00:00.000Z',
    },
    {
      id: uuidv4(),
      name: 'incident-response-policy',
      version: 1,
      status: 'active',
      rules: JSON.stringify([
        { tool: 'PagerDuty', action: 'read', outcome: 'allow' },
        { tool: 'PagerDuty', action: 'acknowledge', outcome: 'allow' },
        { tool: 'PagerDuty', action: 'resolve', outcome: 'escalate', reason: 'Incident resolution requires human confirmation' },
        { tool: 'Slack', action: 'send', outcome: 'allow' },
        { tool: 'Datadog', action: 'read', outcome: 'allow' },
        { tool: 'AWS', action: 'restart', outcome: 'escalate', reason: 'Service restarts require on-call approval' },
        { tool: 'AWS', action: 'scale', outcome: 'escalate', reason: 'Auto-scaling changes require approval' },
        { tool: '*', action: 'delete', outcome: 'deny', reason: 'No delete operations during incidents' },
      ]),
      created: '2026-02-20T09:00:00.000Z',
    },
  ];

  const insertPolicy = db.prepare(
    'INSERT INTO policies (id, name, version, status, rules, org_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const p of policies) {
    insertPolicy.run(p.id, p.name, p.version, p.status, p.rules, orgId, userId, p.created, p.created);
  }

  // Sessions (14 total)
  const now = new Date();
  const sessions = [
    // deploy-bot sessions
    { id: uuidv4(), agentIdx: 0, status: 'completed', task: 'Deploy v2.4.1 to staging environment', startOffset: -7200, endOffset: -6600, toolCalls: 12 },
    { id: uuidv4(), agentIdx: 0, status: 'completed', task: 'Run integration tests on feature/auth-refactor', startOffset: -5400, endOffset: -4800, toolCalls: 8 },
    { id: uuidv4(), agentIdx: 0, status: 'completed', task: 'Rollback staging deployment v2.4.0', startOffset: -86400, endOffset: -85800, toolCalls: 5 },
    // code-reviewer sessions
    { id: uuidv4(), agentIdx: 1, status: 'completed', task: 'Review PR #847: Add rate limiting middleware', startOffset: -10800, endOffset: -9000, toolCalls: 15 },
    { id: uuidv4(), agentIdx: 1, status: 'running', task: 'Review PR #852: Database migration scripts', startOffset: -1800, endOffset: null, toolCalls: 6 },
    { id: uuidv4(), agentIdx: 1, status: 'completed', task: 'Review PR #841: Fix memory leak in worker pool', startOffset: -72000, endOffset: -70200, toolCalls: 9 },
    // data-pipeline sessions
    { id: uuidv4(), agentIdx: 2, status: 'completed', task: 'ETL pipeline: user analytics Q1 2026', startOffset: -14400, endOffset: -12600, toolCalls: 22 },
    { id: uuidv4(), agentIdx: 2, status: 'failed', task: 'Sync inventory data from warehouse', startOffset: -3600, endOffset: -3000, toolCalls: 4 },
    // security-scanner sessions
    { id: uuidv4(), agentIdx: 3, status: 'completed', task: 'Weekly dependency vulnerability scan', startOffset: -21600, endOffset: -19800, toolCalls: 18 },
    { id: uuidv4(), agentIdx: 3, status: 'completed', task: 'Scan container images for CVEs', startOffset: -43200, endOffset: -41400, toolCalls: 11 },
    // onboarding-agent sessions
    { id: uuidv4(), agentIdx: 4, status: 'completed', task: 'Set up dev environment for new engineer: Sarah Chen', startOffset: -28800, endOffset: -27000, toolCalls: 14 },
    { id: uuidv4(), agentIdx: 4, status: 'running', task: 'Configure CI pipeline for new microservice repo', startOffset: -900, endOffset: null, toolCalls: 3 },
    // incident-responder sessions
    { id: uuidv4(), agentIdx: 5, status: 'completed', task: 'Auto-triage: High CPU alert on platform-api', startOffset: -18000, endOffset: -17400, toolCalls: 10 },
    { id: uuidv4(), agentIdx: 5, status: 'running', task: 'Investigate: Elevated error rate on checkout-service', startOffset: -600, endOffset: null, toolCalls: 7 },
  ];

  const insertSession = db.prepare(
    'INSERT INTO sessions (id, agent_id, user_id, status, task_description, started_at, ended_at, tool_call_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const s of sessions) {
    const startedAt = new Date(now.getTime() + s.startOffset * 1000).toISOString();
    const endedAt = s.endOffset ? new Date(now.getTime() + s.endOffset * 1000).toISOString() : null;
    insertSession.run(s.id, agents[s.agentIdx].id, userId, s.status, s.task, startedAt, endedAt, s.toolCalls);
  }

  // Audit events (48 total)
  const auditEvents: Array<{
    sessionIdx: number;
    agentIdx: number;
    toolIdx: number;
    action: string;
    resource: string;
    outcome: string;
    reason: string | null;
    offsetSecs: number;
  }> = [
    // Session 0: deploy-bot staging deploy
    { sessionIdx: 0, agentIdx: 0, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/branches', outcome: 'allow', reason: null, offsetSecs: -7190 },
    { sessionIdx: 0, agentIdx: 0, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/commits', outcome: 'allow', reason: null, offsetSecs: -7150 },
    { sessionIdx: 0, agentIdx: 0, toolIdx: 3, action: 'deploy', resource: 'ecs/staging/platform-api', outcome: 'allow', reason: null, offsetSecs: -7000 },
    { sessionIdx: 0, agentIdx: 0, toolIdx: 3, action: 'deploy', resource: 'ecs/staging/platform-worker', outcome: 'allow', reason: null, offsetSecs: -6900 },
    { sessionIdx: 0, agentIdx: 0, toolIdx: 6, action: 'deploy', resource: 'vercel/acme-dashboard/staging', outcome: 'allow', reason: null, offsetSecs: -6850 },
    { sessionIdx: 0, agentIdx: 0, toolIdx: 4, action: 'send', resource: '#deployments', outcome: 'allow', reason: null, offsetSecs: -6700 },
    // Session 1: deploy-bot tests
    { sessionIdx: 1, agentIdx: 0, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/845', outcome: 'allow', reason: null, offsetSecs: -5390 },
    { sessionIdx: 1, agentIdx: 0, toolIdx: 0, action: 'write', resource: 'repos/acme/platform/checks', outcome: 'allow', reason: null, offsetSecs: -5200 },
    // Session 2: deploy-bot rollback
    { sessionIdx: 2, agentIdx: 0, toolIdx: 3, action: 'deploy', resource: 'ecs/staging/platform-api:v2.4.0', outcome: 'allow', reason: null, offsetSecs: -86390 },
    { sessionIdx: 2, agentIdx: 0, toolIdx: 4, action: 'send', resource: '#deployments', outcome: 'allow', reason: null, offsetSecs: -86000 },
    // Session 3: code-reviewer PR #847
    { sessionIdx: 3, agentIdx: 1, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/847', outcome: 'allow', reason: null, offsetSecs: -10790 },
    { sessionIdx: 3, agentIdx: 1, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/847/files', outcome: 'allow', reason: null, offsetSecs: -10600 },
    { sessionIdx: 3, agentIdx: 1, toolIdx: 0, action: 'comment', resource: 'repos/acme/platform/pulls/847/comments', outcome: 'allow', reason: null, offsetSecs: -10200 },
    { sessionIdx: 3, agentIdx: 1, toolIdx: 0, action: 'write', resource: 'repos/acme/platform/pulls/847', outcome: 'deny', reason: 'Code reviewers cannot push code', offsetSecs: -9800 },
    { sessionIdx: 3, agentIdx: 1, toolIdx: 1, action: 'read', resource: 'issues/ACM-2847', outcome: 'allow', reason: null, offsetSecs: -9500 },
    { sessionIdx: 3, agentIdx: 1, toolIdx: 4, action: 'send', resource: '#code-reviews', outcome: 'allow', reason: null, offsetSecs: -9100 },
    // Session 4: code-reviewer PR #852 (running)
    { sessionIdx: 4, agentIdx: 1, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/852', outcome: 'allow', reason: null, offsetSecs: -1790 },
    { sessionIdx: 4, agentIdx: 1, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/852/files', outcome: 'allow', reason: null, offsetSecs: -1600 },
    { sessionIdx: 4, agentIdx: 1, toolIdx: 0, action: 'write', resource: 'repos/acme/platform/contents/migrations', outcome: 'deny', reason: 'Code reviewers cannot push code', offsetSecs: -1400 },
    // Session 5: code-reviewer PR #841
    { sessionIdx: 5, agentIdx: 1, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/841', outcome: 'allow', reason: null, offsetSecs: -71990 },
    { sessionIdx: 5, agentIdx: 1, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/pulls/841/files', outcome: 'allow', reason: null, offsetSecs: -71500 },
    { sessionIdx: 5, agentIdx: 1, toolIdx: 0, action: 'comment', resource: 'repos/acme/platform/pulls/841/comments', outcome: 'allow', reason: null, offsetSecs: -71000 },
    { sessionIdx: 5, agentIdx: 1, toolIdx: 4, action: 'send', resource: '#code-reviews', outcome: 'allow', reason: null, offsetSecs: -70500 },
    // Session 6: data-pipeline ETL
    { sessionIdx: 6, agentIdx: 2, toolIdx: 3, action: 'read', resource: 's3://acme-data/analytics/q1-2026', outcome: 'allow', reason: null, offsetSecs: -14390 },
    { sessionIdx: 6, agentIdx: 2, toolIdx: 3, action: 'write', resource: 'redshift/analytics/user_metrics', outcome: 'allow', reason: null, offsetSecs: -14000 },
    { sessionIdx: 6, agentIdx: 2, toolIdx: 3, action: 'delete', resource: 's3://acme-data/analytics/temp', outcome: 'deny', reason: 'Delete operations require manual approval', offsetSecs: -13500 },
    { sessionIdx: 6, agentIdx: 2, toolIdx: 2, action: 'write', resource: 'metrics/pipeline.etl.duration', outcome: 'allow', reason: null, offsetSecs: -13000 },
    // Session 7: data-pipeline failed sync
    { sessionIdx: 7, agentIdx: 2, toolIdx: 3, action: 'read', resource: 's3://acme-data/inventory', outcome: 'allow', reason: null, offsetSecs: -3590 },
    { sessionIdx: 7, agentIdx: 2, toolIdx: 3, action: 'write', resource: 'rds/inventory/sync', outcome: 'escalate', reason: 'Write to production database requires approval', offsetSecs: -3400 },
    // Session 8: security-scanner weekly scan
    { sessionIdx: 8, agentIdx: 3, toolIdx: 0, action: 'read', resource: 'repos/acme/platform/dependabot/alerts', outcome: 'allow', reason: null, offsetSecs: -21590 },
    { sessionIdx: 8, agentIdx: 3, toolIdx: 0, action: 'read', resource: 'repos/acme/api-gateway/dependabot/alerts', outcome: 'allow', reason: null, offsetSecs: -21400 },
    { sessionIdx: 8, agentIdx: 3, toolIdx: 3, action: 'read', resource: 'ecr/images/platform-api/scan', outcome: 'allow', reason: null, offsetSecs: -21000 },
    { sessionIdx: 8, agentIdx: 3, toolIdx: 2, action: 'write', resource: 'metrics/security.vulnerabilities', outcome: 'allow', reason: null, offsetSecs: -20500 },
    { sessionIdx: 8, agentIdx: 3, toolIdx: 4, action: 'send', resource: '#security-alerts', outcome: 'allow', reason: null, offsetSecs: -20000 },
    { sessionIdx: 8, agentIdx: 3, toolIdx: 1, action: 'write', resource: 'issues/SEC-142', outcome: 'allow', reason: null, offsetSecs: -19900 },
    // Session 9: security-scanner container scan
    { sessionIdx: 9, agentIdx: 3, toolIdx: 3, action: 'read', resource: 'ecr/images/platform-api', outcome: 'allow', reason: null, offsetSecs: -43190 },
    { sessionIdx: 9, agentIdx: 3, toolIdx: 3, action: 'read', resource: 'ecr/images/platform-worker', outcome: 'allow', reason: null, offsetSecs: -43000 },
    { sessionIdx: 9, agentIdx: 3, toolIdx: 3, action: 'delete', resource: 'ecr/images/platform-api:v2.3.0', outcome: 'deny', reason: 'Delete operations require manual approval', offsetSecs: -42500 },
    { sessionIdx: 9, agentIdx: 3, toolIdx: 2, action: 'write', resource: 'metrics/security.container_scan', outcome: 'allow', reason: null, offsetSecs: -42000 },
    // Session 10: onboarding-agent setup
    { sessionIdx: 10, agentIdx: 4, toolIdx: 0, action: 'read', resource: 'repos/acme/dev-starter/contents', outcome: 'allow', reason: null, offsetSecs: -28790 },
    { sessionIdx: 10, agentIdx: 4, toolIdx: 0, action: 'write', resource: 'repos/acme/sarah-chen-onboard', outcome: 'allow', reason: null, offsetSecs: -28500 },
    { sessionIdx: 10, agentIdx: 4, toolIdx: 4, action: 'send', resource: '#new-devs', outcome: 'allow', reason: null, offsetSecs: -28000 },
    { sessionIdx: 10, agentIdx: 4, toolIdx: 1, action: 'write', resource: 'issues/ONB-78', outcome: 'allow', reason: null, offsetSecs: -27500 },
    { sessionIdx: 10, agentIdx: 4, toolIdx: 0, action: 'write', resource: 'orgs/acme/teams/platform/members', outcome: 'deny', reason: 'Cannot modify team membership directly', offsetSecs: -27200 },
    // Session 11: onboarding-agent CI pipeline (running)
    { sessionIdx: 11, agentIdx: 4, toolIdx: 0, action: 'read', resource: 'repos/acme/checkout-service/.github/workflows', outcome: 'allow', reason: null, offsetSecs: -890 },
    { sessionIdx: 11, agentIdx: 4, toolIdx: 6, action: 'deploy', resource: 'vercel/checkout-service/preview', outcome: 'allow', reason: null, offsetSecs: -600 },
    // Session 12: incident-responder high CPU
    { sessionIdx: 12, agentIdx: 5, toolIdx: 5, action: 'read', resource: 'incidents/INC-4521', outcome: 'allow', reason: null, offsetSecs: -17990 },
    { sessionIdx: 12, agentIdx: 5, toolIdx: 5, action: 'acknowledge', resource: 'incidents/INC-4521', outcome: 'allow', reason: null, offsetSecs: -17800 },
    { sessionIdx: 12, agentIdx: 5, toolIdx: 2, action: 'read', resource: 'metrics/platform-api.cpu.usage', outcome: 'allow', reason: null, offsetSecs: -17600 },
    { sessionIdx: 12, agentIdx: 5, toolIdx: 3, action: 'restart', resource: 'ecs/production/platform-api', outcome: 'escalate', reason: 'Service restarts require on-call approval', offsetSecs: -17400 },
    { sessionIdx: 12, agentIdx: 5, toolIdx: 4, action: 'send', resource: '#incidents', outcome: 'allow', reason: null, offsetSecs: -17300 },
    { sessionIdx: 12, agentIdx: 5, toolIdx: 5, action: 'resolve', resource: 'incidents/INC-4521', outcome: 'escalate', reason: 'Incident resolution requires human confirmation', offsetSecs: -17500 },
    // Session 13: incident-responder checkout errors (running)
    { sessionIdx: 13, agentIdx: 5, toolIdx: 5, action: 'read', resource: 'incidents/INC-4523', outcome: 'allow', reason: null, offsetSecs: -590 },
    { sessionIdx: 13, agentIdx: 5, toolIdx: 5, action: 'acknowledge', resource: 'incidents/INC-4523', outcome: 'allow', reason: null, offsetSecs: -500 },
    { sessionIdx: 13, agentIdx: 5, toolIdx: 2, action: 'read', resource: 'metrics/checkout-service.error_rate', outcome: 'allow', reason: null, offsetSecs: -400 },
    { sessionIdx: 13, agentIdx: 5, toolIdx: 3, action: 'scale', resource: 'ecs/production/checkout-service', outcome: 'escalate', reason: 'Auto-scaling changes require approval', offsetSecs: -300 },
    { sessionIdx: 13, agentIdx: 5, toolIdx: 4, action: 'send', resource: '#incidents', outcome: 'allow', reason: null, offsetSecs: -200 },
    { sessionIdx: 13, agentIdx: 5, toolIdx: 3, action: 'delete', resource: 'ecs/production/checkout-service-old', outcome: 'deny', reason: 'No delete operations during incidents', offsetSecs: -150 },
  ];

  const insertEvent = db.prepare(
    'INSERT INTO audit_events (id, org_id, agent_id, user_id, session_id, tool_id, action, resource, outcome, reason, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (const e of auditEvents) {
    const createdAt = new Date(now.getTime() + e.offsetSecs * 1000).toISOString();
    insertEvent.run(
      uuidv4(), orgId, agents[e.agentIdx].id, userId, sessions[e.sessionIdx].id,
      tools[e.toolIdx].id, e.action, e.resource, e.outcome, e.reason,
      JSON.stringify({}), createdAt
    );
  }

  // Credentials
  const creds = [
    { sessionIdx: 0, agentIdx: 0, scope: 'github:read,write aws:deploy vercel:deploy', ttl: 3600, status: 'expired' as const },
    { sessionIdx: 3, agentIdx: 1, scope: 'github:read,comment linear:read slack:send', ttl: 7200, status: 'expired' as const },
    { sessionIdx: 4, agentIdx: 1, scope: 'github:read,comment', ttl: 3600, status: 'active' as const },
    { sessionIdx: 6, agentIdx: 2, scope: 'aws:read,write datadog:write', ttl: 7200, status: 'expired' as const },
    { sessionIdx: 8, agentIdx: 3, scope: 'github:read aws:read datadog:write linear:write slack:send', ttl: 7200, status: 'expired' as const },
    { sessionIdx: 10, agentIdx: 4, scope: 'github:read,write linear:write slack:send', ttl: 3600, status: 'expired' as const },
    { sessionIdx: 11, agentIdx: 4, scope: 'github:read vercel:deploy', ttl: 3600, status: 'active' as const },
    { sessionIdx: 12, agentIdx: 5, scope: 'pagerduty:read,acknowledge datadog:read aws:restart slack:send', ttl: 3600, status: 'expired' as const },
    { sessionIdx: 13, agentIdx: 5, scope: 'pagerduty:read,acknowledge datadog:read aws:scale slack:send', ttl: 3600, status: 'active' as const },
  ];

  const insertCred = db.prepare(
    'INSERT INTO credentials (id, session_id, agent_id, scope, ttl_seconds, issued_at, expires_at, revoked_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (const c of creds) {
    const session = sessions[c.sessionIdx];
    const issuedAt = new Date(now.getTime() + session.startOffset * 1000).toISOString();
    const expiresAt = new Date(now.getTime() + session.startOffset * 1000 + c.ttl * 1000).toISOString();
    insertCred.run(
      uuidv4(), session.id, agents[c.agentIdx].id, c.scope, c.ttl,
      issuedAt, expiresAt, null, c.status
    );
  }
}
