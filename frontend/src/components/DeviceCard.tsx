import { Card, CardContent, CardHeader, TextField } from "@mui/material";
import React from "react";

import { Device } from "../types/types";
import { setDeviceNickname } from "../utils/api";
import { StreamOptions } from "./StreamOptions";
import { CameraControls } from "./CameraControls";
import { LineBreak } from "./LineBreak";

export interface DeviceCardProps {
    key: number;
    device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = (props) => {
    const controls = props.device.controls;
    console.log(controls);

    // const deviceOptions = <DeviceOptions device={props.device} />;
    const deviceWarning = null;

    const cameraControls = (
        <CameraControls controls={controls} usbInfo={props.device.bus_info} />
    );

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
                action={deviceWarning}
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
                {/* {props.device.stream.device_path ? (
          <SupportingText>
            Device: {props.device.stream.device_path}
          </SupportingText>
        ) : (
          <></>
        )} */}
                {/* {deviceOptions} */}
                <StreamOptions device={props.device} />
                {cameraControls}
            </CardContent>
        </Card>
    );
};

export default DeviceCard;
