package main

import (
	"fmt"
	"log"
	"os/exec"
	"reflect"
	"strings"
	"time"

	"pifke.org/wpasupplicant"
)

type WifiHandler struct {
	WPASupplicant   wpasupplicant.Conn
	TimeoutDuration time.Duration
	InterfaceName   string
	ScanResults     []ScannedWifiNetwork
	SavedResults    []SavedWifiNetwork
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

	if err != nil {
		return fmt.Errorf("Error connecting to wifi manager: %v", err)
	}

	// Set the timeout duration
	wh.TimeoutDuration = time.Duration(3) * time.Second
	wh.WPASupplicant.SetTimeout(wh.TimeoutDuration)

	// Set the interface name
	wh.InterfaceName = interfaces[0]

	wh.ScanResults = []ScannedWifiNetwork{}
	wh.SavedResults = []SavedWifiNetwork{}

	return nil
}

func (wh *WifiHandler) findValidInterfaces() ([]string, error) {
	output, err := exec.Command("bash", "-c", "iwconfig 2>/dev/null | grep -o '^[[:alnum:]]*'").Output()
	if err != nil {
		return nil, err
	}
	interfaces := strings.Fields(string(output))
	if len(interfaces) == 0 {
		return nil, fmt.Errorf("No valid wifi interfaces found")
	}
	return interfaces, nil
}

func (wh *WifiHandler) connect(socket string) error {
	// Implement the logic for connecting to the wifi manager
	// You may need to replace this with the Go equivalent code
	return nil
}

func (wh *WifiHandler) NetworkStatus() (*NetworkStatus, error) {
	result, err := wh.WPASupplicant.Status()
	if err != nil {
		return nil, fmt.Errorf("Error getting status: %v", err)
	}

	return &NetworkStatus{
		WPAState: result.WPAState(),
		KeyMgmt:  result.KeyMgmt(),
		IPAddr:   result.IPAddr(),
		SSID:     result.SSID(),
		Address:  result.Address(),
		BSSID:    result.BSSID(),
		Freq:     result.Freq(),
	}, nil
}

func (wh *WifiHandler) NetworkScan() ([]ScannedWifiNetwork, error) {
	wh.WPASupplicant.SetTimeout(wh.TimeoutDuration)
	timeoutCh := time.After(wh.TimeoutDuration)
	err := wh.WPASupplicant.Scan()
	if err != nil {
		return nil, fmt.Errorf("Failed to scan %s: %s (%v)", wh.InterfaceName, err.Error(), reflect.TypeOf(err))
	}
	scanComplete := false
	for {
		select {
		case wpaEvent := <-wh.WPASupplicant.EventQueue():
			if wpaEvent.Event == "SCAN-RESULTS" {
				scanComplete = true
				break
			}
		case <-timeoutCh:
			return nil, fmt.Errorf("Scan %s timeout after %s", wh.InterfaceName, wh.TimeoutDuration)
		}
		if scanComplete {
			break
		}
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
		joinedFlags := strings.Join(network.Flags(), "")
		securityTypes := []SecurityType{}
		if strings.Contains(joinedFlags, "WPA") {
			securityTypes = append(securityTypes, WPA)
		}
		if strings.Contains(joinedFlags, "WEP") {
			securityTypes = append(securityTypes, WEP)
		}
		if strings.Contains(joinedFlags, "WSN") {
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

	wh.ScanResults = scannedNetworks
	return wh.ScanResults, nil
}

func (wh *WifiHandler) NetworkSaved() ([]SavedWifiNetwork, error) {
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
			Connected:  strings.Contains(strings.Join(network.Flags(), ""), "CURRENT"),
		})
	}
	return savedNetworks, nil
}

func (wh *WifiHandler) NetworkConnected() ([]SavedWifiNetwork, error) {
	savedResults, err := wh.WPASupplicant.ListNetworks()
	if err != nil {
		return nil, fmt.Errorf("Error listing connected networks: %v", err)
	}

	var connectedNetworks []SavedWifiNetwork

	for _, network := range savedResults {
		if strings.Contains(strings.Join(network.Flags(), ""), "CURRENT") {
			connectedNetworks = append(connectedNetworks, SavedWifiNetwork{
				NetworkID:  network.NetworkID(),
				SSID:       network.SSID(),
				MacAddress: network.BSSID(),
				Connected:  true,
			})
		}
	}
	return connectedNetworks, nil
}

func NetworkToggle(wifiOn bool) (bool, error) {
	var cmdArgs []string
	if wifiOn {
		cmdArgs = []string{"sudo", "nmcli", "radio", "wifi", "on"}
	} else {
		cmdArgs = []string{"sudo", "nmcli", "radio", "wifi", "off"}
	}
	output, err := exec.Command(cmdArgs[0], cmdArgs[1:]...).Output()

	if err != nil || strings.Contains(string(output), "Error") {
		return !wifiOn, err
	}

	output, err = exec.Command("sudo", "apt", "install", "network-manager", "-y").Output()

	if err != nil || strings.Contains(string(output), "Error") {
		return !wifiOn, err
	}

	// Sleep for 3 seconds (3000 milliseconds)
	time.Sleep(3 * time.Second)

	return wifiOn, nil
}

func (wh *WifiHandler) NetworkConnect(WifiSSID string, WifiPassword string) (bool, error) {
	_, err := exec.Command(fmt.Sprintf("nmcli device wifi con \"%s\" password \"%s\"", WifiSSID, WifiPassword)).Output()
	if err != nil {
		return false, err
	}
	return true, nil
}

func (wh *WifiHandler) NetworkDisconnect(WifiSSID string) (bool, error) {
	_, err := exec.Command(fmt.Sprintf("nmcli con down \"%s\"", WifiSSID)).Output()
	if err != nil {
		return false, err
	}
	_, err = exec.Command(fmt.Sprintf("f'nmcli connection modify \"%s\" connection.autoconnect no", WifiSSID)).Output()
	if err != nil {
		return false, err
	}
	return true, nil
}

func (wh *WifiHandler) NetworkForget(WifiSSID string) (bool, error) {
	_, err := exec.Command(fmt.Sprintf("nmcli connection delete \"%s\"", WifiSSID)).Output()
	if err != nil {
		return false, err
	}
	return true, nil
}
