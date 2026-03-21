package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/keycard-dev/keycard-cli/internal/output"
)

var policiesCmd = &cobra.Command{
	Use:     "policies",
	Aliases: []string{"policy"},
	Short:   "Manage access policies",
	Long:    "Create, update, simulate, and manage access control policies for AI agents.",
}

var policiesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all policies",
	Example: `  keycard policies list
  keycard policies list -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		policies, err := client.GetPolicies()
		if err != nil {
			return fmt.Errorf("failed to list policies: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(policies)
			return nil
		}

		if len(policies) == 0 {
			fmt.Println("No policies found. Create one with 'keycard policies create'.")
			return nil
		}

		headers := []string{"ID", "Name", "Status", "Created", "Updated"}
		var rows [][]string
		for _, p := range policies {
			rows = append(rows, []string{p.ID, p.Name, p.Status, p.CreatedAt, p.UpdatedAt})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

var policiesGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get policy details",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		policy, err := client.GetPolicy(args[0])
		if err != nil {
			return fmt.Errorf("failed to get policy: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(policy)
			return nil
		}

		fmt.Printf("Policy: %s\n\n", policy.Name)
		fmt.Printf("  ID:      %s\n", policy.ID)
		fmt.Printf("  Status:  %s\n", policy.Status)
		fmt.Printf("  Created: %s\n", policy.CreatedAt)
		fmt.Printf("  Updated: %s\n", policy.UpdatedAt)
		if policy.Rules != nil {
			rulesJSON, _ := json.MarshalIndent(policy.Rules, "  ", "  ")
			fmt.Printf("  Rules:   %s\n", string(rulesJSON))
		}
		return nil
	},
}

var policiesCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new policy",
	Example: `  keycard policies create --name "read-only" --file rules.json
  keycard policies create --name "dev-policy" --file rules.yaml`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()

		name, _ := cmd.Flags().GetString("name")
		file, _ := cmd.Flags().GetString("file")

		if name == "" {
			return fmt.Errorf("--name is required")
		}

		var rules interface{}
		if file != "" {
			data, err := os.ReadFile(file)
			if err != nil {
				return fmt.Errorf("failed to read rules file: %w", err)
			}
			if err := json.Unmarshal(data, &rules); err != nil {
				return fmt.Errorf("failed to parse rules file: %w", err)
			}
		}

		policy, err := client.CreatePolicy(name, rules)
		if err != nil {
			return fmt.Errorf("failed to create policy: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(policy)
			return nil
		}

		fmt.Printf("Policy created successfully!\n\n")
		fmt.Printf("  ID:     %s\n", policy.ID)
		fmt.Printf("  Name:   %s\n", policy.Name)
		fmt.Printf("  Status: %s\n", policy.Status)
		return nil
	},
}

var policiesUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update a policy",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()

		updates := map[string]interface{}{}
		if name, _ := cmd.Flags().GetString("name"); name != "" {
			updates["name"] = name
		}
		if file, _ := cmd.Flags().GetString("file"); file != "" {
			data, err := os.ReadFile(file)
			if err != nil {
				return fmt.Errorf("failed to read rules file: %w", err)
			}
			var rules interface{}
			if err := json.Unmarshal(data, &rules); err != nil {
				return fmt.Errorf("failed to parse rules file: %w", err)
			}
			updates["rules"] = rules
		}

		if len(updates) == 0 {
			return fmt.Errorf("no updates specified; use --name or --file")
		}

		policy, err := client.UpdatePolicy(args[0], updates)
		if err != nil {
			return fmt.Errorf("failed to update policy: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(policy)
			return nil
		}

		fmt.Printf("Policy updated successfully!\n\n")
		fmt.Printf("  ID:     %s\n", policy.ID)
		fmt.Printf("  Name:   %s\n", policy.Name)
		fmt.Printf("  Status: %s\n", policy.Status)
		return nil
	},
}

var policiesSimulateCmd = &cobra.Command{
	Use:   "simulate <id>",
	Short: "Simulate a policy evaluation",
	Long:  "Test a policy against a hypothetical request to see if it would be allowed or denied.",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard policies simulate pol_abc123 --agent agt_123 --tool file-read --action read --resource /etc/passwd`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()

		agent, _ := cmd.Flags().GetString("agent")
		tool, _ := cmd.Flags().GetString("tool")
		action, _ := cmd.Flags().GetString("action")
		resource, _ := cmd.Flags().GetString("resource")

		result, err := client.SimulatePolicy(args[0], agent, tool, action, resource)
		if err != nil {
			return fmt.Errorf("failed to simulate policy: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(result)
			return nil
		}

		fmt.Printf("Outcome: %s\n", result.Outcome)
		fmt.Printf("Reason:  %s\n", result.Reason)
		return nil
	},
}

var policiesActivateCmd = &cobra.Command{
	Use:   "activate <id>",
	Short: "Activate a policy",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		policy, err := client.ActivatePolicy(args[0])
		if err != nil {
			return fmt.Errorf("failed to activate policy: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(policy)
			return nil
		}

		fmt.Printf("Policy %s activated.\n", policy.ID)
		return nil
	},
}

var policiesDiffCmd = &cobra.Command{
	Use:   "diff <id>",
	Short: "Compare policy versions",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Not yet implemented. Policy diff will be available in a future release.")
		return nil
	},
}

func init() {
	// policies create flags
	policiesCreateCmd.Flags().String("name", "", "Policy name")
	policiesCreateCmd.Flags().String("file", "", "Path to rules file (JSON or YAML)")

	// policies update flags
	policiesUpdateCmd.Flags().String("name", "", "New policy name")
	policiesUpdateCmd.Flags().String("file", "", "Path to updated rules file")

	// policies simulate flags
	policiesSimulateCmd.Flags().String("agent", "", "Agent ID to simulate")
	policiesSimulateCmd.Flags().String("tool", "", "Tool name to simulate")
	policiesSimulateCmd.Flags().String("action", "", "Action to simulate")
	policiesSimulateCmd.Flags().String("resource", "", "Resource to simulate")

	policiesCmd.AddCommand(policiesListCmd)
	policiesCmd.AddCommand(policiesGetCmd)
	policiesCmd.AddCommand(policiesCreateCmd)
	policiesCmd.AddCommand(policiesUpdateCmd)
	policiesCmd.AddCommand(policiesSimulateCmd)
	policiesCmd.AddCommand(policiesActivateCmd)
	policiesCmd.AddCommand(policiesDiffCmd)
}
