export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
  createdAt: string;
}

export type AgentType = 'coding-agent' | 'ci' | 'service-bot' | 'monitoring' | 'custom';
export type AgentStatus = 'active' | 'revoked';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  orgId: string;
  createdBy: string;
  config: Record<string, unknown>;
  lastActiveAt: string | null;
  sessionsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type PolicyStatus = 'active' | 'observe' | 'archived';

export interface Policy {
  id: string;
  name: string;
  version: number;
  status: PolicyStatus;
  rules: PolicyRule[];
  orgId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  effect: 'allow' | 'deny';
  agent?: { type?: AgentType; name?: string };
  tool?: string;
  action?: string;
  resource?: string;
  conditions?: Record<string, unknown>;
}

export type SessionStatus = 'running' | 'completed' | 'failed';

export interface Session {
  id: string;
  agentId: string;
  agentName?: string;
  userId: string;
  userName?: string;
  status: SessionStatus;
  taskDescription: string;
  startedAt: string;
  endedAt: string | null;
  toolCallCount: number;
  duration?: number; // computed in seconds
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  orgId: string;
  connectedAgents?: number;
  createdAt: string;
}

export type AuditOutcome = 'allow' | 'deny' | 'escalate';

export interface AuditEvent {
  id: string;
  orgId: string;
  agentId: string;
  agentName?: string;
  userId: string;
  sessionId: string | null;
  toolId: string | null;
  toolName?: string;
  action: string;
  resource: string;
  outcome: AuditOutcome;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type CredentialStatus = 'active' | 'expired' | 'revoked';

export interface Credential {
  id: string;
  sessionId: string;
  agentId: string;
  scope: string;
  ttlSeconds: number;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: CredentialStatus;
}
