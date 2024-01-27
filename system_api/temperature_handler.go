package main

import (
	"fmt"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
)

// GetWindowsTemperature retrieves the CPU temperature on Windows.
func GetWindowsTemperature() (float64, error) {
	cmd := exec.Command("powershell", "Get-CimInstance", "-ClassName", "Win32_TemperatureProbe")
	output, err := cmd.Output()
	if err != nil {
		return 0.0, err
	}

	lines := strings.Split(string(output), "\r\n")
	if len(lines) >= 2 {
		fields := strings.Fields(lines[1])
		if len(fields) >= 6 {
			temperature, parseErr := strconv.ParseFloat(strings.TrimSpace(fields[5]), 64)
			if parseErr != nil {
				return 0.0, parseErr
			}
			return temperature / 10.0, nil
		}
	}

	return 0.0, fmt.Errorf("Unable to get CPU temperature")
}

// GetLinuxTemperature retrieves the CPU temperature on Linux.
func GetLinuxTemperature() (float64, error) {
	cmd := exec.Command("sensors")
	output, err := cmd.Output()
	if err != nil {
		return 0.0, err
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "Core 0") {
			fields := strings.Fields(line)
			if len(fields) >= 3 {
				temperature, parseErr := strconv.ParseFloat(strings.Trim(fields[2], "+°C"), 64)
				if parseErr != nil {
					return 0.0, parseErr
				}
				return temperature, nil
			}
		}
	}

	return 0.0, fmt.Errorf("Unable to get CPU temperature")
}

// GetMacTemperature retrieves the CPU temperature on macOS.
func GetMacTemperature() (float64, error) {
	output, err := exec.Command("osx-cpu-temp").Output()
	if err != nil {
		return 0.0, err
	}

	temperature, parseErr := strconv.ParseFloat(strings.TrimSpace(string(output)), 64)
	if parseErr != nil {
		return 0.0, parseErr
	}

	return temperature, nil
}

// GetTemperature retrieves the CPU temperature based on the current OS.
func GetTemperature() (map[string]float64, error) {
	platform := runtime.GOOS

	cpuTemperature := 0.0
	var err error

	switch platform {
	case "windows":
		cpuTemperature, err = GetWindowsTemperature()
	case "linux":
		cpuTemperature, err = GetLinuxTemperature()
	case "darwin":
		cpuTemperature, err = GetMacTemperature()
	default:
		return nil, fmt.Errorf("Unsupported platform")
	}

	if err != nil {
		return nil, err
	}

	tempInfo := map[string]float64{"processor_temp": cpuTemperature}
	return tempInfo, nil
}
