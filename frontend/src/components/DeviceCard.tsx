import { Card, CardContent, CardHeader, TextField } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";

import { Device } from "../types/types";
import { setDeviceNickname } from "../utils/api";
import { StreamOptions } from "./StreamOptions";
import { CameraControls } from "./CameraControls";
import { LineBreak } from "./LineBreak";
import DeviceContext from "../contexts/DeviceContext";

export interface DeviceCardProps {
    key: number;
    device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = (props) => {
    const [device, setDevice] = useState(props.device);

    useEffect(() => {
        console.log("Device updated");
    }, [device]);

    return (
        <DeviceContext.Provider value={{ device, setDevice }}>
            <Card
                sx={{
                    minWidth: 512,
                    boxShadow: 3,
                    textAlign: "left",
                    margin: "20px",
                }}
            >
                <CardHeader
                    title={props.device.device_info.device_name}
                    subheader={
                        <>
                            {`Manufacturer: ${props.device.manufacturer}`}
                            <LineBreak />
                            {`USB ID: ${props.device.bus_info}`}
                            <LineBreak />
                            <TextField
                                sx={{ top: 10 }}
                                onChange={(e) => {
                                    let newDevice = { ...device };
                                    newDevice.nickname = e.target.value;
                                    setDevice(newDevice);
                                    setDeviceNickname(
                                        props.device.bus_info,
                                        e.target.value
                                    );
                                }}
                                helperText='Device Nickname'
                                placeholder='Device Nickname'
                                variant='standard'
                                defaultValue={device.nickname}
                            ></TextField>
                        </>
                    }
                />
                <CardContent>
                    <StreamOptions device={props.device} />
                    <CameraControls device={props.device} />
                </CardContent>
            </Card>
        </DeviceContext.Provider>
    );
};

export default DeviceCard;
