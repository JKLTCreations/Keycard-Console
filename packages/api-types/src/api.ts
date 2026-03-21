import { AuditEvent, PolicyRule, AgentType } from './entities';

// Generic response wrappers
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// Auth
export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
}

export interface AuthStatus {
  user: { id: string; email: string; name: string };
  org: { id: string; name: string };
  expiresAt: string;
}

// Agent requests
export interface CreateAgentRequest {
  name: string;
  type: AgentType;
  config?: Record<string, unknown>;
}

export interface UpdateAgentRequest {
  name?: string;
  type?: AgentType;
  config?: Record<string, unknown>;
  status?: 'active' | 'revoked';
}

// Policy requests
export interface CreatePolicyRequest {
  name: string;
  rules: PolicyRule[];
  status?: 'active' | 'observe';
}

export interface SimulateRequest {
  agent: string; // agent name or ID
  tool: string;
  action: string;
  resource?: string;
}

export interface SimulateResponse {
  outcome: 'allow' | 'deny';
  reason: string;
  matchedRule: PolicyRule | null;
  evaluationTimeMs: number;
}

// Dashboard stats
export interface DashboardStats {
  totalAgents: number;
  totalSessions: number;
  requestsToday: number;
  successRate: number;
  autoApprovalRate: number;
  approvalBreakdown: {
    autoApproved: number;
    userApproved: number;
    denied: number;
  };
  recentDenials: AuditEvent[];
  activityTimeline: { hour: string; count: number }[];
}
