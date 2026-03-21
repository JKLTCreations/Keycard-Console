package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/keycard-dev/keycard-cli/internal/config"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage CLI configuration",
	Long:  "View and modify Keycard CLI configuration settings.",
}

var configSetCmd = &cobra.Command{
	Use:   "set <key> <value>",
	Short: "Set a configuration value",
	Args:  cobra.ExactArgs(2),
	Example: `  keycard config set api_url https://api.keycard.dev/v1
  keycard config set output_format json
  keycard config set org_id org_abc123`,
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		value := args[1]

		validKeys := map[string]bool{
			"api_url":       true,
			"output_format": true,
			"org_id":        true,
		}

		if !validKeys[key] {
			return fmt.Errorf("unknown config key: %s\nValid keys: api_url, output_format, org_id", key)
		}

		viper.Set(key, value)
		if err := config.SaveConfig(); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Printf("Set %s = %s\n", key, value)
		return nil
	},
}

var configGetCmd = &cobra.Command{
	Use:   "get <key>",
	Short: "Get a configuration value",
	Args:  cobra.ExactArgs(1),
	Example: `  keycard config get api_url
  keycard config get output_format`,
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		value := viper.GetString(key)
		if value == "" {
			fmt.Printf("%s is not set\n", key)
		} else {
			fmt.Println(value)
		}
		return nil
	},
}

var configInitCmd = &cobra.Command{
	Use:   "init",
	Short: "Interactive setup wizard",
	Long:  "Walk through initial Keycard CLI configuration.",
	RunE: func(cmd *cobra.Command, args []string) error {
		reader := bufio.NewReader(os.Stdin)

		fmt.Println("Keycard CLI Setup")
		fmt.Println("=================")
		fmt.Println()

		// API URL
		currentURL := viper.GetString("api_url")
		if currentURL == "" {
			currentURL = "http://localhost:3001/v1"
		}
		fmt.Printf("API URL [%s]: ", currentURL)
		apiInput, _ := reader.ReadString('\n')
		apiInput = strings.TrimSpace(apiInput)
		if apiInput != "" {
			viper.Set("api_url", apiInput)
		} else {
			viper.Set("api_url", currentURL)
		}

		// Organization ID
		currentOrg := viper.GetString("org_id")
		prompt := "Organization ID"
		if currentOrg != "" {
			prompt = fmt.Sprintf("Organization ID [%s]", currentOrg)
		}
		fmt.Printf("%s: ", prompt)
		orgInput, _ := reader.ReadString('\n')
		orgInput = strings.TrimSpace(orgInput)
		if orgInput != "" {
			viper.Set("org_id", orgInput)
		}

		// Output format
		currentFormat := viper.GetString("output_format")
		if currentFormat == "" {
			currentFormat = "table"
		}
		fmt.Printf("Default output format (table/json) [%s]: ", currentFormat)
		formatInput, _ := reader.ReadString('\n')
		formatInput = strings.TrimSpace(formatInput)
		if formatInput == "json" || formatInput == "table" {
			viper.Set("output_format", formatInput)
		} else if formatInput == "" {
			viper.Set("output_format", currentFormat)
		} else {
			fmt.Println("Invalid format. Using default: table")
			viper.Set("output_format", "table")
		}

		if err := config.SaveConfig(); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Println()
		fmt.Printf("Configuration saved to %s\n", config.ConfigPath())
		fmt.Println()
		fmt.Println("Next steps:")
		fmt.Println("  1. Run 'keycard auth login' to authenticate")
		fmt.Println("  2. Run 'keycard agents list' to see your agents")
		return nil
	},
}

func init() {
	configCmd.AddCommand(configSetCmd)
	configCmd.AddCommand(configGetCmd)
	configCmd.AddCommand(configInitCmd)
}
