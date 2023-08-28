package main

// Represets the request type of toggleWifiStatus()
type WifiToggleRequest struct {
	WifiState bool `json:"wifi_state"` // The state the wifi should be set to (true = on, false = off)
}

// Represets the request type of connectToWifi()
type WifiConnectRequest struct {
	WifiSSID     string `json:"wifi_ssid"`     // The SSID of the wifi network to connect to
	WifiPassword string `json:"wifi_password"` // The password of the wifi network to connect to
}

// Represets the request type of disconnectFromWifi()
type WifiDisconnectRequest struct {
	WifiSSID string `json:"wifi_ssid"` // The SSID of the wifi network to disconnect from
}

// Represets the request type of forgetWifi()
type WifiForgetRequest struct {
	WifiSSID string `json:"wifi_ssid"` // The SSID of the wifi network to forget
}

// // Raised for errors regarding failed parsing of string data to proper structs.
// type ParseError struct {
//     Msg string
// }
