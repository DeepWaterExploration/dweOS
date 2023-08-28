package main

import (
	"fmt"
	"os/exec"
	"runtime"
)

func ShutDown() error {
	platform := runtime.GOOS
	switch platform {
	case "windows":
		_ = exec.Command("shutdown", "/s", "/t", "1")
	case "linux", "darwin":
		_ = exec.Command("shutdown", "-h", "now")
	default:
		return fmt.Errorf("Unsupported platform")
	}
	return nil
}

func Restart() error {
	platform := runtime.GOOS
	switch platform {
	case "windows":
		_ = exec.Command("shutdown", "/r", "/t", "0")
	case "linux", "darwin":
		_ = exec.Command("sudo", "reboot")
	default:
		return fmt.Errorf("Unsupported platform")
	}
	return nil
}
