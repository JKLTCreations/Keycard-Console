package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/keycard-dev/keycard-cli/internal/api"
)

// DeviceFlowLogin performs the full device authorization flow.
// It requests a device code, prompts the user to authorize, then polls for a token.
func DeviceFlowLogin(client *api.Client) (string, error) {
	// Step 1: Request device code
	fmt.Println("Initiating device authorization flow...")
	fmt.Println()

	deviceResp, err := client.DeviceCode()
	if err != nil {
		return "", fmt.Errorf("failed to initiate device auth: %w", err)
	}

	// Step 2: Display instructions to the user
	fmt.Println("To sign in, open the following URL in your browser:")
	fmt.Println()
	fmt.Printf("  %s\n", deviceResp.VerificationURI)
	fmt.Println()
	fmt.Printf("Then enter this code: %s\n", deviceResp.UserCode)
	fmt.Println()
	fmt.Println("Waiting for authorization...")

	// Step 3: Poll for token
	interval := deviceResp.Interval
	if interval < 5 {
		interval = 5
	}
	deadline := time.Now().Add(time.Duration(deviceResp.ExpiresIn) * time.Second)

	for time.Now().Before(deadline) {
		time.Sleep(time.Duration(interval) * time.Second)

		tokenResp, err := client.ExchangeToken(deviceResp.DeviceCode)
		if err != nil {
			// Authorization pending - keep polling
			fmt.Fprint(os.Stderr, ".")
			continue
		}

		if tokenResp.AccessToken != "" {
			fmt.Fprintln(os.Stderr)
			return tokenResp.AccessToken, nil
		}
	}

	fmt.Fprintln(os.Stderr)
	return "", fmt.Errorf("device authorization timed out after %d seconds", deviceResp.ExpiresIn)
}
