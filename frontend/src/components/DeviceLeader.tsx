import { TextField, MenuItem } from "@mui/material";
import PopupState from "material-ui-popup-state";
import { styles } from "../style";
import { removeLeader, setLeader } from "../utils/api";

import React, { useEffect } from "react";
import { Device } from "../types/types";

interface DeviceLeaderProps {
    device: Device;
    leaders: Device[];
}

export const DeviceLeader: React.FC<DeviceLeaderProps> = (props) => {
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
                            value={
                                props.device.leader
                                    ? props.device.leader
                                    : "None"
                            }
                        >
                            <MenuItem
                                key='None'
                                value='None'
                                onClick={() => {
                                    popupState.close();
                                    removeLeader(props.device.bus_info);
                                    props.device.leader = undefined;
                                }}
                            >
                                None
                            </MenuItem>
                            {props.leaders.map((device) => {
                                return (
                                    <MenuItem
                                        key={device.bus_info}
                                        value={device.bus_info}
                                        onClick={() => {
                                            popupState.close();
                                            setLeader(
                                                device.bus_info,
                                                props.device.bus_info
                                            );
                                            // bad global state
                                            props.device.leader =
                                                device.bus_info;
                                        }}
                                    >
                                        {device.nickname.length > 0
                                            ? `${device.nickname}: ${device.bus_info}`
                                            : device.bus_info}
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
