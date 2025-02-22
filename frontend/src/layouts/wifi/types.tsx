export interface NetworkConfig {
    ssid: string;
    password?: string;
}

export interface Connection {
    id: string | undefined;
    type: string | undefined;
}

export interface Status {
    connection: Connection;
    finished_first_scan: boolean;
    connected: boolean;
}

export interface AccessPoint {
    ssid: string;
    strength: number;
    requires_password: boolean;
}

export enum IPType {
    STATIC = "STATIC",
    DYNAMIC = "DYNAMIC",
}

export enum NetworkPriority {
    // AUTO = "AUTO",
    ETHERNET = "ETHERNET",
    WIRELESS = "WIRELESS",
}

export interface IPConfiguration {
    static_ip?: string;
    gateway?: string;
    prefix?: number;
    ip_type: IPType;
    dns?: string[];
}
