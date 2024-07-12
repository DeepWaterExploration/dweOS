import { Card, CardContent, CardHeader, TextField } from "@mui/material";
import React, { useContext } from "react";

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
    // const { devices, setDevices } = useContext(DevicesContext);

    return (
        <DeviceContext.Provider value={{}}>
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
                                    props.device.nickname = e.target.value;
                                    setDeviceNickname(
                                        props.device.bus_info,
                                        e.target.value
                                    );
                                }}
                                helperText='Device Nickname'
                                placeholder='Device Nickname'
                                variant='standard'
                                defaultValue={props.device.nickname}
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
