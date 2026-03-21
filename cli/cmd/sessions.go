package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/keycard-dev/keycard-cli/internal/output"
)

var sessionsCmd = &cobra.Command{
	Use:     "sessions",
	Aliases: []string{"session"},
	Short:   "Manage agent sessions",
	Long:    "View and inspect AI agent sessions and their events.",
}

var sessionsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all sessions",
	Example: `  keycard sessions list
  keycard sessions list -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		sessions, err := client.GetSessions()
		if err != nil {
			return fmt.Errorf("failed to list sessions: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(sessions)
			return nil
		}

		if len(sessions) == 0 {
			fmt.Println("No sessions found.")
			return nil
		}

		headers := []string{"ID", "Agent", "Status", "Task", "Tool Calls", "Started"}
		var rows [][]string
		for _, s := range sessions {
			agentName := s.AgentName
			if agentName == "" {
				agentName = s.AgentID
			}
			task := s.TaskDescription
			if len(task) > 40 {
				task = task[:37] + "..."
			}
			rows = append(rows, []string{
				s.ID[:12],
				agentName,
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

var sessionsGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get session details",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		session, err := client.GetSession(args[0])
		if err != nil {
			return fmt.Errorf("failed to get session: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(session)
			return nil
		}

		agentName := session.AgentName
		if agentName == "" {
			agentName = session.AgentID
		}
		fmt.Printf("Session: %s\n\n", session.ID)
		fmt.Printf("  Agent:      %s\n", agentName)
		fmt.Printf("  Status:     %s\n", session.Status)
		fmt.Printf("  Task:       %s\n", session.TaskDescription)
		fmt.Printf("  Tool Calls: %d\n", session.ToolCallCount)
		fmt.Printf("  Started:    %s\n", session.StartedAt)
		if session.EndedAt != "" {
			fmt.Printf("  Ended:      %s\n", session.EndedAt)
		}
		return nil
	},
}

var sessionsEventsCmd = &cobra.Command{
	Use:   "events <id>",
	Short: "List events for a session",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard sessions events ses_abc123
  keycard sessions events ses_abc123 --follow`,
	RunE: func(cmd *cobra.Command, args []string) error {
		follow, _ := cmd.Flags().GetBool("follow")
		if follow {
			fmt.Println("Live event following is not yet implemented. Showing current events.")
			fmt.Println()
		}

		client := newAuthenticatedClient()
		events, err := client.GetSessionEvents(args[0])
		if err != nil {
			return fmt.Errorf("failed to list session events: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(events)
			return nil
		}

		if len(events) == 0 {
			fmt.Println("No events found for this session.")
			return nil
		}

		headers := []string{"Time", "Tool", "Action", "Resource", "Outcome", "Reason"}
		var rows [][]string
		for _, e := range events {
			toolName := e.ToolName
			if toolName == "" {
				toolName = "-"
			}
			reason := e.Reason
			if reason == "" {
				reason = "-"
			}
			resource := e.Resource
			if len(resource) > 40 {
				resource = resource[:37] + "..."
			}
			rows = append(rows, []string{e.CreatedAt, toolName, e.Action, resource, e.Outcome, reason})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

func init() {
	sessionsEventsCmd.Flags().BoolP("follow", "f", false, "Follow events in real-time (not yet implemented)")

	sessionsCmd.AddCommand(sessionsListCmd)
	sessionsCmd.AddCommand(sessionsGetCmd)
	sessionsCmd.AddCommand(sessionsEventsCmd)
}
