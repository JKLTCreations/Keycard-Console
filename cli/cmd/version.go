package cmd

import (
	"fmt"
	"runtime"

	"github.com/spf13/cobra"

	"github.com/keycard-dev/keycard-cli/internal/output"
)

// Build-time variables set via ldflags.
var (
	Version   = "0.1.0-dev"
	CommitSHA = "unknown"
	BuildDate = "unknown"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	RunE: func(cmd *cobra.Command, args []string) error {
		format := getOutputFormat()
		if format == "json" {
			output.PrintJSON(map[string]string{
				"version":    Version,
				"commit":     CommitSHA,
				"built":      BuildDate,
				"go_version": runtime.Version(),
				"os":         runtime.GOOS,
				"arch":       runtime.GOARCH,
			})
			return nil
		}

		fmt.Printf("keycard %s\n", Version)
		fmt.Printf("  Commit:     %s\n", CommitSHA)
		fmt.Printf("  Built:      %s\n", BuildDate)
		fmt.Printf("  Go version: %s\n", runtime.Version())
		fmt.Printf("  OS/Arch:    %s/%s\n", runtime.GOOS, runtime.GOARCH)
		return nil
	},
}
