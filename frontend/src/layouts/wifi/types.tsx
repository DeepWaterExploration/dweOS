export interface NetworkConfig {
    ssid: string;
    password?: string;
}

export interface Connection {
    id: string;
    type: string;
}

export interface AccessPoint {
    ssid: string;
    strength: number;
    requires_password: boolean;
}
