package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Config holds all CLI configuration values.
type Config struct {
	ApiUrl       string `mapstructure:"api_url" yaml:"api_url"`
	Token        string `mapstructure:"token" yaml:"token"`
	OrgId        string `mapstructure:"org_id" yaml:"org_id"`
	OutputFormat string `mapstructure:"output_format" yaml:"output_format"`
}

// ConfigDir returns the path to ~/.keycard/.
func ConfigDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: unable to determine home directory: %v\n", err)
		os.Exit(1)
	}
	return filepath.Join(home, ".keycard")
}

// ConfigPath returns the full path to the config file.
func ConfigPath() string {
	return filepath.Join(ConfigDir(), "config.yaml")
}

// EnsureConfigDir creates ~/.keycard/ if it doesn't exist.
func EnsureConfigDir() error {
	dir := ConfigDir()
	return os.MkdirAll(dir, 0700)
}

// Load reads the current configuration from Viper.
func Load() *Config {
	return &Config{
		ApiUrl:       viper.GetString("api_url"),
		Token:        viper.GetString("token"),
		OrgId:        viper.GetString("org_id"),
		OutputFormat: viper.GetString("output_format"),
	}
}

// GetToken returns the saved access token.
func GetToken() string {
	return viper.GetString("token")
}

// SetToken saves the access token to the config file.
func SetToken(token string) error {
	viper.Set("token", token)
	return SaveConfig()
}

// GetApiUrl returns the configured API URL.
func GetApiUrl() string {
	url := viper.GetString("api_url")
	if url == "" {
		return "http://localhost:3001/v1"
	}
	return url
}

// SaveConfig writes the current viper state to the config file.
func SaveConfig() error {
	if err := EnsureConfigDir(); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	return viper.WriteConfigAs(ConfigPath())
}
