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
    // device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = (props) => {
    const { device } = useContext(DeviceContext) as {
        device: Device;
    };

    return (
        <Card
            sx={{
                minWidth: 512,
                boxShadow: 3,
                textAlign: "left",
                margin: "20px",
            }}
        >
            <CardHeader
                title={device.device_info.device_name}
                subheader={
                    <>
                        {`Manufacturer: ${device.manufacturer}`}
                        <LineBreak />
                        {`USB ID: ${device.bus_info}`}
                        <LineBreak />
                        <TextField
                            sx={{ top: 10 }}
                            onChange={(e) => {
                                device.nickname = e.target.value;
                                setDeviceNickname(
                                    device.bus_info,
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
                <StreamOptions device={device} />
                <CameraControls device={device} />
            </CardContent>
        </Card>
    );
};

export default DeviceCard;
