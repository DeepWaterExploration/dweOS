package main

// Represents the security type of a Wifi network
type SecurityType string

const (
	// WPA security
	WPA SecurityType = "WPA"
	// WEP security
	WEP SecurityType = "WEP"
	// WSN security
	WSN SecurityType = "WSN"
)

// Represents a Wifi network scanned from the network interface
type ScannedWifiNetwork struct {
	SSID           *string        `json:"ssid,omitempty"`  // Network SSID (can be hidden)
	Frequency      int            `json:"frequency"`       // Network frequency
	MacAddress     string         `json:"mac_address"`     // Network BSSID (always available)
	Secure         bool           `json:"secure"`          // Whether the network is secure
	SecurityType   []SecurityType `json:"security_type"`   // Network security type
	SignalStrength int            `json:"signal_strength"` // Network signal strength
}

// Ra Wifi network saved in the network interface
type SavedWifiNetwork struct {
	NetworkID int    `json:"network_id"` // Network ID (unique identifier)
	SSID      string `json:"ssid"`       // Network SSID
	BSSID     string `json:"bssid"`      // Network BSSID
	Connected bool   `json:"connected"`  // Whether the network is connected
}

// ConnectedWifiNetwork represents a Wifi network connected to the network interface
type ConnectedWifiNetwork struct {
	SSID           string         `json:"ssid"`            // Network SSID (can be hidden)
	Frequency      int            `json:"frequency"`       // Network frequency
	MacAddress     string         `json:"mac_address"`     // Network BSSID (always available)
	Secure         bool           `json:"secure"`          // Whether the network is secure
	SecurityType   []SecurityType `json:"security_type"`   // Network security type
	SignalStrength int            `json:"signal_strength"` // Network signal strength
	NetworkID      int            `json:"network_id"`      // Network ID (unique identifier)
}

// Represents a Wifi credential for connecting to a Wifi Network
type WifiCredentials struct {
	SSID     string `json:"ssid"`     // Network SSID
	Password string `json:"password"` // Network password
}
