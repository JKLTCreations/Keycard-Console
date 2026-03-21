package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	apiURL       string
	outputFormat string
	quiet        bool
)

// rootCmd represents the base command when called without any subcommands.
var rootCmd = &cobra.Command{
	Use:   "keycard",
	Short: "Keycard - AI Agent Security Console",
	Long: `Keycard is a security console for managing AI agent permissions,
policies, and audit trails. Use keycard to register agents, define
access policies, monitor sessions, and review audit logs.

Get started by running:
  keycard auth login`,
	SilenceUsage:  true,
	SilenceErrors: true,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, "Error:", err)
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&apiURL, "api-url", "http://localhost:3001/v1", "Keycard API base URL")
	rootCmd.PersistentFlags().StringVarP(&outputFormat, "output", "o", "table", "Output format: table or json")
	rootCmd.PersistentFlags().BoolVar(&quiet, "quiet", false, "Suppress non-essential output")

	_ = viper.BindPFlag("api_url", rootCmd.PersistentFlags().Lookup("api-url"))
	_ = viper.BindPFlag("output_format", rootCmd.PersistentFlags().Lookup("output"))

	// Register all subcommands
	rootCmd.AddCommand(authCmd)
	rootCmd.AddCommand(agentsCmd)
	rootCmd.AddCommand(policiesCmd)
	rootCmd.AddCommand(sessionsCmd)
	rootCmd.AddCommand(toolsCmd)
	rootCmd.AddCommand(auditCmd)
	rootCmd.AddCommand(runCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(versionCmd)
}

func initConfig() {
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Warning: unable to determine home directory:", err)
		return
	}

	configDir := filepath.Join(home, ".keycard")
	viper.AddConfigPath(configDir)
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")

	// Set defaults
	viper.SetDefault("api_url", "http://localhost:3001/v1")
	viper.SetDefault("output_format", "table")

	// Environment variable overrides
	viper.SetEnvPrefix("KEYCARD")
	viper.AutomaticEnv()

	// Read config file if it exists
	if err := viper.ReadInConfig(); err != nil {
		// Config file not found is fine
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			fmt.Fprintln(os.Stderr, "Warning: error reading config file:", err)
		}
	}
}

// getOutputFormat returns the current output format setting.
func getOutputFormat() string {
	if outputFormat != "" && outputFormat != "table" {
		return outputFormat
	}
	f := viper.GetString("output_format")
	if f != "" {
		return f
	}
	return "table"
}
