package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Client wraps HTTP calls to the Keycard API.
type Client struct {
	BaseURL    string
	Token      string
	HTTPClient *http.Client
}

// NewClient creates a new API client.
func NewClient(baseURL, token string) *Client {
	return &Client{
		BaseURL: baseURL,
		Token:   token,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// --- Request helpers ---

func (c *Client) doRequest(method, path string, body interface{}, query url.Values) ([]byte, int, error) {
	u, err := url.Parse(c.BaseURL + path)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid URL: %w", err)
	}
	if query != nil {
		u.RawQuery = query.Encode()
	}

	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, u.String(), reqBody)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		var errResp struct {
			Error struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		if json.Unmarshal(data, &errResp) == nil && errResp.Error.Message != "" {
			return data, resp.StatusCode, fmt.Errorf("API error (%d): %s", resp.StatusCode, errResp.Error.Message)
		}
		return data, resp.StatusCode, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(data))
	}

	return data, resp.StatusCode, nil
}

func (c *Client) get(path string, query url.Values) ([]byte, error) {
	data, _, err := c.doRequest(http.MethodGet, path, nil, query)
	return data, err
}

func (c *Client) post(path string, body interface{}) ([]byte, error) {
	data, _, err := c.doRequest(http.MethodPost, path, body, nil)
	return data, err
}

func (c *Client) patch(path string, body interface{}) ([]byte, error) {
	data, _, err := c.doRequest(http.MethodPatch, path, body, nil)
	return data, err
}

func (c *Client) put(path string, body interface{}) ([]byte, error) {
	data, _, err := c.doRequest(http.MethodPut, path, body, nil)
	return data, err
}

func (c *Client) del(path string) ([]byte, error) {
	data, _, err := c.doRequest(http.MethodDelete, path, nil, nil)
	return data, err
}

// unwrapData extracts the "data" field from a JSON response like { "data": ... }.
func unwrapData(raw []byte) json.RawMessage {
	var wrapper struct {
		Data json.RawMessage `json:"data"`
	}
	if json.Unmarshal(raw, &wrapper) == nil && wrapper.Data != nil {
		return wrapper.Data
	}
	return raw
}

// --- Types ---

// DeviceCodeResponse from POST /auth/device-code.
type DeviceCodeResponse struct {
	DeviceCode      string `json:"device_code"`
	UserCode        string `json:"user_code"`
	VerificationURI string `json:"verification_uri"`
	ExpiresIn       int    `json:"expires_in"`
	Interval        int    `json:"interval"`
}

// TokenResponse from POST /auth/token.
type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// AuthStatus from GET /auth/me.
type AuthStatus struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	OrgID   string `json:"org_id"`
	OrgName string `json:"org_name"`
}

// Agent represents an agent resource.
type Agent struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Type         string                 `json:"type"`
	Status       string                 `json:"status"`
	LastActiveAt string                 `json:"last_active_at"`
	Config       map[string]interface{} `json:"config,omitempty"`
	CreatedAt    string                 `json:"created_at"`
	UpdatedAt    string                 `json:"updated_at"`
}

// Session represents a session resource.
type Session struct {
	ID              string `json:"id"`
	AgentID         string `json:"agent_id"`
	AgentName       string `json:"agent_name"`
	AgentType       string `json:"agent_type"`
	UserID          string `json:"user_id"`
	Status          string `json:"status"`
	TaskDescription string `json:"task_description"`
	StartedAt       string `json:"started_at"`
	EndedAt         string `json:"ended_at,omitempty"`
	ToolCallCount   int    `json:"tool_call_count"`
}

// SessionEvent represents an event within a session.
type SessionEvent struct {
	ID        string `json:"id"`
	AgentName string `json:"agent_name"`
	ToolName  string `json:"tool_name"`
	Action    string `json:"action"`
	Resource  string `json:"resource"`
	Outcome   string `json:"outcome"`
	Reason    string `json:"reason"`
	CreatedAt string `json:"created_at"`
}

// Policy represents a policy resource.
type Policy struct {
	ID        string      `json:"id"`
	Name      string      `json:"name"`
	Version   int         `json:"version"`
	Status    string      `json:"status"`
	Rules     interface{} `json:"rules,omitempty"`
	CreatedAt string      `json:"created_at"`
	UpdatedAt string      `json:"updated_at"`
}

// SimulationResult from POST /policies/:id/simulate.
type SimulationResult struct {
	Outcome string `json:"outcome"`
	Reason  string `json:"reason"`
}

// Tool represents a tool resource.
type Tool struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

// AuditEvent represents an audit log entry.
type AuditEvent struct {
	ID        string `json:"id"`
	AgentName string `json:"agent_name"`
	ToolName  string `json:"tool_name"`
	Action    string `json:"action"`
	Resource  string `json:"resource"`
	Outcome   string `json:"outcome"`
	Reason    string `json:"reason"`
	CreatedAt string `json:"created_at"`
}

// DashboardStats from GET /stats/dashboard.
type DashboardStats struct {
	TotalAgents    int     `json:"total_agents"`
	ActiveSessions int     `json:"active_sessions"`
	RequestsToday  int     `json:"requests_today"`
	TotalRequests  int     `json:"total_requests"`
	SuccessRate    float64 `json:"success_rate"`
}

// --- Auth Methods ---

// DeviceCode initiates a device authorization flow.
func (c *Client) DeviceCode() (*DeviceCodeResponse, error) {
	data, err := c.post("/auth/device-code", nil)
	if err != nil {
		return nil, err
	}
	var resp DeviceCodeResponse
	if err := json.Unmarshal(unwrapData(data), &resp); err != nil {
		return nil, fmt.Errorf("failed to parse device code response: %w", err)
	}
	return &resp, nil
}

// ExchangeToken polls for a token using the device code.
func (c *Client) ExchangeToken(deviceCode string) (*TokenResponse, error) {
	data, err := c.post("/auth/token", map[string]string{
		"device_code": deviceCode,
	})
	if err != nil {
		return nil, err
	}
	var resp TokenResponse
	if err := json.Unmarshal(unwrapData(data), &resp); err != nil {
		return nil, fmt.Errorf("failed to parse token response: %w", err)
	}
	return &resp, nil
}

// GetAuthStatus returns the currently authenticated user info.
func (c *Client) GetAuthStatus() (*AuthStatus, error) {
	data, err := c.get("/auth/me", nil)
	if err != nil {
		return nil, err
	}
	var resp AuthStatus
	if err := json.Unmarshal(unwrapData(data), &resp); err != nil {
		return nil, fmt.Errorf("failed to parse auth status: %w", err)
	}
	return &resp, nil
}

// --- Agent Methods ---

// GetAgents lists all agents.
func (c *Client) GetAgents() ([]Agent, error) {
	data, err := c.get("/agents", nil)
	if err != nil {
		return nil, err
	}
	var agents []Agent
	if err := json.Unmarshal(unwrapData(data), &agents); err != nil {
		return nil, fmt.Errorf("failed to parse agents response: %w", err)
	}
	return agents, nil
}

// CreateAgent creates a new agent.
func (c *Client) CreateAgent(name, agentType string, config map[string]interface{}) (*Agent, error) {
	body := map[string]interface{}{
		"name": name,
		"type": agentType,
	}
	if config != nil {
		body["config"] = config
	}
	data, err := c.post("/agents", body)
	if err != nil {
		return nil, err
	}
	var agent Agent
	if err := json.Unmarshal(unwrapData(data), &agent); err != nil {
		return nil, fmt.Errorf("failed to parse agent response: %w", err)
	}
	return &agent, nil
}

// GetAgent retrieves a single agent by ID.
func (c *Client) GetAgent(id string) (*Agent, error) {
	data, err := c.get("/agents/"+id, nil)
	if err != nil {
		return nil, err
	}
	var agent Agent
	if err := json.Unmarshal(unwrapData(data), &agent); err != nil {
		return nil, fmt.Errorf("failed to parse agent response: %w", err)
	}
	return &agent, nil
}

// UpdateAgent updates an agent by ID.
func (c *Client) UpdateAgent(id string, updates map[string]interface{}) (*Agent, error) {
	data, err := c.patch("/agents/"+id, updates)
	if err != nil {
		return nil, err
	}
	var agent Agent
	if err := json.Unmarshal(unwrapData(data), &agent); err != nil {
		return nil, fmt.Errorf("failed to parse agent response: %w", err)
	}
	return &agent, nil
}

// DeleteAgent revokes/deletes an agent by ID.
func (c *Client) DeleteAgent(id string) error {
	_, err := c.del("/agents/" + id)
	return err
}

// GetAgentSessions lists sessions for a specific agent.
func (c *Client) GetAgentSessions(agentID string) ([]Session, error) {
	data, err := c.get("/agents/"+agentID+"/sessions", nil)
	if err != nil {
		return nil, err
	}
	var sessions []Session
	if err := json.Unmarshal(unwrapData(data), &sessions); err != nil {
		return nil, fmt.Errorf("failed to parse sessions response: %w", err)
	}
	return sessions, nil
}

// --- Policy Methods ---

// GetPolicies lists all policies.
func (c *Client) GetPolicies() ([]Policy, error) {
	data, err := c.get("/policies", nil)
	if err != nil {
		return nil, err
	}
	var policies []Policy
	if err := json.Unmarshal(unwrapData(data), &policies); err != nil {
		return nil, fmt.Errorf("failed to parse policies response: %w", err)
	}
	return policies, nil
}

// GetPolicy retrieves a single policy by ID.
func (c *Client) GetPolicy(id string) (*Policy, error) {
	data, err := c.get("/policies/"+id, nil)
	if err != nil {
		return nil, err
	}
	var policy Policy
	if err := json.Unmarshal(unwrapData(data), &policy); err != nil {
		return nil, fmt.Errorf("failed to parse policy response: %w", err)
	}
	return &policy, nil
}

// CreatePolicy creates a new policy.
func (c *Client) CreatePolicy(name string, rules interface{}) (*Policy, error) {
	body := map[string]interface{}{
		"name":  name,
		"rules": rules,
	}
	data, err := c.post("/policies", body)
	if err != nil {
		return nil, err
	}
	var policy Policy
	if err := json.Unmarshal(unwrapData(data), &policy); err != nil {
		return nil, fmt.Errorf("failed to parse policy response: %w", err)
	}
	return &policy, nil
}

// UpdatePolicy updates a policy by ID.
func (c *Client) UpdatePolicy(id string, body map[string]interface{}) (*Policy, error) {
	data, err := c.put("/policies/"+id, body)
	if err != nil {
		return nil, err
	}
	var policy Policy
	if err := json.Unmarshal(unwrapData(data), &policy); err != nil {
		return nil, fmt.Errorf("failed to parse policy response: %w", err)
	}
	return &policy, nil
}

// SimulatePolicy simulates a policy evaluation.
func (c *Client) SimulatePolicy(id string, agent, tool, action, resource string) (*SimulationResult, error) {
	body := map[string]string{
		"agent":    agent,
		"tool":     tool,
		"action":   action,
		"resource": resource,
	}
	data, err := c.post("/policies/"+id+"/simulate", body)
	if err != nil {
		return nil, err
	}
	var result SimulationResult
	if err := json.Unmarshal(unwrapData(data), &result); err != nil {
		return nil, fmt.Errorf("failed to parse simulation result: %w", err)
	}
	return &result, nil
}

// ActivatePolicy activates a policy by ID.
func (c *Client) ActivatePolicy(id string) (*Policy, error) {
	data, err := c.post("/policies/"+id+"/activate", nil)
	if err != nil {
		return nil, err
	}
	var policy Policy
	if err := json.Unmarshal(unwrapData(data), &policy); err != nil {
		return nil, fmt.Errorf("failed to parse policy response: %w", err)
	}
	return &policy, nil
}

// --- Session Methods ---

// GetSessions lists all sessions.
func (c *Client) GetSessions() ([]Session, error) {
	data, err := c.get("/sessions", nil)
	if err != nil {
		return nil, err
	}
	var sessions []Session
	if err := json.Unmarshal(unwrapData(data), &sessions); err != nil {
		return nil, fmt.Errorf("failed to parse sessions response: %w", err)
	}
	return sessions, nil
}

// GetSession retrieves a single session by ID.
func (c *Client) GetSession(id string) (*Session, error) {
	data, err := c.get("/sessions/"+id, nil)
	if err != nil {
		return nil, err
	}
	var session Session
	if err := json.Unmarshal(unwrapData(data), &session); err != nil {
		return nil, fmt.Errorf("failed to parse session response: %w", err)
	}
	return &session, nil
}

// GetSessionEvents retrieves events for a session.
func (c *Client) GetSessionEvents(sessionID string) ([]SessionEvent, error) {
	data, err := c.get("/sessions/"+sessionID+"/events", nil)
	if err != nil {
		return nil, err
	}
	var events []SessionEvent
	if err := json.Unmarshal(unwrapData(data), &events); err != nil {
		return nil, fmt.Errorf("failed to parse session events response: %w", err)
	}
	return events, nil
}

// --- Tool Methods ---

// GetTools lists all tools.
func (c *Client) GetTools() ([]Tool, error) {
	data, err := c.get("/tools", nil)
	if err != nil {
		return nil, err
	}
	var tools []Tool
	if err := json.Unmarshal(unwrapData(data), &tools); err != nil {
		return nil, fmt.Errorf("failed to parse tools response: %w", err)
	}
	return tools, nil
}

// GetTool retrieves a single tool by ID.
func (c *Client) GetTool(id string) (*Tool, error) {
	data, err := c.get("/tools/"+id, nil)
	if err != nil {
		return nil, err
	}
	var tool Tool
	if err := json.Unmarshal(unwrapData(data), &tool); err != nil {
		return nil, fmt.Errorf("failed to parse tool response: %w", err)
	}
	return &tool, nil
}

// --- Audit Methods ---

// GetAuditEvents queries audit events with optional filters.
func (c *Client) GetAuditEvents(agent, tool, outcome, since string) ([]AuditEvent, error) {
	q := url.Values{}
	if agent != "" {
		q.Set("agent", agent)
	}
	if tool != "" {
		q.Set("tool", tool)
	}
	if outcome != "" {
		q.Set("outcome", outcome)
	}
	if since != "" {
		q.Set("since", since)
	}
	data, err := c.get("/audit/events", q)
	if err != nil {
		return nil, err
	}
	var events []AuditEvent
	if err := json.Unmarshal(unwrapData(data), &events); err != nil {
		return nil, fmt.Errorf("failed to parse audit events response: %w", err)
	}
	return events, nil
}

// --- Dashboard Methods ---

// GetDashboardStats retrieves dashboard statistics.
func (c *Client) GetDashboardStats() (*DashboardStats, error) {
	data, err := c.get("/stats/dashboard", nil)
	if err != nil {
		return nil, err
	}
	var stats DashboardStats
	if err := json.Unmarshal(unwrapData(data), &stats); err != nil {
		return nil, fmt.Errorf("failed to parse dashboard stats: %w", err)
	}
	return &stats, nil
}
