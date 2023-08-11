/**
 * Represents a WiFi network
 */
export interface WiFiNetwork {
  /* The network's SSID (Service Set Identifier) */
  ssid: string;
  /* Whether the network is secure */
  secure: boolean;
  /* The security protocol used by the network if secure */
  security_type?: string;
  /* The operating frequency of the network in GHz */
  frequency: string;
  /* The network's signal strength in dBm */
  signal_strength: number;
}

/**
 * Represents a WiFi interface
 */
export interface WiFiInterface {
  mac_address: string;
  status: number;
  wifi_networks: WiFiNetwork[];
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
  /* Whether the network connection was successful */
  // success: boolean;
  // /* Elaboration on the status of the connection */
  // error?: string;
}

/**
 * Represents the response from the backend when connecting to a network
 */
export interface ConnectToWifiResponse {
  /* Whether the network connection was successful */
  status: string;
  /* Elaboration on the status of the connection */
  message: string;
}

/**
 * Represents the response from the backend when connecting to a network
 */
export interface GetAvailableWifiResponse {
  available_networks: WiFiNetwork[];
}

/**
 * Represents the response from the backend when requesting the saved networks
 */
export interface GetSavedWifiResponse {
  saved_networks: WiFiNetwork[];
}

/**
 * Represents the response from the backend when requesting the currently connected network
 */
export interface GetConnectedNetworkResponse {
  network: string;
}

export interface WiFiInterfaces {
  [key: string]: WiFiInterface;
}

/**
 * Represents the response from the backend when requesting to forget a network
 */
export interface ForgetWifiResponse {
  enabled: boolean;
}
