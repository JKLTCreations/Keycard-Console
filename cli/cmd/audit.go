package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/keycard-dev/keycard-cli/internal/output"
)

var auditCmd = &cobra.Command{
	Use:   "audit",
	Short: "View audit logs",
	Long:  "Search, stream, and export audit events for AI agent activity.",
}

var auditStreamCmd = &cobra.Command{
	Use:   "stream",
	Short: "Stream audit events in real-time",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Not yet implemented. Real-time audit streaming will be available in a future release.")
		fmt.Println("Use 'keycard audit search' to query recent events.")
		return nil
	},
}

var auditSearchCmd = &cobra.Command{
	Use:   "search",
	Short: "Search audit events",
	Example: `  keycard audit search
  keycard audit search --agent deploy-bot --since 24h
  keycard audit search --outcome deny -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()

		agent, _ := cmd.Flags().GetString("agent")
		tool, _ := cmd.Flags().GetString("tool")
		outcome, _ := cmd.Flags().GetString("outcome")
		since, _ := cmd.Flags().GetString("since")

		events, err := client.GetAuditEvents(agent, tool, outcome, since)
		if err != nil {
			return fmt.Errorf("failed to search audit events: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(events)
			return nil
		}

		if len(events) == 0 {
			fmt.Println("No audit events found matching the criteria.")
			return nil
		}

		headers := []string{"Time", "Agent", "Tool", "Action", "Resource", "Outcome"}
		var rows [][]string
		for _, e := range events {
			resource := e.Resource
			if len(resource) > 35 {
				resource = resource[:32] + "..."
			}
			rows = append(rows, []string{e.CreatedAt, e.AgentName, e.ToolName, e.Action, resource, e.Outcome})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

var auditExportCmd = &cobra.Command{
	Use:   "export",
	Short: "Export audit events",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Not yet implemented. Audit export will be available in a future release.")
		fmt.Println("Use 'keycard audit search -o json' to export events as JSON.")
		return nil
	},
}

func init() {
	auditSearchCmd.Flags().String("agent", "", "Filter by agent name")
	auditSearchCmd.Flags().String("tool", "", "Filter by tool name")
	auditSearchCmd.Flags().String("outcome", "", "Filter by outcome (allow, deny)")
	auditSearchCmd.Flags().String("since", "", "Show events since duration (e.g., 24h, 7d)")

	auditCmd.AddCommand(auditStreamCmd)
	auditCmd.AddCommand(auditSearchCmd)
	auditCmd.AddCommand(auditExportCmd)
}
