/**
 * Represents a WiFi network
 */
export interface WiFiNetwork {
  /* The network's SSID (Service Set Identifier) */
  ssid: string;
  /* The security protocol used by the network */
  security: string;
  /* The operating frequency of the network in GHz */
  frequency: string;
  /* The network's signal strength in dBm */
  signal_strength: string;
}

/**
 * Represents the response when inquiring about the wifi connection status
 */
export interface GetWifiStatusResponse {
  /* Whether wifi is enabled */
  enabled: boolean;
}

/**
 * Represents the response when requesting to toggle the wifi connection status
 */
export interface ToggleWifiResponse {
  /* Whether wifi is enabled */
  enabled: boolean;
  // /* Whether the network connection was successful */
  // success: boolean;
  // /* Elaboration on the status of the connection */
  // error?: string;
}

/**
 * Represents the response from the backend when connecting to a network
 */
export interface ConnectToWifiResponse {
  /* Whether the network connection was successful */
  status: boolean;
  /* Elaboration on the status of the connection */
  error?: string;
}
