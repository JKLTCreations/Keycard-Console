const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";
const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdhM2E4OTYwLWFhZTQtNGU1ZC1iYTEzLTg5MjJiM2MyYjc4ZCIsImVtYWlsIjoiYWRtaW5AYWNtZS5kZXYiLCJuYW1lIjoiQWRtaW4gVXNlciIsIm9yZ0lkIjoiMTBhZWQzNTItYjEyOS00ODkwLTk5YjYtNjBjYjJhNzEwNjlhIiwiaWF0IjoxNzc0MTMwOTcwLCJleHAiOjE4MDU2NjY5NzB9.ZlRbB-YwauqX5jmvVC4OYnh7co8hOtuQ1zNTqw3uZWA";

// Types matching the API's snake_case responses
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  org_id: string;
  created_by: string;
  config: Record<string, unknown>;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  sessions_count?: number;
}

export interface Session {
  id: string;
  agent_id: string;
  agent_name?: string;
  agent_type?: string;
  user_id: string;
  user_name?: string;
  status: string;
  task_description: string;
  started_at: string;
  ended_at: string | null;
  tool_call_count: number;
}

export interface SessionEvent {
  id: string;
  agent_id: string;
  agent_name?: string;
  action: string;
  resource: string;
  outcome: string;
  reason: string | null;
  tool_name?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Policy {
  id: string;
  name: string;
  version: number;
  status: string;
  rules: PolicyRule[];
  org_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyRule {
  tool: string;
  action: string;
  outcome: string;
  resource?: string;
  conditions?: Record<string, unknown>;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  org_id: string;
  created_at: string;
  connected_agents?: number;
}

export interface AuditEvent {
  id: string;
  org_id: string;
  agent_id: string;
  agent_name?: string;
  user_id: string;
  session_id: string | null;
  tool_id: string | null;
  tool_name?: string;
  action: string;
  resource: string;
  outcome: "allow" | "deny" | "escalate";
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  total_agents: number;
  active_sessions: number;
  requests_today: number;
  total_requests: number;
  success_rate: number;
  approval_breakdown: { allow: number; deny: number; escalate: number };
  recent_denials: {
    id: string;
    action: string;
    resource: string;
    outcome: string;
    reason: string;
    created_at: string;
    agent_name: string;
    tool_name: string;
  }[];
  activity_24h: {
    hour: string;
    allow: number;
    deny: number;
    escalate: number;
    total: number;
  }[];
  top_agents: {
    id: string;
    name: string;
    type: string;
    event_count: number;
  }[];
}

interface ApiListResponse<T> {
  data: T[];
  cursor?: string | null;
  hasMore?: boolean;
  total?: number;
}

interface ApiDataResponse<T> {
  data: T;
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEMO_TOKEN}`,
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json;
}

// Agents
export async function getAgents(): Promise<Agent[]> {
  const res = await fetchApi<ApiListResponse<Agent>>("/agents");
  return res.data;
}

export async function getAgent(id: string): Promise<Agent> {
  const res = await fetchApi<ApiDataResponse<Agent>>(`/agents/${id}`);
  return res.data;
}

export async function getAgentSessions(id: string): Promise<Session[]> {
  const res = await fetchApi<ApiListResponse<Session>>(`/agents/${id}/sessions`);
  return res.data;
}

export async function createAgent(
  data: { name: string; type: string; config?: Record<string, unknown> }
): Promise<Agent> {
  const res = await fetchApi<ApiDataResponse<Agent>>("/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateAgent(
  id: string,
  data: Partial<Agent>
): Promise<Agent> {
  const res = await fetchApi<ApiDataResponse<Agent>>(`/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteAgent(id: string): Promise<void> {
  await fetchApi<ApiDataResponse<Agent>>(`/agents/${id}`, { method: "DELETE" });
}

// Sessions
export async function getSessions(): Promise<Session[]> {
  const res = await fetchApi<ApiListResponse<Session>>("/sessions");
  return res.data;
}

export async function getSession(id: string): Promise<Session> {
  const res = await fetchApi<ApiDataResponse<Session>>(`/sessions/${id}`);
  return res.data;
}

export async function getSessionEvents(id: string): Promise<SessionEvent[]> {
  const res = await fetchApi<ApiListResponse<SessionEvent>>(
    `/sessions/${id}/events`
  );
  return res.data;
}

// Policies
export async function getPolicies(): Promise<Policy[]> {
  const res = await fetchApi<ApiListResponse<Policy>>("/policies");
  return res.data;
}

export async function getPolicy(id: string): Promise<Policy> {
  const res = await fetchApi<ApiDataResponse<Policy>>(`/policies/${id}`);
  return res.data;
}

// Tools
export async function getTools(): Promise<Tool[]> {
  const res = await fetchApi<ApiListResponse<Tool>>("/tools");
  return res.data;
}

// Audit
export async function getAuditEvents(): Promise<AuditEvent[]> {
  const res = await fetchApi<ApiListResponse<AuditEvent>>("/audit/events");
  return res.data;
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetchApi<ApiDataResponse<DashboardStats>>(
    "/stats/dashboard"
  );
  return res.data;
}
