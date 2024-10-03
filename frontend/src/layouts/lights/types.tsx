export interface LightDevice {
    pin: number;
    nickname: string;
    controller_index: number;
    controller_name: string;
    intensity: number;
}

export interface PWMController {
    name: string;
    pins: number[];
}
