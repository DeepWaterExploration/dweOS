package main

// Represents the security type of a Wifi network
type SecurityType string

const (
	WPA SecurityType = "WPA" // WPA security
	WEP SecurityType = "WEP" // WEP security
	WSN SecurityType = "WSN" // WSN security
)

// Represents a Wifi network scanned from the network interface
type ScannedWifiNetwork struct {
	SSID           string         `json:"ssid,omitempty"`  // Network SSID (can be hidden)
	Frequency      int            `json:"frequency"`       // Network frequency
	MacAddress     string         `json:"mac_address"`     // Network BSSID (always available)
	Secure         bool           `json:"secure"`          // Whether the network is secure
	SecurityType   []SecurityType `json:"security_type"`   // Network security type
	SignalStrength int            `json:"signal_strength"` // Network signal strength
}

// Ra Wifi network saved in the network interface
type SavedWifiNetwork struct {
	NetworkID  string `json:"network_id"`  // Network ID (unique identifier)
	SSID       string `json:"ssid"`        // Network SSID
	MacAddress string `json:"mac_address"` // Network BSSID
	Connected  bool   `json:"connected"`   // Whether the network is connected
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

// Represents the connection status of a Wifi network
type ConnectionStatus string

const (
	// Disconnecting from a network
	DISCONNECTING ConnectionStatus = "DISCONNECTING"
	// Just disconnected from a network
	JUST_DISCONNECTED ConnectionStatus = "JUST_DISCONNECTED"
	// Still disconnected from a network
	STILL_DISCONNECTED ConnectionStatus = "STILL_DISCONNECTED"
	// Connecting to a network
	CONNECTING ConnectionStatus = "CONNECTING"
	// Just connected to a network
	JUST_CONNECTED ConnectionStatus = "JUST_CONNECTED"
	// Still connected to a network
	STILL_CONNECTED ConnectionStatus = "STILL_CONNECTED"
	// Unknown connection status
	UNKNOWN ConnectionStatus = "UNKNOWN"
)
