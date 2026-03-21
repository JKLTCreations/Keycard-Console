package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/keycard-dev/keycard-cli/internal/api"
	"github.com/keycard-dev/keycard-cli/internal/auth"
	"github.com/keycard-dev/keycard-cli/internal/config"
	"github.com/keycard-dev/keycard-cli/internal/output"
)

var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "Manage authentication",
	Long:  "Authenticate with the Keycard API using device authorization flow.",
}

var authLoginCmd = &cobra.Command{
	Use:   "login",
	Short: "Sign in to Keycard",
	Long:  "Initiate a device authorization flow to sign in to your Keycard account.",
	Example: `  keycard auth login
  keycard auth login --api-url https://api.keycard.dev/v1`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := api.NewClient(config.GetApiUrl(), "")

		token, err := auth.DeviceFlowLogin(client)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Authentication failed:", err)
			os.Exit(2)
		}

		if err := config.SetToken(token); err != nil {
			return fmt.Errorf("failed to save token: %w", err)
		}

		fmt.Println("Successfully authenticated!")
		fmt.Printf("Token saved to %s\n", config.ConfigPath())
		return nil
	},
}

var authLogoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Sign out of Keycard",
	Long:  "Clear the saved authentication token.",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := config.SetToken(""); err != nil {
			return fmt.Errorf("failed to clear token: %w", err)
		}
		fmt.Println("Signed out successfully.")
		return nil
	},
}

var authStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show current authentication status",
	Long:  "Display information about the currently authenticated user and organization.",
	RunE: func(cmd *cobra.Command, args []string) error {
		token := config.GetToken()
		if token == "" {
			fmt.Println("Not authenticated. Run 'keycard auth login' to sign in.")
			os.Exit(2)
		}

		client := api.NewClient(config.GetApiUrl(), token)
		status, err := client.GetAuthStatus()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to get auth status: %v\n", err)
			os.Exit(2)
		}

		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(status)
		} else {
			fmt.Println("Authenticated")
			fmt.Println()
			fmt.Printf("  User:         %s (%s)\n", status.Name, status.Email)
			fmt.Printf("  User ID:      %s\n", status.ID)
			fmt.Printf("  Organization: %s\n", status.OrgName)
			fmt.Printf("  Org ID:       %s\n", status.OrgID)
		}
		return nil
	},
}

var authTokenCmd = &cobra.Command{
	Use:   "token",
	Short: "Print the current access token",
	Long:  "Print the raw access token for use in scripts or piping to other commands.",
	Example: `  keycard auth token
  curl -H "Authorization: Bearer $(keycard auth token)" https://api.keycard.dev/v1/agents`,
	RunE: func(cmd *cobra.Command, args []string) error {
		token := viper.GetString("token")
		if token == "" {
			fmt.Fprintln(os.Stderr, "Not authenticated. Run 'keycard auth login' to sign in.")
			os.Exit(2)
		}
		fmt.Print(token)
		return nil
	},
}

func init() {
	authCmd.AddCommand(authLoginCmd)
	authCmd.AddCommand(authLogoutCmd)
	authCmd.AddCommand(authStatusCmd)
	authCmd.AddCommand(authTokenCmd)
}
