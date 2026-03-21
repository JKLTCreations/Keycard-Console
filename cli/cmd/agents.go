package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/keycard-dev/keycard-cli/internal/api"
	"github.com/keycard-dev/keycard-cli/internal/config"
	"github.com/keycard-dev/keycard-cli/internal/output"
)

var agentsCmd = &cobra.Command{
	Use:   "agents",
	Short: "Manage AI agents",
	Long:  "List, create, update, and manage AI agents registered with Keycard.",
}

var agentsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all agents",
	Long:  "Retrieve and display all registered AI agents.",
	Example: `  keycard agents list
  keycard agents list -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		agents, err := client.GetAgents()
		if err != nil {
			return fmt.Errorf("failed to list agents: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(agents)
			return nil
		}

		if len(agents) == 0 {
			fmt.Println("No agents found. Create one with 'keycard agents create'.")
			return nil
		}

		headers := []string{"ID", "Name", "Type", "Status", "Last Active"}
		var rows [][]string
		for _, a := range agents {
			lastActive := a.LastActiveAt
			if lastActive == "" {
				lastActive = "-"
			}
			rows = append(rows, []string{
				a.ID[:12],
				a.Name,
				a.Type,
				a.Status,
				lastActive,
			})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

var agentsCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Register a new agent",
	Long:  "Register a new AI agent with Keycard.",
	Example: `  keycard agents create --name "my-agent" --type claude
  keycard agents create --from keycard.yaml`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()

		fromFile, _ := cmd.Flags().GetString("from")
		name, _ := cmd.Flags().GetString("name")
		agentType, _ := cmd.Flags().GetString("type")

		var agentConfig map[string]interface{}

		if fromFile != "" {
			data, err := os.ReadFile(fromFile)
			if err != nil {
				return fmt.Errorf("failed to read file %s: %w", fromFile, err)
			}
			if err := json.Unmarshal(data, &agentConfig); err != nil {
				return fmt.Errorf("failed to parse file %s: %w", fromFile, err)
			}
			if n, ok := agentConfig["name"].(string); ok && name == "" {
				name = n
			}
			if t, ok := agentConfig["type"].(string); ok && agentType == "" {
				agentType = t
			}
		}

		if name == "" {
			return fmt.Errorf("--name is required")
		}
		if agentType == "" {
			return fmt.Errorf("--type is required")
		}

		agent, err := client.CreateAgent(name, agentType, agentConfig)
		if err != nil {
			return fmt.Errorf("failed to create agent: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(agent)
			return nil
		}

		fmt.Printf("Agent created successfully!\n\n")
		fmt.Printf("  ID:     %s\n", agent.ID)
		fmt.Printf("  Name:   %s\n", agent.Name)
		fmt.Printf("  Type:   %s\n", agent.Type)
		fmt.Printf("  Status: %s\n", agent.Status)
		return nil
	},
}

var agentsGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get agent details",
	Long:  "Retrieve and display detailed information about a specific agent.",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard agents get agt_abc123
  keycard agents get agt_abc123 -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		agent, err := client.GetAgent(args[0])
		if err != nil {
			return fmt.Errorf("failed to get agent: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(agent)
			return nil
		}

		fmt.Printf("Agent: %s\n\n", agent.Name)
		fmt.Printf("  ID:          %s\n", agent.ID)
		fmt.Printf("  Type:        %s\n", agent.Type)
		fmt.Printf("  Status:      %s\n", agent.Status)
		fmt.Printf("  Last Active: %s\n", agent.LastActiveAt)
		fmt.Printf("  Created:     %s\n", agent.CreatedAt)
		fmt.Printf("  Updated:     %s\n", agent.UpdatedAt)
		if agent.Config != nil {
			configJSON, _ := json.MarshalIndent(agent.Config, "  ", "  ")
			fmt.Printf("  Config:      %s\n", string(configJSON))
		}
		return nil
	},
}

var agentsUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update an agent",
	Long:  "Update properties of an existing agent.",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard agents update agt_abc123 --name "new-name"
  keycard agents update agt_abc123 --type openai`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()

		updates := map[string]interface{}{}

		if name, _ := cmd.Flags().GetString("name"); name != "" {
			updates["name"] = name
		}
		if agentType, _ := cmd.Flags().GetString("type"); agentType != "" {
			updates["type"] = agentType
		}
		if configStr, _ := cmd.Flags().GetString("config"); configStr != "" {
			var cfg map[string]interface{}
			if err := json.Unmarshal([]byte(configStr), &cfg); err != nil {
				return fmt.Errorf("invalid --config JSON: %w", err)
			}
			updates["config"] = cfg
		}

		if len(updates) == 0 {
			return fmt.Errorf("no updates specified; use --name, --type, or --config")
		}

		agent, err := client.UpdateAgent(args[0], updates)
		if err != nil {
			return fmt.Errorf("failed to update agent: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(agent)
			return nil
		}

		fmt.Printf("Agent updated successfully!\n\n")
		fmt.Printf("  ID:     %s\n", agent.ID)
		fmt.Printf("  Name:   %s\n", agent.Name)
		fmt.Printf("  Type:   %s\n", agent.Type)
		fmt.Printf("  Status: %s\n", agent.Status)
		return nil
	},
}

var agentsRevokeCmd = &cobra.Command{
	Use:   "revoke <id>",
	Short: "Revoke an agent",
	Long:  "Revoke and delete an agent registration. This action cannot be undone.",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard agents revoke agt_abc123
  keycard agents revoke agt_abc123 --yes`,
	RunE: func(cmd *cobra.Command, args []string) error {
		yes, _ := cmd.Flags().GetBool("yes")

		if !yes {
			fmt.Printf("Are you sure you want to revoke agent %s? This cannot be undone.\n", args[0])
			fmt.Print("Type 'yes' to confirm: ")
			var confirm string
			fmt.Scanln(&confirm)
			if confirm != "yes" {
				fmt.Println("Aborted.")
				return nil
			}
		}

		client := newAuthenticatedClient()
		if err := client.DeleteAgent(args[0]); err != nil {
			return fmt.Errorf("failed to revoke agent: %w", err)
		}

		fmt.Printf("Agent %s has been revoked.\n", args[0])
		return nil
	},
}

var agentsSessionsCmd = &cobra.Command{
	Use:   "sessions <id>",
	Short: "List sessions for an agent",
	Long:  "Display all sessions associated with a specific agent.",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard agents sessions agt_abc123
  keycard agents sessions agt_abc123 -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		sessions, err := client.GetAgentSessions(args[0])
		if err != nil {
			return fmt.Errorf("failed to list agent sessions: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(sessions)
			return nil
		}

		if len(sessions) == 0 {
			fmt.Println("No sessions found for this agent.")
			return nil
		}

		headers := []string{"ID", "Status", "Task", "Tool Calls", "Started"}
		var rows [][]string
		for _, s := range sessions {
			task := s.TaskDescription
			if len(task) > 40 {
				task = task[:37] + "..."
			}
			rows = append(rows, []string{
				s.ID[:12],
				s.Status,
				task,
				fmt.Sprintf("%d", s.ToolCallCount),
				s.StartedAt,
			})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

func init() {
	// agents create flags
	agentsCreateCmd.Flags().String("name", "", "Agent name")
	agentsCreateCmd.Flags().String("type", "", "Agent type (e.g., claude, openai, custom)")
	agentsCreateCmd.Flags().String("from", "", "Path to keycard.yaml configuration file")

	// agents update flags
	agentsUpdateCmd.Flags().String("name", "", "New agent name")
	agentsUpdateCmd.Flags().String("type", "", "New agent type")
	agentsUpdateCmd.Flags().String("config", "", "Agent configuration as JSON string")

	// agents revoke flags
	agentsRevokeCmd.Flags().BoolP("yes", "y", false, "Skip confirmation prompt")

	agentsCmd.AddCommand(agentsListCmd)
	agentsCmd.AddCommand(agentsCreateCmd)
	agentsCmd.AddCommand(agentsGetCmd)
	agentsCmd.AddCommand(agentsUpdateCmd)
	agentsCmd.AddCommand(agentsRevokeCmd)
	agentsCmd.AddCommand(agentsSessionsCmd)
}

// newAuthenticatedClient creates an API client with the saved token.
func newAuthenticatedClient() *api.Client {
	token := config.GetToken()
	if token == "" {
		fmt.Fprintln(os.Stderr, "Not authenticated. Run 'keycard auth login' to sign in.")
		os.Exit(2)
	}
	return api.NewClient(config.GetApiUrl(), token)
}
