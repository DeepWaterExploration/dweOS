package main

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/theojulienne/go-wireless"
)

type WifiHandler struct {
	WPASupplicant   *wireless.Client
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
	interfaces := wireless.Interfaces()

	if len(interfaces) == 0 {
		return fmt.Errorf("No valid wifi interfaces found")
	}

	Log.Printf("Connecting to wifi manager on interface %s", interfaces[0])

	if err != nil {
		return fmt.Errorf("Error connecting to wifi manager: %v", err)
	}

	// Set the interface name
	wh.InterfaceName = interfaces[0]

	wh.ScanResults = []ScannedWifiNetwork{}
	wh.SavedResults = []SavedWifiNetwork{}
	wh.WPASupplicant, err = wireless.NewClient(wh.InterfaceName)

	// Set the timeout duration
	wh.TimeoutDuration = time.Second * 1
	wh.WPASupplicant.ScanTimeout = wh.TimeoutDuration
	return nil
}

func (wh *WifiHandler) NetworkScan() ([]ScannedWifiNetwork, error) {
	scanResults, err := wh.WPASupplicant.Scan()
	if err != nil {
		if err.Error() == "FAIL-BUSY\n" {
			return wh.ScanResults, nil
		} else {
			return nil, fmt.Errorf("Error getting scan results: %v", errs)
		}
	}
	var scannedNetworks []ScannedWifiNetwork

	for _, network := range scanResults {
		// check if the network is secure
		joinedFlags := strings.Join(network.Flags, "")
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
			SSID:           network.SSID,
			Frequency:      network.Frequency,
			MacAddress:     network.BSSID,
			Secure:         len(securityTypes) > 0,
			SecurityType:   securityTypes,
			SignalStrength: network.Signal,
		})
	}

	wh.ScanResults = scannedNetworks

	return scannedNetworks, nil
}

func (wh *WifiHandler) NetworkStatus() (*NetworkStatus, error) {
	result, err := wh.WPASupplicant.Status()
	if err != nil {
		return nil, fmt.Errorf("Error getting status: %v", err)
	}

	return &NetworkStatus{
		WPAState: result.WpaState,
		KeyMgmt:  result.KeyManagement,
		IPAddr:   result.IPAddress,
		SSID:     result.SSID,
		Address:  result.Address,
		BSSID:    result.BSSID,
		// Freq:     result.,
	}, nil
}

func (wh *WifiHandler) NetworkSaved() ([]SavedWifiNetwork, error) {
	savedResults, err := wh.WPASupplicant.Networks()
	if err != nil {
		return nil, fmt.Errorf("Error listing connected networks: %v", err)
	}

	var savedNetworks []SavedWifiNetwork

	for _, network := range savedResults {
		savedNetworks = append(savedNetworks, SavedWifiNetwork{
			SSID:       network.SSID,
			MacAddress: network.BSSID,
			NetworkID:  network.IDStr,
			Connected:  strings.Contains(strings.Join(network.Flags, ""), "CURRENT"),
		})
	}

	wh.SavedResults = savedNetworks

	return savedNetworks, nil
}

func (wh *WifiHandler) NetworkConnected() ([]SavedWifiNetwork, error) {
	savedResults, err := wh.WPASupplicant.Networks()
	if err != nil {
		return nil, fmt.Errorf("Error listing connected networks: %v", err)
	}

	var connectedNetworks []SavedWifiNetwork

	for _, network := range savedResults {
		if strings.Contains(strings.Join(network.Flags, ""), "CURRENT") {
			connectedNetworks = append(connectedNetworks, SavedWifiNetwork{
				SSID:       network.SSID,
				MacAddress: network.BSSID,
				NetworkID:  network.IDStr,
				Connected:  true,
			})
		}
	}
	return connectedNetworks, nil
}

func (wh *WifiHandler) NetworkToggle(wifiOn bool) (bool, error) {
	var cmdArgs []string
	// InterfaceName
	if !wifiOn {
		cmdArgs = []string{"sudo", "ifconfig", wh.InterfaceName, "up"}
	} else {
		cmdArgs = []string{"sudo", "ifconfig", wh.InterfaceName, "down"}
	}
	output, err := exec.Command(cmdArgs[0], cmdArgs[1:]...).Output()

	if err != nil || strings.Contains(string(output), "Error") {
		return wifiOn, err
	}

	// Sleep for 3 seconds (3000 milliseconds)
	time.Sleep(3 * time.Second)

	return !wifiOn, nil
}

func (wh *WifiHandler) NetworkConnect(WifiSSID string, WifiPassword string) (bool, error) {
	// net := wireless.NewNetwork(WifiSSID, WifiPassword)
	// net, err := wh.WPASupplicant.Connect(net)
	exec.Command("nmcli", "con", "delete", WifiSSID)
	cmd := exec.Command("nmcli", "device", "wifi", "connect", WifiSSID, "password", WifiPassword)
	out, err := cmd.Output()
	if err != nil {
		// if there was any error, print it here
		fmt.Println("could not run command: ", err)
		return false, err
	}
	// otherwise, print the output from running the command
	fmt.Println("Output: ", string(out))
	return true, nil
}

func (wh *WifiHandler) NetworkDisconnect(WifiSSID string) (bool, error) {
	cmd := exec.Command("nmcli", "con", "down", WifiSSID)
	out, err := cmd.Output()
	if err != nil {
		// if there was any error, print it here
		fmt.Println("could not run command: ", err)
		return false, err
	}
	// otherwise, print the output from running the command
	fmt.Println("Output: ", string(out))
	return true, nil
}

func (wh *WifiHandler) NetworkForget(WifiSSID string) (bool, error) {
	var filtered []int
	for _, item := range wh.SavedResults {
		if item.SSID == WifiSSID {
			num, err := strconv.Atoi(item.SSID)
			if err != nil {
				return false, err
			}
			filtered = append(filtered, num)
		}
	}
	for _, network := range filtered {
		err := wh.WPASupplicant.RemoveNetwork(network)
		if err != nil {
			return false, err
		}
	}
	return true, nil
}
