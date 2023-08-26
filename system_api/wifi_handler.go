package main

import (
	"fmt"
	"log"
	"os/exec"
	"strings"

	"pifke.org/wpasupplicant"
)

type WifiHandler struct {
	WPASupplicant wpasupplicant.Conn
}

func NewWifiHandler() (*WifiHandler, error) {
	wifiHandler := &WifiHandler{}
	err := wifiHandler.init()
	if err != nil {
		return nil, err
	}
	return wifiHandler, nil
}

func (wh *WifiHandler) init() error {
	// Establish a socket connection with the wifi manager
	interfaces, err := wh.findValidInterfaces()
	if err != nil {
		return fmt.Errorf("Error finding valid interfaces: %v", err)
	}

	if len(interfaces) == 0 {
		return fmt.Errorf("No valid wifi interfaces found")
	}

	wh.WPASupplicant, err = wpasupplicant.Unixgram(interfaces[0])
	Log.Printf("Connecting to wifi manager on interface %s", interfaces[0])
	// wh.WPASupplicant.SetTimeout(1)
	if err != nil {
		return fmt.Errorf("Error connecting to wifi manager: %v", err)
	}

	return nil
}

func (wh *WifiHandler) findValidInterfaces() ([]string, error) {
	output, err := exec.Command("bash", "-c", "iwconfig 2>/dev/null | grep -o '^[[:alnum:]]*'").Output()
	if err != nil {
		return nil, err
	}
	interfaces := strings.Fields(string(output))
	return interfaces, nil
}

func (wh *WifiHandler) connect(socket string) error {
	// Implement the logic for connecting to the wifi manager
	// You may need to replace this with the Go equivalent code
	return nil
}

func (wh *WifiHandler) NetworkStatus() (*WifiHandler, error) {
	// Simulate gathering Wi-Fi status information.
	// In a real implementation, you would use platform-specific libraries or APIs.

	// For the sake of this example, we'll create a mock Wi-Fi status.
	wifiStatus := &WifiHandler{}

	return wifiStatus, nil
}

func (wh *WifiHandler) NetworkConnected() ([]SavedWifiNetwork, error) {
	savedResults, err := wh.WPASupplicant.ListNetworks()
	if err != nil {
		return nil, fmt.Errorf("Error listing connected networks: %v", err)
	}

	var savedNetworks []SavedWifiNetwork

	for _, network := range savedResults {
		savedNetworks = append(savedNetworks, SavedWifiNetwork{
			NetworkID:  network.NetworkID(),
			SSID:       network.SSID(),
			MacAddress: network.BSSID(),
			Connected:  strings.Contains(strings.Join(network.Flags(), ""), "[CURRENT]"),
		})
	}
	return savedNetworks, nil
}

func (wh *WifiHandler) NetworkScan() ([]ScannedWifiNetwork, error) {
	err := wh.WPASupplicant.Scan()
	if err != nil {
		return nil, fmt.Errorf("Error scanning networks: %v", err)
	}

	scanResults, errs := wh.WPASupplicant.ScanResults()
	var scannedNetworks []ScannedWifiNetwork

	if len(errs) > 0 {
		for _, err := range errs {
			log.Printf("Error getting scan results: %v", err)
		}

		return nil, fmt.Errorf("Error getting scan results: %v", errs)
	}

	for _, network := range scanResults {
		// check if the network is secure
		securityTypes := []SecurityType{}
		if strings.Contains(strings.Join(network.Flags(), ""), "WPA") {
			securityTypes = append(securityTypes, WPA)
		}
		if strings.Contains(strings.Join(network.Flags(), ""), "WEP") {
			securityTypes = append(securityTypes, WEP)
		}
		if strings.Contains(strings.Join(network.Flags(), ""), "WSN") {
			securityTypes = append(securityTypes, WSN)
		}

		scannedNetworks = append(scannedNetworks, ScannedWifiNetwork{
			SSID:           network.SSID(),
			Frequency:      network.Frequency(),
			MacAddress:     network.BSSID().String(),
			Secure:         len(securityTypes) > 0,
			SecurityType:   securityTypes,
			SignalStrength: network.RSSI(),
		})
	}
	return scannedNetworks, nil
}
