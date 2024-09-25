import { TextField, MenuItem } from "@mui/material";
import PopupState from "material-ui-popup-state";
import { styles } from "../style";
import { removeLeader, setLeader } from "../utils/api";

import React, { useContext, useEffect } from "react";
import { Device } from "../types/types";
import DeviceContext from "../contexts/DeviceContext";
import { useSnackbar } from "notistack";

interface DeviceLeaderProps {
    leaders: Device[];
}

export const DeviceLeader: React.FC<DeviceLeaderProps> = (props) => {
    const {
        device,
        devices,
        enableStreamUpdate,
        removeLeaderUpdate,
        setFollowerUpdate,
    } = useContext(DeviceContext) as {
        device: Device;
        devices: Device[];
        enableStreamUpdate: (bus_info: string) => void;
        removeLeaderUpdate: (bus_info: string) => void;
        setFollowerUpdate: (
            leader_bus_info: string,
            follower_bus_info: string | undefined
        ) => void;
    };

    const { enqueueSnackbar } = useSnackbar();

    return (
        <div style={styles.cardContent.div}>
            <PopupState variant='popover'>
                {(popupState) => (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                marginRight: "8px",
                            }}
                        >
                            Leader:
                        </span>
                        <TextField
                            variant='standard'
                            select
                            InputProps={{
                                disableUnderline: true,
                            }}
                            value={device.leader ? device.leader : "None"}
                        >
                            <MenuItem
                                key='None'
                                value='None'
                                onClick={() => {
                                    popupState.close();
                                    removeLeader(device.bus_info);
                                    if (device.leader)
                                        setFollowerUpdate(
                                            device.leader,
                                            undefined
                                        );
                                    device.leader = undefined;
                                }}
                            >
                                None
                            </MenuItem>
                            {props.leaders.map((dev) => {
                                return (
                                    <MenuItem
                                        key={dev.bus_info}
                                        value={dev.bus_info}
                                        onClick={() => {
                                            popupState.close();
                                            if (device.leader)
                                                setFollowerUpdate(
                                                    device.leader,
                                                    undefined
                                                );
                                            if (dev.follower) {
                                                // just ignore the request
                                                enqueueSnackbar(
                                                    `Device: ${dev.bus_info} already has a follower.`,
                                                    { variant: "error" }
                                                );
                                                return;
                                            }
                                            device.leader = dev.bus_info;
                                            setLeader(
                                                dev.bus_info,
                                                device.bus_info
                                            );
                                            enableStreamUpdate(device.leader);
                                            setFollowerUpdate(
                                                dev.bus_info,
                                                device.bus_info
                                            );
                                            // good global state
                                        }}
                                    >
                                        {dev.nickname.length > 0
                                            ? `${dev.nickname}: ${dev.bus_info}`
                                            : dev.bus_info}
                                    </MenuItem>
                                );
                            })}
                        </TextField>
                    </div>
                )}
            </PopupState>
        </div>
    );
};
