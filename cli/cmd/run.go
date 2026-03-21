package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

var runCmd = &cobra.Command{
	Use:   "run [flags] -- <command> [args...]",
	Short: "Run a command through Keycard",
	Long: `Run an AI agent command through Keycard's security layer.

Keycard will intercept tool calls, evaluate them against the assigned policy,
and log all activity to the audit trail.

This feature is under active development. Phase 1 shows what the command would do.`,
	Example: `  keycard run --agent agt_abc123 --policy pol_xyz -- claude "write a hello world"
  keycard run --agent agt_abc123 -- python my_agent.py`,
	DisableFlagParsing: false,
	RunE: func(cmd *cobra.Command, args []string) error {
		agent, _ := cmd.Flags().GetString("agent")
		policy, _ := cmd.Flags().GetString("policy")

		// Find the -- separator
		dashArgs := cmd.ArgsLenAtDash()

		var wrappedCmd []string
		if dashArgs >= 0 {
			wrappedCmd = args[dashArgs:]
		} else {
			wrappedCmd = args
		}

		fmt.Println("Keycard Run (Phase 1 Preview)")
		fmt.Println()
		if agent != "" {
			fmt.Printf("  Agent:   %s\n", agent)
		} else {
			fmt.Println("  Agent:   (not specified, would use default)")
		}
		if policy != "" {
			fmt.Printf("  Policy:  %s\n", policy)
		} else {
			fmt.Println("  Policy:  (not specified, would use default)")
		}
		if len(wrappedCmd) > 0 {
			fmt.Printf("  Command: %s\n", strings.Join(wrappedCmd, " "))
		} else {
			fmt.Println("  Command: (none specified)")
		}
		fmt.Println()
		fmt.Println("In a future release, this command will:")
		fmt.Println("  1. Start a Keycard session for the agent")
		fmt.Println("  2. Inject the Keycard MCP proxy")
		fmt.Println("  3. Intercept and evaluate tool calls against the policy")
		fmt.Println("  4. Log all activity to the audit trail")
		fmt.Println("  5. Run the wrapped command with security controls active")
		return nil
	},
}

func init() {
	runCmd.Flags().String("agent", "", "Agent ID to run as")
	runCmd.Flags().String("policy", "", "Policy ID to enforce")
}
