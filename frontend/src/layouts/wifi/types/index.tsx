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
    security_type?: string[];
    /* The network's signal strength in dBm */
    signal_strength: number;
}

/**
 * Represents the response when inquiring about the wifi connection status
 */
export interface WifiStatus {
    wpa_state: string;
    key_mgmt: string;
    ip_address: string;
    ssid: string;
    address: string;
    bssid: string;
    freq: string;
}
