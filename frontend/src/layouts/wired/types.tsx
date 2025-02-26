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
