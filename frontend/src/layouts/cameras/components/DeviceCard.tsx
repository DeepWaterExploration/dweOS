import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import TextField from "@mui/material/TextField";

import React, { useContext } from "react";

import { Device } from "../types";
import { setDeviceNickname } from "../api";
import { StreamOptions } from "./StreamOptions";
import { CameraControls } from "./CameraControls";
import { LineBreak } from "../../../components/LineBreak";
import DeviceContext from "../../../contexts/DeviceContext";
import { styles } from "../../../style";

const DeviceCard: React.FC = () => {
    const { device } = useContext(DeviceContext) as {
        device: Device;
    };

    return (
        <Card sx={styles.card} key={device.bus_info}>
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
                <StreamOptions />
                <CameraControls />
            </CardContent>
        </Card>
    );
};

export default DeviceCard;
