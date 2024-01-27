/**
 * Represents a scanned WiFi network
 */
export interface ScannedWifiNetwork {
    /* The network's SSID (Service Set Identifier) */
    ssid?: string;
    /* The operating frequency of the network in GHz */
    frequency: string;
    /* The network's BSSID (Basic Service Set Identifier) */
    mac_address: string;
    /* Whether the network is secure */
    secure: boolean;
    /* The security protocol used by the network if secure */
    security_type?: string;
    /* The network's signal strength in dBm */
    signal_strength: number;
}

/**
 * Represents a WiFi network saved on the device
 */
export interface SavedWifiNetwork {
    /* The network's Network ID (unique identifier) */
    network_id: number;
    /* The network's SSID (Service Set Identifier) */
    ssid: string;
    /* The network's BSSID (Basic Service Set Identifier) */
    mac_address: string;
    /* Whether the network is currently connected */
    connected: boolean;
}

/**
 * Represents the Wifi network the device is currently connected to
 */
export interface ConnectedWifiNetwork {
    /* The network's SSID (Service Set Identifier) */
    ssid: string;
    /* The operating frequency of the network in GHz */
    frequency: string;
    /* The network's BSSID (Basic Service Set Identifier) */
    mac_address: string;
    /* Whether the network is secure */
    secure: boolean;
    /* The security protocol used by the network if secure */
    security_type?: string;
    /* The network's signal strength in dBm */
    signal_strength: number;
    /* The network's Network ID (unique identifier) */
    network_id: number;
}

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
    wpa_state: string;
    key_mgmt: string;
    ip_address: string;
    ssid: string;
    address: string;
    bssid: string;
    freq: string;
}

/**
 * Represents the response when inquiring about the wifi connection status
 */
export interface ForgetWifiResponse {
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
    available_networks: ScannedWifiNetwork[];
}

/**
 * Represents the response from the backend when requesting the saved networks
 */
export interface GetSavedWifiResponse {
    saved_networks: SavedWifiNetwork[];
}

/**
 * Represents the response from the backend when requesting the currently connected network
 */
export interface GetConnectedNetworkResponse {
    connected_network: ConnectedWifiNetwork;
}

export interface WiFiInterfaces {
    [key: string]: WiFiInterface;
}

/**
 * Represents the response from the backend when requesting to forget a network
 */
export interface ForgetWifiResponse {
    success: boolean;
}
