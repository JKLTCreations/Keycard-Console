package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/keycard-dev/keycard-cli/internal/output"
)

var toolsCmd = &cobra.Command{
	Use:   "tools",
	Short: "Manage tools",
	Long:  "List, inspect, and manage tools available to AI agents.",
}

var toolsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all tools",
	Example: `  keycard tools list
  keycard tools list -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		tools, err := client.GetTools()
		if err != nil {
			return fmt.Errorf("failed to list tools: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(tools)
			return nil
		}

		if len(tools) == 0 {
			fmt.Println("No tools found.")
			return nil
		}

		headers := []string{"ID", "Name", "Description", "Category"}
		var rows [][]string
		for _, t := range tools {
			rows = append(rows, []string{t.ID[:12], t.Name, t.Description, t.Category})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

var toolsGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get tool details",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client := newAuthenticatedClient()
		tool, err := client.GetTool(args[0])
		if err != nil {
			return fmt.Errorf("failed to get tool: %w", err)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(tool)
			return nil
		}

		fmt.Printf("Tool: %s\n\n", tool.Name)
		fmt.Printf("  ID:          %s\n", tool.ID)
		fmt.Printf("  Description: %s\n", tool.Description)
		fmt.Printf("  Category:    %s\n", tool.Category)
		return nil
	},
}

var toolsInstallCmd = &cobra.Command{
	Use:   "install <name>",
	Short: "Install a tool",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Not yet implemented. Tool installation will be available in a future release.")
		return nil
	},
}

func init() {
	toolsCmd.AddCommand(toolsListCmd)
	toolsCmd.AddCommand(toolsGetCmd)
	toolsCmd.AddCommand(toolsInstallCmd)
}
